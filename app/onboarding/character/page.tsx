'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import DetailedPixelCharacter, {
  CharacterCustomization,
} from '@/app/components/DetailedPixelCharacter';
import PixelButton from '@/components/ui/PixelButton';
import PixelInput from '@/components/ui/PixelInput';

const BODY_TYPES = ['SLIM', 'AVERAGE', 'MUSCULAR', 'BULKY'] as const;
const HAIR_STYLES = ['BALD', 'SHORT', 'MEDIUM', 'LONG', 'PONYTAIL', 'MOHAWK', 'AFRO'] as const;
const FACIAL_HAIR = ['NONE', 'STUBBLE', 'MUSTACHE', 'GOATEE', 'BEARD'] as const;
const OUTFITS = ['CASUAL', 'ATHLETIC', 'ARMOR', 'KNIGHT', 'NINJA', 'WIZARD'] as const;

const SKIN_COLORS = [
  { name: 'Light', value: '#fbbf24' },
  { name: 'Tan', value: '#d97706' },
  { name: 'Medium', value: '#92400e' },
  { name: 'Dark', value: '#451a03' },
  { name: 'Pale', value: '#fef3c7' },
  { name: 'Olive', value: '#a16207' },
];

const HAIR_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Brown', value: '#92400e' },
  { name: 'Blonde', value: '#fbbf24' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'White', value: '#f3f4f6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
];

const OUTFIT_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Black', value: '#1f2937' },
  { name: 'White', value: '#f9fafb' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Yellow', value: '#eab308' },
];

