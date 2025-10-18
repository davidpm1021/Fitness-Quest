"use client";

import { useState } from "react";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelButton from "@/components/ui/PixelButton";
import CombatActionCard from "@/components/game/CombatActionCard";
import DiceRoll from "@/components/game/DiceRoll";

interface Goal {
  id: string;
  name: string;
  goalType: string;
  goalMeasurementType: string;
  targetValue: number | null;
  targetUnit: string | null;
}

interface GoalCheckInModalProps {
  goal: Goal;
  goalNumber: number;
  totalGoals: number;
  currentFocus: number;
  onComplete: (result: {
    goalId: string;
    actualValue: number | null;
    isRestDay: boolean;
    goalMet: boolean;
    action?: "ATTACK" | "DEFEND" | "SUPPORT" | "HEROIC_STRIKE";
    d20Roll?: number;
  }) => void;
  currentStreak: number;
}

export default function GoalCheckInModal({
  goal,
  goalNumber,
  totalGoals,
  currentFocus,
  onComplete,
  currentStreak,
}: GoalCheckInModalProps) {
  const [stage, setStage] = useState<"input" | "action_selection" | "rolling">("input");
  const [value, setValue] = useState(goal.targetValue?.toString() || "");
  const [isRestDay, setIsRestDay] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"ATTACK" | "DEFEND" | "SUPPORT" | "HEROIC_STRIKE">("ATTACK");
  const [diceResult, setDiceResult] = useState<number | null>(null);

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

  const checkIfGoalMet = (): boolean => {
    if (isRestDay) return true;

    const numValue = parseFloat(value);
    if (isNaN(numValue) && !isBoolean) return false;

    switch (goal.goalMeasurementType) {
      case 'TARGET_VALUE':
        return numValue >= (goal.targetValue || 0);
      case 'UNDER_LIMIT':
        return numValue < (goal.targetValue || 0);
      case 'BOOLEAN':
        return value === "1";
      case 'PROGRESS_TRACKING':
        return value !== "" && value !== "0";
      default:
        return false;
    }
  };

  const handleSubmitValue = () => {
    const goalMet = checkIfGoalMet();

    if (goalMet) {
      // If goal is met, move to action selection
      setStage("action_selection");
    } else {
      // If goal is not met, complete immediately (monster will attack)
      onComplete({
        goalId: goal.id,
        actualValue: isRestDay ? null : (isBoolean ? (value === "1" ? 1 : 0) : parseFloat(value)),
        isRestDay,
        goalMet: false,
      });
    }
  };

  const handleActionSelected = () => {
    // Show dice roll animation
    setStage("rolling");
  };

  const handleDiceComplete = (roll: number) => {
    setDiceResult(roll);

    // Complete with all data
    onComplete({
      goalId: goal.id,
      actualValue: isRestDay ? null : (isBoolean ? (value === "1" ? 1 : 0) : parseFloat(value)),
      isRestDay,
      goalMet: true,
      action: selectedAction,
      d20Roll: roll,
    });
  };

  // Show dice roll stage
  if (stage === "rolling" && diceResult === null) {
    return (
      <div className="fixed inset-0 game-bg pixel-grid-bg flex items-center justify-center z-50 p-4">
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

        <div className="relative z-10 max-w-2xl w-full">
          <DiceRoll
            onComplete={handleDiceComplete}
            autoRoll={true}
          />
        </div>
      </div>
    );
  }

  // Show action selection stage
  if (stage === "action_selection") {
    return (
      <div className="fixed inset-0 game-bg pixel-grid-bg flex items-center justify-center z-50 p-4 overflow-y-auto">
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

        <div className="relative z-10 max-w-4xl w-full my-8">
          <PixelPanel variant="dialog" title={`✓ ${goal.name} - CHOOSE ACTION`}>
            <div className="space-y-6">
              <div className="text-center">
                <p className="font-pixel text-xl text-green-400 mb-2">
                  Goal Met! 🎉
                </p>
                <p className="font-retro text-gray-300">
                  Choose your combat action for this goal
                </p>
                <div className="mt-3 font-pixel text-yellow-400">
                  ⭐ {currentFocus} Focus Available
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <CombatActionCard
                  action="ATTACK"
                  selected={selectedAction === "ATTACK"}
                  onClick={() => setSelectedAction("ATTACK")}
                  icon="⚔️"
                  title="ATTACK"
                  description="Your reliable damage dealer."
                  details={[
                    "💪 Guaranteed 3-5 base damage",
                    "📈 Full bonus damage on hit",
                    "⭐ Costs 1 focus (recoverable)",
                  ]}
                  focusRequired={1}
                  currentFocus={currentFocus}
                />

                <CombatActionCard
                  action="DEFEND"
                  selected={selectedAction === "DEFEND"}
                  onClick={() => setSelectedAction("DEFEND")}
                  icon="🛡️"
                  title="DEFEND"
                  description="Build focus while protecting."
                  details={[
                    "🛡️ +5 team defense",
                    "⭐ Generates +1 focus",
                    "⚔️ Still deals 50% damage",
                  ]}
                />

                <CombatActionCard
                  action="SUPPORT"
                  selected={selectedAction === "SUPPORT"}
                  onClick={() => setSelectedAction("SUPPORT")}
                  icon="💚"
                  title="SUPPORT"
                  description="Keep your party alive."
                  details={[
                    "💚 Heal weakest ally +10 HP",
                    "⚔️ Deals 50% damage",
                    "⭐ Costs 2 focus",
                  ]}
                  disabled={currentStreak < 3}
                  focusRequired={2}
                  currentFocus={currentFocus}
                />

                <CombatActionCard
                  action="HEROIC_STRIKE"
                  selected={selectedAction === "HEROIC_STRIKE"}
                  onClick={() => setSelectedAction("HEROIC_STRIKE")}
                  icon="⚡"
                  title="HEROIC STRIKE"
                  description="Devastating guaranteed hit!"
                  details={[
                    "⚡ Automatic hit (ignores AC)",
                    "💥 DOUBLE damage dealt",
                    "⭐ Costs 3 focus",
                  ]}
                  disabled={currentStreak < 7}
                  focusRequired={3}
                  currentFocus={currentFocus}
                />
              </div>

              {(currentStreak < 3 || currentStreak < 7) && (
                <div className="text-center font-retro text-sm text-gray-400 space-y-1">
                  {currentStreak < 3 && (
                    <p>🔒 Support unlocks after 3-day streak (Current: {currentStreak})</p>
                  )}
                  {currentStreak < 7 && (
                    <p>🔒 Heroic Strike unlocks after 7-day streak (Current: {currentStreak})</p>
                  )}
                </div>
              )}

              <PixelButton
                onClick={handleActionSelected}
                variant="success"
                size="lg"
                fullWidth
              >
                ⚔️ ROLL TO ATTACK
              </PixelButton>
            </div>
          </PixelPanel>
        </div>
      </div>
    );
  }

  // Show input stage
  return (
    <div className="fixed inset-0 game-bg pixel-grid-bg flex items-center justify-center z-50 p-4">
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

      <div className="relative z-10 max-w-lg w-full">
        <PixelPanel variant="dialog" title={`Goal ${goalNumber} of ${totalGoals}`}>
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="font-pixel text-2xl text-white mb-2">
                {goal.name}
              </h3>
              <p className="font-retro text-gray-300">
                {targetText}
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
                <input
                  type="checkbox"
                  checked={isRestDay}
                  onChange={(e) => setIsRestDay(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-400"
                />
                <span className="text-base font-medium text-white">
                  🛏️ Rest Day
                </span>
              </label>

              {!isRestDay && (
                <div>
                  {isBoolean ? (
                    <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-600/50 rounded-lg hover:bg-gray-600/70 transition-colors">
                      <input
                        type="checkbox"
                        checked={value === "1"}
                        onChange={(e) => setValue(e.target.checked ? "1" : "0")}
                        className="w-6 h-6 rounded border-gray-400"
                      />
                      <span className="text-lg font-medium text-white">
                        ✓ I did this today
                      </span>
                    </label>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        {isProgressTracking ? 'Enter your value' : 'Actual Value'}
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          step="0.1"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          className="flex-1 px-4 py-3 border-4 border-gray-500 rounded-md bg-gray-800 text-white text-lg font-retro focus:border-blue-400 focus:outline-none"
                          placeholder={goal.targetValue?.toString() || "0"}
                          autoFocus
                        />
                        {goal.targetUnit && (
                          <span className="text-gray-300 font-retro text-lg">
                            {goal.targetUnit}
                          </span>
                        )}
                      </div>
                      {isProgressTracking && (
                        <p className="mt-2 text-xs text-green-400 font-retro">
                          ✓ Any value you enter counts as meeting this goal
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <PixelButton
              onClick={handleSubmitValue}
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
  );
}
