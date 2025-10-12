'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import DetailedPixelCharacter, {
  CharacterCustomization,
} from '@/app/components/DetailedPixelCharacter';

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

export default function CharacterCustomizationPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (user && token) {
      fetchCharacterAppearance();
    }
  }, [user, token]);

  async function fetchCharacterAppearance() {
    try {
      const response = await fetch('/api/character', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data.appearance) {
        setCustomization(data.data.appearance);
      }
    } catch (err) {
      console.error('Error fetching character appearance:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch('/api/character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(customization),
      });

      const data = await response.json();
      if (data.success) {
        alert('Character saved successfully!');
      } else {
        alert('Failed to save character: ' + data.error);
      }
    } catch (err) {
      alert('Failed to save character');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Character Customization
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Character'}
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Character Preview
            </h2>
            <div className="flex justify-center items-center bg-gradient-to-b from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-lg p-8 min-h-[500px]">
              <DetailedPixelCharacter
                customization={customization}
                size={320}
                animationState={previewAnimation}
                className="drop-shadow-2xl"
              />
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPreviewAnimation('idle')}
                className={`px-4 py-2 rounded-md ${
                  previewAnimation === 'idle'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Idle
              </button>
              <button
                onClick={() => setPreviewAnimation('attack')}
                className={`px-4 py-2 rounded-md ${
                  previewAnimation === 'attack'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Attack
              </button>
              <button
                onClick={() => setPreviewAnimation('victory')}
                className={`px-4 py-2 rounded-md ${
                  previewAnimation === 'victory'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Victory
              </button>
            </div>
          </div>

          {/* Customization Options */}
          <div className="space-y-6">
            {/* Body Type */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Body Type
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {BODY_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setCustomization({ ...customization, bodyType: type })}
                    className={`px-4 py-2 rounded-md text-sm ${
                      customization.bodyType === type
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Skin Color */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Skin Tone
              </h3>
              <div className="grid grid-cols-6 gap-3">
                {SKIN_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setCustomization({ ...customization, skinColor: color.value })}
                    className={`w-12 h-12 rounded-full border-4 ${
                      customization.skinColor === color.value
                        ? 'border-indigo-600 scale-110'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Hair Style
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {HAIR_STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => setCustomization({ ...customization, hairStyle: style })}
                    className={`px-3 py-2 rounded-md text-sm ${
                      customization.hairStyle === style
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Hair Color
              </h3>
              <div className="grid grid-cols-6 gap-3">
                {HAIR_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setCustomization({ ...customization, hairColor: color.value })}
                    className={`w-12 h-12 rounded-full border-4 ${
                      customization.hairColor === color.value
                        ? 'border-indigo-600 scale-110'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Facial Hair */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Facial Hair
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {FACIAL_HAIR.map((style) => (
                  <button
                    key={style}
                    onClick={() => setCustomization({ ...customization, facialHair: style })}
                    className={`px-3 py-2 rounded-md text-sm ${
                      customization.facialHair === style
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Outfit */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Outfit
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {OUTFITS.map((outfit) => (
                  <button
                    key={outfit}
                    onClick={() => setCustomization({ ...customization, outfit })}
                    className={`px-4 py-2 rounded-md text-sm ${
                      customization.outfit === outfit
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {outfit}
                  </button>
                ))}
              </div>
            </div>

            {/* Outfit Color */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Outfit Color
              </h3>
              <div className="grid grid-cols-6 gap-3">
                {OUTFIT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() =>
                      setCustomization({ ...customization, outfitColor: color.value })
                    }
                    className={`w-12 h-12 rounded-full border-4 ${
                      customization.outfitColor === color.value
                        ? 'border-indigo-600 scale-110'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
