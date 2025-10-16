/**
 * Combat and dice rolling utilities for Fitness Quest
 */

import type { CombatModifiers } from './game/battle-modifiers';

/**
 * Roll a d20 (20-sided die)
 */
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Roll for base damage (3-5)
 */
export function rollBaseDamage(): number {
  return Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
}

/**
 * Calculate attack bonuses based on game state and battle modifiers
 */
export function calculateAttackBonuses(params: {
  goalsMet: number;
  currentStreak: number;
  currentHp: number;
  maxHp: number;
  checkedInCount: number;
  combatModifiers?: CombatModifiers | null;
}): {
  goalBonus: number;
  streakBonus: number;
  teamBonus: number;
  underdogBonus: number;
  modifierBonus: number;
  totalBonus: number;
} {
  const { goalsMet, currentStreak, currentHp, maxHp, checkedInCount, combatModifiers } = params;

  // +1 per goal met (max 5 goals)
  const goalBonus = Math.min(goalsMet, 5);

  // +2 for 3+ day streak
  const streakBonus = currentStreak >= 3 ? 2 : 0;

  // +1 per party member already checked in (max 2)
  const teamBonus = Math.min(checkedInCount, 2);

  // +2 underdog bonus if HP < 50
  const underdogBonus = currentHp < 50 ? 2 : 0;

  // Battle modifier bonus (e.g., DETERMINED: +1, CLUMSY: -1)
  const modifierBonus = combatModifiers?.attackBonusModifier ?? 0;

  const totalBonus = goalBonus + streakBonus + teamBonus + underdogBonus + modifierBonus;

  return {
    goalBonus,
    streakBonus,
    teamBonus,
    underdogBonus,
    modifierBonus,
    totalBonus,
  };
}

/**
 * Evaluate if a goal was met considering flex percentage
 */
export function evaluateGoal(
  actualValue: number,
  targetValue: number,
  flexPercentage: number
): boolean {
  const flexAmount = (targetValue * flexPercentage) / 100;
  const minAcceptable = targetValue - flexAmount;
  const maxAcceptable = targetValue + flexAmount;

  return actualValue >= minAcceptable && actualValue <= maxAcceptable;
}

/**
 * Calculate defense stat based on streak and encouragements
 * +5 per consecutive day (max +25 for 5 days)
 * +5 per encouragement received (max +25 for 5 encouragements)
 * Maximum total defense: 50
 */
export function calculateDefense(streak: number, encouragementsReceived: number = 0): number {
  const streakDefense = Math.min(streak * 5, 25);
  const encouragementDefense = Math.min(encouragementsReceived * 5, 25);
  return Math.min(streakDefense + encouragementDefense, 50);
}

/**
 * Update streak based on previous check-in
 */
export function updateStreak(
  hadPreviousDayCheckIn: boolean,
  currentStreak: number
): number {
  if (hadPreviousDayCheckIn) {
    return currentStreak + 1;
  }
  return 1; // Reset to 1 if streak broken
}

/**
 * Calculate total damage dealt
 * Hit or miss, you ALWAYS deal base damage (effort counts!)
 * On hit, you also add bonuses
 * Battle modifiers can affect damage and critical hit chance
 */
export function calculateDamage(
  attackRoll: number,
  bonuses: number,
  baseDamage: number,
  monsterAC: number = 12,
  combatModifiers?: CombatModifiers | null
): { hit: boolean; damage: number; critical: boolean } {
  const totalRoll = attackRoll + bonuses;
  const hit = totalRoll >= monsterAC;

  // Check for critical hit (natural 20 by default, or threshold from PRECISE modifier)
  const critThreshold = combatModifiers?.critThreshold ?? 20;
  const critical = attackRoll >= critThreshold;

  if (!hit) {
    // Even on a miss, effort counts - deal base damage (no bonuses)
    const missModifier = combatModifiers?.damageBonus ?? 0;
    const finalDamage = Math.max(1, baseDamage + missModifier);
    return { hit: false, damage: finalDamage, critical: false };
  }

  // On hit, deal base damage + bonuses + modifier bonuses
  let damage = baseDamage + bonuses;

  // Apply damage modifier (e.g., INSPIRED: +2, WEAKENED: -1)
  if (combatModifiers?.damageBonus) {
    damage += combatModifiers.damageBonus;
  }

  // Apply damage multiplier (e.g., ENRAGED: 1.5x)
  if (combatModifiers?.damageMultiplier && combatModifiers.damageMultiplier !== 1.0) {
    damage = Math.floor(damage * combatModifiers.damageMultiplier);
  }

  // Critical hit doubles damage
  if (critical) {
    damage *= 2;
  }

  // Ensure minimum 1 damage
  damage = Math.max(1, damage);

  return { hit: true, damage, critical };
}

/**
 * Roll for monster counterattack
 * Counterattack chance is reduced by player defense
 * Battle modifiers can increase or decrease counterattack chance
 */
export function rollCounterattack(
  counterattackChance: number,
  playerDefense: number,
  combatModifiers?: CombatModifiers | null
): boolean {
  // Apply modifier bonus/penalty (e.g., CURSED: +10%)
  const modifierAdjustment = combatModifiers?.counterattackChanceModifier ?? 0;
  const baseChance = counterattackChance + modifierAdjustment;

  const adjustedChance = Math.max(0, baseChance - playerDefense);
  const roll = Math.random() * 100;
  return roll < adjustedChance;
}

/**
 * Calculate monster counterattack damage
 */
export function calculateCounterattackDamage(
  baseDamage: number[]
): number {
  const [min, max] = baseDamage;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
