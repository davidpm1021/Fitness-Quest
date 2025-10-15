// lib/encouragementBuffs.ts
// Buff system for rewarding players who encourage their teammates

export type BuffType = "INSPIRED" | "MOTIVATED" | "ENERGIZED" | "FOCUSED";

export interface EncouragementBuff {
  type: BuffType;
  value: number;
  description: string;
  icon: string;
}

/**
 * Roll for a random buff when sending encouragement
 * Rewards players for being supportive teammates
 */
export function rollEncouragementBuff(): EncouragementBuff {
  const roll = Math.random();

  if (roll < 0.25) {
    // 25% chance - Inspired: Defense bonus
    return {
      type: "INSPIRED",
      value: 3,
      description: "+3 Defense until next check-in",
      icon: "🛡️",
    };
  } else if (roll < 0.5) {
    // 25% chance - Motivated: Attack roll bonus
    return {
      type: "MOTIVATED",
      value: 2,
      description: "+2 to next attack roll",
      icon: "⚡",
    };
  } else if (roll < 0.75) {
    // 25% chance - Energized: Damage bonus
    return {
      type: "ENERGIZED",
      value: 3,
      description: "+3 damage on next attack",
      icon: "💥",
    };
  } else {
    // 25% chance - Focused: Roll with advantage
    return {
      type: "FOCUSED",
      value: 1, // Flag to indicate advantage
      description: "Next attack rolls twice (advantage)",
      icon: "🎯",
    };
  }
}

/**
 * Get display text for buff notification
 */
export function getBuffNotification(buff: EncouragementBuff): string {
  return `${buff.icon} You feel ${buff.type.toLowerCase()}! ${buff.description}`;
}

/**
 * Apply buff bonuses during combat
 */
export function applyBuffToAttackRoll(
  baseRoll: number,
  buffType: BuffType | null
): { roll: number; usedBuff: boolean } {
  if (!buffType) {
    return { roll: baseRoll, usedBuff: false };
  }

  if (buffType === "MOTIVATED") {
    return { roll: baseRoll + 2, usedBuff: true };
  }

  if (buffType === "FOCUSED") {
    // Roll with advantage - roll again and take higher
    const secondRoll = Math.floor(Math.random() * 20) + 1;
    return { roll: Math.max(baseRoll, secondRoll), usedBuff: true };
  }

  return { roll: baseRoll, usedBuff: false };
}

/**
 * Apply buff bonuses to damage
 */
export function applyBuffToDamage(
  baseDamage: number,
  buffType: BuffType | null
): { damage: number; usedBuff: boolean } {
  if (!buffType) {
    return { damage: baseDamage, usedBuff: false };
  }

  if (buffType === "ENERGIZED") {
    return { damage: baseDamage + 3, usedBuff: true };
  }

  return { damage: baseDamage, usedBuff: false };
}

/**
 * Apply buff bonuses to defense
 */
export function applyBuffToDefense(
  baseDefense: number,
  buffType: BuffType | null
): number {
  if (buffType === "INSPIRED") {
    return baseDefense + 3;
  }

  return baseDefense;
}
