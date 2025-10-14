"use client";

import { useState } from "react";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelButton from "@/components/ui/PixelButton";
import PixelBadge from "@/components/ui/PixelBadge";

interface WelcomeBackModalProps {
  daysMissed: number;
  healAmount: number;
  newHp: number;
  maxHp: number;
  onContinue: () => void;
  onAdjustGoals?: () => void;
}

export default function WelcomeBackModal({
  daysMissed,
  healAmount,
  newHp,
  maxHp,
  onContinue,
  onAdjustGoals,
}: WelcomeBackModalProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="max-w-2xl w-full">
        <PixelPanel variant="dialog">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="font-pixel text-3xl text-white mb-2">
              WELCOME BACK, WARRIOR!
            </h2>
            <p className="font-retro text-lg text-gray-300">
              We missed you! Life happens, and that&apos;s okay.
            </p>
          </div>

          {/* Days Missed */}
          <div className="mb-6 p-4 bg-blue-900/30 border-2 border-blue-500 rounded-lg">
            <p className="font-retro text-center text-blue-200">
              You&apos;ve been away for{" "}
              <span className="font-pixel text-xl text-blue-400">
                {daysMissed} {daysMissed === 1 ? "day" : "days"}
              </span>
            </p>
          </div>

          {/* Auto-Heal Notification */}
          <div className="mb-6 p-4 bg-green-900/30 border-2 border-green-500 rounded-lg">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-3xl">💚</span>
              <h3 className="font-pixel text-xl text-green-400">
                AUTO-HEAL ACTIVATED
              </h3>
            </div>
            <p className="font-retro text-center text-green-200">
              Restored <span className="font-pixel text-green-400">+{healAmount} HP</span>
            </p>
            <div className="mt-3 flex justify-center gap-2 items-center">
              <div className="font-retro text-sm text-gray-400">HP:</div>
              <div className="flex-1 max-w-xs bg-gray-800 border-2 border-gray-600 rounded-sm h-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                  style={{ width: `${(newHp / maxHp) * 100}%` }}
                />
              </div>
              <div className="font-pixel text-sm text-white">
                {newHp}/{maxHp}
              </div>
            </div>
          </div>

          {/* Catch-Up Bonuses */}
          <div className="mb-6 p-4 bg-purple-900/30 border-2 border-purple-500 rounded-lg">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-3xl">✨</span>
              <h3 className="font-pixel text-xl text-purple-400">
                CATCH-UP BONUSES
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <PixelBadge variant="success" size="sm">
                  3 DAYS
                </PixelBadge>
                <p className="font-retro text-sm text-purple-200">
                  <span className="font-pixel text-yellow-400">+5 Bonus Damage</span> on your next 3 check-ins
                </p>
              </div>
              <div className="flex items-center gap-3">
                <PixelBadge variant="info" size="sm">
                  3 DAYS
                </PixelBadge>
                <p className="font-retro text-sm text-purple-200">
                  <span className="font-pixel text-blue-400">50% Less</span> counterattack damage
                </p>
              </div>
            </div>
          </div>

          {/* Details Toggle */}
          {!showDetails ? (
            <button
              onClick={() => setShowDetails(true)}
              className="w-full mb-4 font-retro text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              ℹ️ How does this work?
            </button>
          ) : (
            <div className="mb-6 p-4 bg-gray-800/50 border-2 border-gray-600 rounded-lg">
              <h4 className="font-pixel text-sm text-gray-300 mb-2">
                HOW IT WORKS
              </h4>
              <ul className="space-y-2 font-retro text-xs text-gray-400">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong className="text-gray-300">Auto-Heal:</strong> We restored your HP to help you get back in the fight
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong className="text-gray-300">Bonus Damage:</strong> Extra damage helps you catch up with your party
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong className="text-gray-300">Protection:</strong> Reduced counterattacks give you a safe re-entry
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong className="text-gray-300">No Penalties:</strong> There&apos;s never shame for taking time off
                  </span>
                </li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {onAdjustGoals && (
              <PixelButton
                onClick={onAdjustGoals}
                variant="secondary"
                size="md"
                className="flex-1"
              >
                ⚙️ ADJUST GOALS
              </PixelButton>
            )}
            <PixelButton
              onClick={onContinue}
              variant="success"
              size="lg"
              className="flex-1"
            >
              ⚔️ LET&apos;S GO!
            </PixelButton>
          </div>

          {/* Supportive Message */}
          <div className="mt-4 text-center">
            <p className="font-retro text-xs text-gray-400">
              Remember: Consistency beats perfection. Welcome back to the quest! 🎮
            </p>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
