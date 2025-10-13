'use client';

import { useEffect, useRef, useState } from 'react';

// LPC sprite sheets are typically 64x64 per frame
// Standard layout: 4 directions (up, left, down, right) x multiple animation frames
const SPRITE_SIZE = 64;
const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 64;

export interface CharacterLayers {
  base: string; // Body base layer (required)
  hair?: string; // Hair layer
  clothing?: string; // Clothing/outfit layer
  accessory?: string; // Hats, glasses, etc.
  weapon?: string; // Weapons
}

export interface SpriteCustomization {
  layers: CharacterLayers;
  scale?: number; // Display scale (default 2x)
  tintColors?: {
    hair?: string;
    clothing?: string;
    accessory?: string;
  };
}

interface SpriteCharacterProps {
  customization: SpriteCustomization;
  animationState?: 'idle' | 'attack' | 'hit' | 'victory' | 'walk';
  direction?: 'down' | 'left' | 'up' | 'right'; // Facing direction
  className?: string;
}

export default function SpriteCharacter({
  customization,
  animationState = 'idle',
  direction = 'down',
  className = '',
}: SpriteCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const animationFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const scale = customization.scale || 2;
  const displaySize = SPRITE_SIZE * scale;

  // Load all sprite sheet images
  useEffect(() => {
    const imagesToLoad: [string, string][] = [];

    if (customization.layers.base) {
      imagesToLoad.push(['base', customization.layers.base]);
    }
    if (customization.layers.hair) {
      imagesToLoad.push(['hair', customization.layers.hair]);
    }
    if (customization.layers.clothing) {
      imagesToLoad.push(['clothing', customization.layers.clothing]);
    }
    if (customization.layers.accessory) {
      imagesToLoad.push(['accessory', customization.layers.accessory]);
    }
    if (customization.layers.weapon) {
      imagesToLoad.push(['weapon', customization.layers.weapon]);
    }

    const imageMap = new Map<string, HTMLImageElement>();
    let loadedCount = 0;

    imagesToLoad.forEach(([key, src]) => {
      const img = new Image();
      img.onload = () => {
        imageMap.set(key, img);
        loadedCount++;
        if (loadedCount === imagesToLoad.length) {
          setLoadedImages(imageMap);
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        console.error(`Failed to load sprite: ${src}`);
        loadedCount++;
        if (loadedCount === imagesToLoad.length) {
          setLoadedImages(imageMap);
          setIsLoading(false);
        }
      };
      img.src = src;
    });

    return () => {
      imagesToLoad.forEach(([key, src]) => {
        const img = imageMap.get(key);
        if (img) {
          img.src = ''; // Cancel loading
        }
      });
    };
  }, [customization.layers]);

  // Animation loop
  useEffect(() => {
    if (isLoading || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const frameDelay = 150; // ms per frame

    const animate = (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current > frameDelay) {
        // Update frame for animations
        if (animationState === 'walk' || animationState === 'attack') {
          animationFrameRef.current = (animationFrameRef.current + 1) % 4;
        } else {
          animationFrameRef.current = 0; // Idle uses frame 0
        }

        lastFrameTimeRef.current = timestamp;
      }

      // Clear canvas
      ctx.clearRect(0, 0, displaySize, displaySize);
      ctx.imageSmoothingEnabled = false;

      // Get animation row based on state
      const row = getAnimationRow(animationState, direction);
      const frame = animationFrameRef.current;

      // Draw each layer in order (bottom to top)
      const layerOrder: (keyof CharacterLayers)[] = ['base', 'clothing', 'hair', 'accessory', 'weapon'];

      layerOrder.forEach((layerKey) => {
        const img = loadedImages.get(layerKey);
        if (!img) return;

        // Apply tint if specified
        const tintColor = customization.tintColors?.[layerKey as keyof typeof customization.tintColors];

        if (tintColor) {
          // Draw with tint (more complex - requires offscreen canvas)
          drawTintedSprite(ctx, img, frame, row, tintColor, scale);
        } else {
          // Draw normal sprite
          ctx.drawImage(
            img,
            frame * FRAME_WIDTH, // Source X
            row * FRAME_HEIGHT,   // Source Y
            FRAME_WIDTH,          // Source width
            FRAME_HEIGHT,         // Source height
            0,                    // Dest X
            0,                    // Dest Y
            displaySize,          // Dest width (scaled)
            displaySize           // Dest height (scaled)
          );
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [loadedImages, isLoading, animationState, direction, displaySize, scale, customization.tintColors]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          width: displaySize,
          height: displaySize,
        }}
      >
        <div className="font-pixel text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={displaySize}
      height={displaySize}
      className={className}
      style={{
        imageRendering: 'pixelated',
        width: displaySize,
        height: displaySize,
      }}
    />
  );
}

// Get the row in the sprite sheet for the current animation and direction
function getAnimationRow(animationState: string, direction: string): number {
  // Standard LPC layout:
  // Row 0: Walk/Idle Down
  // Row 1: Walk/Idle Left
  // Row 2: Walk/Idle Right
  // Row 3: Walk/Idle Up
  // Row 4-7: Attack variants
  // Row 8-11: Cast/Special variants

  const directionMap: Record<string, number> = {
    down: 0,
    left: 1,
    right: 2,
    up: 3,
  };

  if (animationState === 'attack') {
    return 4 + directionMap[direction]; // Attack animations
  } else if (animationState === 'victory' || animationState === 'hit') {
    return 8 + directionMap[direction]; // Special animations
  } else {
    return directionMap[direction]; // Idle/walk
  }
}

// Draw sprite with color tint
function drawTintedSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frame: number,
  row: number,
  tintColor: string,
  scale: number
) {
  const displaySize = SPRITE_SIZE * scale;

  // Create offscreen canvas for tinting
  const offscreen = document.createElement('canvas');
  offscreen.width = FRAME_WIDTH;
  offscreen.height = FRAME_HEIGHT;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  // Draw original sprite
  offCtx.drawImage(
    img,
    frame * FRAME_WIDTH,
    row * FRAME_HEIGHT,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    0,
    0,
    FRAME_WIDTH,
    FRAME_HEIGHT
  );

  // Apply tint using multiply blend mode
  offCtx.globalCompositeOperation = 'multiply';
  offCtx.fillStyle = tintColor;
  offCtx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);

  // Restore alpha channel
  offCtx.globalCompositeOperation = 'destination-in';
  offCtx.drawImage(
    img,
    frame * FRAME_WIDTH,
    row * FRAME_HEIGHT,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    0,
    0,
    FRAME_WIDTH,
    FRAME_HEIGHT
  );

  // Draw tinted sprite to main canvas
  ctx.drawImage(offscreen, 0, 0, displaySize, displaySize);
}
