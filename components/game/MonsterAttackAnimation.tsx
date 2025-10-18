"use client";

import { useState, useEffect } from "react";

interface MonsterAttackAnimationProps {
  monsterName: string;
  damage: number;
  onComplete: () => void;
}

export default function MonsterAttackAnimation({
  monsterName,
  damage,
  onComplete,
}: MonsterAttackAnimationProps) {
  const [stage, setStage] = useState<"prepare" | "attack" | "damage">("prepare");

  useEffect(() => {
    const timer1 = setTimeout(() => setStage("attack"), 500);
    const timer2 = setTimeout(() => setStage("damage"), 1500);
    const timer3 = setTimeout(() => onComplete(), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

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

      <div className="relative z-10 max-w-2xl w-full text-center">
        {stage === "prepare" && (
          <div className="animate-fade-in">
            <div className="text-8xl mb-6 animate-pulse">👾</div>
            <h2 className="font-pixel text-3xl text-red-400 mb-4">
              {monsterName}
            </h2>
            <p className="font-retro text-xl text-gray-300">
              The monster attacks!
            </p>
          </div>
        )}

        {stage === "attack" && (
          <div className="animate-fade-in">
            <div className="text-9xl mb-6 animate-bounce">💥</div>
            <h2 className="font-pixel text-4xl text-red-500 mb-4 animate-pulse">
              DIRECT HIT!
            </h2>
          </div>
        )}

        {stage === "damage" && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <div className="text-8xl font-pixel text-red-400 mb-4 drop-shadow-[4px_4px_0_rgba(0,0,0,0.8)]">
                -{damage}
              </div>
              <p className="font-retro text-xl text-red-300">
                HP Lost!
              </p>
            </div>
            <p className="font-retro text-gray-400 text-sm">
              Failed goals let monsters strike...
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
