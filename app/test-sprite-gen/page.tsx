// app/test-sprite-gen/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  CharacterCustomization,
  AnimationState,
  DEFAULT_PALETTE,
  ANIMATION_CONFIGS,
  HairStyle,
} from '@/lib/sprites/types';
import { useGeneratedSprite } from '@/lib/hooks/useGeneratedSprite';
import { getSpriteCache } from '@/lib/sprites/SpriteCache';

export default function TestSpriteGenPage() {
  const [customization, setCustomization] = useState<CharacterCustomization>({
    bodyType: 'athletic',
    gender: 'male',
    skinTone: 1,
    hairStyle: 'short-01',
    hairColor: 0,
    outfit: 'athletic',
    outfitColor: 0,
  });

  const [animation, setAnimation] = useState<AnimationState>('idle');
  const [scale, setScale] = useState(8);

  const { dataURL, isLoading, error, regenerate } = useGeneratedSprite({
    customization,
    animation,
  });

  const cache = getSpriteCache();
  const [stats, setStats] = useState({ memorySize: 0, sessionSize: 0, dbAvailable: false });

  // Update cache stats on client only
  useEffect(() => {
    setStats(cache.getCacheStats());
  }, [dataURL]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          Sprite Generation Test Lab
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Preview */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Preview</h2>

            {/* Sprite Display */}
            <div className="bg-gray-700 rounded-lg p-8 mb-4 flex items-center justify-center min-h-[300px]">
              {isLoading && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p>Generating sprite...</p>
                </div>
              )}

              {!isLoading && dataURL && (
                <div className="text-center">
                  <div
                    className="mx-auto mb-4 overflow-hidden"
                    style={{
                      width: `${32 * scale}px`,
                      height: `${32 * scale}px`,
                    }}
                  >
                    <img
                      src={dataURL}
                      alt="Generated sprite"
                      style={{
                        width: `${32 * ANIMATION_CONFIGS[animation].frameCount * scale}px`,
                        height: `${32 * scale}px`,
                        imageRendering: 'pixelated',
                        animation: `sprite-${animation} ${ANIMATION_CONFIGS[animation].duration}ms steps(${ANIMATION_CONFIGS[animation].frameCount}) ${ANIMATION_CONFIGS[animation].loop ? 'infinite' : 'forwards'}`,
                      }}
                      className="block"
                    />
                  </div>
                  <p className="text-sm text-gray-400">
                    {ANIMATION_CONFIGS[animation].frameCount} frames @{' '}
                    {ANIMATION_CONFIGS[animation].fps} FPS
                  </p>
                  <style jsx>{`
                    @keyframes sprite-${animation} {
                      from {
                        transform: translateX(0);
                      }
                      to {
                        transform: translateX(-${32 * (ANIMATION_CONFIGS[animation].frameCount - 1) * scale}px);
                      }
                    }
                  `}</style>
                </div>
              )}

              {!isLoading && !dataURL && (
                <div className="text-gray-400 text-center">
                  <p>No sprite generated</p>
                </div>
              )}
            </div>

            {/* Animation Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Animation State
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(ANIMATION_CONFIGS) as AnimationState[]).map(
                  (anim) => (
                    <button
                      key={anim}
                      onClick={() => setAnimation(anim)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        animation === anim
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {anim}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Scale Slider */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Scale: {scale}x
              </label>
              <input
                type="range"
                min="2"
                max="16"
                value={scale}
                onChange={(e) => setScale(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={regenerate}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={async () => {
                  await cache.clearAll();
                  setStats(cache.getCacheStats());
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Clear Cache
              </button>
            </div>

            {/* Cache Stats */}
            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <h3 className="font-bold mb-2">Cache Statistics</h3>
              <div className="text-sm space-y-1">
                <p>Memory Cache: {stats.memorySize} sprites</p>
                <p>Session Storage: {stats.sessionSize} sprites</p>
                <p>
                  IndexedDB:{' '}
                  {stats.dbAvailable ? 'Available' : 'Not available'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: Customization */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Customization</h2>

            {/* Body Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Body Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['athletic', 'heavy', 'slim'].map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setCustomization({
                        ...customization,
                        bodyType: type as any,
                      })
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                      customization.bodyType === type
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {['male', 'female', 'nonbinary'].map((g) => (
                  <button
                    key={g}
                    onClick={() =>
                      setCustomization({
                        ...customization,
                        gender: g as any,
                      })
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                      customization.gender === g
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Hair Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['short-01', 'short-spiky', 'medium-01', 'medium-curly', 'long-01', 'long-wavy'] as HairStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() =>
                      setCustomization({
                        ...customization,
                        hairStyle: style,
                      })
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                      customization.hairStyle === style
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {style.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Skin Tone */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Skin Tone
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_PALETTE.skin.map((color, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      setCustomization({
                        ...customization,
                        skinTone: index as any,
                      })
                    }
                    className={`h-12 rounded-lg border-2 transition-all ${
                      customization.skinTone === index
                        ? 'border-white scale-110'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Hair Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_PALETTE.hair.map((color, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      setCustomization({
                        ...customization,
                        hairColor: index,
                      })
                    }
                    className={`h-12 rounded-lg border-2 transition-all ${
                      customization.hairColor === index
                        ? 'border-white scale-110'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Outfit */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Outfit</label>
              <div className="grid grid-cols-3 gap-2">
                {['athletic', 'casual', 'armor', 'ninja', 'wizard', 'knight'].map(
                  (outfit) => (
                    <button
                      key={outfit}
                      onClick={() =>
                        setCustomization({
                          ...customization,
                          outfit: outfit as any,
                        })
                      }
                      className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                        customization.outfit === outfit
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {outfit}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Outfit Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Outfit Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_PALETTE.outfit.slice(0, 12).map((color, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      setCustomization({
                        ...customization,
                        outfitColor: index,
                      })
                    }
                    className={`h-12 rounded-lg border-2 transition-all ${
                      customization.outfitColor === index
                        ? 'border-white scale-110'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Current Config */}
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="font-bold mb-2">Current Configuration</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(customization, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
