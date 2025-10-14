// lib/utils/canvas-helpers.ts
// Canvas utility functions for sprite generation

/**
 * Create a new canvas with pixel-perfect settings
 */
export function createPixelCanvas(
  width: number,
  height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', {
    willReadFrequently: true, // Optimization for pixel manipulation
    alpha: true, // Preserve transparency
  });

  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  // Disable smoothing for crisp pixel art
  ctx.imageSmoothingEnabled = false;
  // @ts-ignore - Vendor prefixes for older browsers
  ctx.mozImageSmoothingEnabled = false;
  // @ts-ignore
  ctx.webkitImageSmoothingEnabled = false;
  // @ts-ignore
  ctx.msImageSmoothingEnabled = false;

  return { canvas, ctx };
}

/**
 * Compose multiple canvas layers into one
 */
export function composeLayers(
  layers: Array<{ canvas: HTMLCanvasElement; opacity?: number }>,
  outputWidth: number,
  outputHeight: number
): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(outputWidth, outputHeight);

  // Draw each layer in order
  layers.forEach(({ canvas: layerCanvas, opacity = 1.0 }) => {
    ctx.globalAlpha = opacity;
    ctx.drawImage(layerCanvas, 0, 0);
  });

  ctx.globalAlpha = 1.0; // Reset
  return canvas;
}

/**
 * Load an image from URL
 */
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Extract a single frame from a sprite sheet
 */
export function extractFrame(
  img: HTMLImageElement,
  frameIndex: number,
  frameWidth: number,
  frameHeight: number,
  spacing: number = 2
): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(frameWidth, frameHeight);

  const sourceX = frameIndex * (frameWidth + spacing);
  const sourceY = 0;

  ctx.drawImage(
    img,
    sourceX,
    sourceY, // Source x, y
    frameWidth,
    frameHeight, // Source width, height
    0,
    0, // Dest x, y
    frameWidth,
    frameHeight // Dest width, height
  );

  return canvas;
}

/**
 * Convert canvas to data URL
 */
export function canvasToDataURL(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Convert canvas to blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * Convert data URL to canvas
 */
export async function dataURLToCanvas(
  dataURL: string
): Promise<HTMLCanvasElement> {
  const img = await loadImage(dataURL);
  if (!img) {
    throw new Error('Failed to load data URL');
  }

  const { canvas, ctx } = createPixelCanvas(img.width, img.height);
  ctx.drawImage(img, 0, 0);

  return canvas;
}

/**
 * Clone a canvas
 */
export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(source.width, source.height);
  ctx.drawImage(source, 0, 0);
  return canvas;
}

/**
 * Clear a canvas
 */
export function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/**
 * Fill canvas with color
 */
export function fillCanvas(
  canvas: HTMLCanvasElement,
  color: string
): void {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

/**
 * Draw outline around non-transparent pixels
 */
export function drawOutline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  outlineColor: string,
  outlineWidth: number = 1
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Create a new canvas for the outline
  const { canvas: outlineCanvas, ctx: outlineCtx } = createPixelCanvas(
    width,
    height
  );

  // Find edges and draw outline
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];

      // If pixel is not transparent
      if (alpha > 0) {
        // Check neighboring pixels
        const hasTransparentNeighbor =
          isTransparent(data, width, height, x - 1, y) ||
          isTransparent(data, width, height, x + 1, y) ||
          isTransparent(data, width, height, x, y - 1) ||
          isTransparent(data, width, height, x, y + 1);

        if (hasTransparentNeighbor) {
          outlineCtx.fillStyle = outlineColor;
          outlineCtx.fillRect(x, y, outlineWidth, outlineWidth);
        }
      }
    }
  }

  // Draw outline first, then original image on top
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(outlineCanvas, 0, 0);
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Helper function to check if a pixel is transparent
 */
function isTransparent(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number
): boolean {
  // Out of bounds is considered transparent
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return true;
  }

  const i = (y * width + x) * 4;
  return data[i + 3] === 0;
}

/**
 * Apply shadow/glow effect
 */
export function applyShadow(
  ctx: CanvasRenderingContext2D,
  offsetX: number = 0,
  offsetY: number = 2,
  blur: number = 4,
  color: string = 'rgba(0, 0, 0, 0.5)'
): void {
  ctx.shadowOffsetX = offsetX;
  ctx.shadowOffsetY = offsetY;
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
}

/**
 * Reset shadow
 */
export function resetShadow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}
