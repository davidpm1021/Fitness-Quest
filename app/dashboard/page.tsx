"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import HPBar from "@/components/ui/HPBar";

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
  };
}

interface GoalData {
  id: string;
  name: string;
  goalType: string;
  targetValue: number;
  targetUnit: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [partyData, setPartyData] = useState<PartyData | null>(null);
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [badgeProgress, setBadgeProgress] = useState({ earned: 0, total: 20 });

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
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
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

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <PixelPanel variant="menu">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <PixelButton
                variant="primary"
                size="md"
                onClick={() => router.push('/history')}
              >
                📊 VIEW CHECK-IN HISTORY
              </PixelButton>
              <PixelButton
                variant="secondary"
                size="md"
                onClick={() => router.push('/monsters')}
              >
                👹 CHANGE MONSTER
              </PixelButton>
            </div>
          </PixelPanel>
        </div>
      </main>
    </PageLayout>
  );
}
