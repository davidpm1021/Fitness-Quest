"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelInput from "@/components/ui/PixelInput";
import PixelBadge from "@/components/ui/PixelBadge";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

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

        <PixelPanel variant="dialog" title="⚔️ HERO LOGIN">
          <div className="text-center mb-6">
            <PixelBadge variant="info" size="md">
              RETURNING HERO
            </PixelBadge>
            <p className="mt-4 text-white font-retro text-lg">
              Continue your fitness adventure
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

            <PixelInput
              label="EMAIL ADDRESS"
              id="email"
              name="email"
              type="email"
              required
              placeholder="hero@fitness-quest.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <PixelInput
              label="PASSWORD"
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <div className="pt-4">
              <PixelButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "⏳ LOGGING IN..." : "▶ LOGIN"}
              </PixelButton>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-300 font-retro mb-2">NEW HERO?</p>
            <Link href="/register">
              <PixelButton variant="success" size="md">
                ✨ CREATE ACCOUNT
              </PixelButton>
            </Link>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
