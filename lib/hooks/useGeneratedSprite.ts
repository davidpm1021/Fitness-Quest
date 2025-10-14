// lib/hooks/useGeneratedSprite.ts
// React hook for generating and caching character sprites

import { useEffect, useState, useRef } from 'react';
import { CharacterCustomization, AnimationState } from '../sprites/types';
import { getSpriteGenerator } from '../sprites/SpriteGenerator';
import { getSpriteCache } from '../sprites/SpriteCache';

interface UseGeneratedSpriteOptions {
  customization: CharacterCustomization;
  animation: AnimationState;
  frameWidth?: number;
  frameHeight?: number;
  enabled?: boolean; // Allow disabling generation
}

interface UseGeneratedSpriteReturn {
  dataURL: string;
  isLoading: boolean;
  error: Error | null;
  regenerate: () => void;
}

/**
 * Hook to generate and cache character sprites
 */
export function useGeneratedSprite({
  customization,
  animation,
  frameWidth = 32,
  frameHeight = 32,
  enabled = true,
}: UseGeneratedSpriteOptions): UseGeneratedSpriteReturn {
  const [dataURL, setDataURL] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [regenerateCounter, setRegenerateCounter] = useState(0);

  const generator = getSpriteGenerator();
  const cache = getSpriteCache();

  // Generate cache key
  const cacheKey = JSON.stringify({
    customization,
    animation,
    frameWidth,
    frameHeight,
    regenerateCounter,
  });

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function generateSprite() {
      setIsLoading(true);
      setError(null);

      try {
        // Check cache first
        const cachedCanvas = await cache.get(cacheKey);

        if (cachedCanvas && !cancelled) {
          setDataURL(cachedCanvas.toDataURL('image/png'));
          setIsLoading(false);
          return;
        }

        // Generate new sprite
        if (!cancelled) {
          // Try loading from assets first
          const canvas = await generator.generateCharacterSprite(
            customization,
            animation,
            frameWidth,
            frameHeight
          );

          if (!cancelled) {
            const url = canvas.toDataURL('image/png');
            setDataURL(url);

            // Cache the result
            await cache.set(cacheKey, canvas);
          }
        }
      } catch (err) {
        if (!cancelled) {
          // Expected error - falling back to procedural generation
          // (sprite assets don't exist, so we use procedural rendering)

          // Fallback to procedural generation
          try {
            const canvas = await generator.generateProceduralCharacter(
              customization,
              animation,
              frameWidth,
              frameHeight
            );

            if (!cancelled) {
              const url = canvas.toDataURL('image/png');
              setDataURL(url);
              await cache.set(cacheKey, canvas);
            }
          } catch (fallbackErr) {
            if (!cancelled) {
              console.error('Procedural sprite generation failed:', fallbackErr);
              setError(fallbackErr as Error);
            }
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    generateSprite();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, enabled]);

  const regenerate = () => {
    setRegenerateCounter((c) => c + 1);
  };

  return {
    dataURL,
    isLoading,
    error,
    regenerate,
  };
}

/**
 * Hook to preload multiple sprites
 */
export function usePreloadSprites(
  sprites: Array<{
    customization: CharacterCustomization;
    animation: AnimationState;
  }>
): {
  isPreloading: boolean;
  progress: number;
} {
  const [isPreloading, setIsPreloading] = useState(true);
  const [progress, setProgress] = useState(0);

  const generator = getSpriteGenerator();
  const cache = getSpriteCache();

  useEffect(() => {
    let cancelled = false;

    async function preload() {
      setIsPreloading(true);
      setProgress(0);

      for (let i = 0; i < sprites.length; i++) {
        if (cancelled) break;

        const { customization, animation } = sprites[i];
        const cacheKey = JSON.stringify({ customization, animation });

        // Check if already cached
        const cached = await cache.has(cacheKey);
        if (!cached) {
          try {
            const canvas = await generator.generateCharacterSprite(
              customization,
              animation
            );
            await cache.set(cacheKey, canvas);
          } catch (error) {
            console.warn('Preload failed for sprite:', error);
          }
        }

        setProgress(((i + 1) / sprites.length) * 100);
      }

      if (!cancelled) {
        setIsPreloading(false);
      }
    }

    preload();

    return () => {
      cancelled = true;
    };
  }, [sprites]);

  return { isPreloading, progress };
}