export default function CharacterOnboardingPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [characterName, setCharacterName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [customization, setCustomization] = useState<CharacterCustomization>({
    bodyType: 'AVERAGE',
    skinColor: '#fbbf24',
    hairStyle: 'SHORT',
    hairColor: '#92400e',
    facialHair: 'NONE',
    outfit: 'CASUAL',
    outfitColor: '#3b82f6',
    accessoryColor: '#9ca3af',
  });

  const [previewAnimation, setPreviewAnimation] = useState<'idle' | 'attack' | 'victory'>('idle');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  async function handleContinue() {
    if (!characterName.trim()) {
      setError('Please enter a character name');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Save character appearance
      const appearanceResponse = await fetch('/api/character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(customization),
      });

      if (!appearanceResponse.ok) {
        throw new Error('Failed to save character appearance');
      }

      // Update character name and onboarding step
      const userResponse = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          characterName: characterName.trim(),
          onboardingStep: 'goals',
        }),
      });

      if (!userResponse.ok) {
        throw new Error('Failed to update character name');
      }

      // Proceed to goals step
      router.push('/onboarding/goals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save character');
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

      <div className="max-w-6xl mx-auto relative z-10">
        <OnboardingProgress currentStep="character" />

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3 font-pixel">
            ⚔️ CREATE YOUR HERO
          </h1>
          <p className="text-xl text-gray-300 font-retro">
            Design your character and begin your fitness adventure
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/50 border-4 border-red-500 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-red-200 font-bold text-center">⚠️ {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Preview */}
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-4 border-purple-500/50 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center font-pixel">
              CHARACTER PREVIEW
            </h2>
            <div className="flex justify-center items-center bg-gradient-to-b from-purple-900/50 to-indigo-900/50 rounded-lg p-8 min-h-[400px]">
              <DetailedPixelCharacter
                customization={customization}
                size={280}
                animationState={previewAnimation}
                className="drop-shadow-2xl"
              />
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPreviewAnimation('idle')}
                className={`px-4 py-2 rounded-md font-retro ${
                  previewAnimation === 'idle'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Idle
              </button>
              <button
                onClick={() => setPreviewAnimation('attack')}
                className={`px-4 py-2 rounded-md font-retro ${
                  previewAnimation === 'attack'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Attack
              </button>
              <button
                onClick={() => setPreviewAnimation('victory')}
                className={`px-4 py-2 rounded-md font-retro ${
                  previewAnimation === 'victory'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Victory
              </button>
            </div>

            {/* Character Name */}
            <div className="mt-6">
              <PixelInput
                label="CHARACTER NAME"
                id="characterName"
                name="characterName"
                type="text"
                required
                placeholder="Enter your hero's name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                helperText="This is your character's name in the game world"
                className="bg-gray-800 text-white"
              />
            </div>
          </div>

          {/* Customization Options */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {/* Body Type */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-2 border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-white mb-3 font-pixel">BODY TYPE</h3>
              <div className="grid grid-cols-4 gap-2">
                {BODY_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setCustomization({ ...customization, bodyType: type })}
                    className={`px-3 py-2 rounded-md text-sm font-retro ${
                      customization.bodyType === type
                        ? 'bg-purple-600 text-white border-2 border-purple-400'
                        : 'bg-gray-700 text-gray-300 border-2 border-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Skin Color */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-2 border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-white mb-3 font-pixel">SKIN TONE</h3>
              <div className="grid grid-cols-6 gap-3">
                {SKIN_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setCustomization({ ...customization, skinColor: color.value })}
                    className={`w-12 h-12 rounded-full border-4 transition-transform ${
                      customization.skinColor === color.value
                        ? 'border-purple-400 scale-110'
                        : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-2 border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-white mb-3 font-pixel">HAIR STYLE</h3>
              <div className="grid grid-cols-4 gap-2">
                {HAIR_STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => setCustomization({ ...customization, hairStyle: style })}
                    className={`px-2 py-2 rounded-md text-xs font-retro ${
                      customization.hairStyle === style
                        ? 'bg-purple-600 text-white border-2 border-purple-400'
                        : 'bg-gray-700 text-gray-300 border-2 border-gray-600'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-2 border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-white mb-3 font-pixel">HAIR COLOR</h3>
              <div className="grid grid-cols-6 gap-3">
                {HAIR_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setCustomization({ ...customization, hairColor: color.value })}
                    className={`w-12 h-12 rounded-full border-4 transition-transform ${
                      customization.hairColor === color.value
                        ? 'border-purple-400 scale-110'
                        : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Facial Hair */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-2 border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-white mb-3 font-pixel">FACIAL HAIR</h3>
              <div className="grid grid-cols-5 gap-2">
                {FACIAL_HAIR.map((style) => (
                  <button
                    key={style}
                    onClick={() => setCustomization({ ...customization, facialHair: style })}
                    className={`px-2 py-2 rounded-md text-xs font-retro ${
                      customization.facialHair === style
                        ? 'bg-purple-600 text-white border-2 border-purple-400'
                        : 'bg-gray-700 text-gray-300 border-2 border-gray-600'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Outfit */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-2 border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-white mb-3 font-pixel">OUTFIT</h3>
              <div className="grid grid-cols-3 gap-2">
                {OUTFITS.map((outfit) => (
                  <button
                    key={outfit}
                    onClick={() => setCustomization({ ...customization, outfit })}
                    className={`px-3 py-2 rounded-md text-sm font-retro ${
                      customization.outfit === outfit
                        ? 'bg-purple-600 text-white border-2 border-purple-400'
                        : 'bg-gray-700 text-gray-300 border-2 border-gray-600'
                    }`}
                  >
                    {outfit}
                  </button>
                ))}
              </div>
            </div>

            {/* Outfit Color */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-2 border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-white mb-3 font-pixel">OUTFIT COLOR</h3>
              <div className="grid grid-cols-6 gap-3">
                {OUTFIT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() =>
                      setCustomization({ ...customization, outfitColor: color.value })
                    }
                    className={`w-12 h-12 rounded-full border-4 transition-transform ${
                      customization.outfitColor === color.value
                        ? 'border-purple-400 scale-110'
                        : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <PixelButton
            onClick={handleContinue}
            disabled={saving || !characterName.trim()}
            variant="success"
            size="lg"
          >
            {saving ? '⏳ SAVING...' : '▶ CONTINUE TO GOALS'}
          </PixelButton>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.8);
        }
      `}</style>
    </div>
  );
}
