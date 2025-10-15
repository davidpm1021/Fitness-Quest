"use client";

import { useEffect, useState } from "react";

interface MonsterHealthBarProps {
  currentHp: number;
  maxHp: number;
  monsterName: string;
  damageDealt?: number;
  animated?: boolean;
}

export default function MonsterHealthBar({
  currentHp,
  maxHp,
  monsterName,
  damageDealt = 0,
  animated = true,
}: MonsterHealthBarProps) {
  const [displayHp, setDisplayHp] = useState(animated ? currentHp + damageDealt : currentHp);
  const percentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  // Animate HP reduction
  useEffect(() => {
    if (animated && damageDealt > 0) {
      const startHp = currentHp + damageDealt;
      const duration = 1500; // 1.5 seconds
      const steps = 30;
      const hpPerStep = damageDealt / steps;
      const timePerStep = duration / steps;

      let step = 0;
      const interval = setInterval(() => {
        step++;
        setDisplayHp(Math.max(currentHp, startHp - hpPerStep * step));

        if (step >= steps) {
          clearInterval(interval);
          setDisplayHp(currentHp);
        }
      }, timePerStep);

      return () => clearInterval(interval);
    }
  }, [currentHp, damageDealt, animated]);

  // Color based on HP percentage
  const getHealthColor = () => {
    if (percentage > 60) return "bg-green-500";
    if (percentage > 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getGlowColor = () => {
    if (percentage > 60) return "shadow-[0_0_20px_rgba(34,197,94,0.6)]";
    if (percentage > 30) return "shadow-[0_0_20px_rgba(234,179,8,0.6)]";
    return "shadow-[0_0_20px_rgba(239,68,68,0.6)]";
  };

  return (
    <div className="w-full">
      {/* Monster name */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👾</span>
          <h3 className="font-pixel text-xl text-white">{monsterName}</h3>
        </div>
        <div className="font-pixel text-sm text-gray-300">
          {Math.round(displayHp)}/{maxHp} HP
        </div>
      </div>

      {/* Health bar container */}
      <div className="relative w-full h-8 bg-gray-900 rounded-lg border-4 border-gray-700 overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:8px_8px]" />
        </div>

        {/* Health bar fill */}
        <div
          className={`absolute inset-0 ${getHealthColor()} ${getGlowColor()} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />

          {/* Pulse effect when low */}
          {percentage <= 30 && (
            <div className="absolute inset-0 bg-red-400/50 animate-pulse" />
          )}
        </div>

        {/* HP percentage text (overlay) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-pixel text-sm text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)] z-10">
            {Math.round(percentage)}%
          </span>
        </div>

        {/* Damage dealt indicator */}
        {damageDealt > 0 && animated && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 font-pixel text-xs text-red-200 animate-fade-in-out">
            -{damageDealt}
          </div>
        )}
      </div>

      {/* Status indicators */}
      <div className="mt-2 flex gap-2 justify-end">
        {percentage <= 25 && (
          <span className="font-pixel text-xs text-red-400 animate-pulse">
            ⚠️ CRITICAL!
          </span>
        )}
        {percentage <= 50 && percentage > 25 && (
          <span className="font-pixel text-xs text-yellow-400">
            ⚡ WEAKENED
          </span>
        )}
        {currentHp === maxHp && (
          <span className="font-pixel text-xs text-green-400">
            💪 FULL HEALTH
          </span>
        )}
      </div>

      {/* Shine animation */}
      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes fade-in-out {
          0% {
            opacity: 0;
            transform: translateY(-50%) translateX(10px);
          }
          50% {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-50%) translateX(-10px);
          }
        }
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
        .animate-fade-in-out {
          animation: fade-in-out 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
