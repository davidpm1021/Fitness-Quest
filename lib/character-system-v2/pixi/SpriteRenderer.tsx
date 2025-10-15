"use client";

import { useEffect, useRef, useState } from 'react';
import { Application, Sprite, Texture } from 'pixi.js';
import type { AnimKey, SpriteMeta } from '../types';
import {
  createAnimationState,
  updateAnimation,
  changeAnimation,
  getCurrentFrameIndex,
} from '../sprites/animation-controller';
import { loadSprite, getFrameTexture } from '../sprites/sprite-loader';

/**
 * Sprite Renderer Props
 */
export interface SpriteRendererProps {
  /** Path to sprite sheet PNG */
  spritePath: string;

  /** Path to metadata JSON */
  metadataPath: string;

  /** Initial animation to play */
  initialAnimation?: AnimKey;

  /** Whether to loop the animation */
  loop?: boolean;

  /** Frames per second */
  fps?: number;

  /** X position in the stage */
  x?: number;

  /** Y position in the stage */
  y?: number;

  /** Scale factor */
  scale?: number;

  /** Callback when animation completes (non-looping only) */
  onAnimationComplete?: () => void;

  /** Current animation (controlled mode) */
  animation?: AnimKey;
}

/**
 * Sprite Renderer Component
 *
 * Renders an animated sprite using the sprite sheet and metadata.
 * This is used internally by the PixiStage component.
 *
 * @internal This component is meant to be used with a PixiJS Application instance
 */
export function useSpriteRenderer(
  app: Application,
  props: SpriteRendererProps
) {
  const {
    spritePath,
    metadataPath,
    initialAnimation = 'idle',
    loop = true,
    fps = 12,
    x = 0,
    y = 0,
    scale = 1,
    onAnimationComplete,
    animation,
  } = props;

  const spriteRef = useRef<Sprite | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const metadataRef = useRef<SpriteMeta | null>(null);
  const animStateRef = useRef(createAnimationState(initialAnimation, fps, loop));
  const lastTimeRef = useRef(Date.now());

  // Load sprite and metadata
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { texture, metadata } = await loadSprite(spritePath, metadataPath);

        if (cancelled) return;

        metadataRef.current = metadata;

        // Create sprite
        const sprite = new Sprite(texture);
        sprite.x = x;
        sprite.y = y;
        sprite.scale.set(scale);

        // Set anchor to bottom-center by default (can be overridden by metadata)
        const anchor = metadata.anchors || { x: 0.5, y: 0.9 };
        sprite.anchor.set(anchor.x, anchor.y);

        // Add to stage
        app.stage.addChild(sprite);
        spriteRef.current = sprite;

        setIsLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load sprite');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (spriteRef.current) {
        app.stage.removeChild(spriteRef.current);
        spriteRef.current.destroy();
        spriteRef.current = null;
      }
    };
  }, [app, spritePath, metadataPath, x, y, scale]);

  // Animation ticker
  useEffect(() => {
    if (!isLoaded || !spriteRef.current || !metadataRef.current) return;

    const ticker = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = now;

      // Update animation state
      const newState = updateAnimation(
        animStateRef.current,
        metadataRef.current!,
        deltaTime
      );

      // Check if animation completed
      if (!newState.isPlaying && animStateRef.current.isPlaying && onAnimationComplete) {
        onAnimationComplete();
      }

      animStateRef.current = newState;

      // Update sprite texture to current frame
      if (spriteRef.current && metadataRef.current) {
        const frameIndex = getCurrentFrameIndex(newState, metadataRef.current);
        const frameTexture = getFrameTexture(
          spriteRef.current.texture,
          metadataRef.current,
          frameIndex
        );
        spriteRef.current.texture = frameTexture;
      }
    };

    // Add ticker
    app.ticker.add(ticker);

    return () => {
      app.ticker.remove(ticker);
    };
  }, [isLoaded, app, onAnimationComplete]);

  // Handle controlled animation changes
  useEffect(() => {
    if (animation && metadataRef.current) {
      animStateRef.current = changeAnimation(animStateRef.current, animation, true, loop);
    }
  }, [animation, loop]);

  // Update position
  useEffect(() => {
    if (spriteRef.current) {
      spriteRef.current.x = x;
      spriteRef.current.y = y;
    }
  }, [x, y]);

  // Update scale
  useEffect(() => {
    if (spriteRef.current) {
      spriteRef.current.scale.set(scale);
    }
  }, [scale]);

  return { isLoaded, error, sprite: spriteRef.current };
}

/**
 * Simple Sprite Renderer Component
 *
 * A component that renders a single animated sprite.
 * Requires being rendered within a PixiStage.
 */
export default function SpriteRenderer(props: SpriteRendererProps & { app: Application }) {
  const { app, ...spriteProps } = props;
  const { isLoaded, error } = useSpriteRenderer(app, spriteProps);

  if (error) {
    console.error('SpriteRenderer error:', error);
  }

  // This component doesn't render anything to the DOM
  // The sprite is rendered to the PixiJS canvas
  return null;
}
