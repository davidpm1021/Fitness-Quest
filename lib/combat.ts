/**
 * Combat and dice rolling utilities for Fitness Quest
 */

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
 * Calculate attack bonuses based on game state
 */
export function calculateAttackBonuses(params: {
  goalsMet: number;
  currentStreak: number;
  currentHp: number;
  maxHp: number;
  checkedInCount: number;
}): {
  goalBonus: number;
  streakBonus: number;
  teamBonus: number;
  underdogBonus: number;
  totalBonus: number;
} {
  const { goalsMet, currentStreak, currentHp, maxHp, checkedInCount } = params;

  // +1 per goal met (max 5 goals)
  const goalBonus = Math.min(goalsMet, 5);

  // +2 for 3+ day streak
  const streakBonus = currentStreak >= 3 ? 2 : 0;

  // +1 per party member already checked in (max 2)
  const teamBonus = Math.min(checkedInCount, 2);

  // +2 underdog bonus if HP < 50
  const underdogBonus = currentHp < 50 ? 2 : 0;

  const totalBonus = goalBonus + streakBonus + teamBonus + underdogBonus;

  return {
    goalBonus,
    streakBonus,
    teamBonus,
    underdogBonus,
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
 */
export function calculateDamage(
  attackRoll: number,
  bonuses: number,
  baseDamage: number,
  monsterAC: number = 12
): { hit: boolean; damage: number } {
  const totalRoll = attackRoll + bonuses;
  const hit = totalRoll >= monsterAC;

  if (!hit) {
    // Even on a miss, effort counts - deal base damage (no bonuses)
    return { hit: false, damage: baseDamage };
  }

  // On hit, deal base damage + bonuses
  const damage = baseDamage + bonuses;
  return { hit: true, damage };
}

/**
 * Roll for monster counterattack
 * Counterattack chance is reduced by player defense
 */
export function rollCounterattack(
  counterattackChance: number,
  playerDefense: number
): boolean {
  const adjustedChance = Math.max(0, counterattackChance - playerDefense);
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
