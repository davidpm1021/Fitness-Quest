import { Assets, Texture, Rectangle } from 'pixi.js';
import type { SpriteMeta } from '../types';

/**
 * Sprite Loader
 *
 * Utilities for loading sprite sheets and their metadata.
 * Handles caching, validation, and error handling.
 */

/**
 * Load a sprite sheet and its metadata
 *
 * @param spritePath Path to the sprite sheet PNG (e.g., "/sprites/characters/hero-idle.png")
 * @param metadataPath Path to the metadata JSON (e.g., "/sprites/characters/hero-idle.json")
 * @returns Promise resolving to { texture, metadata }
 */
export async function loadSprite(
  spritePath: string,
  metadataPath: string
): Promise<{ texture: Texture; metadata: SpriteMeta }> {
  try {
    // Load texture and metadata in parallel
    const [texture, metadataResponse] = await Promise.all([
      Assets.load<Texture>(spritePath),
      fetch(metadataPath),
    ]);

    // Parse metadata
    if (!metadataResponse.ok) {
      throw new Error(`Failed to load metadata: ${metadataResponse.statusText}`);
    }

    const text = await metadataResponse.text();
    if (!text || text.trim().length === 0) {
      throw new Error(`Metadata file is empty: ${metadataPath}`);
    }

    const metadata = JSON.parse(text) as SpriteMeta;

    // Validate metadata
    validateSpriteMeta(metadata);

    return { texture, metadata };
  } catch (error) {
    console.error(`Error loading sprite: ${spritePath}`, error);
    throw error;
  }
}

/**
 * Preload multiple sprites
 *
 * @param sprites Array of { spritePath, metadataPath } objects
 * @returns Promise resolving when all sprites are loaded
 */
export async function preloadSprites(
  sprites: Array<{ spritePath: string; metadataPath: string }>
): Promise<void> {
  const promises = sprites.map(({ spritePath, metadataPath }) =>
    loadSprite(spritePath, metadataPath)
  );

  await Promise.all(promises);
}

/**
 * Validate sprite metadata
 * Throws an error if metadata is invalid
 *
 * @param metadata Sprite metadata to validate
 */
function validateSpriteMeta(metadata: SpriteMeta): void {
  if (!metadata) {
    throw new Error('Metadata is null or undefined');
  }

  if (!metadata.frameWidth || metadata.frameWidth <= 0) {
    throw new Error('Invalid frameWidth in metadata');
  }

  if (!metadata.frameHeight || metadata.frameHeight <= 0) {
    throw new Error('Invalid frameHeight in metadata');
  }

  if (!metadata.columns || metadata.columns <= 0) {
    throw new Error('Invalid columns in metadata');
  }

  if (!metadata.rows || metadata.rows <= 0) {
    throw new Error('Invalid rows in metadata');
  }

  if (!metadata.animations || Object.keys(metadata.animations).length === 0) {
    throw new Error('No animations defined in metadata');
  }

  if (!metadata.version) {
    throw new Error('No version specified in metadata');
  }

  // Validate each animation
  for (const [animKey, frames] of Object.entries(metadata.animations)) {
    if (!Array.isArray(frames) || frames.length === 0) {
      throw new Error(`Animation "${animKey}" has no frames`);
    }

    // Check that frame indices are within bounds
    const maxFrames = metadata.columns * metadata.rows;
    for (const frameIndex of frames) {
      if (frameIndex < 0 || frameIndex >= maxFrames) {
        throw new Error(
          `Animation "${animKey}" has invalid frame index ${frameIndex} (max: ${maxFrames - 1})`
        );
      }
    }
  }
}

/**
 * Get the texture region for a specific frame
 *
 * @param texture Source texture
 * @param metadata Sprite metadata
 * @param frameIndex Frame index to extract
 * @returns Texture for the specific frame
 */
export function getFrameTexture(
  texture: Texture,
  metadata: SpriteMeta,
  frameIndex: number
): Texture {
  const { frameWidth, frameHeight, columns } = metadata;

  // Calculate frame position in the sprite sheet
  const row = Math.floor(frameIndex / columns);
  const col = frameIndex % columns;

  const x = col * frameWidth;
  const y = row * frameHeight;

  // PixiJS v8: Create new texture from source with specific frame region
  // Instead of clone(), use the Texture constructor with Rectangle frame parameter
  const frameTexture = new Texture({
    source: texture.source,
    frame: new Rectangle(x, y, frameWidth, frameHeight),
  });

  return frameTexture;
}

/**
 * Generate cache key for sprite composition
 *
 * @param params Cache key parameters
 * @returns String cache key
 */
export function generateCacheKey(params: {
  metaVersion: string;
  baseId: string;
  cosmeticIds: string[];
  paletteMap: string;
  animKey: string;
  frameIndex: number;
}): string {
  const { metaVersion, baseId, cosmeticIds, paletteMap, animKey, frameIndex } = params;

  return `${metaVersion}_${baseId}_${cosmeticIds.join(',')}_${paletteMap}_${animKey}_${frameIndex}`;
}

/**
 * Clear the PixiJS asset cache
 * Useful for hot-reloading during development
 */
export function clearSpriteCache(): void {
  Assets.cache.reset();
}

/**
 * Get loading progress for multiple sprites
 *
 * @param sprites Array of sprite paths
 * @returns Promise resolving to progress percentage (0-100)
 */
export async function getSpriteLoadProgress(
  sprites: string[]
): Promise<number> {
  let loaded = 0;
  const total = sprites.length;

  for (const sprite of sprites) {
    if (Assets.cache.has(sprite)) {
      loaded++;
    }
  }

  return total > 0 ? (loaded / total) * 100 : 0;
}
