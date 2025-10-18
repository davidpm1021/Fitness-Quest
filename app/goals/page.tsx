"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelInput from "@/components/ui/PixelInput";
import PixelBadge from "@/components/ui/PixelBadge";

interface Goal {
  id: string;
  goalType: string;
  goalMeasurementType: string;
  name: string;
  targetValue: number | null;
  targetUnit: string | null;
  isActive: boolean;
  createdAt: string;
}

const GOAL_TYPES = [
  { value: "weight", label: "Weight Training", unit: "reps" },
  { value: "cardio", label: "Cardio", unit: "minutes" },
  { value: "strength", label: "Strength", unit: "lbs" },
  { value: "protein", label: "Protein Intake", unit: "grams" },
  { value: "sleep", label: "Sleep", unit: "hours" },
  { value: "custom", label: "Custom", unit: "" },
];

const MEASUREMENT_TYPES = [
  {
    value: 'TARGET_VALUE',
    label: 'Exceed a daily target',
    example: 'e.g., Exceed the number of steps',
  },
  {
    value: 'UNDER_LIMIT',
    label: 'Stay under a limit',
    example: 'e.g., Stay under a calorie limit',
  },
  {
    value: 'BOOLEAN',
    label: 'Complete a habit',
    example: 'e.g., Take your vitamins',
  },
  {
    value: 'PROGRESS_TRACKING',
    label: 'Track your progress',
    example: 'e.g., Weigh yourself and enter it',
  },
];

