"use client";

import { useState, useEffect } from "react";
import PixelPanel from "./PixelPanel";
import PixelButton from "./PixelButton";

interface Announcement {
  id: string;
  title: string;
  description: string;
  category: "NEW_FEATURE" | "IMPROVEMENT" | "BUG_FIX" | "COMING_SOON" | "MAINTENANCE";
  version: string | null;
  releaseDate: string;
}

interface WhatsNewModalProps {
  isOpen: boolean;
  announcements: Announcement[];
  onClose: () => void;
  onMarkAsRead: () => Promise<void>;
}

export default function WhatsNewModal({
  isOpen,
  announcements,
  onClose,
  onMarkAsRead,
}: WhatsNewModalProps) {
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleMarkAsRead() {
    setIsMarking(true);
    try {
      await onMarkAsRead();
      onClose();
    } catch (error) {
      console.error("Error marking as read:", error);
    } finally {
      setIsMarking(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-hidden">
      <div className="max-w-2xl w-full max-h-[90vh] flex flex-col">
        <PixelPanel variant="dialog" className="flex flex-col h-full">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 text-center border-b-2 border-purple-500/30 pb-4 mb-4">
            <h2 className="text-3xl font-bold text-yellow-300 font-pixel mb-2">
              ✨ WHAT&apos;S NEW! ✨
            </h2>
            <p className="text-gray-300 font-retro">
              {announcements.length} new update{announcements.length !== 1 ? "s" : ""} since your last visit!
            </p>
          </div>

          {/* Announcements List - Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 min-h-0">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="bg-gray-900/50 border-2 border-purple-500/30 rounded p-4">
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold font-pixel border-2 ${getCategoryColor(
                        announcement.category
                      )}`}
                    >
                      {getCategoryIcon(announcement.category)} {getCategoryLabel(announcement.category)}
                    </span>
                    {announcement.version && (
                      <span className="px-2 py-1 bg-indigo-900/50 text-indigo-300 text-xs font-pixel rounded">
                        v{announcement.version}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white font-pixel">{announcement.title}</h3>
                </div>

                <p className="text-gray-300 font-retro text-sm whitespace-pre-wrap">
                  {announcement.description}
                </p>

                <div className="mt-3 text-xs text-gray-400 font-retro">
                  Released: {new Date(announcement.releaseDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Buttons - Fixed */}
          <div className="flex-shrink-0 flex gap-3 border-t-2 border-purple-500/30 pt-4">
            <PixelButton
              variant="secondary"
              onClick={onClose}
              disabled={isMarking}
              className="flex-1"
            >
              CLOSE
            </PixelButton>
            <PixelButton
              variant="primary"
              onClick={handleMarkAsRead}
              disabled={isMarking}
              className="flex-1"
            >
              {isMarking ? "MARKING..." : "GOT IT! ✓"}
            </PixelButton>
          </div>

          {/* Link - Fixed */}
          <div className="flex-shrink-0 mt-3 text-center">
            <a
              href="/news"
              className="text-blue-400 hover:text-blue-300 font-retro text-sm underline"
              onClick={onClose}
            >
              View Full Changelog →
            </a>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
