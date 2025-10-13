"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import PageLayout from "@/components/layout/PageLayout";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelInput from "@/components/ui/PixelInput";
import PixelBadge from "@/components/ui/PixelBadge";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [understood, setUnderstood] = useState({
    data: false,
    party: false,
    permanent: false,
  });

  const allUnderstood = understood.data && understood.party && understood.permanent;

  async function handleDeleteAccount() {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    if (confirmText !== "DELETE MY ACCOUNT") {
      toast.error('Please type "DELETE MY ACCOUNT" exactly');
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Account deleted successfully. Goodbye!");
        setTimeout(() => {
          logout();
          router.push("/");
        }, 2000);
      } else {
        toast.error(data.error || "Failed to delete account");
        setDeleting(false);
      }
    } catch (err) {
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <PageLayout title="🗑️ DELETE ACCOUNT" showBackButton={true} backPath="/settings">
      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-pixel text-lg ${
                  step >= num
                    ? "bg-red-600 border-red-800 text-white"
                    : "bg-gray-700 border-gray-600 text-gray-400"
                }`}
              >
                {num}
              </div>
              {num < 3 && (
                <div
                  className={`w-16 h-1 ${
                    step > num ? "bg-red-600" : "bg-gray-600"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Warning */}
        {step === 1 && (
          <PixelPanel variant="dialog">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="font-pixel text-3xl text-red-400 mb-3">
                WARNING
              </h2>
              <p className="font-retro text-xl text-white">
                You are about to delete your account
              </p>
            </div>

            <div className="bg-red-900/30 border-4 border-red-600 rounded-lg p-6 mb-6">
              <h3 className="font-pixel text-xl text-red-300 mb-4">
                This action will permanently delete:
              </h3>
              <ul className="space-y-3 font-retro text-lg text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-2xl">•</span>
                  <span>Your character appearance and customization</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-2xl">•</span>
                  <span>All your fitness goals and progress tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-2xl">•</span>
                  <span>Your check-in history and combat statistics</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-2xl">•</span>
                  <span>Your account credentials and profile information</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-900/30 border-4 border-yellow-600 rounded-lg p-6 mb-6">
              <h3 className="font-pixel text-xl text-yellow-300 mb-4">
                Party Impact:
              </h3>
              <p className="font-retro text-lg text-gray-200">
                If you're in a party, your departure may affect your team's ability to defeat monsters. Consider coordinating with your party members first.
              </p>
            </div>

            <div className="flex gap-4">
              <PixelButton
                onClick={() => router.push("/settings")}
                variant="secondary"
                size="lg"
                className="flex-1"
              >
                ← GO BACK
              </PixelButton>
              <PixelButton
                onClick={() => setStep(2)}
                variant="danger"
                size="lg"
                className="flex-1"
              >
                CONTINUE →
              </PixelButton>
            </div>
          </PixelPanel>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <PixelPanel variant="dialog">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="font-pixel text-3xl text-white mb-3">
                CONFIRM YOUR UNDERSTANDING
              </h2>
              <p className="font-retro text-lg text-gray-300">
                Please confirm you understand the consequences
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <label className="flex items-start gap-4 cursor-pointer bg-gray-800/50 p-4 rounded-lg border-4 border-gray-700 hover:border-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={understood.data}
                  onChange={(e) =>
                    setUnderstood({ ...understood, data: e.target.checked })
                  }
                  className="mt-1 w-6 h-6 rounded border-gray-600"
                />
                <span className="font-retro text-lg text-white">
                  I understand that <strong>all my data will be permanently deleted</strong> and cannot be recovered
                </span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer bg-gray-800/50 p-4 rounded-lg border-4 border-gray-700 hover:border-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={understood.party}
                  onChange={(e) =>
                    setUnderstood({ ...understood, party: e.target.checked })
                  }
                  className="mt-1 w-6 h-6 rounded border-gray-600"
                />
                <span className="font-retro text-lg text-white">
                  I understand that <strong>I will be removed from my party</strong> and my teammates will be affected
                </span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer bg-gray-800/50 p-4 rounded-lg border-4 border-gray-700 hover:border-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={understood.permanent}
                  onChange={(e) =>
                    setUnderstood({ ...understood, permanent: e.target.checked })
                  }
                  className="mt-1 w-6 h-6 rounded border-gray-600"
                />
                <span className="font-retro text-lg text-white">
                  I understand that <strong>this action is permanent and irreversible</strong>
                </span>
              </label>
            </div>

            <div className="flex gap-4">
              <PixelButton
                onClick={() => setStep(1)}
                variant="secondary"
                size="lg"
                className="flex-1"
              >
                ← BACK
              </PixelButton>
              <PixelButton
                onClick={() => setStep(3)}
                disabled={!allUnderstood}
                variant="danger"
                size="lg"
                className="flex-1"
              >
                CONTINUE →
              </PixelButton>
            </div>
          </PixelPanel>
        )}

        {/* Step 3: Final Confirmation */}
        {step === 3 && (
          <PixelPanel variant="dialog">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="font-pixel text-3xl text-red-400 mb-3">
                FINAL CONFIRMATION
              </h2>
              <p className="font-retro text-lg text-white">
                This is your last chance to go back
              </p>
            </div>

            <div className="bg-red-900/50 border-4 border-red-500 rounded-lg p-6 mb-6">
              <p className="font-retro text-xl text-white text-center mb-4">
                Type <strong className="font-pixel text-red-300">DELETE MY ACCOUNT</strong> to confirm
              </p>
              <PixelInput
                label="CONFIRMATION TEXT"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type: DELETE MY ACCOUNT"
                required
              />
            </div>

            <div className="mb-6">
              <PixelInput
                label="YOUR PASSWORD"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Verify your identity by entering your password"
                required
              />
            </div>

            <div className="flex gap-4">
              <PixelButton
                onClick={() => setStep(2)}
                variant="secondary"
                size="lg"
                className="flex-1"
              >
                ← BACK
              </PixelButton>
              <PixelButton
                onClick={handleDeleteAccount}
                disabled={
                  deleting ||
                  confirmText !== "DELETE MY ACCOUNT" ||
                  !password
                }
                variant="danger"
                size="lg"
                className="flex-1"
              >
                {deleting ? "🗑️ DELETING..." : "🗑️ DELETE FOREVER"}
              </PixelButton>
            </div>

            {!deleting && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push("/settings")}
                  className="font-retro text-blue-300 hover:text-blue-200 underline"
                >
                  Cancel and return to settings
                </button>
              </div>
            )}
          </PixelPanel>
        )}
      </main>
    </PageLayout>
  );
}
