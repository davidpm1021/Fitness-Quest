// lib/sprites/SpriteGenerator.ts
// Main sprite generation class with layering and customization support

import {
  CharacterCustomization,
  ColorPalette,
  DEFAULT_PALETTE,
  AnimationState,
  ANIMATION_CONFIGS,
  LayerDefinition,
  SpriteLayer,
} from './types';
import { paletteSwap, generateShadingPalette } from '../utils/color-utils';
import {
  createPixelCanvas,
  loadImage,
  extractFrame,
  composeLayers,
  cloneCanvas,
} from '../utils/canvas-helpers';

export class SpriteGenerator {
  private layerCache: Map<string, HTMLCanvasElement> = new Map();
  private palette: ColorPalette;
  private maxCacheSize: number = 100;

  constructor(palette: ColorPalette = DEFAULT_PALETTE, maxCacheSize: number = 100) {
    this.palette = palette;
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Generate a complete character sprite sheet for an animation
   */
  async generateCharacterSprite(
    customization: CharacterCustomization,
    animation: AnimationState,
    frameWidth: number = 32,
    frameHeight: number = 32
  ): Promise<HTMLCanvasElement> {
    const animConfig = ANIMATION_CONFIGS[animation];
    const frameCount = animConfig.frameCount;

    // Create output canvas for full sprite sheet
    const { canvas, ctx } = createPixelCanvas(
      frameWidth * frameCount,
      frameHeight
    );

    // Generate each frame
    for (let frame = 0; frame < frameCount; frame++) {
      const frameCanvas = await this.generateCharacterFrame(
        customization,
        animation,
        frame,
        frameWidth,
        frameHeight
      );

      // Draw frame onto sprite sheet
      const offsetX = frame * frameWidth;
      ctx.drawImage(frameCanvas, offsetX, 0);
    }

    return canvas;
  }

  /**
   * Generate a single frame of character animation
   */
  private async generateCharacterFrame(
    customization: CharacterCustomization,
    animation: AnimationState,
    frameIndex: number,
    frameWidth: number,
    frameHeight: number
  ): Promise<HTMLCanvasElement> {
    // Skip asset loading - we're using procedural generation exclusively
    // In the future, if sprite assets exist, this could try loading them first
    throw new Error('Using procedural generation');
  }

  /**
   * Load and stack character layers based on customization
   */
  private async loadCharacterLayers(
    customization: CharacterCustomization,
    animation: AnimationState,
    frameIndex: number,
    frameWidth: number,
    frameHeight: number
  ): Promise<LayerDefinition[]> {
    const layers: LayerDefinition[] = [];

    // Build color maps for this character
    const skinColorMap = this.buildSkinColorMap(customization);
    const hairColorMap = this.buildHairColorMap(customization);
    const outfitColorMap = this.buildOutfitColorMap(customization);

    // Layer 1: Shadow (optional)
    // layers.push({
    //   layer: SpriteLayer.SHADOW,
    //   path: `/sprites/characters/base/shadow.png`,
    //   opacity: 0.3,
    // });

    // Layer 2: Body
    const bodyPath = `/sprites/characters/base/body-${customization.bodyType}-${customization.gender}-${animation}.png`;
    const bodyCanvas = await this.loadLayerFrame(
      bodyPath,
      frameIndex,
      frameWidth,
      frameHeight
    );
    if (bodyCanvas) {
      layers.push({
        layer: SpriteLayer.BODY,
        path: bodyPath,
        canvas: bodyCanvas,
        colorMap: skinColorMap,
      });
    }

    // Layer 3: Outfit
    const outfitPath = `/sprites/characters/outfits/outfit-${customization.outfit}-${animation}.png`;
    const outfitCanvas = await this.loadLayerFrame(
      outfitPath,
      frameIndex,
      frameWidth,
      frameHeight
    );
    if (outfitCanvas) {
      layers.push({
        layer: SpriteLayer.BODY,
        path: outfitPath,
        canvas: outfitCanvas,
        colorMap: outfitColorMap,
      });
    }

    // Layer 4: Hair
    const hairPath = `/sprites/characters/hair/${customization.hairStyle}-${animation}.png`;
    const hairCanvas = await this.loadLayerFrame(
      hairPath,
      frameIndex,
      frameWidth,
      frameHeight
    );
    if (hairCanvas) {
      layers.push({
        layer: SpriteLayer.HAIR,
        path: hairPath,
        canvas: hairCanvas,
        colorMap: hairColorMap,
      });
    }

    // Layer 5: Accessories (if any)
    if (customization.accessories) {
      for (const [type, accessoryId] of Object.entries(customization.accessories)) {
        if (accessoryId) {
          const accessoryPath = `/sprites/characters/accessories/${type}-${accessoryId}-${animation}.png`;
          const accessoryCanvas = await this.loadLayerFrame(
            accessoryPath,
            frameIndex,
            frameWidth,
            frameHeight
          );
          if (accessoryCanvas) {
            layers.push({
              layer: SpriteLayer.FRONT_ACCESSORY,
              path: accessoryPath,
              canvas: accessoryCanvas,
            });
          }
        }
      }
    }

    return layers.filter((l) => l.canvas);
  }

  /**
   * Load a single frame from a sprite sheet layer
   */
  private async loadLayerFrame(
    path: string,
    frameIndex: number,
    frameWidth: number,
    frameHeight: number
  ): Promise<HTMLCanvasElement | null> {
    const cacheKey = `${path}-${frameIndex}`;

    // Check cache
    if (this.layerCache.has(cacheKey)) {
      return cloneCanvas(this.layerCache.get(cacheKey)!);
    }

    // Load full sprite sheet
    const img = await loadImage(path);
    if (!img) {
      // If specific animation sprite doesn't exist, try idle fallback
      if (!path.includes('-idle.png')) {
        const fallbackPath = path.replace(/-\w+\.png$/, '-idle.png');
        return this.loadLayerFrame(fallbackPath, 0, frameWidth, frameHeight);
      }
      return null;
    }

    // Extract specific frame
    const frameCanvas = extractFrame(img, frameIndex, frameWidth, frameHeight);

    // Cache it (with size limit)
    if (this.layerCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.layerCache.keys().next().value;
      if (firstKey) {
        this.layerCache.delete(firstKey);
      }
    }
    this.layerCache.set(cacheKey, cloneCanvas(frameCanvas));

    return frameCanvas;
  }

  /**
   * Build color map for skin tones
   */
  private buildSkinColorMap(
    customization: CharacterCustomization
  ): Map<string, string> {
    const map = new Map<string, string>();

    // Base skin color
    const baseSkin = this.palette.skin[customization.skinTone];

    // Generate 3-tone shading
    const [shadow, base, highlight] = generateShadingPalette(baseSkin);

    // Map placeholder colors to actual colors
    map.set('#fbbf24', base); // Base skin
    map.set('#f59e0b', shadow); // Skin shadow
    map.set('#d97706', highlight); // Skin highlight

    return map;
  }

  /**
   * Build color map for hair
   */
  private buildHairColorMap(
    customization: CharacterCustomization
  ): Map<string, string> {
    const map = new Map<string, string>();

    // Base hair color
    const baseHair = this.palette.hair[customization.hairColor];

    // Generate 3-tone shading
    const [shadow, base, highlight] = generateShadingPalette(baseHair);

    // Map placeholder colors to actual colors
    map.set('#92400e', base); // Base hair
    map.set('#78350f', shadow); // Hair shadow
    map.set('#451a03', highlight); // Hair highlight

    return map;
  }

  /**
   * Build color map for outfit
   */
  private buildOutfitColorMap(
    customization: CharacterCustomization
  ): Map<string, string> {
    const map = new Map<string, string>();

    // Base outfit color
    const baseOutfit = this.palette.outfit[customization.outfitColor];

    // Generate 3-tone shading
    const [shadow, base, highlight] = generateShadingPalette(baseOutfit);

    // Map placeholder colors to actual colors
    map.set('#3b82f6', base); // Base outfit
    map.set('#2563eb', shadow); // Outfit shadow
    map.set('#1e40af', highlight); // Outfit highlight

    return map;
  }

  /**
   * Generate a procedural character sprite (when no assets exist)
   * This creates a simple geometric character
   */
  async generateProceduralCharacter(
    customization: CharacterCustomization,
    animation: AnimationState,
    frameWidth: number = 32,
    frameHeight: number = 32
  ): Promise<HTMLCanvasElement> {
    const animConfig = ANIMATION_CONFIGS[animation];
    const frameCount = animConfig.frameCount;

    const { canvas, ctx } = createPixelCanvas(
      frameWidth * frameCount,
      frameHeight
    );

    // Get colors
    const skinColor = this.palette.skin[customization.skinTone];
    const hairColor = this.palette.hair[customization.hairColor];
    const outfitColor = this.palette.outfit[customization.outfitColor];

    // Generate each frame
    for (let frame = 0; frame < frameCount; frame++) {
      const offsetX = frame * frameWidth;

      // Draw detailed character with animation
      this.drawSimpleCharacter(
        ctx,
        offsetX + 16,
        16,
        skinColor,
        hairColor,
        outfitColor,
        customization,
        animation,
        frame,
        frameCount
      );
    }

    return canvas;
  }

  /**
   * Calculate animation-specific pose offsets using distinct keyframes
   * Classic pixel art style with 3-6 frames per animation
   */
  private calculateAnimationPose(
    animation: AnimationState,
    frame: number,
    frameCount: number
  ): {
    bobOffset: number;
    armOffset: number;
    weaponAngle: number;
    legOffset: number;
  } {
    if (animation === 'idle') {
      // 4-frame idle: subtle breathing
      const poses = [
        { bobOffset: 0, armOffset: 0, weaponAngle: 0, legOffset: 0 },      // Frame 0: neutral
        { bobOffset: -1, armOffset: -0.5, weaponAngle: 0, legOffset: 0 },   // Frame 1: inhale
        { bobOffset: 0, armOffset: 0, weaponAngle: 0, legOffset: 0 },      // Frame 2: neutral
        { bobOffset: 1, armOffset: 0.5, weaponAngle: 0, legOffset: 0 },    // Frame 3: exhale
      ];
      return poses[frame % frameCount];
    } else if (animation === 'attack') {
      // 4-frame attack: Classic SNES-style with distinct keyframes
      const poses = [
        { bobOffset: 0, armOffset: 0, weaponAngle: 0, legOffset: 0 },         // Frame 0: neutral stance
        { bobOffset: 1, armOffset: -3, weaponAngle: -60, legOffset: -1 },     // Frame 1: WIND-UP (exaggerated pull back)
        { bobOffset: -2, armOffset: 5, weaponAngle: 90, legOffset: 2 },       // Frame 2: STRIKE! (peak action, maximum extension)
        { bobOffset: 0, armOffset: 1, weaponAngle: 20, legOffset: 0 },        // Frame 3: follow-through/recovery
      ];
      return poses[frame % frameCount];
    } else if (animation === 'victory') {
      // 6-frame victory: Celebratory jumping
      const poses = [
        { bobOffset: 0, armOffset: 0, weaponAngle: 0, legOffset: 0 },         // Frame 0: start
        { bobOffset: -1, armOffset: 2, weaponAngle: 45, legOffset: -0.5 },    // Frame 1: crouch
        { bobOffset: -3, armOffset: 4, weaponAngle: 90, legOffset: -1 },      // Frame 2: JUMP! (peak)
        { bobOffset: -2, armOffset: 4, weaponAngle: 80, legOffset: -0.5 },    // Frame 3: air
        { bobOffset: 0, armOffset: 3, weaponAngle: 60, legOffset: 0 },        // Frame 4: land
        { bobOffset: 1, armOffset: 1, weaponAngle: 20, legOffset: 0.5 },      // Frame 5: settle
      ];
      return poses[frame % frameCount];
    } else if (animation === 'hit') {
      // 3-frame hit: Quick hit reaction
      const poses = [
        { bobOffset: 0, armOffset: 0, weaponAngle: 0, legOffset: 0 },         // Frame 0: normal
        { bobOffset: -2, armOffset: -1, weaponAngle: -15, legOffset: -0.5 },  // Frame 1: IMPACT! (recoil)
        { bobOffset: -1, armOffset: -0.5, weaponAngle: -5, legOffset: -0.2 }, // Frame 2: recover
      ];
      return poses[frame % frameCount];
    } else if (animation === 'defend') {
      // 2-frame defend: Fast defensive pose
      const poses = [
        { bobOffset: 0, armOffset: -1, weaponAngle: -30, legOffset: 0 },      // Frame 0: ready
        { bobOffset: -1, armOffset: -2, weaponAngle: -50, legOffset: 0.3 },   // Frame 1: BLOCK! (crouch)
      ];
      return poses[frame % frameCount];
    } else if (animation === 'support') {
      // 4-frame support: Casting/healing gesture
      const poses = [
        { bobOffset: 0, armOffset: 0, weaponAngle: 0, legOffset: 0 },         // Frame 0: start
        { bobOffset: 0, armOffset: 1, weaponAngle: 15, legOffset: 0 },        // Frame 1: raise arms
        { bobOffset: 0.5, armOffset: 2, weaponAngle: 30, legOffset: 0 },      // Frame 2: CAST! (peak)
        { bobOffset: 0, armOffset: 1, weaponAngle: 10, legOffset: 0 },        // Frame 3: lower
      ];
      return poses[frame % frameCount];
    } else if (animation === 'heroic-strike') {
      // 6-frame heroic-strike: Epic special move with multiple phases
      const poses = [
        { bobOffset: 0, armOffset: 0, weaponAngle: 0, legOffset: 0 },         // Frame 0: ready
        { bobOffset: -2, armOffset: -3, weaponAngle: -60, legOffset: -1 },    // Frame 1: charge up (deep)
        { bobOffset: -3, armOffset: -4, weaponAngle: -90, legOffset: -1.5 },  // Frame 2: maximum charge!
        { bobOffset: -1, armOffset: 0, weaponAngle: 0, legOffset: 1 },        // Frame 3: leap/transition
        { bobOffset: -2, armOffset: 5, weaponAngle: 110, legOffset: 2 },      // Frame 4: EPIC STRIKE! (max power)
        { bobOffset: 0, armOffset: 2, weaponAngle: 30, legOffset: 0.5 },      // Frame 5: follow-through
      ];
      return poses[frame % frameCount];
    }

    return {
      bobOffset: 0,
      armOffset: 0,
      weaponAngle: 0,
      legOffset: 0,
    };
  }

  /**
   * Draw a detailed procedural character with Stardew Valley-quality pixel art
   */
  private drawSimpleCharacter(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    skinColor: string,
    hairColor: string,
    outfitColor: string,
    customization: CharacterCustomization,
    animation: AnimationState,
    frame: number,
    frameCount: number
  ): void {
    const pose = this.calculateAnimationPose(animation, frame, frameCount);
    const [skinShadow, skinBase, skinHighlight] = generateShadingPalette(skinColor);
    const [hairShadow, hairBase, hairHighlight] = generateShadingPalette(hairColor);
    const [outfitShadow, outfitBase, outfitHighlight] =
      generateShadingPalette(outfitColor);

    const y = centerY + Math.round(pose.bobOffset);

    // Draw in correct layer order: back arm, legs, body, head, front arm, hair, weapon

    // Back arm (left arm for front-facing sprites)
    this.drawArm(
      ctx,
      centerX - 6,
      y + 1 + pose.armOffset,
      skinBase,
      skinShadow,
      'left',
      animation
    );

    // Legs with walking animation
    this.drawLegs(
      ctx,
      centerX,
      y + 10,
      outfitBase,
      outfitShadow,
      skinBase,
      customization.bodyType,
      pose.legOffset
    );

    // Body/torso with outfit details
    this.drawBody(
      ctx,
      centerX,
      y,
      outfitBase,
      outfitShadow,
      outfitHighlight,
      customization.outfit,
      customization.bodyType
    );

    // Head with shading
    this.drawHead(ctx, centerX, y - 7, skinBase, skinShadow, skinHighlight);

    // Facial features
    this.drawFace(ctx, centerX, y - 7, customization.gender);

    // Front arm (right arm)
    this.drawArm(
      ctx,
      centerX + 6,
      y + 1 + pose.armOffset,
      skinBase,
      skinShadow,
      'right',
      animation
    );

    // Hair (on top of head)
    this.drawHair(
      ctx,
      centerX,
      y - 7,
      hairBase,
      hairShadow,
      hairHighlight,
      customization.hairStyle,
      customization.gender
    );

    // Weapon (rendered last, on top)
    if (animation !== 'idle' && animation !== 'hit') {
      this.drawWeapon(
        ctx,
        centerX + 7,
        y + pose.armOffset,
        customization.outfit,
        pose.weaponAngle
      );
    }
  }

  /**
   * Draw detailed head with 3-tone shading
   */
  private drawHead(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    base: string,
    shadow: string,
    highlight: string
  ): void {
    // Base head shape (8x9 pixels for more detail)
    ctx.fillStyle = base;
    ctx.fillRect(x - 3, y, 6, 8);

    // Round top of head
    ctx.fillRect(x - 4, y + 1, 8, 6);

    // Shadow on left side
    ctx.fillStyle = shadow;
    ctx.fillRect(x - 4, y + 2, 1, 5);
    ctx.fillRect(x - 3, y + 6, 1, 2);

    // Highlight on right side
    ctx.fillStyle = highlight;
    ctx.fillRect(x + 3, y + 1, 1, 3);

    // Neck
    ctx.fillStyle = base;
    ctx.fillRect(x - 2, y + 7, 4, 2);
    ctx.fillStyle = shadow;
    ctx.fillRect(x - 2, y + 8, 1, 1);
  }

  /**
   * Draw facial features
   */
  private drawFace(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    gender: 'male' | 'female' | 'nonbinary'
  ): void {
    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 2, y + 3, 1, 1); // Left eye
    ctx.fillRect(x + 1, y + 3, 1, 1); // Right eye

    // Eye shine (makes them look alive)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, y + 3, 1, 0.5);
    ctx.fillRect(x + 1, y + 3, 1, 0.5);

    // Nose (small)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x, y + 4, 1, 1);

    // Mouth (subtle smile)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    if (gender === 'female') {
      ctx.fillRect(x - 1, y + 6, 2, 1);
    } else {
      ctx.fillRect(x - 1, y + 5, 2, 1);
    }
  }

  /**
   * Draw detailed hair with multiple style options
   */
  private drawHair(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    base: string,
    shadow: string,
    highlight: string,
    style: string,
    gender: 'male' | 'female' | 'nonbinary'
  ): void {
    ctx.fillStyle = base;

    // Parse hair style
    const isShort = style.includes('short');
    const isMedium = style.includes('medium');
    const isLong = style.includes('long');
    const isCurly = style.includes('curly');
    const isSpiky = style.includes('spiky');

    if (isShort || style === 'short-01') {
      // Short hair - covers top of head
      ctx.fillRect(x - 4, y - 1, 8, 3);
      ctx.fillStyle = shadow;
      ctx.fillRect(x - 4, y + 1, 8, 1);
      // Bangs
      ctx.fillStyle = base;
      ctx.fillRect(x - 3, y + 2, 2, 1);
      ctx.fillRect(x + 1, y + 2, 2, 1);
    } else if (isMedium) {
      // Medium length - to shoulders
      ctx.fillRect(x - 4, y - 1, 8, 4);
      ctx.fillRect(x - 5, y + 2, 2, 3);
      ctx.fillRect(x + 3, y + 2, 2, 3);
      ctx.fillStyle = shadow;
      ctx.fillRect(x - 4, y + 2, 8, 1);
    } else if (isLong) {
      // Long hair - past shoulders
      ctx.fillRect(x - 4, y - 1, 8, 5);
      ctx.fillRect(x - 5, y + 2, 2, 6);
      ctx.fillRect(x + 3, y + 2, 2, 6);
      ctx.fillStyle = shadow;
      ctx.fillRect(x - 4, y + 3, 8, 1);
      ctx.fillRect(x - 5, y + 5, 2, 1);
      ctx.fillRect(x + 3, y + 5, 2, 1);
    } else if (isSpiky) {
      // Spiky hair
      ctx.fillRect(x - 4, y - 2, 2, 3);
      ctx.fillRect(x - 2, y - 1, 2, 3);
      ctx.fillRect(x, y - 2, 2, 3);
      ctx.fillRect(x + 2, y - 1, 2, 3);
      ctx.fillStyle = highlight;
      ctx.fillRect(x - 3, y - 2, 1, 1);
      ctx.fillRect(x - 1, y - 1, 1, 1);
      ctx.fillRect(x + 1, y - 2, 1, 1);
    } else {
      // Default medium style
      ctx.fillRect(x - 4, y - 1, 8, 4);
      ctx.fillStyle = shadow;
      ctx.fillRect(x - 4, y + 2, 8, 1);
    }

    // Add highlights
    ctx.fillStyle = highlight;
    ctx.fillRect(x + 2, y, 1, 1);
  }

  /**
   * Draw detailed body with outfit-specific details
   */
  private drawBody(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    base: string,
    shadow: string,
    highlight: string,
    outfit: string,
    bodyType: string
  ): void {
    const width = bodyType === 'heavy' ? 11 : bodyType === 'slim' ? 8 : 10;

    // Base torso
    ctx.fillStyle = base;
    ctx.fillRect(x - Math.floor(width / 2), y, width, 9);

    // Add outfit-specific details
    if (outfit === 'athletic') {
      // Athletic wear - add stripes
      ctx.fillStyle = shadow;
      ctx.fillRect(x - Math.floor(width / 2), y + 2, width, 1);
      ctx.fillRect(x - Math.floor(width / 2), y + 5, width, 1);
      ctx.fillStyle = highlight;
      ctx.fillRect(x - 1, y + 1, 2, 7);
    } else if (outfit === 'armor') {
      // Armor - add plates
      ctx.fillStyle = shadow;
      ctx.fillRect(x - Math.floor(width / 2), y, width, 1);
      ctx.fillRect(x - Math.floor(width / 2), y + 4, width, 1);
      ctx.fillStyle = highlight;
      ctx.fillRect(x - 2, y + 1, 1, 2);
      ctx.fillRect(x + 1, y + 1, 1, 2);
      ctx.fillRect(x - 1, y + 5, 2, 2);
    } else if (outfit === 'wizard') {
      // Wizard robe - flowing
      ctx.fillStyle = base;
      ctx.fillRect(x - Math.floor(width / 2) - 1, y + 3, width + 2, 6);
      ctx.fillStyle = shadow;
      ctx.fillRect(x - Math.floor(width / 2) - 1, y + 7, width + 2, 1);
      // Mystical symbols
      ctx.fillStyle = highlight;
      ctx.fillRect(x - 1, y + 2, 1, 1);
      ctx.fillRect(x, y + 4, 1, 1);
    } else if (outfit === 'knight') {
      // Knight armor - chainmail pattern
      ctx.fillStyle = shadow;
      for (let dy = 0; dy < 9; dy += 2) {
        for (let dx = 0; dx < width; dx += 2) {
          ctx.fillRect(
            x - Math.floor(width / 2) + dx + (dy % 4 === 0 ? 0 : 1),
            y + dy,
            1,
            1
          );
        }
      }
    } else if (outfit === 'ninja') {
      // Ninja - dark with belt
      ctx.fillStyle = shadow;
      ctx.fillRect(x - Math.floor(width / 2), y + 4, width, 2);
      ctx.fillStyle = highlight;
      ctx.fillRect(x - 2, y + 5, 4, 1);
    } else {
      // Casual - simple shading
      ctx.fillStyle = shadow;
      ctx.fillRect(x - Math.floor(width / 2), y, 1, 9);
      ctx.fillRect(x - Math.floor(width / 2), y + 8, width, 1);
      ctx.fillStyle = highlight;
      ctx.fillRect(x + Math.floor(width / 2) - 1, y + 1, 1, 7);
    }
  }

  /**
   * Draw detailed arm with hand
   */
  private drawArm(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    base: string,
    shadow: string,
    side: 'left' | 'right',
    animation: AnimationState
  ): void {
    const isRight = side === 'right';

    // Upper arm
    ctx.fillStyle = base;
    ctx.fillRect(x, y, 2, 5);

    // Forearm
    if (animation === 'attack' || animation === 'defend') {
      // Bent arm during action
      ctx.fillRect(x + (isRight ? 1 : -1), y + 4, 2, 4);
    } else {
      ctx.fillRect(x, y + 4, 2, 4);
    }

    // Hand
    ctx.fillRect(x, y + 7, 2, 2);

    // Shadow for depth
    ctx.fillStyle = shadow;
    ctx.fillRect(x + (isRight ? 0 : 1), y + 1, 1, 7);
  }

  /**
   * Draw legs with walking animation
   */
  private drawLegs(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    base: string,
    shadow: string,
    skinColor: string,
    bodyType: string,
    offset: number
  ): void {
    const width = bodyType === 'heavy' ? 4 : bodyType === 'slim' ? 2 : 3;

    // Left leg
    ctx.fillStyle = base;
    ctx.fillRect(x - width - 1, y + offset, width, 5);
    ctx.fillStyle = shadow;
    ctx.fillRect(x - width - 1, y + offset, 1, 5);

    // Right leg
    ctx.fillStyle = base;
    ctx.fillRect(x + 1, y - offset, width, 5);
    ctx.fillStyle = shadow;
    ctx.fillRect(x + 1, y - offset, 1, 5);

    // Feet
    ctx.fillStyle = shadow;
    ctx.fillRect(x - width - 1, y + 5, width + 1, 1);
    ctx.fillRect(x + 1, y + 5, width + 1, 1);
  }

  /**
   * Draw weapon based on outfit type
   */
  private drawWeapon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    outfit: string,
    angle: number
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);

    if (outfit === 'knight' || outfit === 'armor') {
      // Sword
      ctx.fillStyle = '#8b9dc3'; // Blade
      ctx.fillRect(-1, -8, 2, 10);
      ctx.fillStyle = '#4a5568'; // Edge
      ctx.fillRect(-1, -8, 1, 10);
      ctx.fillStyle = '#92400e'; // Handle
      ctx.fillRect(-1, 2, 2, 3);
      ctx.fillStyle = '#d97706'; // Guard
      ctx.fillRect(-2, 1, 4, 1);
    } else if (outfit === 'wizard') {
      // Staff
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, -10, 1, 14);
      ctx.fillStyle = '#8b5cf6'; // Magical crystal
      ctx.fillRect(-1, -11, 3, 2);
      ctx.fillStyle = '#a78bfa'; // Glow
      ctx.fillRect(0, -11, 1, 1);
    } else if (outfit === 'ninja') {
      // Katana
      ctx.fillStyle = '#cbd5e0'; // Blade
      ctx.fillRect(0, -9, 1, 11);
      ctx.fillStyle = '#1a202c'; // Handle
      ctx.fillRect(0, 2, 1, 3);
      ctx.fillStyle = '#dc2626'; // Wrap
      ctx.fillRect(0, 3, 1, 1);
    } else {
      // Default weapon (dagger)
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(0, -5, 1, 7);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 2, 1, 2);
    }

    ctx.restore();
  }

  /**
   * Export sprite to data URL
   */
  exportToDataURL(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL('image/png');
  }

  /**
   * Export sprite to blob
   */
  async exportToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  /**
   * Clear layer cache
   */
  clearCache(): void {
    this.layerCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.layerCache.size;
  }
}

// Singleton instance
let generatorInstance: SpriteGenerator | null = null;

/**
 * Get singleton sprite generator instance
 */
export function getSpriteGenerator(): SpriteGenerator {
  if (!generatorInstance) {
    generatorInstance = new SpriteGenerator();
  }
  return generatorInstance;
}
