/**
 * Monster Phases System
 *
 * Monsters become more dangerous as they lose HP, creating dynamic difficulty
 * and dramatic moments during battles.
 *
 * Phase Thresholds:
 * - Phase 1 (100-76% HP): Normal
 * - Phase 2 (75-51% HP): Bloodied - Getting aggressive
 * - Phase 3 (50-26% HP): Enraged - Very dangerous
 * - Phase 4 (25-0% HP): Desperate - All-or-nothing
 */

export type MonsterPhase = 1 | 2 | 3 | 4;

export interface PhaseInfo {
  phase: MonsterPhase;
  name: string;
  description: string;
  counterattackBonus: number; // Percentage points to add
  damageBonus: number; // Flat damage to add
  damageMultiplier: number; // Multiplier for all damage (1.0 = normal)
  icon: string;
  color: string; // Tailwind color class
}

/**
 * Phase definitions with their effects
 */
export const MONSTER_PHASES: Record<MonsterPhase, PhaseInfo> = {
  1: {
    phase: 1,
    name: 'Normal',
    description: 'The monster is at full strength.',
    counterattackBonus: 0,
    damageBonus: 0,
    damageMultiplier: 1.0,
    icon: '👹',
    color: 'text-gray-400',
  },
  2: {
    phase: 2,
    name: 'Bloodied',
    description: 'The monster is wounded and fighting more aggressively!',
    counterattackBonus: 10,
    damageBonus: 1,
    damageMultiplier: 1.0,
    icon: '💢',
    color: 'text-yellow-400',
  },
  3: {
    phase: 3,
    name: 'Enraged',
    description: 'The monster has entered a furious rage! Beware its wrath!',
    counterattackBonus: 20,
    damageBonus: 2,
    damageMultiplier: 1.0,
    icon: '🔥',
    color: 'text-orange-400',
  },
  4: {
    phase: 4,
    name: 'Desperate',
    description: 'The monster fights with desperate ferocity! Victory is near, but danger is high!',
    counterattackBonus: 30,
    damageBonus: 0,
    damageMultiplier: 1.5,
    icon: '💀',
    color: 'text-red-400',
  },
};

/**
 * Calculate which phase a monster is in based on HP percentage
 *
 * @param currentHp Current HP
 * @param maxHp Maximum HP
 * @returns Monster phase (1-4)
 */
export function calculateMonsterPhase(currentHp: number, maxHp: number): MonsterPhase {
  if (maxHp <= 0) return 1;

  const hpPercentage = (currentHp / maxHp) * 100;

  if (hpPercentage > 75) return 1;
  if (hpPercentage > 50) return 2;
  if (hpPercentage > 25) return 3;
  return 4;
}

/**
 * Check if a phase transition occurred
 *
 * @param oldHp Previous HP
 * @param newHp New HP after damage
 * @param maxHp Maximum HP
 * @returns Phase transition info if one occurred, null otherwise
 */
export function checkPhaseTransition(
  oldHp: number,
  newHp: number,
  maxHp: number
): { oldPhase: MonsterPhase; newPhase: MonsterPhase; phaseInfo: PhaseInfo } | null {
  const oldPhase = calculateMonsterPhase(oldHp, maxHp);
  const newPhase = calculateMonsterPhase(newHp, maxHp);

  if (oldPhase !== newPhase) {
    return {
      oldPhase,
      newPhase,
      phaseInfo: MONSTER_PHASES[newPhase],
    };
  }

  return null;
}

/**
 * Get phase info for display
 *
 * @param currentHp Current HP
 * @param maxHp Maximum HP
 * @returns Phase information
 */
export function getPhaseInfo(currentHp: number, maxHp: number): PhaseInfo {
  const phase = calculateMonsterPhase(currentHp, maxHp);
  return MONSTER_PHASES[phase];
}

/**
 * Apply phase modifiers to combat stats
 *
 * @param phase Current monster phase
 * @param baseCounterattackChance Base counterattack chance
 * @param baseDamage Base damage amount
 * @returns Modified combat stats
 */
export function applyPhaseModifiers(
  phase: MonsterPhase,
  baseCounterattackChance: number,
  baseDamage: number
): { counterattackChance: number; damage: number } {
  const phaseInfo = MONSTER_PHASES[phase];

  const counterattackChance = baseCounterattackChance + phaseInfo.counterattackBonus;
  const damage = Math.floor((baseDamage + phaseInfo.damageBonus) * phaseInfo.damageMultiplier);

  return { counterattackChance, damage };
}

/**
 * Get next phase threshold HP value
 *
 * @param currentPhase Current phase
 * @param maxHp Maximum HP
 * @returns HP value at which next phase starts, or null if already at final phase
 */
export function getNextPhaseThreshold(currentPhase: MonsterPhase, maxHp: number): number | null {
  const thresholds: Record<MonsterPhase, number | null> = {
    1: Math.floor(maxHp * 0.75),
    2: Math.floor(maxHp * 0.5),
    3: Math.floor(maxHp * 0.25),
    4: null, // Final phase
  };

  return thresholds[currentPhase];
}

/**
 * Get phase transition message for UI
 *
 * @param phaseInfo Phase that was just entered
 * @param monsterName Name of the monster
 * @returns Dramatic message for the phase transition
 */
export function getPhaseTransitionMessage(phaseInfo: PhaseInfo, monsterName: string): string {
  const messages: Record<MonsterPhase, string> = {
    1: `${monsterName} is at full strength!`,
    2: `${phaseInfo.icon} ${monsterName.toUpperCase()} IS BLOODIED! The monster fights more aggressively! (+10% counterattack, +1 damage)`,
    3: `${phaseInfo.icon} ${monsterName.toUpperCase()} HAS ENTERED A FURIOUS RAGE! Watch out for devastating counterattacks! (+20% counterattack, +2 damage)`,
    4: `${phaseInfo.icon} ${monsterName.toUpperCase()} FIGHTS WITH DESPERATE FEROCITY! Victory is near, but the danger is extreme! (+30% counterattack, +50% damage!)`,
  };

  return messages[phaseInfo.phase];
}
