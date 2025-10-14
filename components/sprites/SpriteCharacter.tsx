'use client';

import SpriteSheet from './SpriteSheet';
import { useAnimationController, AnimationState } from '@/lib/hooks/useAnimationController';
import { useEffect } from 'react';

interface SpriteCharacterProps {
  /** Animation state to play */
  animationState?: AnimationState;
  /** Display size (will scale sprite appropriately) */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  /** Character customization (future: outfit variations) */
  outfit?: 'athletic' | 'casual' | 'armor' | 'ninja' | 'wizard' | 'knight';
}

/**
 * SpriteCharacter Component
 *
 * Renders the hero character with custom sprite animations.
 * Uses the sprite sheet system for smooth, professional animations.
 *
 * TODO: Once custom sprites are created, this will load:
 * - /sprites/characters/hero-idle.png
 * - /sprites/characters/hero-attack.png
 * - /sprites/characters/hero-victory.png
 * - /sprites/characters/hero-hit.png
 *
 * @example
 * <SpriteCharacter
 *   animationState="attack"
 *   size={128}
 *   outfit="athletic"
 * />
 */
export default function SpriteCharacter({
  animationState = 'idle',
  size = 128,
  className = '',
  onAnimationComplete,
  outfit = 'athletic',
}: SpriteCharacterProps) {
  const {
    state,
    play,
    getCurrentAnimation,
    onAnimationComplete: handleAnimationComplete,
  } = useAnimationController({
    initialState: animationState,
    onComplete: () => {
      if (onAnimationComplete) onAnimationComplete();
    },
  });

  // Update animation when prop changes
  useEffect(() => {
    if (animationState !== state) {
      play(animationState);
    }
  }, [animationState, state, play]);

  // Get current animation config
  const currentAnimation = getCurrentAnimation();

  // Calculate scale based on desired display size
  // Base sprite size is 32x32, so scale = size / 32
  const scale = size / 32;

  // Sprite paths (placeholder - will be replaced with actual custom sprites)
  // For now, we'll use a placeholder image or fallback to canvas rendering
  const spriteMap: Record<AnimationState, { src: string; frames: number; fps: number }> = {
    idle: { src: '/sprites/placeholder-hero-idle.png', frames: 4, fps: 8 },
    ready: { src: '/sprites/placeholder-hero-idle.png', frames: 1, fps: 1 },
    charge: { src: '/sprites/placeholder-hero-charge.png', frames: 4, fps: 8 },
    attack: { src: '/sprites/placeholder-hero-attack.png', frames: 8, fps: 16 },
    hit: { src: '/sprites/placeholder-hero-hit.png', frames: 4, fps: 12 },
    victory: { src: '/sprites/placeholder-hero-victory.png', frames: 6, fps: 10 },
    defeat: { src: '/sprites/placeholder-hero-hit.png', frames: 4, fps: 8 },
    counterattack: { src: '/sprites/placeholder-hero-idle.png', frames: 1, fps: 1 },
  };

  const currentSprite = spriteMap[state];

  return (
    <div className={`sprite-character ${className}`}>
      <SpriteSheet
        src={currentSprite.src}
        frameWidth={32}
        frameHeight={32}
        frameCount={currentAnimation.frameCount}
        fps={currentAnimation.fps}
        loop={currentAnimation.loop}
        scale={scale}
        onComplete={handleAnimationComplete}
      />

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <span className="text-xs text-gray-500 font-mono bg-black/50 px-2 py-1 rounded">
            {state}
          </span>
        </div>
      )}
    </div>
  );
}
