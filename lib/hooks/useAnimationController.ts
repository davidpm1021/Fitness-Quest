import { useState, useCallback, useEffect } from 'react';

export type AnimationState =
  | 'idle'
  | 'ready'
  | 'charge'
  | 'attack'
  | 'hit'
  | 'victory'
  | 'defeat'
  | 'counterattack';

interface AnimationConfig {
  frameCount: number;
  fps: number;
  loop: boolean;
  nextState?: AnimationState;
  duration?: number; // Override duration in ms (instead of using frameCount/fps)
}

const DEFAULT_ANIMATIONS: Record<AnimationState, AnimationConfig> = {
  idle: { frameCount: 4, fps: 8, loop: true },
  ready: { frameCount: 1, fps: 1, loop: false, duration: 2000, nextState: 'idle' },
  charge: { frameCount: 4, fps: 8, loop: false, duration: 1500, nextState: 'attack' },
  attack: { frameCount: 8, fps: 16, loop: false, nextState: 'idle' },
  hit: { frameCount: 4, fps: 12, loop: false, nextState: 'idle' },
  victory: { frameCount: 6, fps: 10, loop: true },
  defeat: { frameCount: 4, fps: 8, loop: false },
  counterattack: { frameCount: 6, fps: 14, loop: false, nextState: 'idle' },
};

interface UseAnimationControllerOptions {
  /** Initial animation state (default: 'idle') */
  initialState?: AnimationState;
  /** Custom animation configurations */
  animations?: Partial<Record<AnimationState, AnimationConfig>>;
  /** Callback when animation state changes */
  onStateChange?: (state: AnimationState) => void;
  /** Callback when animation completes (non-looping) */
  onComplete?: (state: AnimationState) => void;
}

/**
 * useAnimationController Hook
 *
 * Manages sprite animation states and transitions.
 * Handles automatic state transitions and timing.
 *
 * @example
 * const { state, play, getCurrentAnimation } = useAnimationController({
 *   initialState: 'idle',
 *   onComplete: (state) => console.log(`${state} animation finished`)
 * });
 *
 * // Trigger animation
 * play('attack');
 *
 * // Get current animation config for SpriteSheet
 * const anim = getCurrentAnimation();
 */
export function useAnimationController({
  initialState = 'idle',
  animations = {},
  onStateChange,
  onComplete,
}: UseAnimationControllerOptions = {}) {
  const [currentState, setCurrentState] = useState<AnimationState>(initialState);
  const [isPlaying, setIsPlaying] = useState(true);

  // Merge custom animations with defaults
  const animationConfigs: Record<AnimationState, AnimationConfig> = {
    ...DEFAULT_ANIMATIONS,
    ...animations,
  };

  /**
   * Play a specific animation
   */
  const play = useCallback(
    (state: AnimationState) => {
      if (state === currentState) return;
      setCurrentState(state);
      setIsPlaying(true);
      if (onStateChange) onStateChange(state);
    },
    [currentState, onStateChange]
  );

  /**
   * Pause current animation
   */
  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  /**
   * Resume current animation
   */
  const resume = useCallback(() => {
    setIsPlaying(true);
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setCurrentState(initialState);
    setIsPlaying(true);
  }, [initialState]);

  /**
   * Get current animation configuration
   */
  const getCurrentAnimation = useCallback(() => {
    return animationConfigs[currentState];
  }, [currentState, animationConfigs]);

  /**
   * Handle animation completion
   */
  const handleComplete = useCallback(() => {
    const config = animationConfigs[currentState];

    if (onComplete) onComplete(currentState);

    // Auto-transition to next state if defined
    if (config.nextState) {
      play(config.nextState);
    }
  }, [currentState, animationConfigs, onComplete, play]);

  /**
   * Auto-transition based on duration (for non-frame-based timing)
   */
  useEffect(() => {
    const config = animationConfigs[currentState];

    if (config.duration && config.nextState && !config.loop) {
      const timer = setTimeout(() => {
        play(config.nextState!);
      }, config.duration);

      return () => clearTimeout(timer);
    }
  }, [currentState, animationConfigs, play]);

  return {
    /** Current animation state */
    state: currentState,
    /** Is animation currently playing */
    isPlaying,
    /** Play specific animation */
    play,
    /** Pause animation */
    pause,
    /** Resume animation */
    resume,
    /** Reset to initial state */
    reset,
    /** Get current animation config */
    getCurrentAnimation,
    /** Handle animation completion callback */
    onAnimationComplete: handleComplete,
  };
}
