'use client';

import { useEffect, useRef, useState } from 'react';

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

interface DetailedPixelCharacterProps {
  customization: CharacterCustomization;
  size?: number;
  animationState?: 'idle' | 'attack' | 'victory' | 'hit';
  className?: string;
}

export default function DetailedPixelCharacter({
  customization,
  size = 320,
  animationState = 'idle',
  className = '',
}: DetailedPixelCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, 64, 64);

    // Draw character
    drawDetailedCharacter(ctx, customization, animationState, frame);
  }, [customization, animationState, frame]);

  useEffect(() => {
    // Animation loop
    const interval = setInterval(() => {
      setFrame((f) => {
        if (animationState === 'idle') return (f + 1) % 4;
        if (animationState === 'attack') return (f + 1) % 8;
        if (animationState === 'victory') return (f + 1) % 6;
        if (animationState === 'hit') return (f + 1) % 4;
        return 0;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [animationState]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      className={className}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
      }}
    />
  );
}

function drawDetailedCharacter(
  ctx: CanvasRenderingContext2D,
  custom: CharacterCustomization,
  state: string,
  frame: number
) {
  const pixel = (x: number, y: number, color: string, alpha: number = 1) => {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(x, y, 1, 1);
    ctx.globalAlpha = 1;
  };

  // Helper for shading
  const darken = (color: string, amount: number = 0.3): string => {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) * (1 - amount));
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) * (1 - amount));
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) * (1 - amount));
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  };

  const lighten = (color: string, amount: number = 0.3): string => {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + (255 - parseInt(hex.substring(0, 2), 16)) * amount);
    const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + (255 - parseInt(hex.substring(2, 4), 16)) * amount);
    const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + (255 - parseInt(hex.substring(4, 6), 16)) * amount);
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  };

  // Animation offsets
  let bobOffset = 0;
  let armAngle = 0;
  let legOffset = 0;

  if (state === 'idle') {
    bobOffset = frame < 2 ? 0 : -1;
  } else if (state === 'attack') {
    if (frame < 3) {
      armAngle = -frame * 3; // Wind up
    } else if (frame < 5) {
      armAngle = 15; // Strike!
    } else {
      armAngle = 0;
    }
  } else if (state === 'victory') {
    bobOffset = frame % 2 === 0 ? -2 : 0;
    armAngle = 10;
  } else if (state === 'hit') {
    bobOffset = frame < 2 ? 2 : 0;
  }

  const baseY = 8 + bobOffset;
  const skinDark = darken(custom.skinColor);
  const skinLight = lighten(custom.skinColor, 0.2);
  const outfitDark = darken(custom.outfitColor);
  const outfitLight = lighten(custom.outfitColor, 0.2);

  // Body width based on type
  const bodyWidth = custom.bodyType === 'SLIM' ? 10 : custom.bodyType === 'AVERAGE' ? 12 : custom.bodyType === 'MUSCULAR' ? 14 : 16;
  const centerX = 32;

  // LEGS (detailed with shading)
  const legX1 = centerX - 5;
  const legX2 = centerX + 2;
  const legY = baseY + 32;

  // Left leg
  for (let y = 0; y < 16; y++) {
    const legColor = y < 8 ? custom.outfitColor : outfitDark;
    // Thigh
    if (y < 8) {
      for (let x = 0; x < 5; x++) {
        pixel(legX1 + x + legOffset, legY + y, legColor);
      }
      // Shading
      pixel(legX1 + 4, legY + y, outfitDark);
    } else {
      // Calf - narrower
      for (let x = 1; x < 4; x++) {
        pixel(legX1 + x, legY + y, legColor);
      }
      pixel(legX1 + 3, legY + y, outfitDark);
    }
  }
  // Foot
  for (let x = 0; x < 6; x++) {
    pixel(legX1 + x, legY + 16, '#1f2937');
  }

  // Right leg
  for (let y = 0; y < 16; y++) {
    const legColor = y < 8 ? custom.outfitColor : outfitDark;
    if (y < 8) {
      for (let x = 0; x < 5; x++) {
        pixel(legX2 + x - legOffset, legY + y, legColor);
      }
      pixel(legX2, legY + y, outfitLight);
    } else {
      for (let x = 1; x < 4; x++) {
        pixel(legX2 + x, legY + y, legColor);
      }
      pixel(legX2 + 1, legY + y, outfitLight);
    }
  }
  // Foot
  for (let x = 0; x < 6; x++) {
    pixel(legX2 + x, legY + 16, '#1f2937');
  }

  // TORSO (detailed with muscles/outfit details)
  const torsoY = baseY + 16;
  const torsoHeight = 16;

  for (let y = 0; y < torsoHeight; y++) {
    const widthAtY = bodyWidth - Math.floor(y / 4);
    for (let x = 0; x < widthAtY; x++) {
      const posX = centerX - Math.floor(widthAtY / 2) + x;
      let color = custom.outfitColor;

      // Add shading
      if (x === 0 || x === widthAtY - 1) {
        color = outfitDark;
      } else if (x === 1) {
        color = outfitLight;
      }

      // Outfit-specific details
      if (custom.outfit === 'ARMOR' || custom.outfit === 'KNIGHT') {
        // Armor plates
        if (y % 4 === 0 && x % 2 === 0) {
          color = lighten(color, 0.5);
        }
        if (y === 4 || y === 8 || y === 12) {
          color = '#4b5563'; // Metal bands
        }
      } else if (custom.outfit === 'ATHLETIC') {
        // Racing stripe
        if (x === Math.floor(widthAtY / 2)) {
          color = custom.accessoryColor || '#ffffff';
        }
      } else if (custom.outfit === 'NINJA') {
        // Ninja wraps
        if ((y + x) % 3 === 0) {
          color = darken(color, 0.2);
        }
      } else if (custom.outfit === 'WIZARD') {
        // Robe patterns
        if (y > 8 && x % 3 === 1) {
          color = custom.accessoryColor || '#fbbf24';
        }
      }

      pixel(posX, torsoY + y, color);
    }
  }

  // Chest/shoulder details
  if (custom.bodyType === 'MUSCULAR' || custom.bodyType === 'BULKY') {
    // Pec definition
    pixel(centerX - 3, torsoY + 4, outfitDark);
    pixel(centerX + 2, torsoY + 4, outfitDark);
    pixel(centerX - 2, torsoY + 5, outfitLight);
    pixel(centerX + 1, torsoY + 5, outfitLight);
  }

  // ARMS (detailed with shading and animation)
  const armY = baseY + 18;
  const armLength = 14;

  // Left arm
  const leftArmX = centerX - Math.floor(bodyWidth / 2) - 4;
  for (let y = 0; y < armLength; y++) {
    const armColor = y < 6 ? custom.outfitColor : custom.skinColor;
    const width = y < 8 ? 3 : 2;

    for (let x = 0; x < width; x++) {
      const adjustedY = y + Math.floor(armAngle / 3);
      pixel(leftArmX + x, armY + adjustedY, armColor);

      // Shading
      if (x === 0) {
        pixel(leftArmX + x, armY + adjustedY, y < 6 ? outfitDark : skinDark);
      }
    }
  }
  // Hand
  for (let i = 0; i < 3; i++) {
    pixel(leftArmX + i, armY + armLength + Math.floor(armAngle / 3), skinDark);
  }

  // Right arm (with weapon in attack)
  const rightArmX = centerX + Math.floor(bodyWidth / 2) + 1;
  for (let y = 0; y < armLength; y++) {
    const armColor = y < 6 ? custom.outfitColor : custom.skinColor;
    const width = y < 8 ? 3 : 2;

    for (let x = 0; x < width; x++) {
      const adjustedY = y - Math.floor(armAngle / 2);
      pixel(rightArmX + x, armY + adjustedY, armColor);

      // Highlight
      if (x === width - 1) {
        pixel(rightArmX + x, armY + adjustedY, y < 6 ? outfitLight : skinLight);
      }
    }
  }
  // Hand
  for (let i = 0; i < 3; i++) {
    pixel(rightArmX + i, armY + armLength - Math.floor(armAngle / 2), skinDark);
  }

  // WEAPON (sword/staff depending on outfit)
  if (state === 'attack' && frame >= 2 && frame < 6) {
    const weaponX = rightArmX + 2;
    const weaponY = armY + armLength - Math.floor(armAngle / 2) + 2;

    if (custom.outfit === 'WIZARD') {
      // Staff
      for (let i = 0; i < 18; i++) {
        pixel(weaponX + 2, weaponY + i, '#8b4513');
      }
      // Orb
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          if ((x - 2) * (x - 2) + (y - 2) * (y - 2) <= 4) {
            pixel(weaponX + x, weaponY - 3 + y, '#8b5cf6');
          }
        }
      }
    } else {
      // Sword
      for (let i = 0; i < 16; i++) {
        pixel(weaponX + 2, weaponY + i, '#9ca3af');
        pixel(weaponX + 3, weaponY + i, '#e5e7eb');
      }
      // Hilt
      for (let x = 0; x < 5; x++) {
        pixel(weaponX + x, weaponY + 16, '#92400e');
        pixel(weaponX + x, weaponY + 17, '#92400e');
      }
      // Pommel
      pixel(weaponX + 2, weaponY + 18, '#fbbf24');
    }
  }

  // HEAD/NECK
  const headY = baseY + 8;
  const neckWidth = 4;

  // Neck
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < neckWidth; x++) {
      pixel(centerX - Math.floor(neckWidth / 2) + x, headY + 6 + y, custom.skinColor);
    }
    // Neck shading
    pixel(centerX - Math.floor(neckWidth / 2), headY + 6 + y, skinDark);
    pixel(centerX + Math.floor(neckWidth / 2) - 1, headY + 6 + y, skinLight);
  }

  // Head (detailed 14x12 oval with features)
  const headWidth = 12;
  const headHeight = 14;

  // Head outline and fill with shading
  for (let y = 0; y < headHeight; y++) {
    const widthAtY = y < 2 || y > 11 ? 6 : y < 4 || y > 9 ? 10 : headWidth;
    for (let x = 0; x < widthAtY; x++) {
      const posX = centerX - Math.floor(widthAtY / 2) + x;
      let color = custom.skinColor;

      // Shading on sides
      if (x === 0) {
        color = skinDark;
      } else if (x === widthAtY - 1) {
        color = skinLight;
      }

      pixel(posX, headY + y, color);
    }
  }

  // FACIAL FEATURES (eyes, nose, mouth)
  const eyeY = headY + 5;
  const eyeLeft = centerX - 3;
  const eyeRight = centerX + 1;

  // Eyes (white + iris)
  pixel(eyeLeft, eyeY, '#ffffff');
  pixel(eyeLeft + 1, eyeY, '#ffffff');
  pixel(eyeRight, eyeY, '#ffffff');
  pixel(eyeRight + 1, eyeY, '#ffffff');

  // Irises (brown/blue based on hair color)
  const irisColor = custom.hairColor === '#3b82f6' ? '#1e40af' : '#92400e';
  pixel(eyeLeft + (frame % 2), eyeY, irisColor);
  pixel(eyeRight + (frame % 2), eyeY, irisColor);

  // Eyebrows
  pixel(eyeLeft - 1, eyeY - 1, custom.hairColor);
  pixel(eyeLeft, eyeY - 1, custom.hairColor);
  pixel(eyeLeft + 1, eyeY - 1, custom.hairColor);
  pixel(eyeRight, eyeY - 1, custom.hairColor);
  pixel(eyeRight + 1, eyeY - 1, custom.hairColor);
  pixel(eyeRight + 2, eyeY - 1, custom.hairColor);

  // Nose
  pixel(centerX - 1, eyeY + 2, skinDark);
  pixel(centerX, eyeY + 2, skinDark);
  pixel(centerX - 1, eyeY + 3, skinDark);

  // Mouth
  if (state === 'victory') {
    // Big smile
    pixel(centerX - 2, eyeY + 5, '#000000');
    pixel(centerX - 1, eyeY + 6, '#000000');
    pixel(centerX, eyeY + 6, '#000000');
    pixel(centerX + 1, eyeY + 6, '#000000');
    pixel(centerX + 2, eyeY + 5, '#000000');
  } else if (state === 'hit') {
    // Grimace
    pixel(centerX - 1, eyeY + 5, '#000000');
    pixel(centerX, eyeY + 5, '#000000');
    pixel(centerX + 1, eyeY + 5, '#000000');
  } else {
    // Normal mouth
    pixel(centerX - 1, eyeY + 5, '#000000');
    pixel(centerX, eyeY + 5, '#000000');
  }

  // FACIAL HAIR
  drawFacialHair(pixel, custom.facialHair, custom.hairColor, centerX, eyeY);

  // HAIR (very detailed)
  drawDetailedHair(pixel, custom.hairStyle, custom.hairColor, centerX, headY, darken);

  // OUTFIT ACCESSORIES
  if (custom.outfit === 'WIZARD') {
    // Wizard hat
    drawWizardHat(pixel, custom.outfitColor, custom.accessoryColor || '#fbbf24', centerX, headY);
  } else if (custom.outfit === 'KNIGHT') {
    // Helmet
    drawHelmet(pixel, centerX, headY);
  } else if (custom.outfit === 'NINJA') {
    // Ninja mask
    drawNinjaMask(pixel, custom.outfitColor, centerX, headY, eyeY);
  }
}

