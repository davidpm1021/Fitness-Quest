'use client';

import SpriteSheet from './SpriteSheet';
import { useAnimationController, AnimationState } from '@/lib/hooks/useAnimationController';
import { useEffect } from 'react';

type MonsterType = 'TANK' | 'BALANCED' | 'GLASS_CANNON';

interface SpriteMonsterProps {
  /** Monster type determines sprite set */
  monsterType: MonsterType;
  /** Specific monster ID (e.g., "procrastination-dragon") */
  monsterId?: string;
  /** Animation state to play */
  animationState?: AnimationState;
  /** Display size */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

/**
 * SpriteMonster Component
 *
 * Renders monsters with type-specific sprites and animations.
 * Each monster type (Tank, Balanced, Glass Cannon) has unique visuals.
 *
 * TODO: Once custom sprites are created, this will load:
 * - /sprites/monsters/tank/[monster-name]-idle.png
 * - /sprites/monsters/balanced/[monster-name]-idle.png
 * - /sprites/monsters/glass-cannon/[monster-name]-idle.png
 *
 * @example
 * <SpriteMonster
 *   monsterType="TANK"
 *   monsterId="couch-potato-golem"
 *   animationState="attack"
 *   size={192}
 * />
 */
export default function SpriteMonster({
  monsterType,
  monsterId = 'default',
  animationState = 'idle',
  size = 192,
  className = '',
  onAnimationComplete,
}: SpriteMonsterProps) {
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

  // Calculate scale (monsters are 64x64 base, larger than heroes)
  const scale = size / 64;

  // Sprite paths by monster type
  // TODO: Replace with actual custom sprites
  const getSpritePath = (type: MonsterType, animation: AnimationState): string => {
    const typeFolder = type.toLowerCase().replace('_', '-');
    return `/sprites/monsters/${typeFolder}/${monsterId}-${animation}.png`;
  };

  // Fallback placeholder paths
  const spritePath = getSpritePath(monsterType, state);

  // Monster-specific animation configs
  // Tanks are slower, Glass Cannons are faster
  const fps = monsterType === 'TANK' ? 6 : monsterType === 'GLASS_CANNON' ? 12 : 8;

  // Color overlay based on type (temporary until custom sprites exist)
  const getTypeColor = (type: MonsterType): string => {
    switch (type) {
      case 'TANK':
        return 'hue-rotate-[200deg]'; // Blue tones
      case 'BALANCED':
        return 'hue-rotate-[270deg]'; // Purple tones
      case 'GLASS_CANNON':
        return 'hue-rotate-[0deg]'; // Red tones
      default:
        return '';
    }
  };

  return (
    <div className={`sprite-monster ${className} ${getTypeColor(monsterType)}`}>
      <SpriteSheet
        src={spritePath}
        frameWidth={64}
        frameHeight={64}
        frameCount={currentAnimation.frameCount}
        fps={fps}
        loop={currentAnimation.loop}
        scale={scale}
        onComplete={handleAnimationComplete}
      />

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <span className="text-xs text-gray-500 font-mono bg-black/50 px-2 py-1 rounded">
            {monsterType} - {state}
          </span>
        </div>
      )}
    </div>
  );
}
