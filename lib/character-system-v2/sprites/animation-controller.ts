import type { AnimKey, AnimationState, SpriteMeta } from '../types';

/**
 * Animation Controller
 *
 * Manages animation playback for sprite-based characters.
 * Handles frame timing, looping, and animation transitions.
 */

/**
 * Create a new animation state
 *
 * @param animation Initial animation to play
 * @param fps Frames per second (default: 12)
 * @param loop Whether to loop the animation (default: true)
 * @returns Initial animation state
 */
export function createAnimationState(
  animation: AnimKey = 'idle',
  fps: number = 12,
  loop: boolean = true
): AnimationState {
  return {
    currentAnimation: animation,
    currentFrame: 0,
    isPlaying: true,
    loop,
    timeAccumulator: 0,
    fps,
  };
}

/**
 * Update animation state based on delta time
 *
 * @param state Current animation state
 * @param metadata Sprite metadata containing animation definitions
 * @param deltaTime Time elapsed since last frame (in seconds)
 * @returns Updated animation state
 */
export function updateAnimation(
  state: AnimationState,
  metadata: SpriteMeta,
  deltaTime: number
): AnimationState {
  if (!state.isPlaying) {
    return state;
  }

  const newState = { ...state };
  newState.timeAccumulator += deltaTime;

  // Calculate frame duration based on FPS
  const frameDuration = 1 / state.fps;

  // Advance frames if enough time has passed
  while (newState.timeAccumulator >= frameDuration) {
    newState.timeAccumulator -= frameDuration;
    newState.currentFrame++;

    // Get frame count for current animation
    const frames = metadata.animations[state.currentAnimation];
    if (!frames) {
      console.warn(`Animation "${state.currentAnimation}" not found in metadata`);
      newState.isPlaying = false;
      return newState;
    }

    // Handle end of animation
    if (newState.currentFrame >= frames.length) {
      if (newState.loop) {
        // Loop back to start
        newState.currentFrame = 0;
      } else {
        // Stop at last frame
        newState.currentFrame = frames.length - 1;
        newState.isPlaying = false;
      }
    }
  }

  return newState;
}

/**
 * Change the current animation
 *
 * @param state Current animation state
 * @param newAnimation Animation to switch to
 * @param reset Whether to reset to frame 0 (default: true)
 * @param loop Whether the new animation should loop (default: true)
 * @returns Updated animation state
 */
export function changeAnimation(
  state: AnimationState,
  newAnimation: AnimKey,
  reset: boolean = true,
  loop: boolean = true
): AnimationState {
  // Don't change if already playing this animation
  if (state.currentAnimation === newAnimation && !reset) {
    return state;
  }

  return {
    ...state,
    currentAnimation: newAnimation,
    currentFrame: reset ? 0 : state.currentFrame,
    loop,
    isPlaying: true,
    timeAccumulator: 0,
  };
}

/**
 * Play an animation
 *
 * @param state Current animation state
 * @returns Updated animation state
 */
export function playAnimation(state: AnimationState): AnimationState {
  return {
    ...state,
    isPlaying: true,
  };
}

/**
 * Pause an animation
 *
 * @param state Current animation state
 * @returns Updated animation state
 */
export function pauseAnimation(state: AnimationState): AnimationState {
  return {
    ...state,
    isPlaying: false,
  };
}

/**
 * Stop an animation and reset to frame 0
 *
 * @param state Current animation state
 * @returns Updated animation state
 */
export function stopAnimation(state: AnimationState): AnimationState {
  return {
    ...state,
    isPlaying: false,
    currentFrame: 0,
    timeAccumulator: 0,
  };
}

/**
 * Get the current frame index in the sprite sheet
 *
 * @param state Animation state
 * @param metadata Sprite metadata
 * @returns Frame index in the sprite sheet
 */
export function getCurrentFrameIndex(
  state: AnimationState,
  metadata: SpriteMeta
): number {
  const frames = metadata.animations[state.currentAnimation];
  if (!frames || frames.length === 0) {
    console.warn(`Animation "${state.currentAnimation}" not found or has no frames`);
    return 0;
  }

  // Clamp frame to valid range
  const frameIndex = Math.min(state.currentFrame, frames.length - 1);
  return frames[frameIndex];
}

/**
 * Set FPS for animation
 *
 * @param state Current animation state
 * @param fps New frames per second
 * @returns Updated animation state
 */
export function setAnimationFPS(state: AnimationState, fps: number): AnimationState {
  return {
    ...state,
    fps: Math.max(1, fps), // Ensure FPS is at least 1
  };
}

/**
 * Check if animation has finished (for non-looping animations)
 *
 * @param state Animation state
 * @param metadata Sprite metadata
 * @returns True if animation is finished
 */
export function isAnimationFinished(
  state: AnimationState,
  metadata: SpriteMeta
): boolean {
  if (state.loop) {
    return false; // Looping animations never finish
  }

  const frames = metadata.animations[state.currentAnimation];
  if (!frames) {
    return true;
  }

  return state.currentFrame >= frames.length - 1 && !state.isPlaying;
}

/**
 * Get animation progress as a percentage (0-100)
 *
 * @param state Animation state
 * @param metadata Sprite metadata
 * @returns Progress percentage
 */
export function getAnimationProgress(
  state: AnimationState,
  metadata: SpriteMeta
): number {
  const frames = metadata.animations[state.currentAnimation];
  if (!frames || frames.length === 0) {
    return 0;
  }

  return (state.currentFrame / (frames.length - 1)) * 100;
}
