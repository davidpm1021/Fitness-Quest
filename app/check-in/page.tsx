"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import GoalCheckInModal from "@/components/game/GoalCheckInModal";
import MonsterAttackAnimation from "@/components/game/MonsterAttackAnimation";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelButton from "@/components/ui/PixelButton";

interface Goal {
  id: string;
  name: string;
  goalType: string;
  goalMeasurementType: string;
  targetValue: number | null;
  targetUnit: string | null;
}

interface GoalResult {
  goalId: string;
  goalName: string;
  actualValue: number | null;
  isRestDay: boolean;
  goalMet: boolean;
  action?: "ATTACK" | "DEFEND" | "SUPPORT" | "HEROIC_STRIKE";
  d20Roll?: number;
  bonusApplied?: number;
  finalRoll?: number;
  hit?: boolean;
  damageDealt?: number;
  counterattackDamage?: number;
  monsterAttackDamage?: number;
}

interface PartyMember {
  id: string;
  current_hp: number;
  max_hp: number;
  current_defense: number;
  focus_points: number;
  current_streak: number;
  xp: number;
  level: number;
}

interface Monster {
  name: string;
  currentHp: number;
  maxHp: number;
  armorClass: number;
}

type Stage = "loading" | "checking_in" | "goal_result" | "monster_attack" | "processing" | "results";

