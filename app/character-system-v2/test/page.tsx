"use client";

import { useState } from 'react';
import PixiStage from '@/lib/character-system-v2/pixi/PixiStage';
import SpriteRenderer from '@/lib/character-system-v2/pixi/SpriteRenderer';
import type { AnimKey } from '@/lib/character-system-v2/types';
import type { Application } from 'pixi.js';

/**
 * Character System V2 - Test Page
 *
 * ⚠️ ISOLATED DEVELOPMENT - NOT LINKED FROM MAIN APP
 *
 * This page is for testing the new PixiJS-based character rendering system.
 * It is completely isolated from the production application and will not
 * affect beta testers.
 *
 * To access: Navigate directly to /character-system-v2/test
 */
export default function CharacterSystemV2TestPage() {
  const [currentAnimation, setCurrentAnimation] = useState<AnimKey>('idle');
  const [fps, setFps] = useState(12);
  const [scale, setScale] = useState(4);
  const [appInstance, setAppInstance] = useState<Application | null>(null);

  const animations: AnimKey[] = [
    'idle',
    'walk',
    'attack',
    'hit',
    'victory',
    'defend',
    'support',
    'heroic_strike',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-4 mb-8">
          <h1 className="text-3xl font-bold text-yellow-200 font-pixel mb-2">
            🚧 Character System V2 - Test Environment
          </h1>
          <p className="text-yellow-100 font-retro text-sm">
            ⚠️ <strong>ISOLATED DEVELOPMENT TRACK</strong> - This system is built
            separately and will not affect production until Phase 8.4 is complete.
          </p>
          <p className="text-yellow-100 font-retro text-sm mt-2">
            Beta testers continue using the current system unaffected.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Canvas */}
          <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-purple-500/30">
            <h2 className="text-xl font-bold text-white font-pixel mb-4">
              PixiJS Sprite Renderer
            </h2>

            <div className="flex justify-center items-center bg-gray-900 rounded-lg p-4 border-2 border-gray-700">
              <PixiStage
                width={400}
                height={400}
                backgroundColor="#FFFFFF"
                className="rounded-lg"
                onAppReady={setAppInstance}
                autoDensity={false}
                resolution={1}
              >
                {(app) => (
                  <>
                    <SpriteRenderer
                      app={app}
                      spritePath="/sprites/characters/v2/lpc-body.png"
                      metadataPath="/sprites/characters/v2/lpc-body.json"
                      animation={currentAnimation}
                      fps={fps}
                      scale={scale}
                      x={200}
                      y={350}
                      loop={true}
                    />
                  </>
                )}
              </PixiStage>
            </div>

            <div className="mt-4 text-sm text-gray-400 font-retro">
              <p>✅ PixiJS Application: {appInstance ? 'Initialized' : 'Loading...'}</p>
              <p>✅ WebGL Renderer: {appInstance?.renderer ? 'Active' : 'Pending'}</p>
              <p>✅ Round Pixels: Enabled</p>
              <p>✅ Nearest-Neighbor Filtering: Enabled</p>
              <p className="text-yellow-400 mt-2">🔍 Check browser console (F12) for sprite loading logs</p>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Animation Controls */}
            <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-purple-500/30">
              <h3 className="text-lg font-bold text-white font-pixel mb-4">
                Animation Controls
              </h3>

              <div className="mb-4">
                <label className="block text-sm text-gray-300 font-retro mb-2">
                  Current Animation: {currentAnimation}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {animations.map((anim) => (
                    <button
                      key={anim}
                      onClick={() => setCurrentAnimation(anim)}
                      className={`px-3 py-2 rounded font-retro text-sm transition-colors ${
                        currentAnimation === anim
                          ? 'bg-purple-600 text-white border-2 border-purple-400'
                          : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      {anim}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-300 font-retro mb-2">
                  FPS: {fps}
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 font-retro mb-2">
                  Scale: {scale}x
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={scale}
                  onChange={(e) => setScale(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Implementation Status */}
            <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-green-500/30">
              <h3 className="text-lg font-bold text-white font-pixel mb-4">
                ✅ Phase 8.1 Progress
              </h3>

              <ul className="space-y-2 text-sm font-retro">
                <li className="text-green-400">✓ PixiJS v8 installed</li>
                <li className="text-green-400">✓ SpriteMeta type schema defined</li>
                <li className="text-green-400">✓ PixiStage wrapper component</li>
                <li className="text-green-400">✓ Animation controller</li>
                <li className="text-green-400">✓ Sprite loader utilities</li>
                <li className="text-green-400">✓ SpriteRenderer component</li>
                <li className="text-green-400">✓ Isolated test page created</li>
                <li className="text-yellow-400">⏳ Create first sprite sheet (32×32)</li>
                <li className="text-yellow-400">⏳ Export workflow documentation</li>
                <li className="text-gray-500">☐ Palette swapping system</li>
                <li className="text-gray-500">☐ Layer composition system</li>
              </ul>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-blue-500/30">
              <h3 className="text-lg font-bold text-white font-pixel mb-4">
                📋 Next Steps
              </h3>

              <ol className="space-y-2 text-sm font-retro text-gray-300">
                <li>1. Create first 32×32 sprite sheet in Aseprite</li>
                <li>2. Export with tagged animations (idle, walk, attack)</li>
                <li>3. Generate metadata JSON</li>
                <li>4. Save to /public/sprites/characters/v2/</li>
                <li>5. Test sprite rendering in this page</li>
                <li>6. Implement palette swapping</li>
                <li>7. Build layer composition system</li>
                <li>8. Continue to Phase 8.2 (Database & Security)</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Documentation Links */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-6 border-2 border-purple-500/30">
          <h3 className="text-lg font-bold text-white font-pixel mb-4">
            📚 Documentation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-retro">
            <div>
              <h4 className="text-purple-400 font-bold mb-2">Type Definitions</h4>
              <p className="text-gray-400">/lib/character-system-v2/types/</p>
              <p className="text-gray-500 text-xs mt-1">
                SpriteMeta, AnimKey, CharacterSprite
              </p>
            </div>

            <div>
              <h4 className="text-purple-400 font-bold mb-2">Pixi Components</h4>
              <p className="text-gray-400">/lib/character-system-v2/pixi/</p>
              <p className="text-gray-500 text-xs mt-1">
                PixiStage, SpriteRenderer
              </p>
            </div>

            <div>
              <h4 className="text-purple-400 font-bold mb-2">Utilities</h4>
              <p className="text-gray-400">/lib/character-system-v2/sprites/</p>
              <p className="text-gray-500 text-xs mt-1">
                sprite-loader, animation-controller
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
