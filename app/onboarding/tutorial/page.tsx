"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

interface TutorialSlide {
  title: string;
  icon: string;
  content: React.ReactNode;
}

export default function TutorialPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: TutorialSlide[] = [
    {
      title: "WELCOME TO FITNESS QUEST",
      icon: "⚔️",
      content: (
        <div className="space-y-4 text-gray-200">
          <p className="text-xl font-retro text-center text-yellow-300">
            Turn your fitness goals into an epic adventure!
          </p>
          <p className="font-retro">
            You and your party will battle monsters together by checking in daily
            with your fitness progress. Every check-in is an attack, every goal met
            makes you stronger, and every party member matters!
          </p>
          <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-purple-500/30">
            <p className="font-retro text-sm text-purple-300">
              💡 <strong>Key Concept:</strong> This is about consistency and teamwork,
              not competition. Everyone contributes equally regardless of their starting
              point or goals!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "DAILY CHECK-INS",
      icon: "📋",
      content: (
        <div className="space-y-4 text-gray-200">
          <p className="font-retro">
            Every evening (6 PM - Midnight), you&apos;ll check in with your daily progress:
          </p>
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-green-500">
              <div className="font-pixel text-green-400 mb-1">✓ REPORT YOUR PROGRESS</div>
              <p className="text-sm font-retro">
                Enter your actual values for each goal (weight, cardio, steps, etc.)
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-blue-500">
              <div className="font-pixel text-blue-400 mb-1">🎲 ROLL FOR ATTACK</div>
              <p className="text-sm font-retro">
                The system rolls a d20 die + bonuses to see if you hit the monster
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-red-500">
              <div className="font-pixel text-red-400 mb-1">💥 DEAL DAMAGE</div>
              <p className="text-sm font-retro">
                Hit or miss, you ALWAYS deal 3-5 base damage. Effort always counts!
              </p>
            </div>
          </div>
          <div className="bg-yellow-900/30 rounded-lg p-3 border-2 border-yellow-500/50">
            <p className="text-sm font-retro text-yellow-200">
              ⏱️ Takes less than 2 minutes! Eventually 30 seconds with fitness tracker sync.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "GOALS & ATTACK BONUSES",
      icon: "🎯",
      content: (
        <div className="space-y-4 text-gray-200">
          <p className="font-retro">
            Your goals determine your attack bonuses. More goals met = stronger attacks!
          </p>
          <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-yellow-500/30">
            <div className="font-pixel text-yellow-400 mb-3">ATTACK BONUS CALCULATION:</div>
            <div className="space-y-2 text-sm font-retro">
              <div className="flex justify-between">
                <span>Each goal met:</span>
                <span className="text-green-400 font-bold">+1 bonus</span>
              </div>
              <div className="flex justify-between">
                <span>3+ day streak:</span>
                <span className="text-blue-400 font-bold">+2 bonus</span>
              </div>
              <div className="flex justify-between">
                <span>Party momentum (others checked in):</span>
                <span className="text-purple-400 font-bold">+1-2 bonus</span>
              </div>
              <div className="flex justify-between">
                <span>Below 50 HP (underdog):</span>
                <span className="text-red-400 font-bold">+2 bonus</span>
              </div>
            </div>
          </div>
          <div className="bg-purple-900/30 rounded-lg p-3 border-2 border-purple-500/50">
            <p className="text-sm font-retro text-purple-200">
              💚 <strong>Rest Days:</strong> Mark a goal as &quot;Rest Day&quot; and it counts as met!
              Healthy rest is rewarded, not punished.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "XP & LEVELING UP",
      icon: "⭐",
      content: (
        <div className="space-y-4 text-gray-200">
          <p className="font-retro">
            Every check-in earns you XP. Level up to become stronger and unlock new abilities!
          </p>
          <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-purple-500/30">
            <div className="font-pixel text-purple-400 mb-3">EARNING XP:</div>
            <div className="space-y-2 text-sm font-retro">
              <div className="flex justify-between">
                <span>Daily check-in:</span>
                <span className="text-yellow-400 font-bold">+10 XP</span>
              </div>
              <div className="flex justify-between">
                <span>Each goal met:</span>
                <span className="text-yellow-400 font-bold">+2 XP</span>
              </div>
              <div className="flex justify-between">
                <span>Defeat Glass Cannon monster:</span>
                <span className="text-yellow-400 font-bold">+50 XP</span>
              </div>
              <div className="flex justify-between">
                <span>Defeat Balanced monster:</span>
                <span className="text-yellow-400 font-bold">+75 XP</span>
              </div>
              <div className="flex justify-between">
                <span>Defeat Tank monster:</span>
                <span className="text-yellow-400 font-bold">+100 XP</span>
              </div>
            </div>
          </div>
          <div className="bg-yellow-900/30 rounded-lg p-3 border-2 border-yellow-500/50">
            <p className="text-sm font-retro text-yellow-200">
              🌟 <strong>Level Up Benefits:</strong> Each level grants 1 skill point to spend
              on permanent stat boosts and special abilities!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "STREAKS & CONSISTENCY",
      icon: "🔥",
      content: (
        <div className="space-y-4 text-gray-200">
          <p className="font-retro">
            Check in daily to build your streak. Longer streaks = bigger bonuses!
          </p>
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-orange-500">
              <div className="font-pixel text-orange-400 mb-1">🔥 STREAK BENEFITS</div>
              <div className="text-sm font-retro space-y-1">
                <p>• +2 attack bonus at 3+ day streak</p>
                <p>• +5 defense per consecutive day (max +25)</p>
                <p>• Unlock SUPPORT action at 3 days</p>
                <p>• Unlock HEROIC STRIKE at 7 days</p>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-red-500">
              <div className="font-pixel text-red-400 mb-1">💔 BREAKING STREAKS</div>
              <div className="text-sm font-retro space-y-1">
                <p>• Streak resets to 0</p>
                <p>• Lose all focus points</p>
                <p>• Defense resets to 0</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-900/30 rounded-lg p-3 border-2 border-blue-500/50">
            <p className="text-sm font-retro text-blue-200">
              🎁 <strong>Welcome Back System:</strong> Been gone 3+ days? Get bonus HP,
              reduced counterattacks, and catch-up damage for your next 3 check-ins!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "FOCUS & COMBAT ACTIONS",
      icon: "⚡",
      content: (
        <div className="space-y-4 text-gray-200">
          <p className="font-retro">
            Earn focus points to unlock powerful combat actions!
          </p>
          <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-blue-500/30 mb-4">
            <div className="font-pixel text-blue-400 mb-2">FOCUS GENERATION:</div>
            <div className="text-sm font-retro space-y-1">
              <p>• Start with 5 focus points</p>
              <p>• Earn +2 focus per check-in</p>
              <p>• Earn +1 focus per goal met</p>
              <p>• Maximum 10 focus (prevents hoarding)</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-red-900/30 rounded-lg p-2 border-l-4 border-red-500">
              <div className="text-xs font-pixel text-red-300">⚔️ ATTACK (Free)</div>
              <p className="text-xs font-retro">Standard attack, guaranteed base damage</p>
            </div>
            <div className="bg-blue-900/30 rounded-lg p-2 border-l-4 border-blue-500">
              <div className="text-xs font-pixel text-blue-300">🛡️ DEFEND (Costs 1 Focus)</div>
              <p className="text-xs font-retro">50% damage, +5 defense to all party members</p>
            </div>
            <div className="bg-green-900/30 rounded-lg p-2 border-l-4 border-green-500">
              <div className="text-xs font-pixel text-green-300">💚 SUPPORT (Costs 2 Focus, 3-day streak)</div>
              <p className="text-xs font-retro">50% damage, heal teammate +10 HP</p>
            </div>
            <div className="bg-yellow-900/30 rounded-lg p-2 border-l-4 border-yellow-500">
              <div className="text-xs font-pixel text-yellow-300">⚡ HEROIC STRIKE (Costs 3 Focus, 7-day streak)</div>
              <p className="text-xs font-retro">Auto-hit, double damage</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "PARTY COOPERATION",
      icon: "👥",
      content: (
        <div className="space-y-4 text-gray-200">
          <p className="font-retro">
            This is a team game! Your party succeeds or fails together.
          </p>
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-purple-500">
              <div className="font-pixel text-purple-400 mb-1">👥 PARTY MOMENTUM</div>
              <p className="text-sm font-retro">
                When you check in after teammates, you get +1-2 attack bonus.
                Their energy motivates you!
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-green-500">
              <div className="font-pixel text-green-400 mb-1">👍 ENCOURAGEMENTS</div>
              <p className="text-sm font-retro">
                Send encouragement to give teammates +5 defense. Help protect
                those who need it most!
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-blue-500">
              <div className="font-pixel text-blue-400 mb-1">🛡️ DEFEND ACTION</div>
              <p className="text-sm font-retro">
                Using DEFEND gives +5 defense to ALL party members, not just you!
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-red-500">
              <div className="font-pixel text-red-400 mb-1">💚 SUPPORT ACTION</div>
              <p className="text-sm font-retro">
                Heal injured teammates to keep everyone in fighting shape!
              </p>
            </div>
          </div>
          <div className="bg-purple-900/30 rounded-lg p-3 border-2 border-purple-500/50">
            <p className="text-sm font-retro text-purple-200">
              🎯 <strong>No Competition:</strong> Different goals contribute equally.
              A beginner&apos;s progress helps as much as an athlete&apos;s!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "DEFENSE & HP",
      icon: "🛡️",
      content: (
        <div className="space-y-4 text-gray-200">
          <p className="font-retro">
            Monsters can counterattack! Build defense to protect yourself.
          </p>
          <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-blue-500/30 mb-3">
            <div className="font-pixel text-blue-400 mb-2">DEFENSE BUILDING:</div>
            <div className="text-sm font-retro space-y-1">
              <p>• +5 defense per consecutive check-in day (max +25)</p>
              <p>• +5 defense per encouragement received (max +25)</p>
              <p>• Maximum defense: 50</p>
              <p>• Higher defense = less counterattack chance</p>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-red-500/30">
            <div className="font-pixel text-red-400 mb-2">HEALTH POINTS:</div>
            <div className="text-sm font-retro space-y-1">
              <p>• Everyone starts with 100 HP</p>
              <p>• Monster counterattacks deal 5-15 damage</p>
              <p>• Heal +5 HP per check-in (natural healing)</p>
              <p>• Low HP (&lt;50) gives +2 underdog bonus</p>
              <p>• Reaching 0 HP = mission failed (party restarts)</p>
            </div>
          </div>
          <div className="bg-orange-900/30 rounded-lg p-3 border-2 border-orange-500/50 mt-3">
            <p className="text-sm font-retro text-orange-200">
              🔥 <strong>Strategy Tip:</strong> Use DEFEND when party HP is low,
              use SUPPORT to heal critical teammates!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "MONSTERS & VICTORY",
      icon: "👹",
      content: (
        <div className="space-y-4 text-gray-200">
          <p className="font-retro">
            Your party picks one monster at a time to battle together.
          </p>
          <div className="space-y-2">
            <div className="bg-blue-900/40 rounded-lg p-3 border-2 border-blue-400">
              <div className="font-pixel text-blue-300 mb-1">🛡️ TANK</div>
              <p className="text-xs font-retro">High HP, high AC - Hard to hit and kill. +100 XP reward.</p>
            </div>
            <div className="bg-purple-900/40 rounded-lg p-3 border-2 border-purple-400">
              <div className="font-pixel text-purple-300 mb-1">⚖️ BALANCED</div>
              <p className="text-xs font-retro">Medium HP, medium AC - Standard challenge. +75 XP reward.</p>
            </div>
            <div className="bg-red-900/40 rounded-lg p-3 border-2 border-red-400">
              <div className="font-pixel text-red-300 mb-1">⚔️ GLASS CANNON</div>
              <p className="text-xs font-retro">Low HP, low AC - Easy to kill. +50 XP reward.</p>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-yellow-500/30">
            <div className="font-pixel text-yellow-400 mb-2">VICTORY REWARDS:</div>
            <div className="text-sm font-retro space-y-1">
              <p>• Everyone gets full HP restore</p>
              <p>• Party shares XP based on monster type</p>
              <p>• Possible badge unlocks</p>
              <p>• Celebration screen with stats</p>
            </div>
          </div>
          <div className="bg-green-900/30 rounded-lg p-3 border-2 border-green-500/50">
            <p className="text-sm font-retro text-green-200">
              🎉 <strong>Victory Milestones:</strong> Celebrate when monster reaches 75%, 50%, and 25% HP!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "READY TO BEGIN!",
      icon: "🚀",
      content: (
        <div className="space-y-6 text-gray-200">
          <p className="text-xl font-retro text-center text-yellow-300">
            You&apos;re all set to start your fitness adventure!
          </p>
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-lg p-6 border-4 border-yellow-500">
            <div className="font-pixel text-yellow-400 text-center mb-4 text-lg">
              YOUR QUEST BEGINS NOW:
            </div>
            <div className="space-y-3 text-sm font-retro">
              <div className="flex items-start gap-3">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <p className="font-bold text-yellow-300">Set Your Goals</p>
                  <p className="text-gray-300">Choose goals that match your fitness journey</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <p className="font-bold text-yellow-300">Join or Create a Party</p>
                  <p className="text-gray-300">Find 2-8 friends to adventure with you</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <p className="font-bold text-yellow-300">Pick Your First Monster</p>
                  <p className="text-gray-300">Start with Glass Cannon for an easier first battle</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">4️⃣</span>
                <div>
                  <p className="font-bold text-yellow-300">Check In Daily</p>
                  <p className="text-gray-300">Every evening, report your progress and attack!</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-900/30 rounded-lg p-4 border-2 border-blue-500/50 text-center">
            <p className="text-sm font-retro text-blue-200">
              💡 <strong>Remember:</strong> Consistency beats perfection. Show up every day,
              support your party, and celebrate progress together!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleFinish = async () => {
    // Update user's onboarding step to 'goals'
    try {
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          onboardingStep: "goals",
        }),
      });
      router.push("/onboarding/goals");
    } catch (error) {
      console.error("Error updating onboarding step:", error);
      router.push("/onboarding/goals");
    }
  };

  const currentSlideData = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="max-w-4xl w-full mx-auto">
        {/* Onboarding progress */}
        <OnboardingProgress currentStep="tutorial" />

        {/* Tutorial progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-retro text-gray-300">
              Tutorial Progress
            </span>
            <span className="text-sm font-pixel text-yellow-400">
              {currentSlide + 1} / {slides.length}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 border-2 border-gray-700">
            <div
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tutorial content */}
        <PixelPanel variant="dialog">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">{currentSlideData.icon}</div>
            <h1 className="font-pixel text-3xl text-yellow-400 drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)]">
              {currentSlideData.title}
            </h1>
          </div>

          <div className="min-h-[400px] mb-6">{currentSlideData.content}</div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center gap-4">
            <PixelButton
              variant="secondary"
              size="md"
              onClick={handlePrev}
              disabled={currentSlide === 0}
            >
              ← PREVIOUS
            </PixelButton>

            {currentSlide === slides.length - 1 ? (
              <PixelButton
                variant="success"
                size="lg"
                onClick={handleFinish}
              >
                START YOUR QUEST! 🚀
              </PixelButton>
            ) : (
              <PixelButton variant="primary" size="md" onClick={handleNext}>
                NEXT →
              </PixelButton>
            )}
          </div>

          {/* Skip option */}
          {currentSlide < slides.length - 1 && (
            <div className="mt-4 text-center">
              <button
                onClick={handleFinish}
                className="text-sm font-retro text-gray-400 hover:text-gray-300 underline"
              >
                Skip tutorial
              </button>
            </div>
          )}
        </PixelPanel>
      </div>
    </div>
  );
}
