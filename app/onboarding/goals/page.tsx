'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import PixelButton from '@/components/ui/PixelButton';
import PixelInput from '@/components/ui/PixelInput';

const GOAL_TYPES = [
  { value: 'CARDIO', label: 'Cardio', icon: '🏃', unit: 'minutes', placeholder: '30' },
  { value: 'STRENGTH', label: 'Strength Training', icon: '💪', unit: 'minutes', placeholder: '45' },
  { value: 'WEIGHT', label: 'Weight Goal', icon: '⚖️', unit: 'lbs', placeholder: '150' },
  { value: 'PROTEIN', label: 'Protein Intake', icon: '🥩', unit: 'grams', placeholder: '120' },
  { value: 'SLEEP', label: 'Sleep', icon: '😴', unit: 'hours', placeholder: '8' },
  { value: 'CUSTOM', label: 'Custom Goal', icon: '🎯', unit: '', placeholder: 'Your goal' },
];

const MEASUREMENT_TYPES = [
  {
    value: 'TARGET_VALUE',
    label: 'Exceed a daily target',
    example: 'e.g., Exceed the number of steps',
    description: 'Meet or exceed a specific target value',
  },
  {
    value: 'UNDER_LIMIT',
    label: 'Stay under a limit',
    example: 'e.g., Stay under a calorie limit',
    description: 'Stay below a maximum value',
  },
  {
    value: 'BOOLEAN',
    label: 'Complete a habit',
    example: 'e.g., Take your vitamins',
    description: 'Simple yes/no - did you do it?',
  },
  {
    value: 'PROGRESS_TRACKING',
    label: 'Track your progress',
    example: 'e.g., Weigh yourself and enter it',
    description: 'Any entry counts as success - rewards tracking',
  },
];

