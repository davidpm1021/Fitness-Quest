// lib/sprites/types.ts
// Type definitions for the modular sprite generation system

export type BodyType = 'athletic' | 'heavy' | 'slim';
export type Gender = 'male' | 'female' | 'nonbinary';
export type SkinTone = 0 | 1 | 2 | 3;
export type HairStyle =
  | 'short-01'
  | 'short-spiky'
  | 'medium-01'
  | 'medium-curly'
  | 'long-01'
  | 'long-wavy';
export type OutfitType = 'athletic' | 'casual' | 'armor' | 'ninja' | 'wizard' | 'knight';

export interface CharacterCustomization {
  // Physical attributes
  bodyType: BodyType;
  gender: Gender;

  // Appearance
  skinTone: SkinTone;
  hairStyle: HairStyle;
  hairColor: number;
  eyeColor?: number;

  // Clothing
  outfit: OutfitType;
  outfitColor: number;

  // Accessories (optional)
  accessories?: {
    glasses?: string;
    hat?: string;
    cape?: string;
    headband?: string;
  };
}

export interface ColorPalette {
  skin: string[];      // 4 skin tone variations
  hair: string[];      // 8+ hair color options
  outfit: string[];    // 16+ outfit color variations
  accent: string[];    // 4 accent colors
  eye: string[];       // 8+ eye color options
}

export const DEFAULT_PALETTE: ColorPalette = {
  skin: [
    '#fbbf24',  // Light
    '#d97706',  // Medium
    '#92400e',  // Dark
    '#fef3c7',  // Very light
  ],
  hair: [
    '#92400e',  // Brown
    '#000000',  // Black
    '#fbbf24',  // Blonde
    '#dc2626',  // Red
    '#6b7280',  // Gray
    '#8b5cf6',  // Purple
    '#10b981',  // Green
    '#ec4899',  // Pink
  ],
  outfit: [
    '#3b82f6',  // Blue
    '#ef4444',  // Red
    '#10b981',  // Green
    '#f59e0b',  // Orange
    '#8b5cf6',  // Purple
    '#06b6d4',  // Cyan
    '#ec4899',  // Pink
    '#84cc16',  // Lime
    '#facc15',  // Yellow
    '#f43f5e',  // Rose
    '#14b8a6',  // Teal
    '#a855f7',  // Violet
    '#fb923c',  // Orange (light)
    '#4ade80',  // Green (light)
    '#60a5fa',  // Blue (light)
    '#c084fc',  // Purple (light)
  ],
  accent: [
    '#ffffff',  // White
    '#000000',  // Black
    '#fbbf24',  // Gold
    '#9ca3af',  // Silver
  ],
  eye: [
    '#3b82f6',  // Blue
    '#10b981',  // Green
    '#92400e',  // Brown
    '#6b7280',  // Gray
    '#8b5cf6',  // Purple
    '#000000',  // Black
    '#10b981',  // Emerald
    '#f59e0b',  // Amber
  ],
};

export type AnimationState =
  | 'idle'
  | 'attack'
  | 'victory'
  | 'hit'
  | 'defend'
  | 'support'
  | 'heroic-strike';

export interface AnimationConfig {
  frameCount: number;
  fps: number;
  loop: boolean;
  duration: number;
}

export const ANIMATION_CONFIGS: Record<AnimationState, AnimationConfig> = {
  idle: { frameCount: 4, fps: 12, loop: true, duration: 333 },  // Classic 4-frame breathing
  attack: { frameCount: 4, fps: 12, loop: false, duration: 333 },  // 4-frame attack: wind-up -> strike -> follow-through -> recover
  victory: { frameCount: 6, fps: 12, loop: true, duration: 500 },  // 6-frame celebration
  hit: { frameCount: 3, fps: 12, loop: false, duration: 250 },  // Quick 3-frame hit reaction
  defend: { frameCount: 2, fps: 12, loop: false, duration: 167 },  // Fast 2-frame defensive pose
  support: { frameCount: 4, fps: 12, loop: false, duration: 333 },  // 4-frame support cast
  'heroic-strike': { frameCount: 6, fps: 12, loop: false, duration: 500 },  // 6-frame epic move
};

export enum SpriteLayer {
  SHADOW = 0,
  BACK_ARM = 1,
  BACK_ACCESSORY = 2,
  LEGS = 3,
  BODY = 4,
  FRONT_ARM = 5,
  HEAD = 6,
  HAIR = 7,
  FRONT_ACCESSORY = 8,
  HELD_ITEM = 9,
}

export interface LayerDefinition {
  layer: SpriteLayer;
  path: string;
  opacity?: number;
  colorMap?: Map<string, string>;
}

export interface SpriteGenerationOptions {
  customization: CharacterCustomization;
  animation: AnimationState;
  frameCount: number;
  frameWidth?: number;
  frameHeight?: number;
  palette?: ColorPalette;
}

export interface CachedSprite {
  key: string;
  dataURL: string;
  timestamp: number;
}
