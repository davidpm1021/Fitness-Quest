"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import PageLayout from "@/components/layout/PageLayout";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelInput from "@/components/ui/PixelInput";
import PixelBadge from "@/components/ui/PixelBadge";

export default function PartyPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState<"select" | "create" | "join">("select");
  const [partyName, setPartyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdParty, setCreatedParty] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      checkExistingParty();
    }
  }, [user, token]);

  async function checkExistingParty() {
    try {
      const response = await fetch("/api/parties/my-party", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data.party) {
        // User already has a party, redirect to dashboard
        router.push("/party/dashboard");
      }
    } catch (err) {
      console.error("Error checking party:", err);
    }
  }

  async function handleCreateParty(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/parties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: partyName }),
      });

      const data = await response.json();

      if (data.success) {
        setCreatedParty(data.data.party);
      } else {
        setError(data.error || "Failed to create party");
      }
    } catch (err) {
      setError("Failed to create party");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinParty(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/parties/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/party/dashboard");
      } else {
        setError(data.error || "Failed to join party");
      }
    } catch (err) {
      setError("Failed to join party");
    } finally {
      setLoading(false);
    }
  }

  function copyInviteCode() {
    if (createdParty) {
      navigator.clipboard.writeText(createdParty.inviteCode);
      toast.success("Invite code copied to clipboard!");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center game-bg pixel-grid-bg">
        <p className="text-white font-retro text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageLayout title="👥 PARTY SETUP" showBackButton={true}>
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {createdParty ? (
          <PixelPanel variant="dialog" title="✓ PARTY CREATED!">
            <div className="text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="font-pixel text-2xl text-white mb-2">
                  {createdParty.name}
                </h2>
                <PixelBadge variant="success" size="lg">
                  READY TO ADVENTURE
                </PixelBadge>
              </div>

              <div className="mb-8 p-6 bg-gray-900/50 border-4 border-yellow-500 rounded-lg">
                <p className="font-retro text-lg text-yellow-200 mb-4">
                  Share this invite code with your friends:
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <code className="font-pixel text-3xl text-yellow-400 tracking-wider bg-gray-800 px-6 py-3 border-4 border-yellow-600 rounded-sm">
                    {createdParty.inviteCode}
                  </code>
                  <PixelButton
                    onClick={copyInviteCode}
                    variant="warning"
                    size="md"
                  >
                    📋 COPY
                  </PixelButton>
                </div>
              </div>

              <PixelButton
                onClick={() => router.push("/party/dashboard")}
                variant="success"
                size="lg"
                className="w-full"
              >
                ▶ GO TO PARTY DASHBOARD
              </PixelButton>
            </div>
          </PixelPanel>
        ) : mode === "select" ? (
          <PixelPanel variant="dialog" title="👥 PARTY SETUP">
            <div className="text-center mb-8">
              <h2 className="font-pixel text-2xl text-white mb-3">
                JOIN THE ADVENTURE
              </h2>
              <p className="font-retro text-lg text-blue-200">
                Create a new party or join an existing one
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setMode("create")}
                className="p-8 bg-blue-800/50 border-4 border-blue-500 rounded-lg hover:bg-blue-700/50 hover:translate-y-[-4px] transition-all shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] hover:shadow-[4px_8px_0_0_rgba(0,0,0,0.6)]"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">➕</div>
                  <h3 className="font-pixel text-lg text-white mb-2">
                    CREATE PARTY
                  </h3>
                  <p className="font-retro text-blue-200">
                    Start a new party and invite friends
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode("join")}
                className="p-8 bg-green-800/50 border-4 border-green-500 rounded-lg hover:bg-green-700/50 hover:translate-y-[-4px] transition-all shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] hover:shadow-[4px_8px_0_0_rgba(0,0,0,0.6)]"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">🚪</div>
                  <h3 className="font-pixel text-lg text-white mb-2">
                    JOIN PARTY
                  </h3>
                  <p className="font-retro text-green-200">
                    Enter an invite code to join
                  </p>
                </div>
              </button>
            </div>
          </PixelPanel>
        ) : mode === "create" ? (
          <PixelPanel variant="dialog" title="➕ CREATE PARTY">
            <PixelButton
              onClick={() => setMode("select")}
              variant="secondary"
              size="sm"
              className="mb-6"
            >
              ← BACK
            </PixelButton>

            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🏰</div>
              <h2 className="font-pixel text-xl text-white">
                CREATE YOUR PARTY
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-900/50 border-4 border-red-500 rounded-lg">
                <p className="font-bold text-red-200 text-center">
                  ⚠️ {error}
                </p>
              </div>
            )}

            <form onSubmit={handleCreateParty} className="space-y-6">
              <PixelInput
                label="PARTY NAME"
                type="text"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="e.g., The Iron Warriors"
                helperText="Choose a legendary name for your party"
                required
              />

              <PixelButton
                type="submit"
                disabled={loading}
                variant="primary"
                size="lg"
                className="w-full"
              >
                {loading ? "⏳ CREATING..." : "✓ CREATE PARTY"}
              </PixelButton>
            </form>
          </PixelPanel>
        ) : (
          <PixelPanel variant="dialog" title="🚪 JOIN PARTY">
            <PixelButton
              onClick={() => setMode("select")}
              variant="secondary"
              size="sm"
              className="mb-6"
            >
              ← BACK
            </PixelButton>

            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🔑</div>
              <h2 className="font-pixel text-xl text-white">
                JOIN A PARTY
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-900/50 border-4 border-red-500 rounded-lg">
                <p className="font-bold text-red-200 text-center">
                  ⚠️ {error}
                </p>
              </div>
            )}

            <form onSubmit={handleJoinParty} className="space-y-6">
              <div>
                <label className="block font-bold text-sm uppercase tracking-wider mb-2 text-white">
                  INVITE CODE
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-4 bg-white dark:bg-gray-800 border-4 border-gray-800 dark:border-gray-600 rounded-sm font-pixel text-2xl text-gray-900 dark:text-white text-center tracking-wider shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] focus:outline-none focus:border-blue-500 focus:shadow-[4px_4px_0_0_rgba(59,130,246,0.4)] uppercase"
                  placeholder="ABCD12"
                  maxLength={6}
                  required
                />
                <p className="mt-3 font-retro text-sm text-blue-200 text-center">
                  Enter the 6-character code from your party leader
                </p>
              </div>

              <PixelButton
                type="submit"
                disabled={loading || inviteCode.length !== 6}
                variant="success"
                size="lg"
                className="w-full"
              >
                {loading ? "⏳ JOINING..." : "▶ JOIN PARTY"}
              </PixelButton>
            </form>
          </PixelPanel>
        )}
      </main>
    </PageLayout>
  );
}
