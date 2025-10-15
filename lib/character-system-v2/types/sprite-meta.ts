/**
 * Sprite Metadata Schema - Character System V2
 *
 * This schema defines the structure of sprite sheets and their metadata
 * for the new PixiJS-based rendering system.
 */

/**
 * Animation keys for all character and monster states
 */
export type AnimKey =
  | "idle"
  | "walk"
  | "attack"
  | "hit"
  | "victory"
  | "defend"
  | "support"
  | "heroic_strike";

/**
 * Color map for palette swapping
 * Allows recoloring sprites for customization (skin tone, hair color, etc.)
 */
export interface ColorMap {
  from: string;  // Original hex color (e.g., "#fbbf24")
  to: string;    // Replacement hex color (e.g., "#d97706")
}

/**
 * Anchor point for sprite positioning
 * Values are normalized (0..1) representing position within the frame
 */
export interface SpriteAnchor {
  x: number;  // 0 = left, 0.5 = center, 1 = right
  y: number;  // 0 = top, 0.5 = center, 1 = bottom
}

/**
 * Per-layer per-frame pixel offsets for fine-tuning alignment
 */
export interface LayerOffset {
  x: number;  // Horizontal pixel offset
  y: number;  // Vertical pixel offset
}

/**
 * Complete sprite metadata schema
 * Exported from Aseprite or hand-authored for sprite sheets
 */
export interface SpriteMeta {
  /** Frame width in pixels (typically 32 or 48) */
  frameWidth: number;

  /** Frame height in pixels (typically 32 or 48) */
  frameHeight: number;

  /** Number of frames per row in the sprite sheet */
  columns: number;

  /** Number of rows in the sprite sheet */
  rows: number;

  /** Animation definitions mapping animation names to frame indices */
  animations: Record<AnimKey, number[]>;

  /** Optional anchor point for sprite positioning (defaults to {x: 0.5, y: 0.9}) */
  anchors?: SpriteAnchor;

  /** Optional layer names for modular sprite composition */
  layers?: string[];

  /** Optional per-layer per-frame pixel offsets for alignment */
  offsets?: Record<string, LayerOffset[]>;

  /** Asset version for cache busting (e.g., "1.0.0") */
  version: string;

  /** Optional frame rate for this sprite (defaults to 12 FPS) */
  fps?: number;

  /** Optional tags for categorization and filtering */
  tags?: string[];
}

/**
 * Sprite layer definition for modular composition
 */
export interface SpriteLayer {
  /** Layer name (e.g., "base", "hair", "outfit", "weapon") */
  name: string;

  /** Path to the layer's sprite sheet PNG */
  spritePath: string;

  /** Path to the layer's metadata JSON */
  metadataPath: string;

  /** Optional z-index for layer ordering (higher = in front) */
  zIndex?: number;

  /** Optional color maps for palette swapping */
  colorMaps?: ColorMap[];

  /** Optional opacity (0..1, defaults to 1) */
  opacity?: number;

  /** Optional blend mode (defaults to "normal") */
  blendMode?: "normal" | "add" | "multiply" | "screen";
}

/**
 * Complete character sprite definition with all layers
 */
export interface CharacterSprite {
  /** Unique identifier for this character sprite configuration */
  id: string;

  /** Display name */
  name: string;

  /** Base sprite layer (required) */
  baseLayer: SpriteLayer;

  /** Additional cosmetic layers (hair, outfit, accessories, weapon) */
  layers: SpriteLayer[];

  /** Default animation to play when idle */
  defaultAnimation?: AnimKey;

  /** Optional metadata for this character configuration */
  metadata?: {
    author?: string;
    created?: string;
    description?: string;
  };
}

/**
 * Animation state for the animation controller
 */
export interface AnimationState {
  /** Current animation being played */
  currentAnimation: AnimKey;

  /** Current frame index within the animation */
  currentFrame: number;

  /** Whether the animation is currently playing */
  isPlaying: boolean;

  /** Whether the animation should loop */
  loop: boolean;

  /** Time accumulator for frame timing */
  timeAccumulator: number;

  /** Frames per second for this animation */
  fps: number;
}

/**
 * Texture atlas frame definition
 * Used when combining multiple sprites into a single texture atlas
 */
export interface AtlasFrame {
  /** Frame identifier */
  name: string;

  /** X position in atlas */
  x: number;

  /** Y position in atlas */
  y: number;

  /** Frame width */
  width: number;

  /** Frame height */
  height: number;

  /** Optional rotation (0, 90, 180, 270) */
  rotated?: boolean;

  /** Optional trim data for optimized packing */
  trimmed?: boolean;
  spriteSourceSize?: { x: number; y: number; w: number; h: number };
  sourceSize?: { w: number; h: number };
}

/**
 * Texture atlas definition
 * Combines multiple sprite sheets to reduce HTTP requests
 */
export interface TextureAtlas {
  /** Frames in this atlas */
  frames: Record<string, AtlasFrame>;

  /** Atlas metadata */
  meta: {
    /** Path to atlas image */
    image: string;

    /** Atlas dimensions */
    size: { w: number; h: number };

    /** Scale factor */
    scale?: string;

    /** Format version */
    version?: string;
  };
}

/**
 * Sprite cache key for memoization
 */
export interface SpriteCacheKey {
  /** Metadata version */
  metaVersion: string;

  /** Base sprite ID */
  baseId: string;

  /** Cosmetic layer IDs (comma-separated) */
  cosmeticIds: string;

  /** Palette map signature */
  paletteMap: string;

  /** Animation key */
  animKey: AnimKey;

  /** Frame index */
  frameIndex: number;
}

/**
 * Helper type for sprite loading states
 */
export type SpriteLoadState =
  | { status: "idle" }
  | { status: "loading"; progress: number }
  | { status: "loaded"; data: SpriteMeta }
  | { status: "error"; error: string };
