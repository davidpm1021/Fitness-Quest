"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

export default function PartyPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
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
      alert("Invite code copied to clipboard!");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Fitness Quest
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {createdParty ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Party Created!
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {createdParty.name}
                </p>
              </div>

              <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Share this invite code with your friends:
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <code className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                    {createdParty.inviteCode}
                  </code>
                  <button
                    onClick={copyInviteCode}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <button
                onClick={() => router.push("/party/dashboard")}
                className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Go to Party Dashboard
              </button>
            </div>
          </div>
        ) : mode === "select" ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Join the Adventure
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Create a new party or join an existing one
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setMode("create")}
                className="p-8 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full mb-4">
                    <svg
                      className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Create Party
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Start a new party and invite friends
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode("join")}
                className="p-8 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                    <svg
                      className="w-8 h-8 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Join Party
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Enter an invite code to join
                  </p>
                </div>
              </button>
            </div>
          </div>
        ) : mode === "create" ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <button
              onClick={() => setMode("select")}
              className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back
            </button>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Create Your Party
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreateParty} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Party Name
                </label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="e.g., The Iron Warriors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Party"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <button
              onClick={() => setMode("select")}
              className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back
            </button>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Join a Party
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleJoinParty} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center text-2xl tracking-wider font-mono"
                  placeholder="ABCD12"
                  maxLength={6}
                  required
                />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Enter the 6-character code shared by your party leader
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || inviteCode.length !== 6}
                className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {loading ? "Joining..." : "Join Party"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
