// lib/progression.ts
// Character progression utilities: XP, leveling, and rewards

/**
 * Calculate level from total XP
 * Formula: Level = floor(sqrt(XP/100)) + 1
 *
 * Examples:
 * - 0 XP = Level 1
 * - 100 XP = Level 2
 * - 400 XP = Level 3
 * - 900 XP = Level 4
 * - 1600 XP = Level 5
 * - 10000 XP = Level 11
 */
export function calculateLevelFromXP(xp: number): number {
  if (xp < 0) return 1;
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
}

/**
 * Calculate XP required to start a specific level
 * Inverse of calculateLevelFromXP
 */
export function calculateXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * (level - 1) * 100;
}

/**
 * Calculate XP progress within current level
 * Returns percentage (0-100) of progress to next level
 */
export function calculateLevelProgress(xp: number): {
  currentLevel: number;
  nextLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressXP: number;
  progressPercentage: number;
} {
  const currentLevel = calculateLevelFromXP(xp);
  const nextLevel = currentLevel + 1;
  const currentLevelXP = calculateXPForLevel(currentLevel);
  const nextLevelXP = calculateXPForLevel(nextLevel);
  const progressXP = xp - currentLevelXP;
  const progressPercentage = Math.floor((progressXP / (nextLevelXP - currentLevelXP)) * 100);

  return {
    currentLevel,
    nextLevel,
    currentLevelXP,
    nextLevelXP,
    progressXP,
    progressPercentage,
  };
}

/**
 * Calculate XP earned on check-in
 * Base: 10 XP for checking in
 * Bonus: +2 XP per goal met
 */
export function calculateCheckInXP(goalsMet: number): number {
  const baseXP = 10;
  const goalBonus = goalsMet * 2;
  return baseXP + goalBonus;
}

/**
 * Calculate XP earned on monster defeat
 * TANK: 100 XP (harder to kill)
 * BALANCED: 75 XP
 * GLASS_CANNON: 50 XP (easier to kill)
 */
export function calculateMonsterDefeatXP(monsterType: 'TANK' | 'BALANCED' | 'GLASS_CANNON'): number {
  switch (monsterType) {
    case 'TANK':
      return 100;
    case 'BALANCED':
      return 75;
    case 'GLASS_CANNON':
      return 50;
    default:
      return 75;
  }
}

/**
 * Check if a level up occurred between old and new XP
 */
export function didLevelUp(oldXP: number, newXP: number): {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
} {
  const oldLevel = calculateLevelFromXP(oldXP);
  const newLevel = calculateLevelFromXP(newXP);

  return {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
  };
}

/**
 * Calculate skill points earned when leveling up
 * Players earn 1 skill point per level
 */
export function calculateSkillPointsEarned(oldLevel: number, newLevel: number): number {
  return Math.max(0, newLevel - oldLevel);
}