function drawFacialHair(
  pixel: (x: number, y: number, color: string, alpha?: number) => void,
  type: string,
  color: string,
  centerX: number,
  eyeY: number
) {
  const mouthY = eyeY + 5;
  const chinY = eyeY + 7;

  if (type === 'STUBBLE') {
    // Light stubble
    for (let x = -3; x <= 3; x++) {
      if (Math.random() > 0.5) {
        pixel(centerX + x, chinY, color, 0.5);
        pixel(centerX + x, chinY + 1, color, 0.3);
      }
    }
  } else if (type === 'MUSTACHE') {
    pixel(centerX - 3, mouthY, color);
    pixel(centerX - 2, mouthY - 1, color);
    pixel(centerX - 1, mouthY - 1, color);
    pixel(centerX + 1, mouthY - 1, color);
    pixel(centerX + 2, mouthY - 1, color);
    pixel(centerX + 3, mouthY, color);
  } else if (type === 'GOATEE') {
    pixel(centerX, mouthY + 1, color);
    pixel(centerX - 1, chinY, color);
    pixel(centerX, chinY, color);
    pixel(centerX + 1, chinY, color);
    pixel(centerX, chinY + 1, color);
  } else if (type === 'BEARD') {
    // Full beard
    for (let y = mouthY; y <= chinY + 3; y++) {
      const width = y === mouthY ? 3 : y === chinY + 3 ? 4 : 6;
      for (let x = 0; x < width; x++) {
        pixel(centerX - Math.floor(width / 2) + x, y, color);
      }
    }
  }
}

