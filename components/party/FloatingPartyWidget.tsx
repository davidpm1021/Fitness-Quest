"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import PixelButton from "@/components/ui/PixelButton";

interface Message {
  id: string;
  userId: string;
  displayName: string;
  message: string;
  messageType: "CHAT" | "ENCOURAGEMENT" | "SYSTEM";
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: "check_in" | "damage" | "heal" | "level_up" | "monster_defeated";
  displayName: string;
  message: string;
  createdAt: string;
  icon: string;
}

export default function FloatingPartyWidget() {
  const { user, token } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "activity">("chat");
  const [partyId, setPartyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch party info
  useEffect(() => {
    if (user && token) {
      fetchPartyInfo();
    }
  }, [user, token]);

  // Fetch messages and activities
  useEffect(() => {
    if (partyId && token && isExpanded) {
      fetchMessages();
      fetchActivities();
      const interval = setInterval(() => {
        fetchMessages();
        fetchActivities();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [partyId, token, isExpanded]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (activeTab === "chat") {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  // Track unread messages
  useEffect(() => {
    if (!isExpanded && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.userId !== user?.id) {
        setUnreadCount((prev) => prev + 1);
      }
    }
  }, [messages, isExpanded, user?.id]);

  // Reset unread when expanded
  useEffect(() => {
    if (isExpanded) {
      setUnreadCount(0);
    }
  }, [isExpanded]);

  async function fetchPartyInfo() {
    try {
      const response = await fetch("/api/parties/my-party", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data.party) {
        setPartyId(data.data.party.id);
      }
    } catch (err) {
      console.error("Error fetching party info:", err);
    }
  }

  async function fetchMessages() {
    if (!partyId) return;
    try {
      const response = await fetch(`/api/parties/${partyId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  }

  async function fetchActivities() {
    if (!partyId) return;
    try {
      const response = await fetch(`/api/parties/${partyId}/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setActivities(data.data.activities);
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending || !partyId) return;

    setSending(true);
    try {
      const response = await fetch(`/api/parties/${partyId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage("");
        setMessages([...messages, data.data.message]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  }

  async function sendQuickReaction(reaction: "💪" | "🔥" | "⭐" | "👏") {
    if (!partyId) return;
    try {
      const response = await fetch(`/api/parties/${partyId}/quick-reaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reaction }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages([...messages, data.data.message]);

        // Show buff notification if we got one!
        if (data.data.buff) {
          // You could add a toast notification here
          console.log("🎁 Buff received:", data.data.buff.notification);
        }
      }
    } catch (err) {
      console.error("Error sending reaction:", err);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // Don't show widget if user is not in a party
  if (!partyId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Collapsed Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="relative bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full p-4 shadow-[0_8px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.6)] transition-all border-4 border-purple-800 hover:scale-110"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <span className="font-pixel text-sm">PARTY</span>
          </div>
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-pixel text-xs border-2 border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </button>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="bg-gray-900 rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.8)] border-4 border-purple-600 w-96 h-[600px] flex flex-col animate-slide-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 to-blue-700 p-4 rounded-t border-b-4 border-purple-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-pixel text-xl text-white flex items-center gap-2">
                <span>👥</span>
                PARTY HUB
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white hover:text-red-400 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-2 px-4 rounded font-pixel text-sm transition-all ${
                  activeTab === "chat"
                    ? "bg-purple-900 text-white border-2 border-purple-400"
                    : "bg-purple-900/30 text-purple-200 hover:bg-purple-900/50"
                }`}
              >
                💬 CHAT
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`flex-1 py-2 px-4 rounded font-pixel text-sm transition-all ${
                  activeTab === "activity"
                    ? "bg-blue-900 text-white border-2 border-blue-400"
                    : "bg-blue-900/30 text-blue-200 hover:bg-blue-900/50"
                }`}
              >
                ⚡ ACTIVITY
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "chat" ? (
              <div className="h-full flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 font-retro py-12">
                      <div className="text-4xl mb-2">💬</div>
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isCurrentUser = msg.userId === user?.id;
                      const isEncouragement = msg.messageType === "ENCOURAGEMENT";
                      const isSystem = msg.messageType === "SYSTEM";

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg p-3 ${
                              isSystem
                                ? "bg-blue-900/30 border border-blue-500/30 mx-auto text-center"
                                : isEncouragement
                                  ? "bg-yellow-900/30 border border-yellow-500/30"
                                  : isCurrentUser
                                    ? "bg-purple-900/50 border border-purple-500/30"
                                    : "bg-gray-800/50 border border-gray-600/30"
                            }`}
                          >
                            {!isSystem && (
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`text-xs font-bold font-pixel ${
                                    isCurrentUser ? "text-purple-300" : "text-blue-300"
                                  }`}
                                >
                                  {isCurrentUser ? "You" : msg.displayName}
                                </span>
                                <span className="text-xs text-gray-500 font-retro ml-2">
                                  {formatTime(msg.createdAt)}
                                </span>
                              </div>
                            )}
                            <p
                              className={`text-sm font-retro ${
                                isSystem ? "text-blue-200 text-xs" : "text-white"
                              }`}
                            >
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Reactions */}
                <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700">
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400 font-retro">Quick:</span>
                    <button
                      onClick={() => sendQuickReaction("💪")}
                      className="text-xl hover:scale-125 transition-transform"
                      title="Encourage!"
                    >
                      💪
                    </button>
                    <button
                      onClick={() => sendQuickReaction("🔥")}
                      className="text-xl hover:scale-125 transition-transform"
                      title="On fire!"
                    >
                      🔥
                    </button>
                    <button
                      onClick={() => sendQuickReaction("⭐")}
                      className="text-xl hover:scale-125 transition-transform"
                      title="Amazing!"
                    >
                      ⭐
                    </button>
                    <button
                      onClick={() => sendQuickReaction("👏")}
                      className="text-xl hover:scale-125 transition-transform"
                      title="Well done!"
                    >
                      👏
                    </button>
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 bg-gray-800 border-t-4 border-purple-700 rounded-b">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      maxLength={500}
                      disabled={sending}
                      className="flex-1 px-3 py-2 bg-gray-900 border-2 border-gray-600 rounded text-white text-sm font-retro placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <PixelButton
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={!newMessage.trim() || sending}
                    >
                      {sending ? "..." : "SEND"}
                    </PixelButton>
                  </form>
                </div>
              </div>
            ) : (
              // Activity Feed
              <div className="h-full overflow-y-auto p-4">
                {activities.length === 0 ? (
                  <div className="text-center text-gray-400 font-retro py-12">
                    <div className="text-4xl mb-2">⚡</div>
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs mt-1">Check back later!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{activity.icon}</div>
                          <div className="flex-1">
                            <p className="font-retro text-sm text-white">
                              <span className="font-pixel text-blue-300">
                                {activity.displayName}
                              </span>{" "}
                              {activity.message}
                            </p>
                            <p className="text-xs text-gray-500 font-retro mt-1">
                              {formatTime(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
