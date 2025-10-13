"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelButton from "@/components/ui/PixelButton";

interface Message {
  id: string;
  userId: string;
  displayName: string;
  message: string;
  messageType: "CHAT" | "ENCOURAGEMENT" | "SYSTEM";
  createdAt: string;
}

interface ChatPanelProps {
  partyId: string;
}

export default function ChatPanel({ partyId }: ChatPanelProps) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages on mount and poll every 10 seconds
  useEffect(() => {
    if (partyId && token) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [partyId, token]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchMessages() {
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
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

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
        // Add new message to list immediately
        setMessages([...messages, data.data.message]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  }

  async function sendQuickReaction(reaction: "💪" | "🔥" | "⭐" | "👏") {
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
        // Add new message to list immediately
        setMessages([...messages, data.data.message]);
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

  if (loading) {
    return (
      <PixelPanel variant="menu" title="💬 PARTY CHAT">
        <div className="text-center py-8 text-gray-400 font-retro">
          Loading messages...
        </div>
      </PixelPanel>
    );
  }

  return (
    <PixelPanel variant="menu" title="💬 PARTY CHAT">
      {/* Messages Area */}
      <div className="bg-gray-900/50 rounded-lg p-4 h-80 overflow-y-auto mb-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 font-retro py-8">
            <div className="text-4xl mb-2">💬</div>
            <p>No messages yet. Start the conversation!</p>
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
                  className={`max-w-[75%] rounded-lg p-3 ${
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
      <div className="flex gap-2 mb-4">
        <span className="text-sm text-gray-400 font-retro flex items-center">
          Quick:
        </span>
        <button
          onClick={() => sendQuickReaction("💪")}
          className="text-2xl hover:scale-110 transition-transform"
          title="Encourage!"
        >
          💪
        </button>
        <button
          onClick={() => sendQuickReaction("🔥")}
          className="text-2xl hover:scale-110 transition-transform"
          title="You're on fire!"
        >
          🔥
        </button>
        <button
          onClick={() => sendQuickReaction("⭐")}
          className="text-2xl hover:scale-110 transition-transform"
          title="Amazing!"
        >
          ⭐
        </button>
        <button
          onClick={() => sendQuickReaction("👏")}
          className="text-2xl hover:scale-110 transition-transform"
          title="Well done!"
        >
          👏
        </button>
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          disabled={sending}
          className="flex-1 px-4 py-2 bg-gray-800 border-2 border-gray-600 rounded text-white font-retro placeholder-gray-500 focus:outline-none focus:border-purple-500"
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
    </PixelPanel>
  );
}
