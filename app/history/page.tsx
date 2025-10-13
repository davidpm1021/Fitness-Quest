"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelButton from "@/components/ui/PixelButton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface CheckInHistory {
  date: string;
  goalsMet: number;
  totalGoals: number;
  damageDealt: number;
  wasHit: boolean;
  damageTaken: number;
  attackRoll: number;
  attackBonus: number;
  combatAction: string;
  isRestDay: boolean;
  goals: Array<{
    goalName: string;
    goalType: string;
    actualValue: number | null;
    targetValue: number | null;
    targetUnit: string | null;
    wasMet: boolean;
  }>;
}

interface Stats {
  streaks: {
    current: number;
    longest: number;
  };
  totals: {
    checkIns: number;
    damageDealt: number;
    damageTaken: number;
    goalsMet: number;
    goalAttempts: number;
    timesHit: number;
    restDays: number;
    focusEarned: number;
  };
  averages: {
    goalsMet: number;
    damage: number;
  };
  records: {
    bestDamage: number;
    longestStreak: number;
  };
  percentages: {
    goalCompletionRate: number;
    hitRate: number;
  };
  combatActions: {
    ATTACK: number;
    DEFEND: number;
    SUPPORT: number;
    HEROIC_STRIKE: number;
  };
  checkInsByDay: {
    [key: string]: number;
  };
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<CheckInHistory[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchData();
    }
  }, [user, token]);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch history and stats in parallel
      const [historyRes, statsRes] = await Promise.all([
        fetch("/api/check-ins/history", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/check-ins/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const historyData = await historyRes.json();
      const statsData = await statsRes.json();

      if (historyData.success) {
        setHistory(historyData.data.checkIns);
      }

      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getDayOfWeek(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  // Prepare chart data
  const damageChartData = history
    .slice()
    .reverse()
    .map((checkIn) => ({
      date: formatDate(checkIn.date),
      damage: checkIn.damageDealt,
      damageTaken: checkIn.damageTaken,
    }));

  const goalsChartData = history
    .slice()
    .reverse()
    .map((checkIn) => ({
      date: formatDate(checkIn.date),
      goalsMet: checkIn.goalsMet,
      totalGoals: checkIn.totalGoals,
    }));

  // Combat actions pie chart data
  const combatActionsData = stats
    ? [
        { name: "Attack", value: stats.combatActions.ATTACK, color: "#3b82f6" },
        { name: "Defend", value: stats.combatActions.DEFEND, color: "#10b981" },
        { name: "Support", value: stats.combatActions.SUPPORT, color: "#f59e0b" },
        {
          name: "Heroic Strike",
          value: stats.combatActions.HEROIC_STRIKE,
          color: "#ef4444",
        },
      ].filter((item) => item.value > 0)
    : [];

  // Check-ins by day of week data
  const dayOfWeekData = stats
    ? [
        { day: "Sun", count: stats.checkInsByDay.Sunday || 0 },
        { day: "Mon", count: stats.checkInsByDay.Monday || 0 },
        { day: "Tue", count: stats.checkInsByDay.Tuesday || 0 },
        { day: "Wed", count: stats.checkInsByDay.Wednesday || 0 },
        { day: "Thu", count: stats.checkInsByDay.Thursday || 0 },
        { day: "Fri", count: stats.checkInsByDay.Friday || 0 },
        { day: "Sat", count: stats.checkInsByDay.Saturday || 0 },
      ]
    : [];

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

  return (
    <PageLayout title="📊 CHECK-IN HISTORY" showBackButton backPath="/dashboard">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Current Streak */}
            <PixelPanel variant="default" className="text-center">
              <div className="text-4xl mb-2">🔥</div>
              <div className="text-3xl font-bold text-orange-400 font-pixel mb-1">
                {stats.streaks.current}
              </div>
              <div className="text-sm text-gray-400 font-retro">Current Streak</div>
            </PixelPanel>

            {/* Longest Streak */}
            <PixelPanel variant="default" className="text-center">
              <div className="text-4xl mb-2">⭐</div>
              <div className="text-3xl font-bold text-yellow-400 font-pixel mb-1">
                {stats.streaks.longest}
              </div>
              <div className="text-sm text-gray-400 font-retro">Longest Streak</div>
            </PixelPanel>

            {/* Total Check-Ins */}
            <PixelPanel variant="default" className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-3xl font-bold text-green-400 font-pixel mb-1">
                {stats.totals.checkIns}
              </div>
              <div className="text-sm text-gray-400 font-retro">Total Check-Ins</div>
            </PixelPanel>

            {/* Best Damage */}
            <PixelPanel variant="default" className="text-center">
              <div className="text-4xl mb-2">⚔️</div>
              <div className="text-3xl font-bold text-red-400 font-pixel mb-1">
                {stats.records.bestDamage}
              </div>
              <div className="text-sm text-gray-400 font-retro">Best Damage</div>
            </PixelPanel>
          </div>
        )}

        {/* Additional Stats */}
        {stats && (
          <PixelPanel variant="menu" title="📈 PERFORMANCE STATS" className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-pixel">
                  {stats.totals.damageDealt}
                </div>
                <div className="text-xs text-gray-400 font-retro">Total Damage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-pixel">
                  {stats.percentages.goalCompletionRate}%
                </div>
                <div className="text-xs text-gray-400 font-retro">Goal Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-pixel">
                  {stats.averages.damage}
                </div>
                <div className="text-xs text-gray-400 font-retro">Avg Damage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-pixel">
                  {stats.totals.focusEarned}
                </div>
                <div className="text-xs text-gray-400 font-retro">Total Focus</div>
              </div>
            </div>
          </PixelPanel>
        )}

        {/* Charts */}
        {history.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Damage Over Time */}
            <PixelPanel variant="menu" title="⚔️ DAMAGE OVER TIME">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={damageChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "2px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="damage"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Damage Dealt"
                  />
                  <Line
                    type="monotone"
                    dataKey="damageTaken"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Damage Taken"
                  />
                </LineChart>
              </ResponsiveContainer>
            </PixelPanel>

            {/* Goals Met Per Day */}
            <PixelPanel variant="menu" title="🎯 GOALS COMPLETION">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={goalsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "2px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="goalsMet" fill="#10b981" name="Goals Met" />
                  <Bar dataKey="totalGoals" fill="#6b7280" name="Total Goals" />
                </BarChart>
              </ResponsiveContainer>
            </PixelPanel>

            {/* Combat Actions Distribution */}
            {combatActionsData.length > 0 && (
              <PixelPanel variant="menu" title="⚡ COMBAT ACTIONS">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={combatActionsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {combatActionsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </PixelPanel>
            )}

            {/* Check-Ins by Day of Week */}
            {stats && (
              <PixelPanel variant="menu" title="📅 CHECK-INS BY DAY">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "2px solid #374151",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" name="Check-Ins" />
                  </BarChart>
                </ResponsiveContainer>
              </PixelPanel>
            )}
          </div>
        )}

        {/* Recent Check-Ins List */}
        <PixelPanel variant="menu" title="📜 RECENT CHECK-INS" className="mb-8">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-400 font-retro mb-4">
                No check-ins yet. Start your journey!
              </p>
              <PixelButton
                variant="primary"
                size="lg"
                onClick={() => router.push("/check-in")}
              >
                START CHECK-IN
              </PixelButton>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((checkIn, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-4 border-2 border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold font-pixel">
                          {formatDate(checkIn.date)}
                        </span>
                        <span className="text-gray-400 text-sm font-retro">
                          ({getDayOfWeek(checkIn.date)})
                        </span>
                        {checkIn.isRestDay && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded font-retro">
                            REST DAY
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 font-retro mt-1">
                        Action: {checkIn.combatAction.replace("_", " ")}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400 font-pixel">
                          {checkIn.damageDealt}
                        </div>
                        <div className="text-xs text-gray-400 font-retro">DMG</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 font-pixel">
                          {checkIn.goalsMet}/{checkIn.totalGoals}
                        </div>
                        <div className="text-xs text-gray-400 font-retro">GOALS</div>
                      </div>
                    </div>
                  </div>

                  {/* Goals Detail */}
                  {checkIn.goals.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t-2 border-gray-700">
                      {checkIn.goals.map((goal, goalIndex) => (
                        <div
                          key={goalIndex}
                          className={`flex items-center justify-between p-2 rounded ${
                            goal.wasMet ? "bg-green-900/20" : "bg-red-900/20"
                          }`}
                        >
                          <span className="text-sm font-retro text-gray-300">
                            {goal.goalName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-retro text-gray-400">
                              {goal.actualValue || "N/A"} {goal.targetUnit}
                            </span>
                            {goal.wasMet ? (
                              <span className="text-green-400">✓</span>
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Combat Details */}
                  <div className="mt-3 pt-3 border-t-2 border-gray-700 flex flex-wrap gap-4 text-sm font-retro">
                    <span className="text-gray-400">
                      Roll: <span className="text-blue-400">{checkIn.attackRoll}</span> +{" "}
                      <span className="text-purple-400">{checkIn.attackBonus}</span>
                    </span>
                    {checkIn.wasHit && (
                      <span className="text-orange-400">
                        Hit! -{checkIn.damageTaken} HP
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PixelPanel>

        {/* Back to Dashboard */}
        <div className="text-center">
          <PixelButton
            variant="secondary"
            size="lg"
            onClick={() => router.push("/dashboard")}
          >
            ← BACK TO DASHBOARD
          </PixelButton>
        </div>
      </main>
    </PageLayout>
  );
}
