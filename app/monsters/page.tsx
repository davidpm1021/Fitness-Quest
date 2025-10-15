"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import PageLayout from "@/components/layout/PageLayout";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelButton from "@/components/ui/PixelButton";

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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    setLoading(true);
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
        setError(null);
      } else {
        setError(data.error || "Failed to load monsters");
      }
    } catch (err) {
      console.error("Error fetching monsters:", err);
      setError("Unable to connect to the server. Please try again.");
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
        toast.success(data.message || "Monster activated!");
        router.push("/dashboard");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-900">
        <PixelPanel variant="dialog">
          <p className="text-white font-retro text-2xl">LOADING MONSTERS...</p>
        </PixelPanel>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageLayout title="👹 SELECT MONSTER" showBackButton={true}>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <PixelPanel variant="warning" className="mb-6">
            <div className="text-center">
              <p className="text-red-300 font-pixel mb-4">⚠️ {error}</p>
              <PixelButton variant="secondary" onClick={fetchMonsters}>
                🔄 RETRY
              </PixelButton>
            </div>
          </PixelPanel>
        )}

        {activeMonster ? (
          <PixelPanel variant="warning" className="mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-yellow-200 font-pixel mb-2">
                ⚔️ CURRENTLY FIGHTING
              </h2>
              <p className="text-xl font-bold text-white font-pixel mb-2">
                {activeMonster.name}
              </p>
              <p className="text-yellow-100 font-retro">
                Defeat this monster before selecting a new one!
              </p>
              <div className="mt-4">
                <PixelButton variant="primary" onClick={() => router.push("/dashboard")}>
                  BACK TO BATTLE
                </PixelButton>
              </div>
            </div>
          </PixelPanel>
        ) : (
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white font-pixel mb-3">
              ⚔️ CHOOSE YOUR CHALLENGE
            </h2>
            <p className="text-gray-300 font-retro mb-2 text-lg">
              Select a monster for your party to fight
            </p>
            <p className="text-sm text-gray-400 font-retro">
              💡 Each type has different stats and strategies!
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monsters.map((monster) => (
            <PixelPanel
              key={monster.id}
              variant="dialog"
              className="hover:scale-[1.02] transition-transform"
            >
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-white font-pixel">
                    {monster.name}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold font-pixel ${getTypeColor(
                      monster.monsterType
                    )}`}
                  >
                    {monster.monsterType}
                  </span>
                </div>

                <p className="text-gray-300 font-retro text-sm mb-3 min-h-[3rem]">
                  {monster.description}
                </p>

                <div className="mb-4 p-3 bg-gray-800/50 rounded border-2 border-purple-500/30">
                  <p className="text-xs text-purple-200 font-retro">
                    {getTypeStrategy(monster.monsterType)}
                  </p>
                </div>

                <div className="space-y-2 mb-4 bg-gray-800/30 p-3 rounded border border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-retro">HP:</span>
                    <span className="font-bold text-green-400 font-pixel">
                      {monster.maxHp}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-retro">Armor Class:</span>
                    <span className="font-bold text-blue-400 font-pixel">
                      {monster.armorClass}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-retro">Counterattack:</span>
                    <span className="font-bold text-red-400 font-pixel">
                      {monster.counterattackChance}%
                    </span>
                  </div>
                </div>
              </div>

              <PixelButton
                variant="primary"
                size="md"
                onClick={() => activateMonster(monster.id)}
                disabled={!!activeMonster || activating === monster.id}
                className="w-full"
              >
                {activating === monster.id ? "⏳ ACTIVATING..." : "⚔️ SELECT"}
              </PixelButton>
            </PixelPanel>
          ))}
        </div>
      </main>
    </PageLayout>
  );
}
