import React from 'react';

interface OnboardingProgressProps {
  currentStep: 'character' | 'goals' | 'party';
}

const steps = [
  { key: 'character', label: 'Character', emoji: '⚔️' },
  { key: 'goals', label: 'Goals', emoji: '🎯' },
  { key: 'party', label: 'Party', emoji: '👥' },
];

export default function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-700 -z-10">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div
                className={`
                  w-12 h-12 rounded-full border-4 flex items-center justify-center text-2xl
                  transition-all duration-300
                  ${
                    isComplete
                      ? 'bg-green-500 border-green-400 scale-110'
                      : isCurrent
                      ? 'bg-blue-500 border-blue-400 scale-125 animate-pulse'
                      : 'bg-gray-800 border-gray-700'
                  }
                `}
              >
                {isComplete ? '✓' : step.emoji}
              </div>
              <span
                className={`
                  mt-2 text-sm font-bold uppercase tracking-wider
                  ${isCurrent ? 'text-blue-400' : isComplete ? 'text-green-400' : 'text-gray-500'}
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
