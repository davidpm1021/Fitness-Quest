"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import { BadgeDisplay, BadgeProgress } from "@/components/game/BadgeDisplay";

interface Badge {
  badgeType: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  earnedAt: Date | null;
}

interface BadgesByCategory {
  monsterDefeat: Badge[];
  streaks: Badge[];
  goalAchievement: Badge[];
  teamPlayer: Badge[];
  combat: Badge[];
  consistency: Badge[];
}

export default function BadgesPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [badgesByCategory, setBadgesByCategory] = useState<BadgesByCategory>({
    monsterDefeat: [],
    streaks: [],
    goalAchievement: [],
    teamPlayer: [],
    combat: [],
    consistency: [],
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchBadges();
    }
  }, [user, token]);

  async function fetchBadges() {
    try {
      const response = await fetch("/api/badges", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setEarnedCount(data.data.earnedCount);
        setTotalCount(data.data.totalCount);
        setBadgesByCategory(data.data.badgesByCategory);
      }
    } catch (err) {
      console.error("Error fetching badges:", err);
    } finally {
      setLoading(false);
    }
  }

  if (isLoading || loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-gray-600 dark:text-gray-400">Loading badges...</p>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Badge Collection
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Earn badges by achieving milestones and mastering the game
            </p>
          </div>
          <button
            onClick={() => router.push("/party/dashboard")}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <BadgeProgress earnedCount={earnedCount} totalCount={totalCount} />
        </div>

        <div className="space-y-8">
          <BadgeDisplay
            badges={badgesByCategory.monsterDefeat}
            title="🗡️ Monster Slayer"
          />
          <BadgeDisplay
            badges={badgesByCategory.streaks}
            title="🔥 Streak Master"
          />
          <BadgeDisplay
            badges={badgesByCategory.goalAchievement}
            title="🎯 Goal Achiever"
          />
          <BadgeDisplay
            badges={badgesByCategory.teamPlayer}
            title="💚 Team Player"
          />
          <BadgeDisplay
            badges={badgesByCategory.combat}
            title="⚔️ Combat Expert"
          />
          <BadgeDisplay
            badges={badgesByCategory.consistency}
            title="📅 Consistency Champion"
          />
        </div>
      </div>
    </PageLayout>
  );
}
