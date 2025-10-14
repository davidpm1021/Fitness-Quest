/**
 * Placeholder Sprite Generator
 *
 * Generates simple pixel art sprites on-the-fly using canvas.
 * This is temporary until custom sprites are created.
 *
 * To use real sprites:
 * 1. Create sprites in Aseprite/Piskel
 * 2. Export as PNG sprite sheets
 * 3. Place in /public/sprites/
 * 4. Remove this generator and update sprite paths
 */

export function generateHeroIdleSprite(): string {
  const canvas = document.createElement('canvas');
  const frameWidth = 32;
  const frameHeight = 32;
  const frameCount = 4;

  canvas.width = frameWidth * frameCount;
  canvas.height = frameHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Disable smoothing for crisp pixels
  ctx.imageSmoothingEnabled = false;

  const skinColor = '#fbbf24';
  const outfitColor = '#3b82f6';
  const hairColor = '#92400e';

  // Draw 4 frames of idle animation
  for (let frame = 0; frame < frameCount; frame++) {
    const offsetX = frame * frameWidth;
    const bobOffset = frame < 2 ? 0 : -1; // Simple bob animation

    // Head
    ctx.fillStyle = skinColor;
    ctx.fillRect(offsetX + 12, 8 + bobOffset, 8, 8);

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(offsetX + 13, 10 + bobOffset, 2, 2);
    ctx.fillRect(offsetX + 17, 10 + bobOffset, 2, 2);

    // Hair
    ctx.fillStyle = hairColor;
    ctx.fillRect(offsetX + 12, 6 + bobOffset, 8, 3);

    // Body
    ctx.fillStyle = outfitColor;
    ctx.fillRect(offsetX + 12, 16 + bobOffset, 8, 10);

    // Arms
    ctx.fillStyle = skinColor;
    ctx.fillRect(offsetX + 10, 18 + bobOffset, 2, 6);
    ctx.fillRect(offsetX + 20, 18 + bobOffset, 2, 6);

    // Legs
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(offsetX + 13, 26 + bobOffset, 2, 4);
    ctx.fillRect(offsetX + 17, 26 + bobOffset, 2, 4);
  }

  return canvas.toDataURL();
}

export function generateHeroAttackSprite(): string {
  const canvas = document.createElement('canvas');
  const frameWidth = 32;
  const frameHeight = 32;
  const frameCount = 8;

  canvas.width = frameWidth * frameCount;
  canvas.height = frameHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;

  const skinColor = '#fbbf24';
  const outfitColor = '#3b82f6';
  const hairColor = '#92400e';
  const weaponColor = '#9ca3af';

  // Draw 8 frames of attack animation
  for (let frame = 0; frame < frameCount; frame++) {
    const offsetX = frame * frameWidth;

    // Windup (frames 0-2)
    // Strike (frames 3-5)
    // Recovery (frames 6-7)
    const isWindup = frame < 3;
    const isStrike = frame >= 3 && frame < 6;
    const bodyOffsetX = isStrike ? 2 : 0;
    const weaponOffset = isWindup ? -2 : isStrike ? 4 : 0;

    // Head
    ctx.fillStyle = skinColor;
    ctx.fillRect(offsetX + 12 + bodyOffsetX, 8, 8, 8);

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(offsetX + 13 + bodyOffsetX, 10, 2, 2);
    ctx.fillRect(offsetX + 17 + bodyOffsetX, 10, 2, 2);

    // Hair
    ctx.fillStyle = hairColor;
    ctx.fillRect(offsetX + 12 + bodyOffsetX, 6, 8, 3);

    // Body
    ctx.fillStyle = outfitColor;
    ctx.fillRect(offsetX + 12 + bodyOffsetX, 16, 8, 10);

    // Arms
    ctx.fillStyle = skinColor;
    ctx.fillRect(offsetX + 10 + bodyOffsetX, 18, 2, 6);
    ctx.fillRect(offsetX + 20 + bodyOffsetX, 18, 2, 6);

    // Legs
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(offsetX + 13 + bodyOffsetX, 26, 2, 4);
    ctx.fillRect(offsetX + 17 + bodyOffsetX, 26, 4);

    // Weapon (sword)
    if (!isWindup) {
      ctx.fillStyle = weaponColor;
      ctx.fillRect(offsetX + 22 + weaponOffset, 12, 2, 10);
      // Hilt
      ctx.fillStyle = '#92400e';
      ctx.fillRect(offsetX + 21 + weaponOffset, 21, 4, 2);
    }
  }

  return canvas.toDataURL();
}

