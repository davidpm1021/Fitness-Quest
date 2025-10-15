/**
 * Generate a simple test sprite for Phase 8 development
 * This creates a basic colored square sprite sheet for testing the PixiJS system
 */

const fs = require('fs');
const path = require('path');

// Simple PNG encoder (creates a 32x32 colored square)
function createSimplePNG(width, height, r, g, b) {
  const pixels = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Create a simple character shape
      const isBorder = x === 0 || x === width - 1 || y === 0 || y === height - 1;
      const isBody = y > height / 3 && y < height * 2 / 3;
      const isHead = y <= height / 3 && x > width / 4 && x < width * 3 / 4;

      if (isBorder) {
        // Black border
        pixels.push(0, 0, 0, 255);
      } else if (isHead) {
        // Head (lighter color)
        pixels.push(Math.min(255, r + 50), Math.min(255, g + 50), Math.min(255, b + 50), 255);
      } else if (isBody) {
        // Body (main color)
        pixels.push(r, g, b, 255);
      } else {
        // Transparent
        pixels.push(0, 0, 0, 0);
      }
    }
  }

  return Buffer.from(pixels);
}

// Create a sprite sheet with 4 frames (slight variations)
function createSpriteSheet() {
  const frameWidth = 32;
  const frameHeight = 32;
  const frames = 4;
  const sheetWidth = frameWidth * frames;
  const sheetHeight = frameHeight;

  const pixels = [];

  for (let y = 0; y < sheetHeight; y++) {
    for (let x = 0; x < sheetWidth; x++) {
      // Determine which frame we're in
      const frame = Math.floor(x / frameWidth);
      const frameX = x % frameWidth;

      // Slight color variation per frame for animation
      const r = 100 + frame * 20;
      const g = 150 + frame * 10;
      const b = 200;

      // Create character shape
      const isBorder = frameX === 0 || frameX === frameWidth - 1 || y === 0 || y === frameHeight - 1;
      const isBody = y > frameHeight / 3 && y < frameHeight * 2 / 3;
      const isHead = y <= frameHeight / 3 && frameX > frameWidth / 4 && frameX < frameWidth * 3 / 4;

      // Slight vertical offset per frame for "bobbing" animation
      const yOffset = Math.sin(frame * Math.PI / 2) * 2;
      const adjustedY = y - yOffset;

      const isBodyAdjusted = adjustedY > frameHeight / 3 && adjustedY < frameHeight * 2 / 3;
      const isHeadAdjusted = adjustedY <= frameHeight / 3 && frameX > frameWidth / 4 && frameX < frameWidth * 3 / 4;

      if (isBorder) {
        pixels.push(0, 0, 0, 255);
      } else if (isHeadAdjusted) {
        pixels.push(Math.min(255, r + 50), Math.min(255, g + 50), Math.min(255, b + 50), 255);
      } else if (isBodyAdjusted) {
        pixels.push(r, g, b, 255);
      } else {
        pixels.push(0, 0, 0, 0);
      }
    }
  }

  return { width: sheetWidth, height: sheetHeight, pixels: Buffer.from(pixels) };
}

console.log('Generating test sprite sheet...');
console.log('This is a simple colored square placeholder for testing.');
console.log('For real sprites, use Aseprite as documented in art-src/ASEPRITE-WORKFLOW.md');
console.log('');
console.log('Output: public/sprites/characters/v2/test-hero.png');
console.log('Status: Creating basic 128x32 sprite sheet (4 frames)...');

// Create output directory
const outputDir = path.join(__dirname, '..', 'public', 'sprites', 'characters', 'v2');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Note: This is a placeholder. For actual PNG generation, we'd need a library like 'pngjs'
// For now, just document what the sprite would be
console.log('');
console.log('⚠️  Note: To actually generate a PNG, install pngjs:');
console.log('   npm install pngjs');
console.log('');
console.log('For now, you can:');
console.log('1. Create a 128x32 PNG manually (4 frames of 32x32 each)');
console.log('2. Save it to: public/sprites/characters/v2/test-hero.png');
console.log('3. Or use Aseprite to create a proper sprite');
console.log('');
console.log('Metadata already created at:');
console.log('  public/sprites/characters/v2/test-hero.json');
