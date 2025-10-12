'use client';

import { useEffect, useRef } from 'react';

export interface CharacterCustomization {
  bodyType: 'SLIM' | 'AVERAGE' | 'MUSCULAR' | 'BULKY';
  skinColor: string;
  hairStyle: 'SHORT' | 'MEDIUM' | 'LONG' | 'BALD' | 'PONYTAIL' | 'MOHAWK' | 'AFRO';
  hairColor: string;
  facialHair: 'NONE' | 'STUBBLE' | 'BEARD' | 'GOATEE' | 'MUSTACHE';
  outfit: 'CASUAL' | 'ATHLETIC' | 'ARMOR' | 'NINJA' | 'WIZARD' | 'KNIGHT';
  outfitColor: string;
  accessoryColor?: string;
}

interface CustomizablePixelCharacterProps {
  customization: CharacterCustomization;
  size?: number;
  animationState?: 'idle' | 'attack' | 'hit' | 'victory';
  className?: string;
}

export default function CustomizablePixelCharacter({
  customization,
  size = 160,
  animationState = 'idle',
  className = '',
}: CustomizablePixelCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;

    const pixelSize = size / 24; // 24x24 grid for more detail

    // Helper to draw a pixel
    const drawPixel = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    };

    // Animation offsets
    const offsetY = animationState === 'attack' ? -1 : animationState === 'hit' ? 1 : 0;
    const weaponX = animationState === 'attack' ? 20 : 19;
    const armRaise = animationState === 'victory' ? -1 : 0;

    drawCharacter(drawPixel, customization, offsetY, weaponX, armRaise);
  }, [customization, size, animationState]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

function drawCharacter(
  drawPixel: (x: number, y: number, color: string) => void,
  custom: CharacterCustomization,
  offsetY: number,
  weaponX: number,
  armRaise: number
) {
  const darkColor = adjustBrightness(custom.skinColor, -30);

  // Body width based on body type
  const bodyWidth = custom.bodyType === 'SLIM' ? 5 : custom.bodyType === 'MUSCULAR' ? 7 : custom.bodyType === 'BULKY' ? 8 : 6;
  const bodyStart = 12 - Math.floor(bodyWidth / 2);

  // HEAD (6x6 pixels, centered)
  for (let y = 6; y < 11; y++) {
    for (let x = 9; x < 15; x++) {
      if (y === 6 && (x === 9 || x === 14)) continue; // Round top corners
      drawPixel(x, y + offsetY, custom.skinColor);
    }
  }

  // EYES
  drawPixel(10, 8 + offsetY, darkColor);
  drawPixel(13, 8 + offsetY, darkColor);

  // MOUTH (simple)
  drawPixel(11, 9 + offsetY, darkColor);
  drawPixel(12, 9 + offsetY, darkColor);

  // HAIR
  drawHair(drawPixel, custom.hairStyle, custom.hairColor, offsetY);

  // FACIAL HAIR
  if (custom.facialHair !== 'NONE') {
    drawFacialHair(drawPixel, custom.facialHair, custom.hairColor, offsetY);
  }

  // BODY (outfit)
  const bodyY = 11 + offsetY;
  for (let y = bodyY; y < bodyY + 6; y++) {
    for (let x = bodyStart; x < bodyStart + bodyWidth; x++) {
      drawPixel(x, y, custom.outfitColor);
    }
  }

  // OUTFIT DETAILS
  drawOutfitDetails(drawPixel, custom.outfit, custom.outfitColor, custom.accessoryColor || '#9ca3af', bodyStart, bodyWidth, bodyY);

  // ARMS
  const armX1 = bodyStart - 1;
  const armX2 = bodyStart + bodyWidth;
  for (let y = 0; y < 3; y++) {
    drawPixel(armX1, bodyY + 2 + y + armRaise, custom.skinColor);
    drawPixel(armX2, bodyY + 2 + y + armRaise, custom.skinColor);
  }

  // LEGS
  const legY = bodyY + 6;
  const legX1 = bodyStart + 1;
  const legX2 = bodyStart + bodyWidth - 2;
  for (let y = 0; y < 5; y++) {
    drawPixel(legX1, legY + y, custom.outfitColor);
    drawPixel(legX2, legY + y, custom.outfitColor);
  }

  // BOOTS/SHOES
  drawPixel(legX1, legY + 4, darkColor);
  drawPixel(legX2, legY + 4, darkColor);
  drawPixel(legX1 - 1, legY + 4, darkColor);
  drawPixel(legX2 + 1, legY + 4, darkColor);

  // WEAPON (if applicable)
  if (custom.outfit === 'KNIGHT' || custom.outfit === 'ARMOR' || custom.outfit === 'NINJA') {
    const weaponColor = custom.accessoryColor || '#9ca3af';
    drawPixel(weaponX, 7 + offsetY, weaponColor);
    drawPixel(weaponX, 8 + offsetY, weaponColor);
    drawPixel(weaponX, 9 + offsetY, weaponColor);
    drawPixel(weaponX, 10 + offsetY, weaponColor);
    drawPixel(weaponX, 6 + offsetY, '#fbbf24'); // Hilt
  }
}