export function generateMonsterIdleSprite(type: 'TANK' | 'BALANCED' | 'GLASS_CANNON'): string {
  const canvas = document.createElement('canvas');
  const frameWidth = 64;
  const frameHeight = 64;
  const frameCount = 4;

  canvas.width = frameWidth * frameCount;
  canvas.height = frameHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;

  // Type-specific colors
  const bodyColor = type === 'TANK' ? '#3b82f6' : type === 'BALANCED' ? '#8b5cf6' : '#ef4444';
  const eyeColor = '#ff0000';

  // Draw 4 frames
  for (let frame = 0; frame < frameCount; frame++) {
    const offsetX = frame * frameWidth;
    const breatheOffset = frame < 2 ? 0 : 1; // Breathing animation

    // Body size varies by type
    const bodySize = type === 'TANK' ? 32 : type === 'BALANCED' ? 24 : 20;
    const bodyX = offsetX + (frameWidth - bodySize) / 2;
    const bodyY = (frameHeight - bodySize) / 2 + breatheOffset;

    // Body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(bodyX, bodyY, bodySize, bodySize);

    // Eyes
    ctx.fillStyle = eyeColor;
    const eyeSize = 4;
    const eyeY = bodyY + bodySize / 3;
    ctx.fillRect(bodyX + bodySize / 4, eyeY, eyeSize, eyeSize);
    ctx.fillRect(bodyX + (bodySize * 3) / 4 - eyeSize, eyeY, eyeSize, eyeSize);

    // Type-specific features
    if (type === 'TANK') {
      // Add armor plating
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(bodyX - 2, bodyY + 8, 2, 16);
      ctx.fillRect(bodyX + bodySize, bodyY + 8, 2, 16);
    } else if (type === 'GLASS_CANNON') {
      // Add spikes
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(bodyX + bodySize / 2 - 2, bodyY - 4, 4, 4);
      ctx.fillRect(bodyX - 4, bodyY + bodySize / 2 - 2, 4, 4);
      ctx.fillRect(bodyX + bodySize, bodyY + bodySize / 2 - 2, 4, 4);
    }
  }

  return canvas.toDataURL();
}

export function generateMonsterAttackSprite(type: 'TANK' | 'BALANCED' | 'GLASS_CANNON'): string {
  const canvas = document.createElement('canvas');
  const frameWidth = 64;
  const frameHeight = 64;
  const frameCount = 6;

  canvas.width = frameWidth * frameCount;
  canvas.height = frameHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;

  const bodyColor = type === 'TANK' ? '#3b82f6' : type === 'BALANCED' ? '#8b5cf6' : '#ef4444';
  const eyeColor = '#ff0000';

  for (let frame = 0; frame < frameCount; frame++) {
    const offsetX = frame * frameWidth;
    const lunge = frame >= 2 && frame < 5 ? 4 : 0; // Lunge forward during attack

    const bodySize = type === 'TANK' ? 32 : type === 'BALANCED' ? 24 : 20;
    const bodyX = offsetX + (frameWidth - bodySize) / 2 + lunge;
    const bodyY = (frameHeight - bodySize) / 2;

    // Body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(bodyX, bodyY, bodySize, bodySize);

    // Eyes (angry)
    ctx.fillStyle = eyeColor;
    const eyeSize = 6; // Larger when attacking
    const eyeY = bodyY + bodySize / 3 - 2;
    ctx.fillRect(bodyX + bodySize / 4, eyeY, eyeSize, eyeSize);
    ctx.fillRect(bodyX + (bodySize * 3) / 4 - eyeSize, eyeY, eyeSize, eyeSize);

    // Mouth (teeth)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bodyX + bodySize / 3, bodyY + (bodySize * 2) / 3, 4, 3);
    ctx.fillRect(bodyX + (bodySize * 2) / 3 - 4, bodyY + (bodySize * 2) / 3, 4, 3);
  }

  return canvas.toDataURL();
}

/**
 * Generate all placeholder sprites and save to sessionStorage
 * This avoids regenerating on every render
 */
export function initializePlaceholderSprites() {
  if (typeof window === 'undefined') return;

  // Check if already initialized
  if (sessionStorage.getItem('sprites-initialized')) return;

  try {
    // Generate and store sprites
    sessionStorage.setItem('sprite-hero-idle', generateHeroIdleSprite());
    sessionStorage.setItem('sprite-hero-attack', generateHeroAttackSprite());
    sessionStorage.setItem('sprite-monster-tank-idle', generateMonsterIdleSprite('TANK'));
    sessionStorage.setItem('sprite-monster-balanced-idle', generateMonsterIdleSprite('BALANCED'));
    sessionStorage.setItem('sprite-monster-glass-cannon-idle', generateMonsterIdleSprite('GLASS_CANNON'));
    sessionStorage.setItem('sprite-monster-tank-attack', generateMonsterAttackSprite('TANK'));
    sessionStorage.setItem('sprite-monster-balanced-attack', generateMonsterAttackSprite('BALANCED'));
    sessionStorage.setItem('sprite-monster-glass-cannon-attack', generateMonsterAttackSprite('GLASS_CANNON'));

    sessionStorage.setItem('sprites-initialized', 'true');
  } catch (error) {
    console.error('Failed to generate placeholder sprites:', error);
  }
}

/**
 * Get a placeholder sprite from sessionStorage
 */
export function getPlaceholderSprite(key: string): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(`sprite-${key}`) || '';
}
