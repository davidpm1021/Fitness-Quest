// lib/utils/color-utils.ts
// Utility functions for color manipulation and palette swapping

/**
 * Convert hex color to RGB tuple
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

/**
 * Convert RGB values to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
  );
}

/**
 * Apply palette swapping to canvas using ImageData manipulation
 */
export function paletteSwap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colorMap: Map<string, string>
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convert color map to RGB values for faster lookup
  const rgbMap = new Map<string, [number, number, number]>();
  colorMap.forEach((newColor, oldColor) => {
    rgbMap.set(oldColor.toLowerCase(), hexToRgb(newColor));
  });

  // Iterate through pixels (RGBA format: 4 bytes per pixel)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent pixels
    if (a === 0) continue;

    // Check if pixel matches a color to swap
    const hex = rgbToHex(r, g, b).toLowerCase();
    const newRgb = rgbMap.get(hex);

    if (newRgb) {
      data[i] = newRgb[0];       // Red
      data[i + 1] = newRgb[1];   // Green
      data[i + 2] = newRgb[2];   // Blue
      // Keep original alpha (data[i + 3])
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply color variation using hue rotation (faster but less precise)
 */
export function applyHueRotation(
  ctx: CanvasRenderingContext2D,
  hueRotation: number
): void {
  // Draw to temporary canvas with filter
  const temp = document.createElement('canvas');
  temp.width = ctx.canvas.width;
  temp.height = ctx.canvas.height;
  const tempCtx = temp.getContext('2d');

  if (!tempCtx) return;

  tempCtx.filter = `hue-rotate(${hueRotation}deg)`;
  tempCtx.drawImage(ctx.canvas, 0, 0);

  // Copy back
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(temp, 0, 0);
}

/**
 * Draw a single pixel on canvas
 */
export function drawPixel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

/**
 * Draw a rectangle with specified color
 */
export function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

/**
 * Lighten a hex color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const amount = Math.round(255 * (percent / 100));

  const newR = Math.min(255, r + amount);
  const newG = Math.min(255, g + amount);
  const newB = Math.min(255, b + amount);

  return rgbToHex(newR, newG, newB);
}

/**
 * Darken a hex color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const amount = Math.round(255 * (percent / 100));

  const newR = Math.max(0, r - amount);
  const newG = Math.max(0, g - amount);
  const newB = Math.max(0, b - amount);

  return rgbToHex(newR, newG, newB);
}

/**
 * Generate a 3-color shading palette from a base color
 */
export function generateShadingPalette(baseColor: string): [string, string, string] {
  const base = baseColor;
  const highlight = lightenColor(baseColor, 20);
  const shadow = darkenColor(baseColor, 20);

  return [shadow, base, highlight];
}

/**
 * Check if a color is similar to another within a threshold
 */
export function colorsSimilar(
  color1: string,
  color2: string,
  threshold: number = 10
): boolean {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);

  const distance = Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );

  return distance <= threshold;
}

/**
 * Create a gradient color between two colors
 */
export function interpolateColor(
  color1: string,
  color2: string,
  factor: number
): string {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return rgbToHex(r, g, b);
}