function drawHair(
  drawPixel: (x: number, y: number, color: string) => void,
  style: string,
  color: string,
  offsetY: number
) {
  switch (style) {
    case 'BALD':
      // No hair!
      break;
    case 'SHORT':
      for (let x = 9; x < 15; x++) {
        drawPixel(x, 5 + offsetY, color);
        if (x >= 10 && x <= 13) {
          drawPixel(x, 6 + offsetY, color);
        }
      }
      break;
    case 'MEDIUM':
      for (let x = 9; x < 15; x++) {
        drawPixel(x, 5 + offsetY, color);
        drawPixel(x, 6 + offsetY, color);
      }
      drawPixel(8, 6 + offsetY, color);
      drawPixel(15, 6 + offsetY, color);
      break;
    case 'LONG':
      for (let x = 9; x < 15; x++) {
        drawPixel(x, 5 + offsetY, color);
        drawPixel(x, 6 + offsetY, color);
      }
      drawPixel(8, 6 + offsetY, color);
      drawPixel(8, 7 + offsetY, color);
      drawPixel(8, 8 + offsetY, color);
      drawPixel(15, 6 + offsetY, color);
      drawPixel(15, 7 + offsetY, color);
      drawPixel(15, 8 + offsetY, color);
      break;
    case 'PONYTAIL':
      for (let x = 9; x < 15; x++) {
        drawPixel(x, 5 + offsetY, color);
        drawPixel(x, 6 + offsetY, color);
      }
      drawPixel(12, 7 + offsetY, color);
      drawPixel(12, 8 + offsetY, color);
      drawPixel(12, 9 + offsetY, color);
      break;
    case 'MOHAWK':
      for (let x = 11; x < 13; x++) {
        drawPixel(x, 4 + offsetY, color);
        drawPixel(x, 5 + offsetY, color);
        drawPixel(x, 6 + offsetY, color);
      }
      break;
    case 'AFRO':
      for (let y = 4; y < 7; y++) {
        for (let x = 8; x < 16; x++) {
          drawPixel(x, y + offsetY, color);
        }
      }
      drawPixel(7, 5 + offsetY, color);
      drawPixel(7, 6 + offsetY, color);
      drawPixel(16, 5 + offsetY, color);
      drawPixel(16, 6 + offsetY, color);
      break;
  }
}

function drawFacialHair(
  drawPixel: (x: number, y: number, color: string) => void,
  style: string,
  color: string,
  offsetY: number
) {
  switch (style) {
    case 'STUBBLE':
      drawPixel(10, 10 + offsetY, color);
      drawPixel(11, 10 + offsetY, color);
      drawPixel(12, 10 + offsetY, color);
      drawPixel(13, 10 + offsetY, color);
      break;
    case 'BEARD':
      for (let x = 10; x < 14; x++) {
        drawPixel(x, 10 + offsetY, color);
        drawPixel(x, 11 + offsetY, color);
      }
      drawPixel(9, 10 + offsetY, color);
      drawPixel(14, 10 + offsetY, color);
      break;
    case 'GOATEE':
      drawPixel(11, 10 + offsetY, color);
      drawPixel(12, 10 + offsetY, color);
      drawPixel(11, 11 + offsetY, color);
      drawPixel(12, 11 + offsetY, color);
      break;
    case 'MUSTACHE':
      drawPixel(10, 9 + offsetY, color);
      drawPixel(11, 9 + offsetY, color);
      drawPixel(12, 9 + offsetY, color);
      drawPixel(13, 9 + offsetY, color);
      break;
  }
}

function drawOutfitDetails(
  drawPixel: (x: number, y: number, color: string) => void,
  outfit: string,
  outfitColor: string,
  accessoryColor: string,
  bodyStart: number,
  bodyWidth: number,
  bodyY: number
) {
  const centerX = bodyStart + Math.floor(bodyWidth / 2);
  const darkOutfit = adjustBrightness(outfitColor, -20);

  switch (outfit) {
    case 'ARMOR':
      // Chest plate lines
      for (let y = 0; y < 4; y++) {
        drawPixel(centerX, bodyY + y, accessoryColor);
      }
      // Shoulder guards
      drawPixel(bodyStart, bodyY, accessoryColor);
      drawPixel(bodyStart + 1, bodyY, accessoryColor);
      drawPixel(bodyStart + bodyWidth - 1, bodyY, accessoryColor);
      drawPixel(bodyStart + bodyWidth - 2, bodyY, accessoryColor);
      break;
    case 'KNIGHT':
      // Cape
      for (let y = 1; y < 5; y++) {
        drawPixel(bodyStart, bodyY + y, darkOutfit);
        drawPixel(bodyStart + bodyWidth - 1, bodyY + y, darkOutfit);
      }
      // Chest emblem
      drawPixel(centerX, bodyY + 2, accessoryColor);
      drawPixel(centerX - 1, bodyY + 2, accessoryColor);
      drawPixel(centerX + 1, bodyY + 2, accessoryColor);
      break;
    case 'NINJA':
      // Headband/mask
      for (let x = 9; x < 15; x++) {
        drawPixel(x, 7, outfitColor);
      }
      // Belt
      for (let x = bodyStart; x < bodyStart + bodyWidth; x++) {
        drawPixel(x, bodyY + 3, accessoryColor);
      }
      break;
    case 'WIZARD':
      // Hat (draw above head)
      for (let y = 2; y < 6; y++) {
        const width = Math.max(2, 7 - y);
        for (let x = 0; x < width; x++) {
          drawPixel(12 - Math.floor(width / 2) + x, y, outfitColor);
        }
      }
      // Stars on robe
      drawPixel(centerX - 1, bodyY + 2, accessoryColor);
      drawPixel(centerX + 1, bodyY + 4, accessoryColor);
      break;
    case 'ATHLETIC':
      // Stripe down side
      drawPixel(bodyStart + 1, bodyY + 1, '#ffffff');
      drawPixel(bodyStart + 1, bodyY + 2, '#ffffff');
      drawPixel(bodyStart + 1, bodyY + 3, '#ffffff');
      break;
  }
}

function adjustBrightness(hex: string, amount: number): string {
  const rgb = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((rgb >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((rgb >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (rgb & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
