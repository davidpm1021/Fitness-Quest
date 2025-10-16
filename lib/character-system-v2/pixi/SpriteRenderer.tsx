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
  const fullTextureRef = useRef<Texture | null>(null); // Keep original texture for frame extraction
  const animStateRef = useRef(createAnimationState(initialAnimation, fps, loop));
  const lastTimeRef = useRef(Date.now());

  // Load sprite and metadata
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        console.log('[SpriteRenderer] Loading sprite:', spritePath, metadataPath);
        const { texture, metadata } = await loadSprite(spritePath, metadataPath);

        if (cancelled) return;

        console.log('[SpriteRenderer] Sprite loaded successfully:', {
          textureSize: { width: texture.width, height: texture.height },
          metadata,
        });

        metadataRef.current = metadata;
        fullTextureRef.current = texture; // Store original texture for frame extraction

        // Get the first frame of the initial animation
        const initialFrameIndex = getCurrentFrameIndex(animStateRef.current, metadata);
        const initialFrameTexture = getFrameTexture(texture, metadata, initialFrameIndex);

        // Create sprite with the first frame
        const sprite = new Sprite(initialFrameTexture);
        sprite.x = x;
        sprite.y = y;
        sprite.scale.set(scale);

        // Set anchor to bottom-center by default (can be overridden by metadata)
        const anchor = metadata.anchors || { x: 0.5, y: 0.9 };
        sprite.anchor.set(anchor.x, anchor.y);

        console.log('[SpriteRenderer] Sprite created:', {
          position: { x: sprite.x, y: sprite.y },
          scale: sprite.scale.x,
          anchor: { x: sprite.anchor.x, y: sprite.anchor.y },
          visible: sprite.visible,
        });

        // Add to stage
        app.stage.addChild(sprite);
        spriteRef.current = sprite;

        // Force a manual render to ensure the sprite appears
        app.renderer.render(app.stage);

        setIsLoaded(true);
        console.log('[SpriteRenderer] Sprite added to stage', {
          spriteAlpha: sprite.alpha,
          spriteVisible: sprite.visible,
          spriteWidth: sprite.width,
          spriteHeight: sprite.height,
          textureWidth: sprite.texture.width,
          textureHeight: sprite.texture.height,
          stageChildren: app.stage.children.length,
          rendererType: app.renderer.type,
          canvasWidth: app.canvas.width,
          canvasHeight: app.canvas.height,
        });
      } catch (err) {
        console.error('[SpriteRenderer] Error loading sprite:', err);
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
      if (spriteRef.current && metadataRef.current && fullTextureRef.current) {
        const frameIndex = getCurrentFrameIndex(newState, metadataRef.current);
        const frameTexture = getFrameTexture(
          fullTextureRef.current, // Use original full texture for frame extraction
          metadataRef.current,
          frameIndex
        );
        spriteRef.current.texture = frameTexture;

        // Debug log first few frames
        if (newState.currentFrame < 3) {
          console.log('[Animation] Frame update:', {
            animation: newState.currentAnimation,
            currentFrame: newState.currentFrame,
            frameIndex,
            textureFrame: frameTexture.frame,
            spritePosition: { x: spriteRef.current.x, y: spriteRef.current.y },
            spriteVisible: spriteRef.current.visible,
          });
        }
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