function drawDetailedHair(
  pixel: (x: number, y: number, color: string, alpha?: number) => void,
  style: string,
  color: string,
  centerX: number,
  headY: number,
  darken: (c: string) => string
) {
  const darkHair = darken(color);

  if (style === 'BALD') {
    // Just a bit of hair line
    for (let x = -4; x <= 4; x++) {
      pixel(centerX + x, headY + 1, color, 0.3);
    }
  } else if (style === 'SHORT') {
    // Short hair covering top and sides
    for (let x = -5; x <= 5; x++) {
      pixel(centerX + x, headY, color);
      pixel(centerX + x, headY + 1, color);
    }
    for (let x = -6; x <= 6; x++) {
      pixel(centerX + x, headY + 2, color);
    }
    // Shading
    pixel(centerX - 5, headY + 1, darkHair);
    pixel(centerX + 5, headY + 1, darkHair);
  } else if (style === 'MEDIUM') {
    // Covers head and reaches ears
    for (let y = 0; y < 6; y++) {
      const width = y < 3 ? 12 : 10;
      for (let x = 0; x < width; x++) {
        pixel(centerX - Math.floor(width / 2) + x, headY + y, color);
      }
      // Shading
      pixel(centerX - Math.floor(width / 2), headY + y, darkHair);
    }
  } else if (style === 'LONG') {
    // Long flowing hair
    for (let y = 0; y < 10; y++) {
      const width = y < 3 ? 12 : y < 6 ? 10 : 8;
      for (let x = 0; x < width; x++) {
        pixel(centerX - Math.floor(width / 2) + x, headY + y, color);
      }
      pixel(centerX - Math.floor(width / 2), headY + y, darkHair);
    }
  } else if (style === 'PONYTAIL') {
    // Top bun
    for (let x = -3; x <= 3; x++) {
      pixel(centerX + x, headY - 2, color);
      pixel(centerX + x, headY - 1, color);
    }
    // Hair on head
    for (let x = -5; x <= 5; x++) {
      pixel(centerX + x, headY, color);
      pixel(centerX + x, headY + 1, color);
      pixel(centerX + x, headY + 2, color);
    }
  } else if (style === 'MOHAWK') {
    // Tall mohawk down center
    for (let y = -4; y < 3; y++) {
      const width = y < 0 ? 4 : 6;
      for (let x = 0; x < width; x++) {
        pixel(centerX - Math.floor(width / 2) + x, headY + y, color);
      }
    }
  } else if (style === 'AFRO') {
    // Big round afro
    for (let y = -4; y < 6; y++) {
      let width = 16;
      if (y === -4 || y === 5) width = 10;
      else if (y === -3 || y === 4) width = 14;

      for (let x = 0; x < width; x++) {
        pixel(centerX - Math.floor(width / 2) + x, headY + y, color);
      }
    }
  }
}

