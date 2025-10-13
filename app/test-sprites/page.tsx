'use client';

import { useState } from 'react';
import SpriteCharacter, { CharacterLayers, SpriteCustomization } from '../components/SpriteCharacter';

export default function TestSpritesPage() {
  const [animationState, setAnimationState] = useState<'idle' | 'walk' | 'attack' | 'victory'>('idle');
  const [direction, setDirection] = useState<'down' | 'left' | 'up' | 'right'>('down');

  // Using real LPC sprites!
  const characterLayers: CharacterLayers = {
    base: '/sprites/body/male-light.png', // Real LPC sprite
    hair: '/sprites/hair-short.png',
    clothing: '/sprites/shirt-basic.png',
    accessory: '/sprites/hat-cap.png',
    weapon: '/sprites/weapon-sword.png',
  };

  const customization: SpriteCustomization = {
    layers: characterLayers,
    scale: 3, // 3x scale for better visibility
    tintColors: {
      hair: '#8B4513', // Brown hair
      clothing: '#4169E1', // Blue shirt
      accessory: '#FF4500', // Red hat
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-pixel text-4xl text-white mb-8">LPC Sprite System Test</h1>

        {/* Character Display */}
        <div className="bg-gray-800 border-4 border-gray-600 rounded-lg p-8 mb-8">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <SpriteCharacter
                customization={customization}
                animationState={animationState}
                direction={direction}
                className="border-2 border-gray-500"
              />
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 px-3 py-1 rounded-full">
                <p className="font-pixel text-xs text-white whitespace-nowrap">
                  {animationState} - {direction}
                </p>
              </div>
            </div>
          </div>

          {/* Animation Controls */}
          <div className="space-y-6 mt-12">
            <div>
              <p className="font-pixel text-white mb-3">Animation State:</p>
              <div className="grid grid-cols-4 gap-2">
                {['idle', 'walk', 'attack', 'victory'].map((state) => (
                  <button
                    key={state}
                    onClick={() => setAnimationState(state as any)}
                    className={`px-4 py-2 font-pixel text-sm rounded transition-colors ${
                      animationState === state
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-pixel text-white mb-3">Direction:</p>
              <div className="grid grid-cols-4 gap-2">
                {['down', 'left', 'up', 'right'].map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setDirection(dir as any)}
                    className={`px-4 py-2 font-pixel text-sm rounded transition-colors ${
                      direction === dir
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Customization Info */}
        <div className="bg-gray-800 border-4 border-gray-600 rounded-lg p-6">
          <h2 className="font-pixel text-2xl text-white mb-4">Layer System</h2>
          <div className="space-y-2 font-retro text-sm text-gray-300">
            <p>✅ Base body layer (required)</p>
            <p>✅ Hair layer with color tinting</p>
            <p>✅ Clothing layer with color tinting</p>
            <p>✅ Accessory layer (hats, glasses, etc.)</p>
            <p>✅ Weapon layer</p>
          </div>

          <div className="mt-6 p-4 bg-gray-900 rounded border border-gray-700">
            <p className="font-pixel text-yellow-400 mb-2">🔓 Unlockable Items:</p>
            <ul className="font-retro text-xs text-gray-400 space-y-1">
              <li>• New hairstyles (unlock after X days)</li>
              <li>• New outfits (unlock after defeating Y monsters)</li>
              <li>• Hats and accessories (unlock with Z check-ins)</li>
              <li>• Weapons (unlock after special achievements)</li>
              <li>• Color variations (unlock with streak milestones)</li>
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-900 border-4 border-blue-700 rounded-lg">
          <h3 className="font-pixel text-xl text-white mb-3">Next Steps:</h3>
          <ol className="font-retro text-sm text-blue-100 space-y-2">
            <li>1. Download LPC sprite sheets from OpenGameArt or LPC Generator</li>
            <li>2. Place sprite sheets in /public/sprites/ directory</li>
            <li>3. Update character layer URLs to point to real sprites</li>
            <li>4. Create unlock system in database (unlocked items per user)</li>
            <li>5. Add UI for character customization screen</li>
            <li>6. Integrate with existing character display components</li>
          </ol>
        </div>

        {/* Temporary Placeholder Notice */}
        <div className="mt-8 p-6 bg-red-900 border-4 border-red-700 rounded-lg">
          <h3 className="font-pixel text-xl text-white mb-3">⚠️ Placeholder Notice</h3>
          <p className="font-retro text-sm text-red-100">
            This page will show "Loading..." until we add actual sprite sheet images.
            The component is ready and will work once we have real LPC sprite sheets.
          </p>
        </div>
      </div>
    </div>
  );
}
