"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelInput from "@/components/ui/PixelInput";
import PixelPasswordInput from "@/components/ui/PixelPasswordInput";
import PixelBadge from "@/components/ui/PixelBadge";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({
    checking: false,
    available: null,
    message: "",
  });

  // Debounced email availability check
  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.email || formData.email.length < 3) {
        setEmailStatus({ checking: false, available: null, message: "" });
        return;
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setEmailStatus({ checking: false, available: null, message: "" });
        return;
      }

      setEmailStatus({ checking: true, available: null, message: "Checking..." });

      try {
        const response = await fetch(
          `/api/auth/check-email?email=${encodeURIComponent(formData.email)}`
        );
        const data = await response.json();

        if (data.success) {
          setEmailStatus({
            checking: false,
            available: data.available,
            message: data.message,
          });
        }
      } catch (err) {
        console.error("Error checking email:", err);
        setEmailStatus({ checking: false, available: null, message: "" });
      }
    };

    // Debounce the email check by 500ms
    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Check if email is available
    if (emailStatus.available === false) {
      setError("This email is already registered. Please log in instead.");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
      });
      // Redirect to onboarding flow
      router.push("/onboarding/character");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Get email status indicator
  const getEmailStatusIndicator = () => {
    if (emailStatus.checking) {
      return <span className="text-yellow-400">⏳ Checking...</span>;
    }
    if (emailStatus.available === true) {
      return <span className="text-green-400">✓ Available</span>;
    }
    if (emailStatus.available === false) {
      return <span className="text-red-400">✗ Already registered</span>;
    }
    return null;
  };

  // Password match indicator
  const passwordsMatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;
  const passwordsDontMatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password !== formData.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center game-bg pixel-grid-bg py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: i % 5 === 0 ? '3px' : '2px',
              height: i % 5 === 0 ? '3px' : '2px',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Back to home link */}
        <div className="text-center mb-6">
          <Link href="/">
            <PixelButton variant="secondary" size="sm">
              ← BACK TO HOME
            </PixelButton>
          </Link>
        </div>

        <PixelPanel variant="dialog" title="✨ CREATE HERO">
          <div className="text-center mb-6">
            <PixelBadge variant="success" size="md">
              NEW HERO
            </PixelBadge>
            <p className="mt-4 text-white font-retro text-lg">
              Begin your fitness adventure
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border-4 border-red-500 rounded-lg p-4">
                <p className="text-red-200 font-bold text-center">
                  ⚠️ {error}
                </p>
              </div>
            )}

            <div>
              <PixelInput
                label="EMAIL ADDRESS"
                id="email"
                name="email"
                type="email"
                required
                placeholder="hero@fitness-quest.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                helperText="Your email will be used to log in"
                error={emailStatus.available === false ? emailStatus.message : undefined}
              />
              <div className="mt-1 text-sm font-retro">
                {getEmailStatusIndicator()}
              </div>
            </div>

            <PixelInput
              label="DISPLAY NAME"
              id="displayName"
              name="displayName"
              type="text"
              required
              placeholder="Epic Hero Name"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              helperText="This is how you'll appear to others"
            />

            <PixelPasswordInput
              label="PASSWORD"
              id="password"
              name="password"
              required
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="8+ chars, letters & numbers"
            />

            <div>
              <PixelPasswordInput
                label="CONFIRM PASSWORD"
                id="confirmPassword"
                name="confirmPassword"
                required
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={passwordsDontMatch ? "Passwords do not match" : undefined}
              />
              {passwordsMatch && (
                <p className="mt-1 text-sm text-green-400 font-retro flex items-center gap-1">
                  <span>✓</span> Passwords match
                </p>
              )}
            </div>

            <div className="pt-4">
              <PixelButton
                type="submit"
                variant="success"
                size="lg"
                disabled={
                  isLoading ||
                  emailStatus.checking ||
                  emailStatus.available === false ||
                  passwordsDontMatch ||
                  !passwordsMatch
                }
                className="w-full"
              >
                {isLoading ? "⏳ CREATING HERO..." : "✨ CREATE HERO"}
              </PixelButton>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-300 font-retro mb-2">ALREADY A HERO?</p>
            <Link href="/login">
              <PixelButton variant="primary" size="md">
                ▶ LOGIN
              </PixelButton>
            </Link>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
