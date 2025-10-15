"use client";

import { calculateLevelProgress, calculateXPForLevel } from "@/lib/progression";
import PixelBadge from "@/components/ui/PixelBadge";
import { useState } from "react";

interface ProgressionDisplayProps {
  xp: number;
  level: number;
  skillPoints: number;
  variant?: "compact" | "full";
  showXPBreakdown?: boolean;
}

export default function ProgressionDisplay({
  xp,
  level,
  skillPoints,
  variant = "compact",
  showXPBreakdown = false,
}: ProgressionDisplayProps) {
  const [showInfo, setShowInfo] = useState(false);

  const progress = calculateLevelProgress(xp);
  const xpToNextLevel = progress.nextLevelXP - xp;

  if (variant === "compact") {
    return (
      <div className="relative">
        <div className="bg-gray-800/50 rounded-lg p-3 border-2 border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="text-2xl">⭐</div>
              <div>
                <div className="text-sm text-gray-400 font-retro">LEVEL</div>
                <div className="text-xl font-bold text-purple-400 font-pixel">
                  {level}
                </div>
              </div>
            </div>

            {skillPoints > 0 && (
              <PixelBadge variant="success">
                {skillPoints} SP Available!
              </PixelBadge>
            )}
          </div>

          {/* XP Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400 font-retro">XP</span>
              <span className="text-xs text-gray-300 font-retro">
                {progress.progressXP} / {progress.nextLevelXP - progress.currentLevelXP}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress.progressPercentage}%` }}
              />
            </div>
            <div className="text-center mt-1">
              <span className="text-xs text-gray-400 font-retro">
                {xpToNextLevel} XP to Level {progress.nextLevel}
              </span>
            </div>
          </div>

          {showXPBreakdown && (
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-xs text-blue-400 hover:text-blue-300 font-retro mt-2 underline"
            >
              How do I earn XP?
            </button>
          )}
        </div>

        {/* XP Info Tooltip */}
        {showInfo && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-gray-900 border-2 border-blue-500 rounded-lg p-3 shadow-lg">
            <div className="text-sm text-white font-retro space-y-2">
              <div className="font-bold text-blue-400 mb-2">EARNING XP:</div>
              <div>✓ <span className="text-yellow-400">+10 XP</span> for checking in</div>
              <div>✓ <span className="text-yellow-400">+2 XP</span> per goal met</div>
              <div>✓ <span className="text-yellow-400">+50-100 XP</span> for defeating monsters</div>
              <div className="mt-2 pt-2 border-t border-gray-700">
                <span className="text-purple-400">Level up to earn skill points!</span>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="mt-2 text-xs text-gray-400 hover:text-white"
            >
              [Close]
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full variant - more detailed
  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-lg p-6 border-4 border-purple-500">
      <div className="text-center mb-4">
        <div className="text-6xl mb-2">⭐</div>
        <h3 className="text-3xl font-bold text-white font-pixel mb-1">
          LEVEL {level}
        </h3>
        <p className="text-purple-300 font-retro text-sm">Hero Progression</p>
      </div>

      {/* XP Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-retro">Experience</span>
          <span className="text-purple-300 font-pixel">
            {xp} / {progress.nextLevelXP} XP
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-6 border-2 border-purple-600">
          <div
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 h-full rounded-full transition-all duration-500 flex items-center justify-center"
            style={{ width: `${Math.max(5, progress.progressPercentage)}%` }}
          >
            <span className="text-white font-bold text-xs font-pixel px-2">
              {progress.progressPercentage}%
            </span>
          </div>
        </div>
        <div className="text-center mt-2">
          <span className="text-purple-300 font-retro text-sm">
            {xpToNextLevel} XP needed for Level {progress.nextLevel}
          </span>
        </div>
      </div>

      {/* Skill Points */}
      <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-yellow-500/30 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🌟</div>
            <div>
              <div className="text-sm text-gray-400 font-retro">SKILL POINTS</div>
              <div className="text-2xl font-bold text-yellow-400 font-pixel">
                {skillPoints}
              </div>
            </div>
          </div>
          {skillPoints > 0 && (
            <div className="animate-pulse">
              <PixelBadge variant="success">Available!</PixelBadge>
            </div>
          )}
        </div>
        {skillPoints > 0 && (
          <div className="mt-2 text-sm text-yellow-300 font-retro text-center">
            Visit the Skills page to spend your points!
          </div>
        )}
      </div>

      {/* XP Earning Guide */}
      <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-blue-500/30">
        <div className="text-blue-400 font-bold font-retro text-sm mb-3">
          HOW TO EARN XP:
        </div>
        <div className="space-y-2 text-sm text-gray-300 font-retro">
          <div className="flex justify-between items-center">
            <span>✓ Daily check-in</span>
            <span className="text-yellow-400 font-bold">+10 XP</span>
          </div>
          <div className="flex justify-between items-center">
            <span>✓ Each goal met</span>
            <span className="text-yellow-400 font-bold">+2 XP</span>
          </div>
          <div className="flex justify-between items-center">
            <span>✓ Defeat Glass Cannon</span>
            <span className="text-yellow-400 font-bold">+50 XP</span>
          </div>
          <div className="flex justify-between items-center">
            <span>✓ Defeat Balanced</span>
            <span className="text-yellow-400 font-bold">+75 XP</span>
          </div>
          <div className="flex justify-between items-center">
            <span>✓ Defeat Tank</span>
            <span className="text-yellow-400 font-bold">+100 XP</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 text-center">
          <span className="text-purple-400 text-sm font-retro">
            💡 Max XP per check-in: {10 + (5 * 2)} (all goals met)
          </span>
        </div>
      </div>
    </div>
  );
}
