"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import PageLayout from "@/components/layout/PageLayout";
import CombatAnimation from "@/app/components/CombatAnimation";
import DiceRoll from "@/components/game/DiceRoll";
import MilestoneCelebration from "@/components/game/MilestoneCelebration";
import WelcomeBackModal from "@/components/game/WelcomeBackModal";
import CombatActionCard from "@/components/game/CombatActionCard";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelButton from "@/components/ui/PixelButton";
import ProgressionDisplay from "@/components/game/ProgressionDisplay";
import MonsterHealthBar from "@/components/game/MonsterHealthBar";
import { CharacterCustomization } from "@/app/components/CustomizablePixelCharacter";

interface Goal {
  id: string;
  name: string;
  goalType: string;
  goalMeasurementType: string;
  targetValue: number | null;
  targetUnit: string | null;
}

interface AttackResult {
  roll: number;
  bonuses: {
    goalBonus: number;
    streakBonus: number;
    teamBonus: number;
    underdogBonus: number;
    totalBonus: number;
  };
  baseDamage: number;
  totalDamage: number;
  hit: boolean;
  wasCounterattacked?: boolean;
  counterattackDamage?: number;
}

interface Monster {
  name: string;
  currentHp: number;
  maxHp: number;
}

export default function CheckInPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const toast = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalValues, setGoalValues] = useState<Record<string, { value: string; isRestDay: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null);
  const [monster, setMonster] = useState<Monster | null>(null);
  const [showDiceRoll, setShowDiceRoll] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneCrossed, setMilestoneCrossed] = useState<75 | 50 | 25 | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [characterCustomization, setCharacterCustomization] = useState<CharacterCustomization | null>(null);
  const [revealStep, setRevealStep] = useState(0); // For sequential reveals
  const [partyMembers, setPartyMembers] = useState<any[]>([]);
  const [sendingEncouragement, setSendingEncouragement] = useState<string | null>(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [welcomeBackData, setWelcomeBackData] = useState<{
    daysAbsent: number;
    hpRestored: number;
    bonuses: { reducedCounterattack: boolean; catchUpDamage: number; daysRemaining: number };
  } | null>(null);
  const [combatAction, setCombatAction] = useState<"ATTACK" | "DEFEND" | "SUPPORT" | "HEROIC_STRIKE">("ATTACK");
  const [focusPoints, setFocusPoints] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [currentDefense, setCurrentDefense] = useState(0);
  const [focusData, setFocusData] = useState<{
    oldFocus: number;
    newFocus: number;
    change: number;
    recovery: number;
    cost: number;
  } | null>(null);
  const [xpData, setXpData] = useState<{
    xpEarned: number;
    totalXP: number;
    level: number;
    skillPoints: number;
    leveledUp: boolean;
    oldLevel?: number;
    newLevel?: number;
  } | null>(null);

  // Define all callback functions first before useEffect hooks
  const checkWelcomeBack = useCallback(async () => {
    try {
      const response = await fetch('/api/check-ins/welcome-back', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data.needsWelcomeBack) {
        setWelcomeBackData({
          daysAbsent: data.data.daysAbsent,
          hpRestored: data.data.hpRestored,
          bonuses: data.data.bonuses,
        });
        setShowWelcomeBack(true);
      }
    } catch (err) {
      console.error('Error checking welcome back:', err);
    }
  }, [token]);

  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch("/api/goals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setGoals(data.data.goals);
        const initialValues: Record<string, { value: string; isRestDay: boolean }> = {};
        data.data.goals.forEach((goal: Goal) => {
          // BOOLEAN goals default to "0" (unchecked), others default to target value or empty
          const defaultValue = goal.goalMeasurementType === 'BOOLEAN'
            ? "0"
            : (goal.targetValue?.toString() || "");
          initialValues[goal.id] = { value: defaultValue, isRestDay: false };
        });
        setGoalValues(initialValues);
      }
    } catch (err) {
      console.error("Error fetching goals:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchCharacterAppearance = useCallback(async () => {
    try {
      const response = await fetch('/api/character', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data.appearance) {
        setCharacterCustomization(data.data.appearance);
      }
    } catch (err) {
      console.error('Error fetching character appearance:', err);
    }
  }, [token]);

  const fetchPartyMemberData = useCallback(async () => {
    try {
      const response = await fetch('/api/parties/my-party', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data.party) {
        // Find current user's party member data
        const myMember = data.data.party.members.find(
          (member: any) => member.user.id === user?.id
        );
        if (myMember) {
          setFocusPoints(myMember.focusPoints || 0);
          setCurrentStreak(myMember.currentStreak || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching party member data:', err);
    }
  }, [token, user]);

  const fetchPartyMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/parties/my-party', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data.party) {
        // Filter out current user
        const otherMembers = data.data.party.members.filter(
          (member: any) => member.user.id !== user?.id
        );
        setPartyMembers(otherMembers);
      }
    } catch (err) {
      console.error('Error fetching party members:', err);
    }
  }, [token, user]);

  // useEffect hooks after all callback declarations
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      checkWelcomeBack();
      fetchGoals();
      fetchCharacterAppearance();
      fetchPartyMemberData();
    }
  }, [user, token, checkWelcomeBack, fetchGoals, fetchCharacterAppearance, fetchPartyMemberData]);

  // Sequential reveal animation for results screen
  useEffect(() => {
    if (showResult && revealStep < 5) {
      const timer = setTimeout(() => {
        setRevealStep((prev) => prev + 1);
      }, 600); // Show each section after 600ms
      return () => clearTimeout(timer);
    }
  }, [showResult, revealStep]);

  // Fetch party members when results are shown
  useEffect(() => {
    if (showResult && token) {
      fetchPartyMembers();
    }
  }, [showResult, token, fetchPartyMembers]);

  async function sendEncouragement(memberId: string) {
    setSendingEncouragement(memberId);
    try {
      const response = await fetch('/api/encouragements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetMemberId: memberId }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Encouragement sent! +5 defense to your teammate!');
        // Refresh party members to update encouragement status
        fetchPartyMembers();
      } else {
        toast.error(data.error || 'Failed to send encouragement');
      }
    } catch (err) {
      toast.error('Failed to send encouragement');
    } finally {
      setSendingEncouragement(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const goalCheckIns = goals.map((goal) => ({
        goalId: goal.id,
        actualValue: goalValues[goal.id]?.isRestDay
          ? null
          : goalValues[goal.id]?.value
          ? parseFloat(goalValues[goal.id].value)
          : null,
        isRestDay: goalValues[goal.id]?.isRestDay || false,
      }));

      const response = await fetch("/api/check-ins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ goalCheckIns, combatAction }),
      });

      const data = await response.json();

      if (data.success) {
        // Check if monster was defeated - redirect to victory screen
        if (data.data.monsterDefeated && data.data.victoryRewardId) {
          router.push(`/victory?id=${data.data.victoryRewardId}`);
          return;
        }

        setAttackResult(data.data.attackResult);
        setMonster(data.data.monster);
        setMilestoneCrossed(data.data.milestoneCrossed || null);

        // Capture defense from response
        if (data.data.defenseUpdated !== undefined) {
          setCurrentDefense(data.data.defenseUpdated);
        }

        // Capture focus data from combatAction object
        const combatActionData = data.data.combatAction;
        if (combatActionData) {
          setFocusData({
            oldFocus: combatActionData.oldFocusTotal || 0,
            newFocus: combatActionData.newFocusTotal || 0,
            change: combatActionData.focusChange || 0,
            recovery: combatActionData.baseFocusRecovery || 0,
            cost: combatActionData.focusCost || 0,
          });
        }

        // Capture XP data from progression object
        const progression = data.data.progression;
        if (progression) {
          setXpData({
            xpEarned: progression.xpEarned || 0,
            totalXP: progression.totalXP || 0,
            level: progression.level || 1,
            skillPoints: progression.skillPoints || 0,
            leveledUp: progression.leveledUp || false,
            oldLevel: progression.oldLevel,
            newLevel: progression.newLevel,
          });
        }

        setShowDiceRoll(true); // Show dice roll first
      } else {
        // Check if this is a duplicate check-in error
        if (data.data?.alreadyCheckedIn) {
          setError(data.error || "You've already checked in today!");
          // Could show today's results here in the future
        } else {
          setError(data.error || "Failed to submit check-in");
        }
      }
    } catch (err) {
      setError("Failed to submit check-in");
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoalValueChange(goalId: string, value: string) {
    setGoalValues({
      ...goalValues,
      [goalId]: { ...goalValues[goalId], value },
    });
  }

  function handleRestDayToggle(goalId: string) {
    setGoalValues({
      ...goalValues,
      [goalId]: {
        ...goalValues[goalId],
        isRestDay: !goalValues[goalId]?.isRestDay,
      },
    });
  }

  async function handleResetCheckIn() {
    setResetting(true);
    try {
      const response = await fetch('/api/check-ins/reset', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Reset the UI back to check-in form
        setShowResult(false);
        setShowDiceRoll(false);
        setShowAnimation(false);
        setShowMilestone(false);
        setMilestoneCrossed(null);
        setAttackResult(null);
        setMonster(null);
        setError('');
        toast.info('Check-in has been reset. You can try again!');
      } else {
        toast.error('Failed to reset: ' + data.error);
      }
    } catch (err) {
      toast.error('Failed to reset check-in');
    } finally {
      setResetting(false);
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

  // Show dice roll first
  if (showDiceRoll && attackResult) {
    return (
      <PageLayout title="⚔️ DAILY CHECK-IN" showBackButton={false}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <DiceRoll
            onComplete={() => {
              setShowDiceRoll(false);
              setShowAnimation(true);
            }}
            autoRoll={true}
            finalResult={attackResult.roll}
          />
        </div>
      </PageLayout>
    );
  }

  // Show combat animation after dice roll
  if (showAnimation && attackResult) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          <CombatAnimation
            playerName={user.displayName || user.username}
            monsterName={monster?.name || "Training Dummy"}
            damage={attackResult.totalDamage}
            hit={attackResult.hit}
            combatAction={combatAction}
            counterattack={
              attackResult.wasCounterattacked
                ? {
                    damage: attackResult.counterattackDamage || 0,
                    happened: true,
                  }
                : { damage: 0, happened: false }
            }
            characterCustomization={characterCustomization}
            onComplete={() => {
              setShowAnimation(false);
              // Check if we crossed a milestone
              if (milestoneCrossed) {
                setShowMilestone(true);
              } else {
                setRevealStep(0); // Reset reveal step
                setShowResult(true);
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Show milestone celebration after combat animation
  if (showMilestone && milestoneCrossed) {
    return (
      <PageLayout title="⚔️ MILESTONE!" showBackButton={false}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <MilestoneCelebration
            milestone={milestoneCrossed}
            onComplete={() => {
              setShowMilestone(false);
              setRevealStep(0); // Reset reveal step
              setShowResult(true);
            }}
            autoShow={true}
          />
        </div>
      </PageLayout>
    );
  }

  if (showResult && attackResult) {
    return (
      <PageLayout title="⚔️ BATTLE RESULTS" showBackButton={false}>
        <main className="max-w-3xl mx-auto py-6 px-4">
          <div className="text-center mb-8">
            <div className="text-8xl mb-4 animate-bounce">
              {attackResult.hit ? "⚔️" : "🛡️"}
            </div>
            <h2 className="font-pixel text-5xl text-white mb-4 drop-shadow-[4px_4px_0_rgba(0,0,0,0.8)]">
              {attackResult.hit ? "HIT!" : "MISS!"}
            </h2>
            <p className="font-retro text-2xl text-yellow-300">
              {attackResult.hit
                ? `You dealt ${attackResult.totalDamage} damage!`
                : "Better luck tomorrow!"}
            </p>
          </div>

          <div className="space-y-6">
            {/* Monster HP Bar - Show first */}
            {revealStep >= 1 && monster && (
              <div className="animate-fade-in">
                <PixelPanel variant="menu" title="👾 MONSTER STATUS">
                  <MonsterHealthBar
                    currentHp={monster.currentHp}
                    maxHp={monster.maxHp}
                    monsterName={monster.name}
                    damageDealt={attackResult.hit ? attackResult.totalDamage : 0}
                    animated={true}
                  />
                </PixelPanel>
              </div>
            )}

            {/* Step 1: Attack Roll */}
            {revealStep >= 1 && (
              <div className="animate-fade-in">
                <PixelPanel variant="menu" title="🎲 ATTACK ROLL">
                  <div className="text-center">
                    <div className="text-6xl font-pixel text-blue-400 mb-2 drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)]">
                      {attackResult.roll}
                    </div>
                    <p className="font-retro text-lg text-gray-300">d20 Roll</p>
                  </div>
                </PixelPanel>
              </div>
            )}

            {/* Step 2: Bonuses */}
            {revealStep >= 2 && (
              <div className="animate-fade-in">
                <PixelPanel variant="menu" title="⚡ BONUSES">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-pixel text-green-400">
                        +{attackResult.bonuses.goalBonus}
                      </p>
                      <p className="font-retro text-sm text-gray-400">Goals Met</p>
                    </div>
                    {attackResult.bonuses.streakBonus > 0 && (
                      <div className="text-center">
                        <p className="text-3xl font-pixel text-blue-400">
                          +{attackResult.bonuses.streakBonus}
                        </p>
                        <p className="font-retro text-sm text-gray-400">Streak</p>
                      </div>
                    )}
                    {attackResult.bonuses.teamBonus > 0 && (
                      <div className="text-center">
                        <p className="text-3xl font-pixel text-purple-400">
                          +{attackResult.bonuses.teamBonus}
                        </p>
                        <p className="font-retro text-sm text-gray-400">Teamwork</p>
                      </div>
                    )}
                    {attackResult.bonuses.underdogBonus > 0 && (
                      <div className="text-center">
                        <p className="text-3xl font-pixel text-red-400">
                          +{attackResult.bonuses.underdogBonus}
                        </p>
                        <p className="font-retro text-sm text-gray-400">Underdog</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 pt-6 border-t-4 border-gray-700 text-center">
                    <p className="font-retro text-sm text-gray-400 mb-2">Total Bonus</p>
                    <p className="text-4xl font-pixel text-yellow-400 drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)]">
                      +{attackResult.bonuses.totalBonus}
                    </p>
                  </div>
                </PixelPanel>
              </div>
            )}

            {/* Step 2.5: Defense Status */}
            {revealStep >= 2 && currentDefense > 0 && (
              <div className="animate-fade-in">
                <PixelPanel variant="menu" title="🛡️ DEFENSE STATUS">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        {/* Shield icons - 1 per 10 defense */}
                        {Array.from({ length: Math.min(5, Math.floor(currentDefense / 10)) }).map((_, i) => (
                          <span key={i} className="text-4xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                            🛡️
                          </span>
                        ))}
                        {currentDefense % 10 !== 0 && currentDefense < 50 && (
                          <span className="text-2xl opacity-50">🛡️</span>
                        )}
                      </div>
                      <p className="font-retro text-sm text-gray-300">
                        {currentDefense >= 40 && "🔥 Maximum Defense! Nearly invulnerable!"}
                        {currentDefense >= 25 && currentDefense < 40 && "💪 Strong Defense! Well protected!"}
                        {currentDefense >= 10 && currentDefense < 25 && "⚔️ Good Defense! Building up!"}
                        {currentDefense < 10 && "🌟 Defense Active!"}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl font-pixel text-blue-400 mb-1">
                        {currentDefense}
                      </div>
                      <p className="font-retro text-xs text-gray-400">Total Defense</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t-2 border-gray-700">
                    <p className="font-retro text-xs text-gray-400 text-center">
                      Defense reduces counterattack chance • Max 50
                    </p>
                  </div>
                </PixelPanel>
              </div>
            )}

            {/* Step 3: Damage Dealt (if hit) */}
            {revealStep >= 3 && attackResult.hit && (
              <div className="animate-fade-in">
                <PixelPanel variant="success" title="💥 DAMAGE DEALT">
                  <div className="text-center">
                    <div className="text-6xl font-pixel text-red-400 mb-3 drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)]">
                      {attackResult.totalDamage}
                    </div>
                    <p className="font-retro text-lg text-gray-300">
                      Base {attackResult.baseDamage} + Bonuses {attackResult.bonuses.totalBonus}
                    </p>
                  </div>
                </PixelPanel>
              </div>
            )}

            {/* Step 4: Counterattack (if happened) */}
            {revealStep >= 4 && attackResult.wasCounterattacked && (
              <div className="animate-fade-in">
                <PixelPanel variant="warning" title="⚠️ COUNTERATTACK!">
                  <div className="text-center">
                    <div className="text-5xl font-pixel text-red-400 mb-3 animate-pulse">
                      -{attackResult.counterattackDamage}
                    </div>
                    <p className="font-retro text-lg text-red-300">
                      The monster struck back and damaged your HP!
                    </p>
                  </div>
                </PixelPanel>
              </div>
            )}

            {/* Focus Points */}
            {revealStep >= 4 && focusData && (
              <div className="animate-fade-in">
                <PixelPanel
                  variant={focusData.change >= 0 ? "success" : "menu"}
                  title="⭐ FOCUS POINTS"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-6">
                      {/* Old Focus */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          {Array.from({ length: Math.min(10, focusData.oldFocus) }).map((_, i) => (
                            <span key={i} className="text-xl opacity-60">⭐</span>
                          ))}
                        </div>
                        <p className="font-pixel text-2xl text-gray-400">{focusData.oldFocus}</p>
                        <p className="font-retro text-xs text-gray-500">Before</p>
                      </div>

                      {/* Arrow and Change */}
                      <div className="text-center">
                        <div className="text-4xl mb-2">
                          {focusData.change > 0 ? "+" : focusData.change < 0 ? "−" : "→"}
                        </div>
                        <p className={`font-pixel text-3xl ${
                          focusData.change > 0 ? "text-green-400" :
                          focusData.change < 0 ? "text-red-400" :
                          "text-gray-400"
                        }`}>
                          {Math.abs(focusData.change)}
                        </p>
                      </div>

                      {/* New Focus */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          {Array.from({ length: Math.min(10, focusData.newFocus) }).map((_, i) => (
                            <span
                              key={i}
                              className="text-xl animate-pulse"
                              style={{ animationDelay: `${i * 0.05}s` }}
                            >
                              ⭐
                            </span>
                          ))}
                        </div>
                        <p className="font-pixel text-2xl text-yellow-400">{focusData.newFocus}</p>
                        <p className="font-retro text-xs text-gray-400">Current</p>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="text-center pt-4 border-t-2 border-gray-700">
                      <p className="font-retro text-sm text-gray-300">
                        {focusData.cost > 0 && (
                          <span className="text-red-300">
                            Spent {focusData.cost} focus •{" "}
                          </span>
                        )}
                        <span className="text-green-300">
                          Recovered {focusData.recovery} focus
                        </span>
                        {focusData.newFocus === 10 && (
                          <span className="text-yellow-300"> • MAX!</span>
                        )}
                      </p>
                      {focusData.newFocus >= 3 && (
                        <p className="font-retro text-xs text-purple-300 mt-2">
                          💡 You have enough focus for HEROIC STRIKE!
                        </p>
                      )}
                    </div>
                  </div>
                </PixelPanel>
              </div>
            )}

            {/* XP & Level Progress */}
            {revealStep >= 4 && xpData && (
              <div className="animate-fade-in">
                <PixelPanel variant="success" title={xpData.leveledUp ? "⭐ LEVEL UP!" : "⭐ XP EARNED"}>
                  <div className="space-y-4">
                    {xpData.leveledUp && (
                      <div className="text-center mb-4">
                        <div className="text-6xl mb-2 animate-bounce">🎉</div>
                        <div className="text-3xl font-pixel text-yellow-400 mb-2">
                          LEVEL {xpData.oldLevel} → LEVEL {xpData.newLevel}!
                        </div>
                        <p className="font-retro text-purple-300">
                          You&apos;ve grown stronger! You earned a skill point!
                        </p>
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <div className="text-4xl font-pixel text-green-400 mb-2">
                        +{xpData.xpEarned} XP
                      </div>
                      <p className="font-retro text-sm text-gray-300">
                        Earned from this check-in
                      </p>
                    </div>

                    <ProgressionDisplay
                      xp={xpData.totalXP}
                      level={xpData.level}
                      skillPoints={xpData.skillPoints}
                      variant="compact"
                      showXPBreakdown={false}
                    />

                    {xpData.skillPoints > 0 && (
                      <div className="mt-4 text-center">
                        <PixelButton
                          variant="success"
                          size="sm"
                          onClick={() => router.push('/skills')}
                        >
                          🌟 SPEND SKILL POINTS
                        </PixelButton>
                      </div>
                    )}
                  </div>
                </PixelPanel>
              </div>
            )}

            {/* Step 4.5: Encourage Teammates */}
            {revealStep >= 4 && partyMembers.length > 0 && (
              <div className="animate-fade-in">
                <PixelPanel variant="menu" title="💪 ENCOURAGE YOUR PARTY">
                  <p className="font-retro text-sm text-gray-300 mb-4 text-center">
                    Send encouragement to boost your teammates&apos; defense by +5!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {partyMembers.map((member: any) => (
                      <PixelButton
                        key={member.id}
                        onClick={() => sendEncouragement(member.id)}
                        disabled={sendingEncouragement !== null}
                        variant="secondary"
                        size="sm"
                      >
                        {sendingEncouragement === member.id
                          ? '⏳ SENDING...'
                          : `👍 ${member.user.displayName}`}
                      </PixelButton>
                    ))}
                  </div>
                </PixelPanel>
              </div>
            )}
          </div>

          {/* Step 5: Action Buttons */}
          {revealStep >= 5 && (
            <div className="mt-8 space-y-4 animate-fade-in">
              <PixelButton
                onClick={handleResetCheckIn}
                disabled={resetting}
                variant="warning"
                size="lg"
                fullWidth
              >
                {resetting ? '🔄 RESETTING...' : '🎮 TRY AGAIN'}
              </PixelButton>
              <PixelButton
                onClick={() => router.push("/party/dashboard")}
                variant="primary"
                size="lg"
                fullWidth
              >
                🏰 BACK TO DASHBOARD
              </PixelButton>
            </div>
          )}
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="⚔️ DAILY CHECK-IN" showBackButton={true} backPath="/party/dashboard">
      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] border-4 border-blue-500/50 p-6">
          <h2 className="text-2xl font-pixel text-white mb-6">
            ⚔️ How did you do today?
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border-4 border-red-500 rounded-lg">
              <p className="font-bold text-red-200 text-center">⚠️ {error}</p>
            </div>
          )}

          {goals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-300 mb-4">
                You need to set up goals before checking in
              </p>
              <button
                onClick={() => router.push("/goals")}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-pixel border-4 border-blue-800 shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] hover:translate-y-[-2px] transition-all"
              >
                Set Up Goals
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {goals.map((goal) => {
                const isBoolean = goal.goalMeasurementType === 'BOOLEAN';
                const isProgressTracking = goal.goalMeasurementType === 'PROGRESS_TRACKING';
                const isUnderLimit = goal.goalMeasurementType === 'UNDER_LIMIT';

                let targetText = 'Track daily';
                if (goal.targetValue && goal.targetUnit) {
                  if (isUnderLimit) {
                    targetText = `Stay under ${goal.targetValue} ${goal.targetUnit}`;
                  } else if (isProgressTracking) {
                    targetText = `Track your progress (any value counts)`;
                  } else {
                    targetText = `Target: ${goal.targetValue} ${goal.targetUnit}`;
                  }
                } else if (isBoolean) {
                  targetText = 'Complete this habit';
                }

                return (
                  <div
                    key={goal.id}
                    className="border-2 border-gray-600 bg-gray-700/50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-white">
                          {goal.name}
                        </h3>
                        <p className="text-sm text-gray-300">
                          {targetText}
                        </p>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={goalValues[goal.id]?.isRestDay || false}
                          onChange={() => handleRestDayToggle(goal.id)}
                          className="rounded border-gray-400"
                        />
                        <span className="text-sm text-gray-300">
                          Rest Day
                        </span>
                      </label>
                    </div>

                    {!goalValues[goal.id]?.isRestDay && (
                      <div>
                        {isBoolean ? (
                          <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-600/50 rounded-md hover:bg-gray-600/70 transition-colors">
                            <input
                              type="checkbox"
                              checked={goalValues[goal.id]?.value === "1"}
                              onChange={(e) =>
                                handleGoalValueChange(goal.id, e.target.checked ? "1" : "0")
                              }
                              className="w-5 h-5 rounded border-gray-400"
                            />
                            <span className="text-base font-medium text-white">
                              ✓ I did this today
                            </span>
                          </label>
                        ) : (
                          <>
                            <label className="block text-sm font-medium text-gray-200 mb-1">
                              {isProgressTracking ? 'Enter your value' : 'Actual Value'}
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                step="0.1"
                                value={goalValues[goal.id]?.value || ""}
                                onChange={(e) =>
                                  handleGoalValueChange(goal.id, e.target.value)
                                }
                                className="flex-1 px-3 py-2 border-2 border-gray-500 rounded-md bg-gray-800 text-white focus:border-blue-400 focus:outline-none"
                                placeholder={goal.targetValue?.toString() || "0"}
                              />
                              {goal.targetUnit && (
                                <span className="text-gray-300">
                                  {goal.targetUnit}
                                </span>
                              )}
                            </div>
                            {isProgressTracking && (
                              <p className="mt-1 text-xs text-green-400">
                                ✓ Any value you enter counts as meeting this goal
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Combat Action Selection */}
              <div className="my-8 pt-6 border-t-4 border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-pixel text-xl text-white">
                    ⚔️ CHOOSE YOUR ACTION
                  </h3>
                  <div className="font-pixel text-sm text-yellow-400">
                    ⭐ {focusPoints} Focus
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <CombatActionCard
                    action="ATTACK"
                    selected={combatAction === "ATTACK"}
                    onClick={() => setCombatAction("ATTACK")}
                    icon="⚔️"
                    title="ATTACK"
                    description="Your reliable damage dealer. Never let your team down."
                    details={[
                      "💪 Guaranteed 3-5 base damage",
                      "📈 Full bonus damage on hit",
                      "⭐ Costs 1 focus (recoverable)",
                      "💡 TIP: Best for consistent damage",
                    ]}
                    focusRequired={1}
                    currentFocus={focusPoints}
                  />

                  <CombatActionCard
                    action="DEFEND"
                    selected={combatAction === "DEFEND"}
                    onClick={() => setCombatAction("DEFEND")}
                    icon="🛡️"
                    title="DEFEND"
                    description="Build focus for big plays while protecting your team."
                    details={[
                      "🛡️ +5 team defense for everyone",
                      "⭐ Generates +1 focus (no cost)",
                      "⚔️ Still deals 50% damage",
                      "💡 TIP: Use when focus is low",
                    ]}
                  />

                  <CombatActionCard
                    action="SUPPORT"
                    selected={combatAction === "SUPPORT"}
                    onClick={() => setCombatAction("SUPPORT")}
                    icon="💚"
                    title="SUPPORT"
                    description="Keep your party alive with healing support."
                    details={[
                      "💚 Heal weakest ally +10 HP",
                      "⚔️ Deals 50% damage",
                      "⭐ Costs 2 focus",
                      "💡 TIP: Save dying teammates",
                    ]}
                    disabled={currentStreak < 3}
                    focusRequired={2}
                    currentFocus={focusPoints}
                  />

                  <CombatActionCard
                    action="HEROIC_STRIKE"
                    selected={combatAction === "HEROIC_STRIKE"}
                    onClick={() => setCombatAction("HEROIC_STRIKE")}
                    icon="⚡"
                    title="HEROIC STRIKE"
                    description="Unleash devastating power with guaranteed critical damage!"
                    details={[
                      "⚡ Automatic hit (ignores AC)",
                      "💥 DOUBLE damage dealt",
                      "⭐ Costs 3 focus",
                      "💡 TIP: Finish off low HP bosses",
                    ]}
                    disabled={currentStreak < 7}
                    focusRequired={3}
                    currentFocus={focusPoints}
                  />
                </div>

                {(currentStreak < 3 || currentStreak < 7) && (
                  <div className="mt-4 text-center font-retro text-sm text-gray-400 space-y-1">
                    {currentStreak < 3 && (
                      <p>🔒 Support unlocks after 3-day streak (Current: {currentStreak})</p>
                    )}
                    {currentStreak < 7 && (
                      <p>🔒 Heroic Strike unlocks after 7-day streak (Current: {currentStreak})</p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-pixel text-lg border-4 border-blue-800 shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "⏳ SUBMITTING..." : "Submit Check-In"}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Welcome Back Modal */}
      {showWelcomeBack && welcomeBackData && (
        <WelcomeBackModal
          daysAbsent={welcomeBackData.daysAbsent}
          hpRestored={welcomeBackData.hpRestored}
          bonuses={welcomeBackData.bonuses}
          onClose={() => setShowWelcomeBack(false)}
        />
      )}
    </PageLayout>
  );
}
