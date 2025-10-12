"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

interface Goal {
  id: string;
  name: string;
  goalType: string;
  targetValue: number | null;
  targetUnit: string | null;
  flexPercentage: number;
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
}

export default function CheckInPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalValues, setGoalValues] = useState<Record<string, { value: string; isRestDay: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchGoals();
    }
  }, [user, token]);

  async function fetchGoals() {
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
          initialValues[goal.id] = { value: goal.targetValue?.toString() || "", isRestDay: false };
        });
        setGoalValues(initialValues);
      }
    } catch (err) {
      console.error("Error fetching goals:", err);
    } finally {
      setLoading(false);
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
        body: JSON.stringify({ goalCheckIns }),
      });

      const data = await response.json();

      if (data.success) {
        setAttackResult(data.data.attackResult);
        setShowResult(true);
      } else {
        setError(data.error || "Failed to submit check-in");
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

  if (showResult && attackResult) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              {attackResult.hit ? "⚔️" : "🛡️"}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {attackResult.hit ? "HIT!" : "MISS!"}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {attackResult.hit
                ? `You dealt ${attackResult.totalDamage} damage!`
                : "Better luck tomorrow!"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Attack Roll
              </h3>
              <div className="text-center">
                <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  {attackResult.roll}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">d20 Roll</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Bonuses
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    +{attackResult.bonuses.goalBonus}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Goals Met</p>
                </div>
                {attackResult.bonuses.streakBonus > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      +{attackResult.bonuses.streakBonus}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Streak</p>
                  </div>
                )}
                {attackResult.bonuses.teamBonus > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      +{attackResult.bonuses.teamBonus}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Teamwork</p>
                  </div>
                )}
                {attackResult.bonuses.underdogBonus > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      +{attackResult.bonuses.underdogBonus}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Underdog</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Bonus</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  +{attackResult.bonuses.totalBonus}
                </p>
              </div>
            </div>

            {attackResult.hit && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Damage Dealt
                </h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
                    {attackResult.totalDamage}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Base {attackResult.baseDamage} + Bonuses {attackResult.bonuses.totalBonus}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => router.push("/party/dashboard")}
              className="w-full py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
            >
              Back to Party Dashboard
            </button>
            <button
              onClick={() => {
                setShowResult(false);
                setAttackResult(null);
                router.push("/party/dashboard");
              }}
              className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              View Battle Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Daily Check-In
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push("/party/dashboard")}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            How did you do today?
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {goals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You need to set up goals before checking in
              </p>
              <button
                onClick={() => router.push("/goals")}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Set Up Goals
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {goal.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Target: {goal.targetValue} {goal.targetUnit} (±
                        {goal.flexPercentage}%)
                      </p>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={goalValues[goal.id]?.isRestDay || false}
                        onChange={() => handleRestDayToggle(goal.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Rest Day
                      </span>
                    </label>
                  </div>

                  {!goalValues[goal.id]?.isRestDay && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Actual Value
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.1"
                          value={goalValues[goal.id]?.value || ""}
                          onChange={(e) =>
                            handleGoalValueChange(goal.id, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          placeholder={goal.targetValue?.toString() || "0"}
                        />
                        <span className="text-gray-600 dark:text-gray-400">
                          {goal.targetUnit}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Check-In"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
