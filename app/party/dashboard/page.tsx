"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

interface PartyMember {
  id: string;
  currentHp: number;
  maxHp: number;
  currentDefense: number;
  currentStreak: number;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
}

interface Party {
  id: string;
  name: string;
  inviteCode: string;
  members: PartyMember[];
  activeMonster: any;
}

export default function PartyDashboard() {
  const router = useRouter();
  const { user, isLoading, token, logout } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteCode, setShowInviteCode] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchParty();
    }
  }, [user, token]);

  async function fetchParty() {
    try {
      const response = await fetch("/api/parties/my-party", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data.party) {
        setParty(data.data.party);
      } else {
        // No party, redirect to party setup
        router.push("/party");
      }
    } catch (err) {
      console.error("Error fetching party:", err);
    } finally {
      setLoading(false);
    }
  }

  function copyInviteCode() {
    if (party) {
      navigator.clipboard.writeText(party.inviteCode);
      alert("Invite code copied to clipboard!");
    }
  }

  function getHpPercentage(currentHp: number, maxHp: number): number {
    return (currentHp / maxHp) * 100;
  }

  function getHpColor(percentage: number): string {
    if (percentage > 66) return "bg-green-500";
    if (percentage > 33) return "bg-yellow-500";
    return "bg-red-500";
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user || !party) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Fitness Quest
              </h1>
              <button
                onClick={() => router.push("/goals")}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                My Goals
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">
                {user.displayName}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Party Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {party.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {party.members.length} member{party.members.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/check-in")}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Daily Check-In
              </button>
              <button
                onClick={() => setShowInviteCode(!showInviteCode)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {showInviteCode ? "Hide" : "Show"} Invite Code
              </button>
            </div>
          </div>

          {showInviteCode && (
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Share this code with friends to invite them:
                  </p>
                  <code className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                    {party.inviteCode}
                  </code>
                </div>
                <button
                  onClick={copyInviteCode}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Copy Code
                </button>
              </div>
            </div>
          )}

          {/* Active Monster Section */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
              {party.activeMonster ? (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {party.activeMonster.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {party.activeMonster.description}
                  </p>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>HP</span>
                      <span>
                        {party.activeMonster.currentHp} / {party.activeMonster.maxHp}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-red-500 h-4 rounded-full transition-all"
                        style={{
                          width: `${getHpPercentage(
                            party.activeMonster.currentHp,
                            party.activeMonster.maxHp
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Type
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {party.activeMonster.monsterType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Armor Class
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {party.activeMonster.armorClass}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Counterattack
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {party.activeMonster.counterattackChance}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No active monster yet
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Monsters will be available in Sprint 4
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Party Members */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Party Members
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {party.members.map((member) => (
                <div
                  key={member.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {member.user.displayName.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {member.user.displayName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        @{member.user.username}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>HP</span>
                        <span>
                          {member.currentHp} / {member.maxHp}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`${getHpColor(
                            getHpPercentage(member.currentHp, member.maxHp)
                          )} h-2 rounded-full transition-all`}
                          style={{
                            width: `${getHpPercentage(
                              member.currentHp,
                              member.maxHp
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Defense
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          +{member.currentDefense}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Streak
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {member.currentStreak} days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sprint Progress */}
          <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sprint 3: Combat Core - Complete! ✅
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Daily check-ins and combat mechanics are now live! Click the button above to check in.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