export default function GoalsPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    goalType: "",
    goalMeasurementType: "TARGET_VALUE",
    name: "",
    targetValue: "",
    targetUnit: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{goalId: string, goalName: string} | null>(null);

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
    setSuccess("");

    if (!formData.goalType || !formData.name) {
      setError("Please fill in all required fields");
      return;
    }

    // BOOLEAN goals don't need target values
    if (formData.goalMeasurementType !== 'BOOLEAN') {
      if (!formData.targetValue || parseFloat(formData.targetValue) <= 0) {
        setError("Please enter a valid target value");
        return;
      }
    }

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          targetValue: formData.goalMeasurementType === 'BOOLEAN' ? null : formData.targetValue,
          targetUnit: formData.goalMeasurementType === 'BOOLEAN' ? null : formData.targetUnit,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Goal created successfully!");
        setFormData({
          goalType: "",
          goalMeasurementType: "TARGET_VALUE",
          name: "",
          targetValue: "",
          targetUnit: "",
        });
        setShowForm(false);
        fetchGoals();
      } else {
        setError(data.error || "Failed to create goal");
      }
    } catch (err) {
      setError("Failed to create goal");
    }
  }

  function handleDeleteClick(goalId: string, goalName: string) {
    setDeleteConfirmation({goalId, goalName});
  }

  async function confirmDelete() {
    if (!deleteConfirmation) return;

    try {
      const response = await fetch(`/api/goals/${deleteConfirmation.goalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Goal removed successfully!");
        fetchGoals();
      } else {
        setError(data.error || "Failed to remove goal");
      }
    } catch (err) {
      setError("Failed to remove goal");
    } finally {
      setDeleteConfirmation(null);
    }
  }

  function handleGoalTypeChange(type: string) {
    const goalType = GOAL_TYPES.find((g) => g.value === type);
    setFormData({
      ...formData,
      goalType: type,
      targetUnit: goalType?.unit || "",
    });
  }

  function getMeasurementTypeLabel(type: string): string {
    const measurementType = MEASUREMENT_TYPES.find((t) => t.value === type);
    return measurementType?.label || type;
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center game-bg pixel-grid-bg">
        <p className="text-white font-retro text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageLayout title="🎯 GOALS" showBackButton={true}>
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="font-pixel text-3xl text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                ⚡ QUEST SETUP
              </h2>
              <p className="font-retro text-lg text-blue-200 mt-2">
                Choose 2-5 fitness goals to track daily
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={goals.length >= 5}
              className={`px-4 py-2 font-bold border-4 rounded-sm shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] transition-all ${
                goals.length >= 5
                  ? 'bg-gray-500 border-gray-700 text-gray-300 cursor-not-allowed opacity-50'
                  : 'bg-green-500 border-green-700 text-white hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]'
              }`}
            >
              {showForm ? "✖ CANCEL" : "➕ ADD GOAL"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border-4 border-red-500 rounded-lg">
              <p className="font-bold text-red-200 text-center">
                ⚠️ {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-900/50 border-4 border-green-500 rounded-lg">
              <p className="font-bold text-green-200 text-center">
                ✓ {success}
              </p>
            </div>
          )}

          {showForm && (
            <PixelPanel variant="dialog" title="➕ NEW QUEST" className="mb-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block font-bold text-sm uppercase tracking-wider mb-2 text-white">
                    QUEST TYPE
                  </label>
                  <select
                    value={formData.goalType}
                    onChange={(e) => handleGoalTypeChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-4 border-gray-800 dark:border-gray-600 rounded-sm font-retro text-lg text-gray-900 dark:text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Select type...</option>
                    {GOAL_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-sm uppercase tracking-wider mb-2 text-white">
                    HOW DO YOU MEASURE SUCCESS?
                  </label>
                  <div className="space-y-2">
                    {MEASUREMENT_TYPES.map((type) => (
                      <label
                        key={type.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.goalMeasurementType === type.value
                            ? 'bg-blue-900/50 border-blue-400'
                            : 'bg-gray-800/50 border-gray-700 hover:border-blue-500/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="measurementType"
                          value={type.value}
                          checked={formData.goalMeasurementType === type.value}
                          onChange={(e) =>
                            setFormData({ ...formData, goalMeasurementType: e.target.value })
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="text-white font-bold font-retro text-sm">
                            {type.label}
                          </div>
                          <div className="text-gray-400 font-retro text-xs mt-1">
                            {type.example}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <PixelInput
                  label="QUEST NAME"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Morning Run"
                  required
                />

                {formData.goalMeasurementType !== 'BOOLEAN' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PixelInput
                      label="TARGET VALUE"
                      type="number"
                      step="0.1"
                      value={formData.targetValue}
                      onChange={(e) =>
                        setFormData({ ...formData, targetValue: e.target.value })
                      }
                      placeholder="e.g., 30"
                    />

                    <PixelInput
                      label="UNIT"
                      type="text"
                      value={formData.targetUnit}
                      onChange={(e) =>
                        setFormData({ ...formData, targetUnit: e.target.value })
                      }
                      placeholder="e.g., minutes"
                    />
                  </div>
                )}

                {formData.goalMeasurementType === 'BOOLEAN' && (
                  <div className="p-4 bg-green-900/30 border-2 border-green-500/50 rounded-lg">
                    <p className="text-green-200 font-retro text-sm">
                      ✓ <strong>Habit Goal:</strong> No target value needed - just check it off daily!
                    </p>
                  </div>
                )}

                <PixelButton
                  type="submit"
                  variant="success"
                  size="lg"
                  className="w-full"
                >
                  ✓ CREATE QUEST
                </PixelButton>
              </form>
            </PixelPanel>
          )}

          <div className="space-y-4">
            {goals.length === 0 ? (
              <PixelPanel variant="menu">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📜</div>
                  <p className="font-retro text-xl text-white">
                    No quests yet!
                  </p>
                  <p className="font-retro text-lg text-gray-300 mt-2">
                    Create your first quest to begin your adventure
                  </p>
                </div>
              </PixelPanel>
            ) : (
              goals.map((goal) => (
                <PixelPanel key={goal.id} variant="menu">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-pixel text-lg text-white">
                          {goal.name}
                        </h3>
                        <PixelBadge variant="info" size="sm">
                          {GOAL_TYPES.find((t) => t.value === goal.goalType)?.label}
                        </PixelBadge>
                      </div>
                      <p className="font-retro text-sm text-gray-400 mb-1">
                        {getMeasurementTypeLabel(goal.goalMeasurementType)}
                      </p>
                      {goal.targetValue && (
                        <p className="font-retro text-lg text-blue-200">
                          Target: {goal.targetValue} {goal.targetUnit}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteClick(goal.id, goal.name)}
                      className="ml-4 px-3 py-2 bg-red-600 border-4 border-red-800 text-white font-bold rounded-sm shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] hover:translate-y-[-2px] transition-all"
                    >
                      ✖
                    </button>
                  </div>
                </PixelPanel>
              ))
            )}
          </div>

          {goals.length >= 2 && (
            <div className="mt-8 text-center">
              <PixelButton
                onClick={() => router.push("/party")}
                variant="success"
                size="lg"
              >
                ▶ CONTINUE TO PARTY SETUP
              </PixelButton>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <PixelPanel variant="warning" title="⚠️ CONFIRM DELETION">
              <div className="space-y-4">
                <p className="font-retro text-lg text-white text-center">
                  Are you sure you want to remove this goal?
                </p>
                <p className="font-pixel text-xl text-yellow-400 text-center">
                  {deleteConfirmation.goalName}
                </p>
                <p className="font-retro text-sm text-gray-300 text-center">
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <PixelButton
                    onClick={() => setDeleteConfirmation(null)}
                    variant="secondary"
                    size="lg"
                    fullWidth
                  >
                    ✖ CANCEL
                  </PixelButton>
                  <PixelButton
                    onClick={confirmDelete}
                    variant="danger"
                    size="lg"
                    fullWidth
                  >
                    ✓ DELETE
                  </PixelButton>
                </div>
              </div>
            </PixelPanel>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
