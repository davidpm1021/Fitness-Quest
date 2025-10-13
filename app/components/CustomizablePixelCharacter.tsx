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
  // 3-color shading system
  const skinDark = adjustBrightness(custom.skinColor, -35);
  const skinLight = adjustBrightness(custom.skinColor, 25);
  const outline = '#000000';

  // Body width based on body type
  const bodyWidth = custom.bodyType === 'SLIM' ? 5 : custom.bodyType === 'MUSCULAR' ? 7 : custom.bodyType === 'BULKY' ? 8 : 6;
  const bodyStart = 12 - Math.floor(bodyWidth / 2);

  // HEAD (7x7 pixels for better proportions, centered)
  for (let y = 5; y < 11; y++) {
    for (let x = 9; x < 15; x++) {
      if (y === 5 && (x === 9 || x === 14)) continue; // Round top corners
      if (y === 10 && (x === 9 || x === 14)) continue; // Round bottom corners
      drawPixel(x, y + offsetY, custom.skinColor);
    }
  }

  // Head shading (light from top-left)
  drawPixel(10, 6 + offsetY, skinLight);
  drawPixel(11, 6 + offsetY, skinLight);
  drawPixel(10, 9 + offsetY, skinDark);
  drawPixel(13, 9 + offsetY, skinDark);

  // Head outline
  for (let x = 10; x < 14; x++) {
    drawPixel(x, 4 + offsetY, outline);
  }
  drawPixel(9, 5 + offsetY, outline);
  drawPixel(14, 5 + offsetY, outline);
  drawPixel(8, 6 + offsetY, outline);
  drawPixel(15, 6 + offsetY, outline);
  for (let y = 7; y < 10; y++) {
    drawPixel(8, y + offsetY, outline);
    drawPixel(15, y + offsetY, outline);
  }
  drawPixel(9, 10 + offsetY, outline);
  drawPixel(14, 10 + offsetY, outline);

  // EYES (white with black pupils)
  drawPixel(10, 7 + offsetY, '#ffffff');
  drawPixel(11, 7 + offsetY, '#ffffff');
  drawPixel(13, 7 + offsetY, '#ffffff');
  drawPixel(12, 7 + offsetY, '#ffffff');
  drawPixel(10, 8 + offsetY, outline);
  drawPixel(13, 8 + offsetY, outline);

  // MOUTH (simple smile)
  drawPixel(11, 9 + offsetY, outline);
  drawPixel(12, 9 + offsetY, outline);

  // HAIR
  drawHair(drawPixel, custom.hairStyle, custom.hairColor, offsetY, outline);

  // FACIAL HAIR
  if (custom.facialHair !== 'NONE') {
    drawFacialHair(drawPixel, custom.facialHair, custom.hairColor, offsetY);
  }

  // BODY (outfit with shading)
  const bodyY = 11 + offsetY;
  const outfitDark = adjustBrightness(custom.outfitColor, -30);
  const outfitLight = adjustBrightness(custom.outfitColor, 20);

  for (let y = bodyY; y < bodyY + 6; y++) {
    for (let x = bodyStart; x < bodyStart + bodyWidth; x++) {
      drawPixel(x, y, custom.outfitColor);
    }
  }

  // Body shading
  drawPixel(bodyStart + 1, bodyY, outfitLight);
  drawPixel(bodyStart + bodyWidth - 2, bodyY + 2, outfitDark);
  drawPixel(bodyStart + bodyWidth - 2, bodyY + 3, outfitDark);

  // Body outline
  for (let x = bodyStart; x < bodyStart + bodyWidth; x++) {
    drawPixel(x, bodyY - 1, outline); // Top
    drawPixel(x, bodyY + 6, outline); // Bottom
  }
  for (let y = bodyY; y < bodyY + 6; y++) {
    drawPixel(bodyStart - 1, y, outline); // Left
    drawPixel(bodyStart + bodyWidth, y, outline); // Right
  }

  // OUTFIT DETAILS (drawn before arms for layering)
  drawOutfitDetails(drawPixel, custom.outfit, custom.outfitColor, custom.accessoryColor || '#9ca3af', bodyStart, bodyWidth, bodyY, outline, outfitLight, outfitDark, offsetY);

  // ARMS with outline
  const armX1 = bodyStart - 1;
  const armX2 = bodyStart + bodyWidth;
  for (let y = 0; y < 4; y++) {
    drawPixel(armX1, bodyY + 1 + y + armRaise, custom.skinColor);
    drawPixel(armX2, bodyY + 1 + y + armRaise, custom.skinColor);
  }
  // Arm shading
  drawPixel(armX1, bodyY + 3 + armRaise, skinDark);
  drawPixel(armX2, bodyY + 3 + armRaise, skinDark);
  // Arm outline
  drawPixel(armX1 - 1, bodyY + 2 + armRaise, outline);
  drawPixel(armX1 - 1, bodyY + 3 + armRaise, outline);
  drawPixel(armX2 + 1, bodyY + 2 + armRaise, outline);
  drawPixel(armX2 + 1, bodyY + 3 + armRaise, outline);

  // LEGS with outline
  const legY = bodyY + 6;
  const legX1 = bodyStart + 1;
  const legX2 = bodyStart + bodyWidth - 2;
  for (let y = 0; y < 5; y++) {
    drawPixel(legX1, legY + y, custom.outfitColor);
    drawPixel(legX2, legY + y, custom.outfitColor);
    drawPixel(legX1 + 1, legY + y, custom.outfitColor);
    drawPixel(legX2 - 1, legY + y, custom.outfitColor);
  }

  // Leg shading
  drawPixel(legX2, legY + 2, outfitDark);
  drawPixel(legX2, legY + 3, outfitDark);
  drawPixel(legX2 - 1, legY + 3, outfitDark);

  // Leg outline
  for (let y = 0; y < 5; y++) {
    drawPixel(legX1 - 1, legY + y, outline);
    drawPixel(legX2 + 2, legY + y, outline);
  }

  // BOOTS/SHOES with outline
  const bootColor = '#3f2711';
  drawPixel(legX1, legY + 4, bootColor);
  drawPixel(legX2, legY + 4, bootColor);
  drawPixel(legX1 + 1, legY + 4, bootColor);
  drawPixel(legX2 - 1, legY + 4, bootColor);
  drawPixel(legX1 - 1, legY + 4, bootColor);
  drawPixel(legX2 + 2, legY + 4, bootColor);
  // Boot outline (bottom)
  drawPixel(legX1 - 1, legY + 5, outline);
  drawPixel(legX1, legY + 5, outline);
  drawPixel(legX1 + 1, legY + 5, outline);
  drawPixel(legX2 - 1, legY + 5, outline);
  drawPixel(legX2, legY + 5, outline);
  drawPixel(legX2 + 2, legY + 5, outline);

  // WEAPON (drawn last for proper layering)
  drawWeapon(drawPixel, custom.outfit, custom.accessoryColor || '#9ca3af', weaponX, offsetY, outline);
}

