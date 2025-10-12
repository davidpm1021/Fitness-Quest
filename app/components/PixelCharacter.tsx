'use client';

import { useEffect, useRef } from 'react';

interface PixelCharacterProps {
  type: 'hero' | 'monster';
  color?: string;
  size?: number;
  animationState?: 'idle' | 'attack' | 'hit' | 'victory';
  className?: string;
}

export default function PixelCharacter({
  type,
  color = '#4ade80',
  size = 64,
  animationState = 'idle',
  className = '',
}: PixelCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Disable image smoothing for crisp pixels
    ctx.imageSmoothingEnabled = false;

    const pixelSize = size / 16; // 16x16 grid

    // Helper to draw a pixel
    const drawPixel = (x: number, y: number, pixelColor: string) => {
      ctx.fillStyle = pixelColor;
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    };

    if (type === 'hero') {
      drawHero(drawPixel, color, animationState);
    } else {
      drawMonster(drawPixel, color, animationState);
    }
  }, [type, color, size, animationState]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

// Draw a simple hero character (16x16 grid)
function drawHero(
  drawPixel: (x: number, y: number, color: string) => void,
  color: string,
  state: string
) {
  const skinColor = '#fbbf24';
  const darkColor = '#92400e';
  const weaponColor = '#9ca3af';

  // Offset for animation
  const offsetY = state === 'attack' ? -1 : state === 'hit' ? 1 : 0;
  const weaponX = state === 'attack' ? 13 : 12;

  // Head
  drawPixel(6, 3 + offsetY, skinColor);
  drawPixel(7, 3 + offsetY, skinColor);
  drawPixel(8, 3 + offsetY, skinColor);
  drawPixel(9, 3 + offsetY, skinColor);
  drawPixel(6, 4 + offsetY, skinColor);
  drawPixel(7, 4 + offsetY, skinColor);
  drawPixel(8, 4 + offsetY, skinColor);
  drawPixel(9, 4 + offsetY, skinColor);

  // Eyes
  drawPixel(6, 4 + offsetY, darkColor);
  drawPixel(9, 4 + offsetY, darkColor);

  // Body
  drawPixel(6, 5 + offsetY, color);
  drawPixel(7, 5 + offsetY, color);
  drawPixel(8, 5 + offsetY, color);
  drawPixel(9, 5 + offsetY, color);
  drawPixel(6, 6 + offsetY, color);
  drawPixel(7, 6 + offsetY, color);
  drawPixel(8, 6 + offsetY, color);
  drawPixel(9, 6 + offsetY, color);
  drawPixel(6, 7 + offsetY, color);
  drawPixel(7, 7 + offsetY, color);
  drawPixel(8, 7 + offsetY, color);
  drawPixel(9, 7 + offsetY, color);

  // Arms
  drawPixel(5, 6 + offsetY, skinColor);
  drawPixel(10, 6 + offsetY, skinColor);

  // Legs
  drawPixel(6, 8 + offsetY, color);
  drawPixel(9, 8 + offsetY, color);
  drawPixel(6, 9 + offsetY, darkColor);
  drawPixel(9, 9 + offsetY, darkColor);
  drawPixel(6, 10 + offsetY, darkColor);
  drawPixel(9, 10 + offsetY, darkColor);

  // Weapon (sword)
  if (state !== 'hit') {
    drawPixel(weaponX, 4 + offsetY, weaponColor);
    drawPixel(weaponX, 5 + offsetY, weaponColor);
    drawPixel(weaponX, 6 + offsetY, weaponColor);
    drawPixel(weaponX, 3 + offsetY, '#fbbf24'); // Hilt
  }
}

// Draw a simple monster (16x16 grid)
function drawMonster(
  drawPixel: (x: number, y: number, color: string) => void,
  color: string,
  state: string
) {
  const eyeColor = '#ef4444';
  const darkColor = '#7c2d12';

  // Flash white when hit
  const bodyColor = state === 'hit' ? '#ffffff' : color;
  const offsetX = state === 'hit' ? 1 : 0;

  // Large body (blob monster)
  for (let y = 5; y < 12; y++) {
    for (let x = 4; x < 12; x++) {
      const isEdge = x === 4 || x === 11 || y === 5 || y === 11;
      const isCenterEdge = y === 5 && (x === 5 || x === 10);

      if (!isCenterEdge) {
        drawPixel(x + offsetX, y, isEdge ? darkColor : bodyColor);
      }
    }
  }

  // Eyes (glow red)
  drawPixel(6 + offsetX, 7, eyeColor);
  drawPixel(9 + offsetX, 7, eyeColor);

  // Teeth
  if (state === 'attack') {
    drawPixel(6 + offsetX, 9, '#ffffff');
    drawPixel(7 + offsetX, 9, '#ffffff');
    drawPixel(8 + offsetX, 9, '#ffffff');
    drawPixel(9 + offsetX, 9, '#ffffff');
  }

  // Horns or spikes
  drawPixel(5 + offsetX, 4, darkColor);
  drawPixel(10 + offsetX, 4, darkColor);
  drawPixel(4 + offsetX, 5, darkColor);
  drawPixel(11 + offsetX, 5, darkColor);
}
