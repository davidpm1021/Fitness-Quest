"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelButton from "@/components/ui/PixelButton";

interface Announcement {
  id: string;
  title: string;
  description: string;
  category: "NEW_FEATURE" | "IMPROVEMENT" | "BUG_FIX" | "COMING_SOON" | "MAINTENANCE";
  version: string | null;
  releaseDate: string;
  isViewed: boolean;
  viewedAt: string | null;
}

export default function NewsPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchAnnouncements();
    }
  }, [user, token]);

  async function fetchAnnouncements() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/announcements", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.data.announcements);
      } else {
        setError(data.error || "Failed to load announcements");
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}), // Empty body marks all as read
      });

      if (response.ok) {
        // Refetch to update the UI
        fetchAnnouncements();
      }
    } catch (err) {
      console.error("Error marking announcements as read:", err);
    }
  }

  function getCategoryIcon(category: string): string {
    switch (category) {
      case "NEW_FEATURE":
        return "✨";
      case "IMPROVEMENT":
        return "⚡";
      case "BUG_FIX":
        return "🐛";
      case "COMING_SOON":
        return "🔮";
      case "MAINTENANCE":
        return "🔧";
      default:
        return "📢";
    }
  }

  function getCategoryColor(category: string): string {
    switch (category) {
      case "NEW_FEATURE":
        return "bg-green-900/30 border-green-500 text-green-300";
      case "IMPROVEMENT":
        return "bg-blue-900/30 border-blue-500 text-blue-300";
      case "BUG_FIX":
        return "bg-yellow-900/30 border-yellow-500 text-yellow-300";
      case "COMING_SOON":
        return "bg-purple-900/30 border-purple-500 text-purple-300";
      case "MAINTENANCE":
        return "bg-gray-900/30 border-gray-500 text-gray-300";
      default:
        return "bg-gray-900/30 border-gray-500 text-gray-300";
    }
  }

  function getCategoryLabel(category: string): string {
    return category.replace(/_/g, " ");
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

  const categories = ["ALL", "NEW_FEATURE", "IMPROVEMENT", "BUG_FIX", "COMING_SOON"];
  const filteredAnnouncements =
    selectedCategory === "ALL"
      ? announcements
      : announcements.filter((a) => a.category === selectedCategory);

  const unreadCount = announcements.filter((a) => !a.isViewed).length;

  return (
    <PageLayout title="📰 NEWS & UPDATES" showBackButton={true}>
      <main className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <PixelPanel variant="warning" className="mb-6">
            <div className="text-center">
              <p className="text-red-300 font-pixel mb-4">⚠️ {error}</p>
              <PixelButton variant="secondary" onClick={fetchAnnouncements}>
                🔄 RETRY
              </PixelButton>
            </div>
          </PixelPanel>
        )}

        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white font-pixel mb-3">
            📰 WHAT&apos;S NEW IN FITNESS QUEST
          </h2>
          <p className="text-gray-300 font-retro mb-2 text-lg">
            Stay updated on new features, improvements, and upcoming additions
          </p>
          {unreadCount > 0 && (
            <div className="mt-4">
              <PixelButton variant="primary" onClick={markAllAsRead}>
                ✅ MARK ALL AS READ ({unreadCount})
              </PixelButton>
            </div>
          )}
        </div>

        {/* Category Filter */}
        <PixelPanel variant="menu" className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 font-pixel text-sm transition-all ${
                  selectedCategory === category
                    ? "bg-purple-600 text-white border-2 border-purple-400"
                    : "bg-gray-800 text-gray-300 border-2 border-gray-600 hover:bg-gray-700"
                } rounded`}
              >
                {category === "ALL" ? "ALL" : getCategoryLabel(category)}
              </button>
            ))}
          </div>
        </PixelPanel>

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <PixelPanel variant="dialog">
              <div className="text-center py-8">
                <p className="text-gray-300 font-retro text-lg">
                  📭 No announcements to display
                </p>
              </div>
            </PixelPanel>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <PixelPanel
                key={announcement.id}
                variant="dialog"
                className={`relative ${!announcement.isViewed ? "border-2 border-yellow-400" : ""}`}
              >
                {!announcement.isViewed && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold font-pixel rounded">
                      NEW
                    </span>
                  </div>
                )}

                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded text-xs font-bold font-pixel border-2 ${getCategoryColor(
                          announcement.category
                        )}`}
                      >
                        {getCategoryIcon(announcement.category)}{" "}
                        {getCategoryLabel(announcement.category)}
                      </span>
                      {announcement.version && (
                        <span className="px-2 py-1 bg-indigo-900/50 text-indigo-300 text-xs font-pixel rounded">
                          v{announcement.version}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white font-pixel mb-2">
                      {announcement.title}
                    </h3>
                  </div>
                </div>

                <p className="text-gray-300 font-retro mb-3 whitespace-pre-wrap">
                  {announcement.description}
                </p>

                {announcement.viewedAt && (
                  <div className="text-xs text-green-400 font-retro">
                    ✓ Viewed {new Date(announcement.viewedAt).toLocaleDateString()}
                  </div>
                )}
              </PixelPanel>
            ))
          )}
        </div>
      </main>
    </PageLayout>
  );
}
