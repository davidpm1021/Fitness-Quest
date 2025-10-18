"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import HPBar from "@/components/ui/HPBar";
import ProgressionDisplay from "@/components/game/ProgressionDisplay";
import WhatsNewModal from "@/components/ui/WhatsNewModal";

interface BattleModifier {
  id: string;
  modifierType: string;
  modifierCategory: string;
  effectDescription: string;
  statEffect: string | null;
  effectValue: number;
}

interface PartyData {
  id: string;
  name: string;
  members: Array<{
    id: string;
    userId: string;
    currentHp: number;
    maxHp: number;
    currentDefense: number;
    currentStreak: number;
    xp: number;
    level: number;
    skillPoints: number;
    user: {
      displayName: string;
      characterName?: string;
    };
  }>;
  activeMonster?: {
    id: string;
    name: string;
    monsterType: string;
    currentHp: number;
    maxHp: number;
    armorClass: number;
    battleModifiers?: BattleModifier[];
  };
}

type MonsterPhase = 1 | 2 | 3 | 4;

interface PhaseInfo {
  phase: MonsterPhase;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface GoalData {
  id: string;
  name: string;
  goalType: string;
  targetValue: number;
  targetUnit: string;
}

interface Announcement {
  id: string;
  title: string;
  description: string;
  category: "NEW_FEATURE" | "IMPROVEMENT" | "BUG_FIX" | "COMING_SOON" | "MAINTENANCE";
  version: string | null;
  releaseDate: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [partyData, setPartyData] = useState<PartyData | null>(null);
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [badgeProgress, setBadgeProgress] = useState({ earned: 0, total: 20 });
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [newAnnouncements, setNewAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      // Check if onboarding is complete
      if (user.onboardingStep !== 'complete') {
        // Redirect to appropriate onboarding step
        router.push(`/onboarding/${user.onboardingStep || 'character'}`);
        return;
      }

      fetchDashboardData();
    }
  }, [user, token]);

  async function fetchDashboardData() {
    try {
      // Fetch party data
      const partyResponse = await fetch('/api/parties/my-party', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (partyResponse.ok) {
        const partyResult = await partyResponse.json();
        if (partyResult.success) {
          setPartyData(partyResult.data.party);
        }
      }

      // Fetch goals
      const goalsResponse = await fetch('/api/goals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (goalsResponse.ok) {
        const goalsResult = await goalsResponse.json();
        if (goalsResult.success) {
          setGoals(goalsResult.data.goals);
        }
      }

      // Fetch badge progress
      const badgesResponse = await fetch('/api/badges', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (badgesResponse.ok) {
        const badgesResult = await badgesResponse.json();
        if (badgesResult.success) {
          setBadgeProgress({
            earned: badgesResult.data.earnedCount,
            total: badgesResult.data.totalCount,
          });
        }
      }

      // Fetch new announcements
      const announcementsResponse = await fetch('/api/announcements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (announcementsResponse.ok) {
        const announcementsResult = await announcementsResponse.json();
        if (announcementsResult.success && announcementsResult.data.newAnnouncements.length > 0) {
          setNewAnnouncements(announcementsResult.data.newAnnouncements);
          setShowWhatsNew(true); // Auto-show modal if there are new announcements
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAnnouncementsRead() {
    try {
      await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          announcementIds: newAnnouncements.map((a) => a.id),
        }),
      });
    } catch (error) {
      console.error('Error marking announcements as read:', error);
    }
  }

  function getTypeColor(type: string): string {
    switch (type) {
      case 'TANK':
        return 'from-blue-600 to-cyan-600 border-blue-400';
      case 'BALANCED':
        return 'from-purple-600 to-pink-600 border-purple-400';
      case 'GLASS_CANNON':
        return 'from-red-600 to-orange-600 border-red-400';
      default:
        return 'from-gray-600 to-gray-700 border-gray-400';
    }
  }

  function getModifierIcon(type: string): string {
    const icons: Record<string, string> = {
      INSPIRED: "✨",
      EXHAUSTED: "😫",
      FOCUSED: "🎯",
      STURDY: "🛡️",
      WEAKENED: "😓",
      BLESSED: "🙏",
      CURSED: "👿",
      PRECISE: "⚡",
      CLUMSY: "🤦",
      ENRAGED: "🔥",
      FEARFUL: "😰",
      DETERMINED: "💪",
    };
    return icons[type] || "⭐";
  }

  function getModifierCategoryColor(category: string): string {
    switch (category) {
      case "POSITIVE":
        return "bg-green-500/20 text-green-200 border-green-500/50";
      case "NEGATIVE":
        return "bg-red-500/20 text-red-200 border-red-500/50";
      case "NEUTRAL":
        return "bg-yellow-500/20 text-yellow-200 border-yellow-500/50";
      default:
        return "bg-gray-500/20 text-gray-200 border-gray-500/50";
    }
  }

  function calculateMonsterPhase(currentHp: number, maxHp: number): MonsterPhase {
    if (maxHp <= 0) return 1;
    const hpPercentage = (currentHp / maxHp) * 100;
    if (hpPercentage > 75) return 1;
    if (hpPercentage > 50) return 2;
    if (hpPercentage > 25) return 3;
    return 4;
  }

  function getPhaseInfo(phase: MonsterPhase): PhaseInfo {
    const phases: Record<MonsterPhase, PhaseInfo> = {
      1: {
        phase: 1,
        name: 'Normal',
        description: 'The monster is at full strength.',
        icon: '👹',
        color: 'text-gray-400',
      },
      2: {
        phase: 2,
        name: 'Bloodied',
        description: 'The monster is wounded and fighting more aggressively!',
        icon: '💢',
        color: 'text-yellow-400',
      },
      3: {
        phase: 3,
        name: 'Enraged',
        description: 'The monster has entered a furious rage!',
        icon: '🔥',
        color: 'text-orange-400',
      },
      4: {
        phase: 4,
        name: 'Desperate',
        description: 'The monster fights with desperate ferocity!',
        icon: '💀',
        color: 'text-red-400',
      },
    };
    return phases[phase];
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-900">
        <PixelPanel variant="dialog">
          <p className="text-white font-retro text-2xl">LOADING...</p>
        </PixelPanel>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentMember = partyData?.members.find((m) => m.userId === user.id);

  return (
    <PageLayout>
      {/* What's New Modal */}
      <WhatsNewModal
        isOpen={showWhatsNew}
        announcements={newAnnouncements}
        onClose={() => setShowWhatsNew(false)}
        onMarkAsRead={handleMarkAnnouncementsRead}
      />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white font-pixel mb-2">
            WELCOME, {user.characterName || user.displayName}!
          </h1>
          <p className="text-gray-300 font-retro">Your adventure continues</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Hero Status Card */}
          <div className="lg:col-span-1">
            <PixelPanel variant="dialog" title="⚔️ HERO STATUS">
              {partyData && currentMember ? (
                <div className="space-y-4">
                  <div>
                    <HPBar
                      current={currentMember.currentHp}
                      max={currentMember.maxHp}
                      size="md"
                      label="HEALTH"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-3 border-2 border-blue-500/30">
                      <div className="text-3xl mb-1">🛡️</div>
                      <div className="text-sm text-gray-400 font-retro">DEFENSE</div>
                      <div className="text-2xl font-bold text-blue-400 font-pixel">
                        {currentMember.currentDefense}
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-3 border-2 border-orange-500/30">
                      <div className="text-3xl mb-1">🔥</div>
                      <div className="text-sm text-gray-400 font-retro">STREAK</div>
                      <div className="text-2xl font-bold text-orange-400 font-pixel">
                        {currentMember.currentStreak} DAY{currentMember.currentStreak !== 1 ? 'S' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Progression Display */}
                  <ProgressionDisplay
                    xp={currentMember.xp}
                    level={currentMember.level}
                    skillPoints={currentMember.skillPoints}
                    variant="compact"
                    showXPBreakdown={true}
                  />
                </div>
              ) : !partyData ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 font-retro mb-4">No party joined yet</p>
                  <PixelButton
                    variant="primary"
                    size="sm"
                    onClick={() => router.push('/party')}
                  >
                    JOIN A PARTY
                  </PixelButton>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 font-retro mb-4">Loading hero stats...</p>
                </div>
              )}
            </PixelPanel>
          </div>

          {/* Active Monster Card */}
          <div className="lg:col-span-2">
            <PixelPanel variant="dialog" title="👹 ACTIVE QUEST">
              {partyData?.activeMonster ? (
                <div className="space-y-4">
                  <div className={`bg-gradient-to-r ${getTypeColor(partyData.activeMonster.monsterType)} rounded-lg p-6 border-4`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white font-pixel mb-1">
                          {partyData.activeMonster.name}
                        </h3>
                        <p className="text-sm text-white/80 font-retro">
                          Type: {partyData.activeMonster.monsterType} | AC: {partyData.activeMonster.armorClass}
                        </p>
                      </div>
                      <div className="text-6xl">👹</div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-white font-retro text-sm">MONSTER HP</span>
                        <span className="text-white font-bold font-pixel">
                          {partyData.activeMonster.currentHp}/{partyData.activeMonster.maxHp}
                        </span>
                      </div>
                      <HPBar
                        current={partyData.activeMonster.currentHp}
                        max={partyData.activeMonster.maxHp}
                        size="lg"
                        variant="enemy"
                      />
                      <div className="mt-2 text-center">
                        <span className="text-white font-retro text-sm">
                          {Math.round((partyData.activeMonster.currentHp / partyData.activeMonster.maxHp) * 100)}% Remaining
                        </span>
                      </div>
                    </div>

                    {/* Battle Modifiers */}
                    {partyData.activeMonster.battleModifiers && partyData.activeMonster.battleModifiers.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-white font-retro mb-3 text-center">⚡ ACTIVE MODIFIERS:</p>
                        <div className="space-y-2">
                          {partyData.activeMonster.battleModifiers.map((mod) => (
                            <div
                              key={mod.id}
                              className={`px-3 py-2 rounded-lg text-xs font-retro border-2 ${getModifierCategoryColor(
                                mod.modifierCategory
                              )}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">{getModifierIcon(mod.modifierType)}</span>
                                <span className="font-bold uppercase">{mod.modifierType.replace('_', ' ')}</span>
                              </div>
                              <p className="text-xs mt-1 opacity-90">{mod.effectDescription}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Monster Phase */}
                    {(() => {
                      const currentPhase = calculateMonsterPhase(
                        partyData.activeMonster.currentHp,
                        partyData.activeMonster.maxHp
                      );
                      const phaseInfo = getPhaseInfo(currentPhase);

                      if (currentPhase > 1) {
                        return (
                          <div className="mt-4">
                            <div className={`bg-black/30 rounded-lg p-3 border-2 border-white/20`}>
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-3xl">{phaseInfo.icon}</span>
                                <div className="text-center">
                                  <p className={`text-sm font-retro ${phaseInfo.color} font-bold`}>
                                    PHASE {currentPhase}: {phaseInfo.name.toUpperCase()}
                                  </p>
                                  <p className="text-xs text-white/70 font-retro mt-1">
                                    {phaseInfo.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="text-center">
                    <PixelButton
                      variant="warning"
                      size="lg"
                      onClick={() => router.push('/check-in')}
                    >
                      ⚔️ ATTACK NOW
                    </PixelButton>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🗡️</div>
                  <p className="text-gray-400 font-retro mb-4">
                    {partyData ? 'No active monster. Select one to begin!' : 'Join a party to battle monsters'}
                  </p>
                  {partyData && (
                    <PixelButton
                      variant="primary"
                      size="lg"
                      onClick={() => router.push('/monsters')}
                    >
                      SELECT MONSTER
                    </PixelButton>
                  )}
                </div>
              )}
            </PixelPanel>
          </div>
        </div>

        {/* Party Members & Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Party Members */}
          {partyData && partyData.members.length > 0 && (
            <PixelPanel variant="default" title="👥 PARTY MEMBERS">
              <div className="space-y-3">
                {partyData.members.map((member) => (
                  <div
                    key={member.id}
                    className={`bg-gray-800/50 rounded-lg p-4 border-2 ${
                      member.userId === user.id ? 'border-yellow-500' : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-white font-bold font-pixel">
                          {member.user.characterName || member.user.displayName}
                          {member.userId === user.id && ' (You)'}
                        </h4>
                        <p className="text-gray-400 text-sm font-retro">
                          {member.currentStreak} day streak
                        </p>
                      </div>
                      <div className="text-2xl">
                        {member.currentHp > 75 ? '💪' : member.currentHp > 40 ? '😊' : '😓'}
                      </div>
                    </div>
                    <HPBar
                      current={member.currentHp}
                      max={member.maxHp}
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                ))}
              </div>

              {partyData && (
                <div className="mt-4 text-center">
                  <PixelButton
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/party/dashboard')}
                  >
                    VIEW PARTY DETAILS
                  </PixelButton>
                </div>
              )}
            </PixelPanel>
          )}

          {/* Goals & Badge Progress */}
          <div className="space-y-6">
            {/* Goals for Today */}
            <PixelPanel variant="default" title="🎯 YOUR GOALS">
              {goals.length > 0 ? (
                <div className="space-y-2">
                  {goals.slice(0, 3).map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-gray-800/50 rounded-lg p-3 border-2 border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-retro">{goal.name}</span>
                        <span className="text-gray-400 font-retro text-sm">
                          {goal.targetValue} {goal.targetUnit}
                        </span>
                      </div>
                    </div>
                  ))}
                  {goals.length > 3 && (
                    <p className="text-gray-400 text-sm font-retro text-center mt-2">
                      + {goals.length - 3} more goal{goals.length - 3 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 font-retro mb-3">No goals set yet</p>
                  <PixelButton
                    variant="primary"
                    size="sm"
                    onClick={() => router.push('/goals')}
                  >
                    SET GOALS
                  </PixelButton>
                </div>
              )}
              {goals.length > 0 && (
                <div className="mt-4 text-center">
                  <PixelButton
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/goals')}
                  >
                    MANAGE GOALS
                  </PixelButton>
                </div>
              )}
            </PixelPanel>

            {/* Badge Progress */}
            <PixelPanel variant="default" title="🏆 BADGE COLLECTION">
              <div className="text-center">
                <div className="text-5xl mb-3">🏆</div>
                <div className="text-3xl font-bold text-white font-pixel mb-2">
                  {badgeProgress.earned} / {badgeProgress.total}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-4 rounded-full transition-all"
                    style={{
                      width: `${(badgeProgress.earned / badgeProgress.total) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-gray-400 font-retro text-sm mb-4">
                  {Math.round((badgeProgress.earned / badgeProgress.total) * 100)}% Complete
                </p>
                <PixelButton
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push('/badges')}
                >
                  VIEW BADGES
                </PixelButton>
              </div>
            </PixelPanel>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}
