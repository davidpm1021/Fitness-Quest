"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import PageLayout from "@/components/layout/PageLayout";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelBadge from "@/components/ui/PixelBadge";

interface Skill {
  id: string;
  name: string;
  description: string;
  tier: number;
  position: number;
  skillType: string;
  effectType: string;
  effectValue: number;
  prerequisiteSkillId: string | null;
  requiredLevel: number;
  unlocked?: boolean;
}

interface SkillTree {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  skills: Skill[];
}

interface PlayerStats {
  level: number;
  skillPoints: number;
  xp: number;
}

export default function SkillsPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const toast = useToast();
  const [skillTrees, setSkillTrees] = useState<SkillTree[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [selectedTree, setSelectedTree] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchSkills();
    }
  }, [user, token]);

  async function fetchSkills() {
    try {
      const response = await fetch("/api/skills", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSkillTrees(data.data.skillTrees);
        setPlayerStats(data.data.playerStats);
        if (data.data.skillTrees.length > 0 && !selectedTree) {
          setSelectedTree(data.data.skillTrees[0].id);
        }
      } else {
        toast.error(data.error || "Failed to load skills");
      }
    } catch (err) {
      console.error("Error fetching skills:", err);
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  }

  async function unlockSkill(skillId: string) {
    if (!playerStats || playerStats.skillPoints < 1) {
      toast.error("Not enough skill points!");
      return;
    }

    setUnlocking(skillId);
    try {
      const response = await fetch("/api/skills/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skillId }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || "Skill unlocked!");
        fetchSkills(); // Refresh skills
        setSelectedSkill(null);
      } else {
        toast.error(data.error || "Failed to unlock skill");
      }
    } catch (err) {
      console.error("Error unlocking skill:", err);
      toast.error("Failed to unlock skill");
    } finally {
      setUnlocking(null);
    }
  }

  function canUnlockSkill(skill: Skill): { canUnlock: boolean; reason?: string } {
    if (!playerStats) return { canUnlock: false, reason: "Loading..." };
    if (skill.unlocked) return { canUnlock: false, reason: "Already unlocked" };
    if (playerStats.skillPoints < 1) return { canUnlock: false, reason: "Not enough skill points" };
    if (playerStats.level < skill.requiredLevel) {
      return { canUnlock: false, reason: `Requires level ${skill.requiredLevel}` };
    }

    // Check prerequisite
    if (skill.prerequisiteSkillId) {
      const currentTree = skillTrees.find((t) => t.id === selectedTree);
      const prerequisite = currentTree?.skills.find((s) => s.id === skill.prerequisiteSkillId);
      if (prerequisite && !prerequisite.unlocked) {
        return { canUnlock: false, reason: `Requires: ${prerequisite.name}` };
      }
    }

    return { canUnlock: true };
  }

  function getEffectDescription(effectType: string, effectValue: number): string {
    switch (effectType) {
      case "DAMAGE_BOOST":
        return `+${(effectValue * 100).toFixed(0)}% damage`;
      case "HP_BOOST":
        return `+${effectValue} HP when checking in`;
      case "MAX_HP_BOOST":
        return `+${effectValue} max HP`;
      case "DEFENSE_BOOST":
        return `+${effectValue} defense`;
      case "FOCUS_REGEN":
        return `+${effectValue} focus regeneration`;
      case "FOCUS_MAX_BOOST":
        return `+${effectValue} max focus`;
      case "HEALING_BOOST":
        return `+${(effectValue * 100).toFixed(0)}% healing power`;
      case "COUNTERATTACK_REDUCTION":
        return `-${(effectValue * 100).toFixed(0)}% counterattack damage`;
      case "CRITICAL_CHANCE":
        return `+${(effectValue * 100).toFixed(0)}% critical hit chance`;
      case "STREAK_PROTECTION":
        return `Streak protection enabled`;
      case "TEAM_DAMAGE_BOOST":
        return `+${(effectValue * 100).toFixed(0)}% team damage`;
      case "TEAM_DEFENSE_BOOST":
        return `+${effectValue} team defense`;
      case "XP_BOOST":
        return `+${(effectValue * 100).toFixed(0)}% XP earned`;
      default:
        return `+${effectValue}`;
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center game-bg pixel-grid-bg">
        <p className="text-white font-retro text-xl">Loading...</p>
      </div>
    );
  }

  if (!user || !playerStats) {
    return null;
  }

  const currentTree = skillTrees.find((t) => t.id === selectedTree);
  const maxTier = currentTree ? Math.max(...currentTree.skills.map((s) => s.tier)) : 5;

  return (
    <PageLayout title="🌳 SKILL TREES" showBackButton={true} backPath="/party/dashboard">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Player Stats Header */}
        <div className="mb-8">
          <PixelPanel variant="menu">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="font-pixel text-2xl text-white mb-2">
                  CHARACTER PROGRESSION
                </h2>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <span className="font-retro text-sm text-gray-400">Level</span>
                    <p className="font-pixel text-xl text-yellow-400">{playerStats.level}</p>
                  </div>
                  <div>
                    <span className="font-retro text-sm text-gray-400">Skill Points</span>
                    <p className="font-pixel text-xl text-green-400">{playerStats.skillPoints}</p>
                  </div>
                  <div>
                    <span className="font-retro text-sm text-gray-400">Total XP</span>
                    <p className="font-pixel text-xl text-blue-400">{playerStats.xp}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-retro text-sm text-gray-400 mb-2">
                  Earn skill points by leveling up
                </p>
                <p className="font-retro text-xs text-gray-500">
                  1 skill point per level
                </p>
              </div>
            </div>
          </PixelPanel>
        </div>

        {/* Skill Tree Tabs */}
        <div className="mb-6 flex gap-3 flex-wrap">
          {skillTrees.map((tree) => (
            <PixelButton
              key={tree.id}
              onClick={() => setSelectedTree(tree.id)}
              variant={selectedTree === tree.id ? "primary" : "secondary"}
              size="lg"
            >
              {tree.icon} {tree.name}
            </PixelButton>
          ))}
        </div>

        {/* Selected Tree Description */}
        {currentTree && (
          <div className="mb-8">
            <PixelPanel variant="dialog">
              <div className="text-center">
                <div className="text-6xl mb-4">{currentTree.icon}</div>
                <h3 className="font-pixel text-3xl text-white mb-3">
                  {currentTree.name}
                </h3>
                <p className="font-retro text-lg text-gray-300 max-w-2xl mx-auto">
                  {currentTree.description}
                </p>
              </div>
            </PixelPanel>
          </div>
        )}

        {/* Skill Tree Grid */}
        {currentTree && (
          <div className="space-y-8">
            {Array.from({ length: maxTier }, (_, i) => i + 1).map((tier) => {
              const tierSkills = currentTree.skills.filter((s) => s.tier === tier);
              if (tierSkills.length === 0) return null;

              return (
                <div key={tier}>
                  <div className="mb-4">
                    <PixelBadge variant="warning" size="lg">
                      TIER {tier} - Level {tierSkills[0]?.requiredLevel}
                    </PixelBadge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tierSkills.map((skill) => {
                      const unlockCheck = canUnlockSkill(skill);
                      const isSelected = selectedSkill?.id === skill.id;

                      return (
                        <div
                          key={skill.id}
                          onClick={() => setSelectedSkill(skill)}
                          className={`
                            cursor-pointer transition-all
                            ${isSelected ? "scale-105" : "scale-100"}
                          `}
                        >
                          <PixelPanel
                            variant={skill.unlocked ? "success" : "menu"}
                            className={`
                              relative h-full
                              ${!skill.unlocked && !unlockCheck.canUnlock ? "opacity-50" : ""}
                              ${isSelected ? "ring-4 ring-yellow-400" : ""}
                            `}
                          >
                            {/* Lock Icon */}
                            {!skill.unlocked && (
                              <div className="absolute top-2 right-2 text-2xl">
                                🔒
                              </div>
                            )}

                            {/* Unlocked Check */}
                            {skill.unlocked && (
                              <div className="absolute top-2 right-2 text-2xl">
                                ✅
                              </div>
                            )}

                            <div className="mb-3">
                              <h4 className="font-pixel text-lg text-white mb-1">
                                {skill.name}
                              </h4>
                              <p className="font-retro text-sm text-gray-300 mb-2">
                                {skill.description}
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                <PixelBadge
                                  variant={skill.unlocked ? "success" : "info"}
                                  size="sm"
                                >
                                  {skill.skillType}
                                </PixelBadge>
                                <span className="font-retro text-xs text-yellow-400">
                                  {getEffectDescription(skill.effectType, skill.effectValue)}
                                </span>
                              </div>
                            </div>

                            {/* Unlock Button */}
                            {!skill.unlocked && (
                              <div className="mt-3 pt-3 border-t-2 border-gray-700">
                                {unlockCheck.canUnlock ? (
                                  <PixelButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      unlockSkill(skill.id);
                                    }}
                                    disabled={unlocking === skill.id}
                                    variant="success"
                                    size="sm"
                                    fullWidth
                                  >
                                    {unlocking === skill.id
                                      ? "⏳ UNLOCKING..."
                                      : "✨ UNLOCK (1 SP)"}
                                  </PixelButton>
                                ) : (
                                  <p className="font-retro text-xs text-red-400 text-center">
                                    {unlockCheck.reason}
                                  </p>
                                )}
                              </div>
                            )}
                          </PixelPanel>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {skillTrees.length === 0 && (
          <PixelPanel variant="menu">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌳</div>
              <h3 className="font-pixel text-2xl text-white mb-3">
                No Skill Trees Available
              </h3>
              <p className="font-retro text-lg text-gray-300 mb-6">
                Skill trees haven't been seeded yet. Contact your administrator.
              </p>
            </div>
          </PixelPanel>
        )}
      </main>
    </PageLayout>
  );
}