function drawWizardHat(
  pixel: (x: number, y: number, color: string, alpha?: number) => void,
  color: string,
  accentColor: string,
  centerX: number,
  headY: number
) {
  // Tall pointy wizard hat
  for (let y = 0; y < 12; y++) {
    const width = Math.max(2, 14 - y);
    for (let x = 0; x < width; x++) {
      pixel(centerX - Math.floor(width / 2) + x, headY - 12 + y, color);
    }
  }
  // Brim
  for (let x = -8; x <= 8; x++) {
    pixel(centerX + x, headY, color);
  }
  // Stars on hat
  pixel(centerX, headY - 8, accentColor);
  pixel(centerX - 1, headY - 6, accentColor);
  pixel(centerX + 1, headY - 4, accentColor);
}

function drawHelmet(
  pixel: (x: number, y: number, color: string, alpha?: number) => void,
  centerX: number,
  headY: number
) {
  // Knight helmet
  const metalColor = '#9ca3af';
  const metalDark = '#4b5563';
  const metalLight = '#e5e7eb';

  // Helmet dome
  for (let y = 0; y < 10; y++) {
    const width = y < 2 ? 8 : y < 8 ? 12 : 10;
    for (let x = 0; x < width; x++) {
      const posX = centerX - Math.floor(width / 2) + x;
      pixel(posX, headY + y, metalColor);
      if (x === 0) pixel(posX, headY + y, metalDark);
      if (x === width - 1) pixel(posX, headY + y, metalLight);
    }
  }

  // Visor slit
  for (let x = -4; x <= 4; x++) {
    pixel(centerX + x, headY + 5, '#000000');
  }
  pixel(centerX - 3, headY + 6, '#000000');
  pixel(centerX + 3, headY + 6, '#000000');
}

function drawNinjaMask(
  pixel: (x: number, y: number, color: string, alpha?: number) => void,
  color: string,
  centerX: number,
  headY: number,
  eyeY: number
) {
  // Ninja mask covering face except eyes
  for (let y = 2; y < 12; y++) {
    if (y === eyeY - headY || y === eyeY - headY + 1) continue; // Skip eye area

    const width = y < 4 || y > 9 ? 8 : 10;
    for (let x = 0; x < width; x++) {
      const posX = centerX - Math.floor(width / 2) + x;
      // Don't cover eyes
      if (y === eyeY - headY - 1 || y === eyeY - headY + 2) {
        if (x > 1 && x < width - 2) continue;
      }
      pixel(posX, headY + y, color);
    }
  }
}
