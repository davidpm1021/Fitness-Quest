"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";

interface Monster {
  id: string;
  name: string;
  description: string;
  monsterType: string;
  maxHp: number;
  currentHp: number;
  armorClass: number;
  baseDamage: number[];
  counterattackChance: number;
  isDefeated: boolean;
}

export default function MonstersPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const toast = useToast();
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [activeMonster, setActiveMonster] = useState<Monster | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchMonsters();
    }
  }, [user, token]);

  async function fetchMonsters() {
    try {
      const response = await fetch("/api/monsters", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMonsters(data.data.availableMonsters);
        setActiveMonster(data.data.activeMonster);
      }
    } catch (err) {
      console.error("Error fetching monsters:", err);
    } finally {
      setLoading(false);
    }
  }

  async function activateMonster(monsterId: string) {
    setActivating(monsterId);
    try {
      const response = await fetch("/api/monsters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ monsterId }),
      });

      const data = await response.json();
      if (data.success) {
        router.push("/party/dashboard");
      } else {
        toast.error(data.error || "Failed to activate monster");
      }
    } catch (err) {
      toast.error("Failed to activate monster");
    } finally {
      setActivating(null);
    }
  }

  function getTypeColor(type: string): string {
    switch (type) {
      case "TANK":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "BALANCED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "GLASS_CANNON":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }

  function getTypeStrategy(type: string): string {
    switch (type) {
      case "TANK":
        return "🛡️ FORGIVING: High HP, lower pressure. Perfect for building habits and long-term consistency. Defeats take longer but misses hurt less.";
      case "BALANCED":
        return "⚖️ STEADY: Balanced challenge with predictable pacing. Standard difficulty for established groups.";
      case "GLASS_CANNON":
        return "⚔️ FAST & RISKY: Low HP means quick victories IF you hit goals (high AC). But counterattacks hit hard. High risk, high reward!";
      default:
        return "";
    }
  }

  if (isLoading || loading) {
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
                Select Monster
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push("/party/dashboard")}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeMonster ? (
          <div className="mb-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
              Active Monster: {activeMonster.name}
            </h2>
            <p className="text-yellow-800 dark:text-yellow-300">
              Your party is currently fighting this monster. Defeat it before selecting a new one!
            </p>
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Choose Your Challenge
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Select a monster for your party to fight. Each type matches different motivation styles and pacing.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              💡 First person to select chooses for the whole party. Choose wisely!
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monsters.map((monster) => (
            <div
              key={monster.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {monster.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(
                    monster.monsterType
                  )}`}
                >
                  {monster.monsterType}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                {monster.description}
              </p>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  {getTypeStrategy(monster.monsterType)}
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">HP:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {monster.maxHp}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Armor Class:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {monster.armorClass}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Counterattack:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {monster.counterattackChance}%
                  </span>
                </div>
              </div>

              <button
                onClick={() => activateMonster(monster.id)}
                disabled={!!activeMonster || activating === monster.id}
                className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {activating === monster.id ? "Activating..." : "Select Monster"}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
