"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

interface Goal {
  id: string;
  goalType: string;
  name: string;
  targetValue: number | null;
  targetUnit: string | null;
  flexPercentage: number;
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

export default function GoalsPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    goalType: "",
    name: "",
    targetValue: "",
    targetUnit: "",
    flexPercentage: "10",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

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

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Goal created successfully!");
        setFormData({
          goalType: "",
          name: "",
          targetValue: "",
          targetUnit: "",
          flexPercentage: "10",
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

  async function handleDelete(goalId: string) {
    if (!confirm("Are you sure you want to remove this goal?")) {
      return;
    }

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
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
                Fitness Quest
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Goals
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Set 2-5 fitness goals to track daily
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={goals.length >= 5}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showForm ? "Cancel" : "Add Goal"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-400">{success}</p>
            </div>
          )}

          {showForm && (
            <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create New Goal
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Goal Type
                  </label>
                  <select
                    value={formData.goalType}
                    onChange={(e) => handleGoalTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="e.g., Morning Run"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Value
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.targetValue}
                      onChange={(e) =>
                        setFormData({ ...formData, targetValue: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      placeholder="e.g., 30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={formData.targetUnit}
                      onChange={(e) =>
                        setFormData({ ...formData, targetUnit: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      placeholder="e.g., minutes"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Flex Percentage: {formData.flexPercentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={formData.flexPercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, flexPercentage: e.target.value })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Wiggle room for your target (0-20%)
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Goal
                </button>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-gray-600 dark:text-gray-400">
                  No goals yet. Create your first goal to get started!
                </p>
              </div>
            ) : (
              goals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {goal.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {GOAL_TYPES.find((t) => t.value === goal.goalType)?.label}
                      </p>
                      {goal.targetValue && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                          Target: {goal.targetValue} {goal.targetUnit} (±
                          {goal.flexPercentage}%)
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {goals.length >= 2 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/party")}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Continue to Party Setup
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