export default function GoalsOnboardingPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('');
  const [measurementType, setMeasurementType] = useState<string>('TARGET_VALUE');
  const [goalName, setGoalName] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const selectedGoalType = GOAL_TYPES.find((g) => g.value === selectedType);

  useEffect(() => {
    if (selectedGoalType && selectedGoalType.value !== 'CUSTOM') {
      setGoalName(selectedGoalType.label);
      setTargetUnit(selectedGoalType.unit);
    } else if (selectedGoalType && selectedGoalType.value === 'CUSTOM') {
      setGoalName('');
      setTargetUnit('');
    }
  }, [selectedType]);

  async function handleCreateGoal() {
    if (!selectedType) {
      setError('Please select a goal type');
      return;
    }

    if (!goalName.trim()) {
      setError('Please enter a goal name');
      return;
    }

    // BOOLEAN goals don't need target values
    if (measurementType !== 'BOOLEAN') {
      if (!targetValue || parseFloat(targetValue) <= 0) {
        setError('Please enter a valid target value');
        return;
      }
    }

    setSaving(true);
    setError('');

    try {
      // Create the goal
      const goalResponse = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goalType: selectedType,
          goalMeasurementType: measurementType,
          name: goalName.trim(),
          targetValue: measurementType === 'BOOLEAN' ? null : parseFloat(targetValue),
          targetUnit: measurementType === 'BOOLEAN' ? null : (targetUnit || 'units'),
        }),
      });

      if (!goalResponse.ok) {
        throw new Error('Failed to create goal');
      }

      // Update onboarding step
      const userResponse = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          onboardingStep: 'party',
        }),
      });

      if (!userResponse.ok) {
        throw new Error('Failed to update onboarding progress');
      }

      // Proceed to party step
      router.push('/onboarding/party');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center game-bg">
        <p className="text-white font-retro">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen game-bg pixel-grid-bg py-12 px-4">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: i % 5 === 0 ? '3px' : '2px',
              height: i % 5 === 0 ? '3px' : '2px',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <OnboardingProgress currentStep="goals" />

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3 font-pixel">
            🎯 SET YOUR FIRST GOAL
          </h1>
          <p className="text-xl text-gray-300 font-retro mb-2">
            Set your goal now to set yourself up for success later
          </p>
          <p className="text-md text-gray-400 font-retro">
            Research shows that people who set specific goals are 10x more likely to achieve them
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/50 border-4 border-red-500 rounded-lg p-4">
            <p className="text-red-200 font-bold text-center">⚠️ {error}</p>
          </div>
        )}

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-4 border-blue-500/50 p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 font-pixel">
              CHOOSE YOUR GOAL TYPE
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {GOAL_TYPES.map((goalType) => (
                <button
                  key={goalType.value}
                  onClick={() => setSelectedType(goalType.value)}
                  className={`p-4 rounded-lg border-4 transition-all ${
                    selectedType === goalType.value
                      ? 'bg-blue-600 border-blue-400 scale-105'
                      : 'bg-gray-800 border-gray-700 hover:border-blue-500'
                  }`}
                >
                  <div className="text-4xl mb-2">{goalType.icon}</div>
                  <div className="text-white font-bold font-retro text-sm">
                    {goalType.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedType && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-t-4 border-gray-700 pt-6">
                <h3 className="text-xl font-bold text-white mb-4 font-pixel">
                  HOW DO YOU MEASURE SUCCESS?
                </h3>

                <div className="space-y-3 mb-6">
                  {MEASUREMENT_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        measurementType === type.value
                          ? 'bg-blue-900/50 border-blue-400'
                          : 'bg-gray-800/50 border-gray-700 hover:border-blue-500/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="measurementType"
                        value={type.value}
                        checked={measurementType === type.value}
                        onChange={(e) => setMeasurementType(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-white font-bold font-retro text-sm">
                          {type.label}
                        </div>
                        <div className="text-gray-400 font-retro text-xs mt-1">
                          {type.example}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <h3 className="text-xl font-bold text-white mb-4 font-pixel">
                  GOAL DETAILS
                </h3>

                {selectedType === 'CUSTOM' && (
                  <div className="mb-4">
                    <PixelInput
                      label="GOAL NAME"
                      id="goalName"
                      name="goalName"
                      type="text"
                      required
                      placeholder="e.g., Daily Steps, Water Intake"
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      className="bg-gray-800 text-white"
                    />
                  </div>
                )}

                {measurementType !== 'BOOLEAN' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PixelInput
                      label="TARGET VALUE"
                      id="targetValue"
                      name="targetValue"
                      type="number"
                      required
                      placeholder={selectedGoalType?.placeholder || '0'}
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="bg-gray-800 text-white"
                    />

                    {selectedType === 'CUSTOM' && (
                      <PixelInput
                        label="UNIT"
                        id="targetUnit"
                        name="targetUnit"
                        type="text"
                        required
                        placeholder="e.g., steps, glasses"
                        value={targetUnit}
                        onChange={(e) => setTargetUnit(e.target.value)}
                        className="bg-gray-800 text-white"
                      />
                    )}

                    {selectedType !== 'CUSTOM' && (
                      <div>
                        <label className="block font-bold text-sm uppercase tracking-wider mb-2 text-white">
                          UNIT
                        </label>
                        <div className="px-4 py-3 bg-gray-800 border-4 border-gray-700 rounded-sm text-white font-retro">
                          {selectedGoalType?.unit}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {measurementType === 'BOOLEAN' && (
                  <div className="p-4 bg-green-900/30 border-2 border-green-500/50 rounded-lg">
                    <p className="text-green-200 font-retro text-sm">
                      ✓ <strong>Habit Goal:</strong> No target value needed - just check it off daily!
                    </p>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-900/30 border-2 border-blue-500/50 rounded-lg">
                  <p className="text-blue-200 font-retro text-sm">
                    💡 <strong>Pro Tip:</strong> Your goal should be challenging but achievable.
                    You can always adjust it later!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <PixelButton
            onClick={() => router.push('/onboarding/character')}
            variant="secondary"
            size="md"
            disabled={saving}
          >
            ← BACK
          </PixelButton>

          <PixelButton
            onClick={handleCreateGoal}
            disabled={
              saving ||
              !selectedType ||
              !goalName.trim() ||
              (measurementType !== 'BOOLEAN' && !targetValue)
            }
            variant="success"
            size="lg"
          >
            {saving ? '⏳ SAVING...' : '▶ CONTINUE TO PARTY'}
          </PixelButton>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
