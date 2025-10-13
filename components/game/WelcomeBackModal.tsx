"use client";

import { useEffect, useState } from "react";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelButton from "@/components/ui/PixelButton";

interface WelcomeBackModalProps {
  daysAbsent: number;
  hpRestored: number;
  bonuses: {
    reducedCounterattack: boolean;
    catchUpDamage: number;
    daysRemaining: number;
  };
  onClose: () => void;
}

export default function WelcomeBackModal({
  daysAbsent,
  hpRestored,
  bonuses,
  onClose,
}: WelcomeBackModalProps) {
  const [revealStep, setRevealStep] = useState(0);

  useEffect(() => {
    if (revealStep < 3) {
      const timer = setTimeout(() => {
        setRevealStep((prev) => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [revealStep]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="max-w-2xl w-full">
        <PixelPanel variant="menu" className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-3xl font-pixel text-yellow-400">
              ⭐ WELCOME BACK! ⭐
            </h1>
            <p className="font-retro text-xl text-gray-300">
              We missed you! You were gone for {daysAbsent} days.
            </p>
            <p className="font-retro text-lg text-blue-300">
              To help you get back in the fight, we&apos;ve prepared some bonuses!
            </p>
          </div>

          {/* HP Restoration */}
          {revealStep >= 1 && (
            <div className="animate-fade-in-up">
              <PixelPanel variant="menu" title="💚 HP RESTORED">
                <div className="text-center space-y-2">
                  <div className="text-5xl font-pixel text-green-400">
                    +{hpRestored} HP
                  </div>
                  <p className="font-retro text-gray-300">
                    You&apos;ve been healed to help you continue the quest!
                  </p>
                </div>
              </PixelPanel>
            </div>
          )}

          {/* Catch-Up Bonuses */}
          {revealStep >= 2 && (
            <div className="animate-fade-in-up">
              <PixelPanel variant="menu" title="⚡ CATCH-UP BONUSES">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-purple-900/30 rounded-lg border-2 border-purple-500">
                    <div className="text-2xl">⚔️</div>
                    <div className="flex-1">
                      <div className="font-pixel text-sm text-purple-300">
                        BONUS DAMAGE
                      </div>
                      <p className="font-retro text-gray-300">
                        Deal +{bonuses.catchUpDamage} extra damage for the next{" "}
                        {bonuses.daysRemaining} check-ins
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-900/30 rounded-lg border-2 border-blue-500">
                    <div className="text-2xl">🛡️</div>
                    <div className="flex-1">
                      <div className="font-pixel text-sm text-blue-300">
                        REDUCED COUNTERATTACKS
                      </div>
                      <p className="font-retro text-gray-300">
                        Monster counterattack chance reduced by 50% for the next{" "}
                        {bonuses.daysRemaining} check-ins
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-amber-900/30 rounded-lg border-2 border-amber-500">
                    <div className="text-2xl">⏱️</div>
                    <div className="flex-1">
                      <div className="font-pixel text-sm text-amber-300">
                        LIMITED TIME
                      </div>
                      <p className="font-retro text-gray-300">
                        These bonuses last for {bonuses.daysRemaining} check-ins - make them
                        count!
                      </p>
                    </div>
                  </div>
                </div>
              </PixelPanel>
            </div>
          )}

          {/* Action Button */}
          {revealStep >= 3 && (
            <div className="animate-fade-in text-center">
              <PixelButton onClick={onClose} variant="primary" size="lg">
                🎮 LET&apos;S GO!
              </PixelButton>
              <p className="font-retro text-sm text-gray-400 mt-3">
                Your party needs you! Time to jump back into the action.
              </p>
            </div>
          )}
        </PixelPanel>
      </div>
    </div>
  );
}