function drawHair(
  drawPixel: (x: number, y: number, color: string) => void,
  style: string,
  color: string,
  offsetY: number,
  outline: string
) {
  const hairDark = adjustBrightness(color, -25);
  const hairLight = adjustBrightness(color, 15);

  switch (style) {
    case 'BALD':
      // No hair!
      break;
    case 'SHORT':
      // Main hair
      for (let x = 10; x < 14; x++) {
        drawPixel(x, 4 + offsetY, color);
      }
      for (let x = 9; x < 15; x++) {
        drawPixel(x, 5 + offsetY, color);
      }
      // Shading
      drawPixel(10, 4 + offsetY, hairLight);
      drawPixel(13, 5 + offsetY, hairDark);
      // Outline
      for (let x = 10; x < 14; x++) {
        drawPixel(x, 3 + offsetY, outline);
      }
      drawPixel(9, 4 + offsetY, outline);
      drawPixel(14, 4 + offsetY, outline);
      break;
    case 'MEDIUM':
      // Main hair
      for (let x = 9; x < 15; x++) {
        drawPixel(x, 4 + offsetY, color);
        drawPixel(x, 5 + offsetY, color);
      }
      drawPixel(8, 5 + offsetY, color);
      drawPixel(15, 5 + offsetY, color);
      // Shading
      drawPixel(10, 4 + offsetY, hairLight);
      drawPixel(14, 5 + offsetY, hairDark);
      // Outline
      for (let x = 9; x < 15; x++) {
        drawPixel(x, 3 + offsetY, outline);
      }
      drawPixel(8, 4 + offsetY, outline);
      drawPixel(7, 5 + offsetY, outline);
      drawPixel(16, 4 + offsetY, outline);
      drawPixel(16, 5 + offsetY, outline);
      break;
    case 'LONG':
      // Main hair
      for (let x = 9; x < 15; x++) {
        drawPixel(x, 4 + offsetY, color);
        drawPixel(x, 5 + offsetY, color);
      }
      drawPixel(8, 5 + offsetY, color);
      drawPixel(8, 6 + offsetY, color);
      drawPixel(8, 7 + offsetY, color);
      drawPixel(15, 5 + offsetY, color);
      drawPixel(15, 6 + offsetY, color);
      drawPixel(15, 7 + offsetY, color);
      // Shading
      drawPixel(10, 4 + offsetY, hairLight);
      drawPixel(8, 7 + offsetY, hairDark);
      drawPixel(15, 7 + offsetY, hairDark);
      // Outline
      for (let x = 9; x < 15; x++) {
        drawPixel(x, 3 + offsetY, outline);
      }
      drawPixel(8, 4 + offsetY, outline);
      drawPixel(7, 5 + offsetY, outline);
      drawPixel(7, 6 + offsetY, outline);
      drawPixel(7, 7 + offsetY, outline);
      drawPixel(16, 4 + offsetY, outline);
      drawPixel(16, 5 + offsetY, outline);
      drawPixel(16, 6 + offsetY, outline);
      drawPixel(16, 7 + offsetY, outline);
      break;
    case 'PONYTAIL':
      // Main hair
      for (let x = 9; x < 15; x++) {
        drawPixel(x, 4 + offsetY, color);
        drawPixel(x, 5 + offsetY, color);
      }
      drawPixel(12, 6 + offsetY, color);
      drawPixel(12, 7 + offsetY, color);
      drawPixel(12, 8 + offsetY, color);
      // Shading
      drawPixel(10, 4 + offsetY, hairLight);
      drawPixel(12, 8 + offsetY, hairDark);
      // Outline
      for (let x = 9; x < 15; x++) {
        drawPixel(x, 3 + offsetY, outline);
      }
      drawPixel(8, 4 + offsetY, outline);
      drawPixel(16, 4 + offsetY, outline);
      drawPixel(11, 6 + offsetY, outline);
      drawPixel(13, 6 + offsetY, outline);
      drawPixel(11, 7 + offsetY, outline);
      drawPixel(13, 7 + offsetY, outline);
      drawPixel(12, 9 + offsetY, outline);
      break;
    case 'MOHAWK':
      // Main mohawk
      for (let x = 11; x < 13; x++) {
        drawPixel(x, 2 + offsetY, color);
        drawPixel(x, 3 + offsetY, color);
        drawPixel(x, 4 + offsetY, color);
      }
      // Shading
      drawPixel(11, 2 + offsetY, hairLight);
      drawPixel(12, 4 + offsetY, hairDark);
      // Outline
      drawPixel(11, 1 + offsetY, outline);
      drawPixel(12, 1 + offsetY, outline);
      drawPixel(10, 2 + offsetY, outline);
      drawPixel(13, 2 + offsetY, outline);
      drawPixel(10, 3 + offsetY, outline);
      drawPixel(13, 3 + offsetY, outline);
      drawPixel(10, 4 + offsetY, outline);
      drawPixel(13, 4 + offsetY, outline);
      break;
    case 'AFRO':
      // Main afro
      for (let y = 3; y < 6; y++) {
        for (let x = 8; x < 16; x++) {
          drawPixel(x, y + offsetY, color);
        }
      }
      drawPixel(7, 4 + offsetY, color);
      drawPixel(7, 5 + offsetY, color);
      drawPixel(16, 4 + offsetY, color);
      drawPixel(16, 5 + offsetY, color);
      // Shading
      drawPixel(9, 3 + offsetY, hairLight);
      drawPixel(10, 3 + offsetY, hairLight);
      drawPixel(15, 5 + offsetY, hairDark);
      drawPixel(14, 5 + offsetY, hairDark);
      // Outline - top
      for (let x = 8; x < 16; x++) {
        drawPixel(x, 2 + offsetY, outline);
      }
      drawPixel(7, 3 + offsetY, outline);
      drawPixel(6, 4 + offsetY, outline);
      drawPixel(6, 5 + offsetY, outline);
      drawPixel(17, 3 + offsetY, outline);
      drawPixel(17, 4 + offsetY, outline);
      drawPixel(17, 5 + offsetY, outline);
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
  bodyY: number,
  outline: string,
  outfitLight: string,
  outfitDark: string,
  offsetY: number
) {
  const centerX = bodyStart + Math.floor(bodyWidth / 2);
  const metalColor = '#9ca3af';
  const metalLight = '#d1d5db';
  const metalDark = '#4b5563';
  const goldColor = '#fbbf24';

  switch (outfit) {
    case 'ARMOR':
      // FULL CHEST PLATE
      // Main plate (vertical center)
      for (let y = 0; y < 5; y++) {
        drawPixel(centerX, bodyY + y, metalColor);
        drawPixel(centerX - 1, bodyY + y, metalColor);
        drawPixel(centerX + 1, bodyY + y, metalColor);
      }
      // Plate shading
      drawPixel(centerX - 1, bodyY, metalLight);
      drawPixel(centerX, bodyY, metalLight);
      drawPixel(centerX + 1, bodyY + 3, metalDark);
      drawPixel(centerX, bodyY + 4, metalDark);

      // PAULDRONS (shoulder armor)
      drawPixel(bodyStart, bodyY, metalColor);
      drawPixel(bodyStart + 1, bodyY, metalColor);
      drawPixel(bodyStart, bodyY + 1, metalColor);
      drawPixel(bodyStart + bodyWidth - 1, bodyY, metalColor);
      drawPixel(bodyStart + bodyWidth - 2, bodyY, metalColor);
      drawPixel(bodyStart + bodyWidth - 1, bodyY + 1, metalColor);
      // Pauldron highlights
      drawPixel(bodyStart + 1, bodyY, metalLight);
      drawPixel(bodyStart + bodyWidth - 2, bodyY, metalLight);

      // GAUNTLETS (on arms)
      drawPixel(bodyStart - 1, bodyY + 2, metalColor);
      drawPixel(bodyStart + bodyWidth, bodyY + 2, metalColor);

      // Chainmail texture (dots pattern)
      drawPixel(centerX - 2, bodyY + 1, metalDark);
      drawPixel(centerX + 2, bodyY + 1, metalDark);
      drawPixel(centerX - 2, bodyY + 3, metalDark);
      drawPixel(centerX + 2, bodyY + 3, metalDark);
      break;

    case 'KNIGHT':
      // HELMET (above head)
      for (let x = 10; x < 14; x++) {
        drawPixel(x, 3 + offsetY, metalColor);
        drawPixel(x, 4 + offsetY, metalColor);
      }
      // Helmet shading
      drawPixel(10, 3 + offsetY, metalLight);
      drawPixel(11, 3 + offsetY, metalLight);
      drawPixel(13, 4 + offsetY, metalDark);
      // Visor slit
      drawPixel(10, 7 + offsetY, outline);
      drawPixel(11, 7 + offsetY, outline);
      drawPixel(12, 7 + offsetY, outline);
      drawPixel(13, 7 + offsetY, outline);
      // Helmet outline
      for (let x = 10; x < 14; x++) {
        drawPixel(x, 2 + offsetY, outline);
      }
      drawPixel(9, 3 + offsetY, outline);
      drawPixel(14, 3 + offsetY, outline);

      // CAPE (flowing behind)
      const capeColor = adjustBrightness(outfitColor, -40);
      const capeLight = adjustBrightness(capeColor, 15);
      for (let y = 1; y < 6; y++) {
        drawPixel(bodyStart, bodyY + y, capeColor);
        drawPixel(bodyStart + bodyWidth - 1, bodyY + y, capeColor);
      }
      // Cape shading
      drawPixel(bodyStart, bodyY + 1, capeLight);
      drawPixel(bodyStart + bodyWidth - 1, bodyY + 1, capeLight);

      // BREASTPLATE with emblem
      drawPixel(centerX, bodyY + 1, metalColor);
      drawPixel(centerX - 1, bodyY + 1, metalColor);
      drawPixel(centerX + 1, bodyY + 1, metalColor);
      // Shield emblem (cross)
      drawPixel(centerX, bodyY + 2, goldColor);
      drawPixel(centerX, bodyY + 3, goldColor);
      drawPixel(centerX - 1, bodyY + 2, goldColor);
      drawPixel(centerX + 1, bodyY + 2, goldColor);
      break;

    case 'NINJA':
      // FACE MASK (covering lower face)
      for (let x = 10; x < 14; x++) {
        drawPixel(x, 8 + offsetY, outfitColor);
        drawPixel(x, 9 + offsetY, outfitColor);
      }
      drawPixel(9, 9 + offsetY, outfitColor);
      drawPixel(14, 9 + offsetY, outfitColor);

      // HEADBAND
      for (let x = 9; x < 15; x++) {
        drawPixel(x, 6 + offsetY, outfitDark);
      }
      // Headband knot (side)
      drawPixel(15, 6 + offsetY, outfitColor);
      drawPixel(16, 6 + offsetY, outfitColor);
      drawPixel(16, 7 + offsetY, outfitColor);

      // UTILITY BELT with pouches
      for (let x = bodyStart; x < bodyStart + bodyWidth; x++) {
        drawPixel(x, bodyY + 3, outfitDark);
      }
      // Belt pouches
      drawPixel(centerX - 1, bodyY + 4, outfitDark);
      drawPixel(centerX + 1, bodyY + 4, outfitDark);

      // THROWING STAR on belt
      drawPixel(centerX + 2, bodyY + 3, metalColor);
      break;

    case 'WIZARD':
      // TALL POINTED HAT
      // Hat cone
      drawPixel(12, 1 + offsetY, outfitColor);
      for (let x = 11; x < 14; x++) {
        drawPixel(x, 2 + offsetY, outfitColor);
      }
      for (let x = 10; x < 15; x++) {
        drawPixel(x, 3 + offsetY, outfitColor);
      }
      // Hat brim
      for (let x = 9; x < 16; x++) {
        drawPixel(x, 4 + offsetY, outfitColor);
      }
      // Hat shading
      drawPixel(11, 2 + offsetY, outfitLight);
      drawPixel(13, 3 + offsetY, outfitDark);
      // Hat outline
      drawPixel(12, 0 + offsetY, outline);
      drawPixel(11, 1 + offsetY, outline);
      drawPixel(13, 1 + offsetY, outline);
      drawPixel(10, 2 + offsetY, outline);
      drawPixel(14, 2 + offsetY, outline);
      drawPixel(9, 3 + offsetY, outline);
      drawPixel(15, 3 + offsetY, outline);

      // MYSTICAL STARS on robe
      drawPixel(centerX - 1, bodyY + 1, goldColor);
      drawPixel(centerX - 2, bodyY + 2, goldColor);
      drawPixel(centerX, bodyY + 2, goldColor);
      drawPixel(centerX + 2, bodyY + 3, goldColor);
      drawPixel(centerX + 1, bodyY + 4, goldColor);
      drawPixel(centerX + 3, bodyY + 4, goldColor);

      // ROBE TRIM (mystical patterns)
      for (let y = 1; y < 5; y++) {
        drawPixel(bodyStart + 1, bodyY + y, goldColor);
      }
      break;

    case 'ATHLETIC':
      // ATHLETIC STRIPES (racing stripes down sides)
      const stripeColor = '#ffffff';
      for (let y = 0; y < 5; y++) {
        drawPixel(bodyStart + 1, bodyY + y, stripeColor);
        drawPixel(bodyStart + bodyWidth - 2, bodyY + y, stripeColor);
      }
      // LOGO on chest
      drawPixel(centerX, bodyY + 1, stripeColor);
      drawPixel(centerX - 1, bodyY + 1, stripeColor);
      drawPixel(centerX + 1, bodyY + 1, stripeColor);
      drawPixel(centerX, bodyY + 2, stripeColor);
      break;

    case 'CASUAL':
      // COLLAR
      drawPixel(centerX, bodyY, outfitDark);
      drawPixel(centerX - 1, bodyY, outfitDark);
      drawPixel(centerX + 1, bodyY, outfitDark);
      // BUTTONS
      drawPixel(centerX, bodyY + 1, '#ffffff');
      drawPixel(centerX, bodyY + 3, '#ffffff');
      break;
  }
}

function drawWeapon(
  drawPixel: (x: number, y: number, color: string) => void,
  outfit: string,
  weaponColor: string,
  weaponX: number,
  offsetY: number,
  outline: string
) {
  const bladeColor = '#9ca3af';
  const bladeLight = '#d1d5db';
  const bladeDark = '#6b7280';
  const hiltColor = '#8b4513';
  const goldColor = '#fbbf24';

  switch (outfit) {
    case 'KNIGHT':
    case 'ARMOR':
      // LONGSWORD
      // Blade
      drawPixel(weaponX, 5 + offsetY, bladeLight);
      drawPixel(weaponX, 6 + offsetY, bladeColor);
      drawPixel(weaponX, 7 + offsetY, bladeColor);
      drawPixel(weaponX, 8 + offsetY, bladeColor);
      drawPixel(weaponX, 9 + offsetY, bladeColor);
      drawPixel(weaponX, 10 + offsetY, bladeDark);
      // Blade outline
      drawPixel(weaponX - 1, 5 + offsetY, outline);
      drawPixel(weaponX + 1, 5 + offsetY, outline);
      drawPixel(weaponX + 1, 6 + offsetY, outline);
      drawPixel(weaponX + 1, 7 + offsetY, outline);
      drawPixel(weaponX + 1, 8 + offsetY, outline);
      drawPixel(weaponX + 1, 9 + offsetY, outline);
      // Crossguard
      drawPixel(weaponX - 1, 10 + offsetY, goldColor);
      drawPixel(weaponX, 10 + offsetY, goldColor);
      drawPixel(weaponX + 1, 10 + offsetY, goldColor);
      // Hilt
      drawPixel(weaponX, 11 + offsetY, hiltColor);
      drawPixel(weaponX, 12 + offsetY, hiltColor);
      // Pommel
      drawPixel(weaponX, 13 + offsetY, goldColor);
      break;

    case 'NINJA':
      // KATANA (curved blade)
      // Blade
      drawPixel(weaponX, 6 + offsetY, bladeLight);
      drawPixel(weaponX, 7 + offsetY, bladeColor);
      drawPixel(weaponX, 8 + offsetY, bladeColor);
      drawPixel(weaponX + 1, 9 + offsetY, bladeColor);
      drawPixel(weaponX + 1, 10 + offsetY, bladeDark);
      // Blade outline
      drawPixel(weaponX - 1, 6 + offsetY, outline);
      drawPixel(weaponX + 1, 6 + offsetY, outline);
      drawPixel(weaponX + 1, 7 + offsetY, outline);
      drawPixel(weaponX + 1, 8 + offsetY, outline);
      drawPixel(weaponX + 2, 9 + offsetY, outline);
      // Hilt (wrapped)
      drawPixel(weaponX, 11 + offsetY, outline);
      drawPixel(weaponX, 12 + offsetY, hiltColor);
      drawPixel(weaponX, 13 + offsetY, outline);
      break;

    case 'WIZARD':
      // MYSTICAL STAFF
      // Staff shaft (brown wood)
      const staffColor = '#8b4513';
      for (let y = 5; y < 14; y++) {
        drawPixel(weaponX, y + offsetY, staffColor);
      }
      // Staff outline
      drawPixel(weaponX - 1, 5 + offsetY, outline);
      drawPixel(weaponX + 1, 5 + offsetY, outline);
      drawPixel(weaponX - 1, 13 + offsetY, outline);
      drawPixel(weaponX + 1, 13 + offsetY, outline);
      // Mystical orb on top
      drawPixel(weaponX, 4 + offsetY, '#a855f7'); // Purple orb
      drawPixel(weaponX - 1, 5 + offsetY, '#a855f7');
      drawPixel(weaponX + 1, 5 + offsetY, '#a855f7');
      drawPixel(weaponX, 5 + offsetY, '#e9d5ff'); // Light center
      // Orb glow
      drawPixel(weaponX, 3 + offsetY, '#e9d5ff');
      break;

    default:
      // No weapon for casual/athletic
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