export default function CheckInPage() {
  console.log('[CheckIn] Render');

  const { user, token } = useAuth();
  const router = useRouter();

  const [hasInitialized, setHasInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [partyMember, setPartyMember] = useState<PartyMember | null>(null);
  const [monster, setMonster] = useState<Monster | null>(null);

  const [stage, setStage] = useState<Stage>("loading");
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [goalResults, setGoalResults] = useState<GoalResult[]>([]);
  const [currentGoalResult, setCurrentGoalResult] = useState<GoalResult | null>(null);
  const [pendingMonsterAttack, setPendingMonsterAttack] = useState<{ monsterName: string; damage: number } | null>(null);

  const [finalResults, setFinalResults] = useState<any>(null);

  // Initialize data
  useEffect(() => {
    console.log('[CheckIn] Initialize effect:', { user: !!user, token: !!token, hasInitialized });

    if (!user || !token) {
      console.log('[CheckIn] No user/token, redirecting');
      router.push("/login");
      return;
    }

    if (hasInitialized) {
      console.log('[CheckIn] Already initialized, skipping');
      return;
    }

    console.log('[CheckIn] Starting initialization');
    setHasInitialized(true);

    const initializeData = async () => {
      try {
        console.log('[CheckIn] Fetching goals...');
        const goalsRes = await fetch("/api/goals", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!goalsRes.ok) throw new Error("Failed to fetch goals");
        const goalsData = await goalsRes.json();

        // The goals endpoint returns { success: true, data: { goals: [...] } }
        const goals = goalsData.data?.goals || goalsData.data || [];
        console.log('[CheckIn] Goals fetched:', goals.length);
        setGoals(goals);

        console.log('[CheckIn] Fetching party member...');
        const partyRes = await fetch("/api/parties/my-party", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!partyRes.ok) throw new Error("Failed to fetch party member");
        const partyData = await partyRes.json();

        // Find current user's party member data
        if (partyData.success && partyData.data.party) {
          console.log('[CheckIn] Party data:', partyData.data.party);
          console.log('[CheckIn] Current user ID:', user.id);

          const myMember = partyData.data.party.members.find(
            (member: any) => {
              console.log('[CheckIn] Checking member:', member.user?.id, 'against', user.id);
              return member.user.id === user.id;
            }
          );

          if (myMember) {
            console.log('[CheckIn] Party member fetched:', myMember);
            // Map the response format to match our PartyMember interface
            setPartyMember({
              id: myMember.id,
              current_hp: myMember.currentHp || 0,
              max_hp: myMember.maxHp || 100,
              current_defense: myMember.currentDefense || 0,
              focus_points: myMember.focusPoints || 0,
              current_streak: myMember.currentStreak || 0,
              xp: myMember.xp || 0,
              level: myMember.level || 1,
            });
          } else {
            throw new Error("Party member not found in party");
          }

          // Get monster data from party (the API includes activeMonster in the party response)
          const partyWithMonster = partyData.data.party;
          if (partyWithMonster.activeMonster) {
            console.log('[CheckIn] Monster fetched from party:', partyWithMonster.activeMonster);
            setMonster({
              name: partyWithMonster.activeMonster.name,
              currentHp: partyWithMonster.activeMonster.currentHp,
              maxHp: partyWithMonster.activeMonster.maxHp,
              armorClass: partyWithMonster.activeMonster.armorClass || 12,
            });
          } else {
            console.warn('[CheckIn] No active monster in party - will still allow check-in');
            // Set a placeholder monster so check-in can proceed
            setMonster({
              name: "Training Dummy",
              currentHp: 100,
              maxHp: 100,
              armorClass: 10,
            });
          }
        } else {
          throw new Error("Invalid party data response");
        }

        console.log('[CheckIn] Initialization complete, starting check-in');
        setIsLoading(false);
        setStage("checking_in");
      } catch (error) {
        console.error('[CheckIn] Initialization error:', error);
        setIsLoading(false);
      }
    };

    initializeData();
  }, [user, token, hasInitialized, router]);

  // Helper to calculate monster damage (for failed goals)
  const calculateMonsterDamage = (): number => {
    if (!monster) return 0;
    // Simplified damage calculation: 2d6 + 2 (matching backend logic)
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    return dice1 + dice2 + 2;
  };

  // Handle goal completion
  const handleGoalComplete = (result: Omit<GoalResult, "goalName">) => {
    console.log('[CheckIn] Goal completed:', result);

    const currentGoal = goals[currentGoalIndex];

    // Calculate monster damage for failed goals
    let monsterAttackDamage = 0;
    if (!result.goalMet) {
      monsterAttackDamage = calculateMonsterDamage();
    }

    const fullResult: GoalResult = {
      ...result,
      goalName: currentGoal.name,
      monsterAttackDamage: monsterAttackDamage > 0 ? monsterAttackDamage : undefined,
    };

    const newResults = [...goalResults, fullResult];
    setGoalResults(newResults);

    // Store the current result and show the goal result screen
    setCurrentGoalResult(fullResult);
    setStage("goal_result");
  };

  // Handle continuing from goal result screen
  const handleGoalResultContinue = () => {
    console.log('[CheckIn] Continuing from goal result');

    // If goal was failed, show monster attack animation
    if (currentGoalResult && !currentGoalResult.goalMet && currentGoalResult.monsterAttackDamage && monster) {
      console.log('[CheckIn] Goal failed, showing monster attack');
      setPendingMonsterAttack({
        monsterName: monster.name,
        damage: currentGoalResult.monsterAttackDamage,
      });
      setStage("monster_attack");
      return;
    }

    // Otherwise, move to next goal or submit
    moveToNextGoalOrSubmit(goalResults);
  };

  // Move to next goal or submit all results
  const moveToNextGoalOrSubmit = (results: GoalResult[]) => {
    console.log('[CheckIn] Moving to next goal or submit:', { currentGoalIndex, totalGoals: goals.length });

    if (currentGoalIndex < goals.length - 1) {
      // More goals to check in
      setCurrentGoalIndex(currentGoalIndex + 1);
      setStage("checking_in");
    } else {
      // All goals complete, submit to API
      console.log('[CheckIn] All goals complete, submitting');
      submitCheckIn(results);
    }
  };

  // Handle monster attack animation complete
  const handleMonsterAttackComplete = () => {
    console.log('[CheckIn] Monster attack complete');
    setPendingMonsterAttack(null);
    moveToNextGoalOrSubmit(goalResults);
  };

  // Submit all check-in data to API
  const submitCheckIn = async (results: GoalResult[]) => {
    console.log('[CheckIn] Submitting check-in:', results);
    setStage("processing");

    try {
      const response = await fetch("/api/check-ins/modal-flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ goalResults: results }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show error in UI instead of alert
        console.error('[CheckIn] Submit failed:', data.error);
        setStage("checking_in");
        setCurrentGoalIndex(0);
        setGoalResults([]);
        // You could add a toast notification here if desired
        return;
      }

      console.log('[CheckIn] Check-in submitted successfully:', data);
      setFinalResults(data.data);
      setStage("results");
    } catch (error) {
      console.error('[CheckIn] Submit error:', error);
      // Error handled, reset to check-in state
      setStage("checking_in");
      setCurrentGoalIndex(0);
      setGoalResults([]);
    }
  };

  // Loading screen
  if (isLoading || stage === "loading") {
    return (
      <PageLayout title="⚔️ DAILY CHECK-IN" showBackButton={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="font-pixel text-xl text-white">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  // No goals configured
  if (goals.length === 0) {
    return (
      <PageLayout title="⚔️ DAILY CHECK-IN" showBackButton={false}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <PixelPanel variant="warning" title="No Goals Set">
            <div className="text-center space-y-4">
              <p className="text-gray-300 font-retro">
                You need to set up your fitness goals before checking in.
              </p>
              <PixelButton onClick={() => router.push("/goals")} variant="primary">
                Set Up Goals
              </PixelButton>
            </div>
          </PixelPanel>
        </div>
      </PageLayout>
    );
  }

  // Show individual goal result screen
  if (stage === "goal_result" && currentGoalResult) {
    return (
      <div className="min-h-screen game-bg pixel-grid-bg">
        {/* Animated starfield background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: i % 5 === 0 ? "3px" : "2px",
                height: i % 5 === 0 ? "3px" : "2px",
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                opacity: Math.random() * 0.5 + 0.3,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="max-w-2xl w-full">
            <PixelPanel
              variant={currentGoalResult.goalMet ? "success" : "warning"}
              title={`Goal ${currentGoalIndex + 1} of ${goals.length}: ${currentGoalResult.goalName}`}
            >
              <div className="space-y-6">
                {/* Goal Met/Failed Status */}
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {currentGoalResult.goalMet ? "✅" : "❌"}
                  </div>
                  <h2 className="font-pixel text-3xl mb-2">
                    {currentGoalResult.goalMet ? (
                      <span className="text-green-400">GOAL COMPLETED!</span>
                    ) : (
                      <span className="text-red-400">GOAL MISSED</span>
                    )}
                  </h2>
                </div>

                {/* Combat Preview - Show roll and AC, build anticipation */}
                {currentGoalResult.goalMet && currentGoalResult.d20Roll !== undefined && (
                  <div className="space-y-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <span className="font-pixel text-xl text-white">🎲 Attack Roll</span>
                      </div>
                      <div className="text-center mb-4">
                        <div className="text-6xl font-pixel text-yellow-400 mb-2">
                          {currentGoalResult.d20Roll}
                        </div>
                        <p className="text-sm font-retro text-gray-400">You rolled a {currentGoalResult.d20Roll}</p>
                      </div>

                      <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="font-retro text-gray-300">Monster AC:</span>
                          <span className="font-pixel text-2xl text-red-400">{monster?.armorClass || 12}</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-retro text-yellow-400 mb-2">⏳ Result Pending...</p>
                        <p className="text-sm font-retro text-gray-300">
                          Your final bonuses from goals, streak, and party momentum will be added at the end.
                        </p>
                        <p className="text-sm font-retro text-purple-400 mt-2">
                          Will it be enough to hit?
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Failed Goal Message */}
                {!currentGoalResult.goalMet && (
                  <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-4 text-center">
                    <p className="text-xl font-pixel text-red-400 mb-2">👾 MONSTER ATTACKS!</p>
                    <p className="font-retro text-gray-300">
                      The {monster?.name || "monster"} takes advantage of your setback...
                    </p>
                  </div>
                )}

                <PixelButton
                  onClick={handleGoalResultContinue}
                  variant="primary"
                  size="lg"
                  fullWidth
                >
                  ▶ CONTINUE
                </PixelButton>
              </div>
            </PixelPanel>
          </div>
        </div>
      </div>
    );
  }

  // Show monster attack animation
  if (stage === "monster_attack" && pendingMonsterAttack) {
    return (
      <MonsterAttackAnimation
        monsterName={pendingMonsterAttack.monsterName}
        damage={pendingMonsterAttack.damage}
        onComplete={handleMonsterAttackComplete}
      />
    );
  }

  // Show current goal modal
  if (stage === "checking_in" && partyMember) {
    const currentGoal = goals[currentGoalIndex];

    return (
      <GoalCheckInModal
        goal={currentGoal}
        goalNumber={currentGoalIndex + 1}
        totalGoals={goals.length}
        currentFocus={partyMember.focus_points}
        currentStreak={partyMember.current_streak}
        onComplete={handleGoalComplete}
      />
    );
  }

  // Processing screen
  if (stage === "processing") {
    return (
      <PageLayout title="⚔️ DAILY CHECK-IN" showBackButton={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="font-pixel text-2xl text-white mb-2">⏳</p>
            <p className="font-pixel text-xl text-white">Processing your check-in...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Results screen
  if (stage === "results" && finalResults) {
    const { goalResults: updatedResults, totalDamageDealt, totalDamageTaken, monsterDefeated, monster: monsterData, progression, focusData, defenseUpdated } = finalResults;

    return (
      <PageLayout title="⚔️ CHECK-IN COMPLETE" showBackButton={false}>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <PixelPanel variant="success" title="✓ Check-In Complete!">
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-4xl font-pixel text-red-400">-{totalDamageDealt}</div>
                  <div className="text-sm font-retro text-gray-300">Damage Dealt</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-pixel text-orange-400">-{totalDamageTaken}</div>
                  <div className="text-sm font-retro text-gray-300">Damage Taken</div>
                </div>
              </div>

              {/* Monster Status */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-pixel text-xl text-white">{monsterData.name}</span>
                  <span className="font-pixel text-lg text-red-400">
                    {monsterData.currentHp}/{monsterData.maxHp} HP
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-red-600 to-red-400 h-4 rounded-full transition-all"
                    style={{ width: `${(monsterData.currentHp / monsterData.maxHp) * 100}%` }}
                  />
                </div>
                {monsterDefeated && (
                  <div className="mt-3 text-center font-pixel text-2xl text-yellow-400">
                    🎉 MONSTER DEFEATED! 🎉
                  </div>
                )}
              </div>

              {/* Progression */}
              {progression.leveledUp && (
                <div className="bg-yellow-900/30 border-4 border-yellow-600 rounded-lg p-4 text-center">
                  <div className="font-pixel text-3xl text-yellow-400 mb-2">⬆️ LEVEL UP!</div>
                  <div className="font-retro text-white">
                    Level {progression.oldLevel} → Level {progression.newLevel}
                  </div>
                  <div className="font-retro text-yellow-300">
                    +1 Skill Point Available!
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-pixel text-2xl text-blue-400">+{progression.xpEarned}</div>
                  <div className="text-sm font-retro text-gray-300">XP Gained</div>
                </div>
                <div>
                  <div className="font-pixel text-2xl text-purple-400">
                    {focusData.oldFocus} → {focusData.newFocus}
                  </div>
                  <div className="text-sm font-retro text-gray-300">Focus</div>
                </div>
                <div>
                  <div className="font-pixel text-2xl text-green-400">{defenseUpdated}</div>
                  <div className="text-sm font-retro text-gray-300">Defense</div>
                </div>
              </div>

              {/* Individual Goal Results */}
              <div className="space-y-3">
                <h3 className="font-pixel text-xl text-white">Goal Results:</h3>
                {updatedResults.map((result: any, index: number) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-pixel text-white">{result.goalName}</span>
                      <span className={`font-pixel ${result.goalMet ? 'text-green-400' : 'text-red-400'}`}>
                        {result.goalMet ? '✓ MET' : '✗ MISSED'}
                      </span>
                    </div>

                    {result.goalMet && result.hit !== undefined && (
                      <div className="space-y-1 text-sm font-retro text-gray-300">
                        <div>🎲 Roll: {result.d20Roll} + {result.bonusApplied} = {result.finalRoll}</div>
                        {result.hit && (
                          <div className="text-green-400">✓ HIT! Dealt {result.damageDealt} damage</div>
                        )}
                        {!result.hit && (
                          <div className="text-yellow-400">✗ Miss</div>
                        )}
                        {result.counterattackDamage > 0 && (
                          <div className="text-red-400">💥 Counterattack! Took {result.counterattackDamage} damage</div>
                        )}
                      </div>
                    )}

                    {!result.goalMet && result.monsterAttackDamage && (
                      <div className="text-sm font-retro text-red-400">
                        👾 Monster attacked for {result.monsterAttackDamage} damage
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <PixelButton
                onClick={() => router.push("/dashboard")}
                variant="primary"
                size="lg"
                fullWidth
              >
                Return to Dashboard
              </PixelButton>
            </div>
          </PixelPanel>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="⚔️ DAILY CHECK-IN" showBackButton={false}>
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-pixel text-xl text-white">Loading...</p>
      </div>
    </PageLayout>
  );
}
