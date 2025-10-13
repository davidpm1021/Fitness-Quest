"use client";

import { useState, useEffect } from "react";

interface DiceRollProps {
  onComplete: (result: number) => void;
  autoRoll?: boolean;
  finalResult?: number; // Pre-determined result (for using server-generated roll)
}

export default function DiceRoll({
  onComplete,
  autoRoll = false,
  finalResult,
}: DiceRollProps) {
  const [rolling, setRolling] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(20);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [hasRolled, setHasRolled] = useState(false);

  async function rollDice() {
    if (hasRolled) return;

    setRolling(true);
    setDisplayNumber(null);
    setHasRolled(true);

    // Use provided result or generate random
    const result = finalResult !== undefined ? finalResult : Math.floor(Math.random() * 20) + 1;

    // Animate rolling for 2 seconds
    const interval = setInterval(() => {
      setCurrentNumber(Math.floor(Math.random() * 20) + 1);
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      setCurrentNumber(result);
      setDisplayNumber(result);
      setRolling(false);

      // Pause for 2.5 seconds to let user see and appreciate the result
      setTimeout(() => {
        onComplete(result);
      }, 2500);
    }, 2000);
  }

  useEffect(() => {
    if (autoRoll && !hasRolled) {
      // Small delay before auto-rolling for dramatic effect
      setTimeout(() => {
        rollDice();
      }, 300);
    }
  }, [autoRoll, hasRolled]);

  const isCritical = displayNumber === 20;
  const isFail = displayNumber === 1;

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* D20 Display */}
      <div
        className={`
          relative w-40 h-40 bg-gradient-to-br from-blue-500 to-purple-600
          border-4 border-yellow-400 rounded-2xl shadow-[0_8px_0_0_rgba(0,0,0,0.4)]
          flex items-center justify-center
          transform transition-all duration-200
          ${rolling ? "animate-spin scale-110" : ""}
          ${isCritical ? "animate-pulse bg-gradient-to-br from-yellow-400 to-orange-500 scale-125 border-yellow-600" : ""}
          ${isFail ? "bg-gradient-to-br from-gray-600 to-gray-800 border-gray-500" : ""}
          ${displayNumber && !isCritical && !isFail ? "scale-110" : ""}
        `}
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}
      >
        <span
          className={`
            font-pixel text-7xl text-white drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)]
            ${rolling ? "animate-pulse" : ""}
            ${isCritical ? "animate-bounce" : ""}
          `}
        >
          {currentNumber}
        </span>

        {/* Sparkles for critical hit */}
        {isCritical && (
          <>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-ping"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${i * 45}deg) translateY(-80px)`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Result Message */}
      {displayNumber !== null && (
        <div className="mt-8 text-center animate-fade-in-up">
          {isCritical && (
            <div className="space-y-2">
              <p className="font-pixel text-4xl text-yellow-400 animate-bounce drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                ⭐ CRITICAL HIT! ⭐
              </p>
              <p className="font-retro text-xl text-yellow-200">
                Maximum damage incoming!
              </p>
            </div>
          )}
          {isFail && (
            <div className="space-y-2">
              <p className="font-pixel text-3xl text-gray-400 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                💀 CRITICAL FAIL 💀
              </p>
              <p className="font-retro text-lg text-gray-300">
                Still dealt base damage!
              </p>
            </div>
          )}
          {!isCritical && !isFail && (
            <div className="space-y-2">
              <p className="font-pixel text-3xl text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                You rolled: {displayNumber}
              </p>
              <p className="font-retro text-lg text-gray-300">
                {displayNumber >= 15
                  ? "Strong hit!"
                  : displayNumber >= 10
                  ? "Solid roll!"
                  : "Could be better..."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Roll Button (if not auto-rolling) */}
      {!autoRoll && !rolling && displayNumber === null && !hasRolled && (
        <button
          onClick={rollDice}
          className="mt-8 px-8 py-4 font-pixel text-xl bg-blue-600 hover:bg-blue-500 text-white border-4 border-blue-800 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] transition-all hover:translate-y-[-2px] hover:shadow-[4px_6px_0_0_rgba(0,0,0,0.4)]"
        >
          🎲 ROLL D20
        </button>
      )}

      {/* Rolling Status */}
      {rolling && (
        <p className="mt-6 font-retro text-lg text-blue-200 animate-pulse">
          Rolling...
        </p>
      )}
    </div>
  );
}
