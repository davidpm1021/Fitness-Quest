"use client";

import { useEffect, useState } from "react";

interface MilestoneCelebrationProps {
  milestone: 75 | 50 | 25;
  onComplete: () => void;
  autoShow?: boolean;
}

export default function MilestoneCelebration({
  milestone,
  onComplete,
  autoShow = true,
}: MilestoneCelebrationProps) {
  const [show, setShow] = useState(autoShow);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  const milestoneData = {
    75: {
      emoji: "💪",
      title: "QUARTER HEALTH!",
      message: "The monster is weakening!",
      color: "from-yellow-400 to-orange-500",
      borderColor: "border-yellow-500",
      textColor: "text-yellow-300",
    },
    50: {
      emoji: "🔥",
      title: "HALF HEALTH!",
      message: "You're halfway there!",
      color: "from-orange-400 to-red-500",
      borderColor: "border-orange-500",
      textColor: "text-orange-300",
    },
    25: {
      emoji: "⚔️",
      title: "CRITICAL HEALTH!",
      message: "Victory is near! Finish it!",
      color: "from-red-400 to-red-600",
      borderColor: "border-red-500",
      textColor: "text-red-300",
    },
  };

  const data = milestoneData[milestone];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
      <div className="relative">
        {/* Explosion effect background */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-8 h-8 bg-gradient-to-br ${data.color} rounded-full opacity-70 animate-ping`}
              style={{
                animationDelay: `${i * 0.1}s`,
                transform: `rotate(${i * 30}deg) translateY(-120px)`,
              }}
            />
          ))}
        </div>

        {/* Main celebration card */}
        <div
          className={`relative bg-gradient-to-br ${data.color} border-8 ${data.borderColor} rounded-2xl shadow-[0_12px_0_0_rgba(0,0,0,0.5)] p-8 min-w-[400px] transform animate-bounce`}
        >
          {/* Sparkle effects */}
          <div className="absolute -top-4 -right-4 text-6xl animate-pulse">⭐</div>
          <div className="absolute -bottom-4 -left-4 text-6xl animate-pulse delay-100">⭐</div>

          <div className="text-center">
            {/* Large emoji */}
            <div className="text-9xl mb-6 animate-pulse">{data.emoji}</div>

            {/* Title */}
            <h2 className="font-pixel text-4xl text-white mb-4 drop-shadow-[4px_4px_0_rgba(0,0,0,0.8)] animate-bounce">
              {data.title}
            </h2>

            {/* Message */}
            <p className={`font-retro text-2xl ${data.textColor} mb-6`}>
              {data.message}
            </p>

            {/* HP indicator */}
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
              <p className="font-pixel text-lg text-white">
                🎯 Monster HP: {milestone}%
              </p>
            </div>

            {/* Progress bar */}
            <div className="mt-6 bg-gray-800/50 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-white animate-pulse"
                style={{ width: `${(3000 - Date.now() % 3000) / 30}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
