"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import { BadgeNotification } from "@/components/game/BadgeDisplay";
import confetti from "canvas-confetti";

interface VictoryStats {
  monsterName: string;
  monsterType: string;
  daysToDefeat: number;
  totalDamageDealt: number;
  totalHeals: number;
  mvps: {
    consistent?: { userId: string; displayName: string; streak: number };
    supportive?: { userId: string; displayName: string; healsGiven: number };
    damage?: { userId: string; displayName: string; damageDealt: number };
  };
}

interface Badge {
  name: string;
  description: string;
  icon: string;
}

export default function VictoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VictoryStats | null>(null);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      checkForNewBadges();
      loadVictoryStats();
      triggerConfetti();
    }
  }, [user, token]);

  async function checkForNewBadges() {
    try {
      const response = await fetch("/api/badges/check", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data.newBadges.length > 0) {
        setNewBadges(data.data.newBadges);
        setShowBadgeNotification(true);
      }
    } catch (err) {
      console.error("Error checking badges:", err);
    }
  }

  async function loadVictoryStats() {
    const victoryId = searchParams.get("id");
    if (!victoryId) {
      // If no victory ID, show mock stats for testing
      setStats({
        monsterName: "The Procrastination Demon",
        monsterType: "BALANCED",
        daysToDefeat: 7,
        totalDamageDealt: 350,
        totalHeals: 45,
        mvps: {
          consistent: {
            userId: user?.id || "",
            displayName: user?.displayName || "You",
            streak: 7,
          },
        },
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/victory/${victoryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Error loading victory stats:", err);
    } finally {
      setLoading(false);
    }
  }

  function triggerConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#6366f1", "#8b5cf6", "#ec4899"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#6366f1", "#8b5cf6", "#ec4899"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }

  function getTypeColor(type: string): string {
    switch (type) {
      case "TANK":
        return "text-blue-600 dark:text-blue-400";
      case "BALANCED":
        return "text-purple-600 dark:text-purple-400";
      case "GLASS_CANNON":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  }

  if (isLoading || loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-gray-600 dark:text-gray-400">Loading victory stats...</p>
        </div>
      </PageLayout>
    );
  }

  if (!user || !stats) {
    return null;
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Victory Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-6xl animate-bounce">🎉</div>
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600">
            VICTORY!
          </h1>
          <p className="text-2xl text-gray-900 dark:text-white">
            You defeated{" "}
            <span className={`font-bold ${getTypeColor(stats.monsterType)}`}>
              {stats.monsterName}
            </span>
          </p>
        </div>

        {/* Battle Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Battle Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.daysToDefeat}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Days to Defeat
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-4xl font-bold text-red-600 dark:text-red-400">
                {stats.totalDamageDealt}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Total Damage
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                {stats.totalHeals}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Total Healing
              </div>
            </div>
          </div>
        </div>

        {/* MVP Awards */}
        {(stats.mvps.consistent || stats.mvps.supportive || stats.mvps.damage) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              MVP Awards 🏆
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.mvps.consistent && (
                <div className="p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 rounded-lg border-2 border-yellow-400 dark:border-yellow-600">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {stats.mvps.consistent.displayName}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Most Consistent
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {stats.mvps.consistent.streak} day streak
                  </div>
                </div>
              )}
              {stats.mvps.supportive && (
                <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-lg border-2 border-green-400 dark:border-green-600">
                  <div className="text-3xl mb-2">💚</div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {stats.mvps.supportive.displayName}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Most Supportive
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {stats.mvps.supportive.healsGiven} heals given
                  </div>
                </div>
              )}
              {stats.mvps.damage && (
                <div className="p-4 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 rounded-lg border-2 border-red-400 dark:border-red-600">
                  <div className="text-3xl mb-2">⚔️</div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {stats.mvps.damage.displayName}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Top Damage Dealer
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {stats.mvps.damage.damageDealt} damage dealt
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push("/badges")}
            className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors"
          >
            View Badges
          </button>
          <button
            onClick={() => router.push("/monsters")}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
          >
            Choose Next Monster
          </button>
          <button
            onClick={() => router.push("/party/dashboard")}
            className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Badge Notification Modal */}
      {showBadgeNotification && (
        <BadgeNotification
          badges={newBadges}
          onClose={() => setShowBadgeNotification(false)}
        />
      )}
    </PageLayout>
  );
}
