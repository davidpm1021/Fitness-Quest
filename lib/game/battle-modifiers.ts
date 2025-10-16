/**
 * Battle Modifiers System
 *
 * Adds roguelite variety to monster battles by applying random modifiers.
 * Each monster gets 2-3 modifiers that affect combat calculations.
 */

export type BattleModifierType =
  | 'INSPIRED'
  | 'EXHAUSTED'
  | 'FOCUSED'
  | 'STURDY'
  | 'WEAKENED'
  | 'BLESSED'
  | 'CURSED'
  | 'PRECISE'
  | 'CLUMSY'
  | 'ENRAGED'
  | 'FEARFUL'
  | 'DETERMINED';

export type BattleModifierCategory = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export interface BattleModifier {
  type: BattleModifierType;
  category: BattleModifierCategory;
  name: string;
  description: string;
  statEffect: string | null; // Which stat is affected
  effectValue: number; // How much
  icon: string; // Emoji for UI
}

/**
 * All available battle modifiers
 */
export const BATTLE_MODIFIERS: Record<BattleModifierType, BattleModifier> = {
  // POSITIVE MODIFIERS (help the party)
  INSPIRED: {
    type: 'INSPIRED',
    category: 'POSITIVE',
    name: 'Inspired',
    description: 'The party feels energized! All attacks deal +2 damage.',
    statEffect: 'damage',
    effectValue: 2,
    icon: '✨',
  },
  BLESSED: {
    type: 'BLESSED',
    category: 'POSITIVE',
    name: 'Blessed',
    description: 'Divine favor protects the party. All players start with +10 HP.',
    statEffect: 'max_hp',
    effectValue: 10,
    icon: '🙏',
  },
  DETERMINED: {
    type: 'DETERMINED',
    category: 'POSITIVE',
    name: 'Determined',
    description: 'Nothing will stop us! Attack bonus increased by +1.',
    statEffect: 'attack_bonus',
    effectValue: 1,
    icon: '💪',
  },

  // NEGATIVE MODIFIERS (help the monster)
  EXHAUSTED: {
    type: 'EXHAUSTED',
    category: 'NEGATIVE',
    name: 'Exhausted',
    description: 'The party is worn out. Max HP reduced by 10.',
    statEffect: 'max_hp',
    effectValue: -10,
    icon: '😫',
  },
  WEAKENED: {
    type: 'WEAKENED',
    category: 'NEGATIVE',
    name: 'Weakened',
    description: 'Muscles feel heavy. All attacks deal -1 damage (minimum 1).',
    statEffect: 'damage',
    effectValue: -1,
    icon: '😓',
  },
  CURSED: {
    type: 'CURSED',
    category: 'NEGATIVE',
    name: 'Cursed',
    description: 'Bad luck plagues the party. Monster counterattack chance +10%.',
    statEffect: 'counterattack_chance',
    effectValue: 10,
    icon: '👿',
  },
  CLUMSY: {
    type: 'CLUMSY',
    category: 'NEGATIVE',
    name: 'Clumsy',
    description: 'Coordination is off. Attack bonus reduced by -1.',
    statEffect: 'attack_bonus',
    effectValue: -1,
    icon: '🤦',
  },

  // NEUTRAL MODIFIERS (change dynamics)
  FOCUSED: {
    type: 'FOCUSED',
    category: 'NEUTRAL',
    name: 'Focused',
    description: 'Sharp concentration! Rolls of 15+ have advantage.',
    statEffect: 'roll_advantage',
    effectValue: 15,
    icon: '🎯',
  },
  PRECISE: {
    type: 'PRECISE',
    category: 'NEUTRAL',
    name: 'Precise',
    description: 'Every strike counts! Critical hits on natural 18+.',
    statEffect: 'crit_threshold',
    effectValue: 18,
    icon: '⚡',
  },
  ENRAGED: {
    type: 'ENRAGED',
    category: 'NEUTRAL',
    name: 'Enraged',
    description: 'Fury fuels both sides! All damage increased by 50%.',
    statEffect: 'damage_multiplier',
    effectValue: 150, // 150% = 1.5x
    icon: '🔥',
  },
  FEARFUL: {
    type: 'FEARFUL',
    category: 'NEUTRAL',
    name: 'Fearful',
    description: 'Caution prevails. Monster AC +1, but counterattacks deal half damage.',
    statEffect: 'defensive_stance',
    effectValue: 1,
    icon: '😰',
  },
  STURDY: {
    type: 'STURDY',
    category: 'NEUTRAL',
    name: 'Sturdy',
    description: 'Built to last. Monster has +20% HP, but deals -2 damage.',
    statEffect: 'hp_damage_trade',
    effectValue: 20,
    icon: '🛡️',
  },
};

/**
 * Generate 2-3 random modifiers for a monster
 * Ensures variety: mix of positive, negative, and neutral
 */
export function generateRandomModifiers(): BattleModifier[] {
  const allModifiers = Object.values(BATTLE_MODIFIERS);

  // Categorize modifiers
  const positive = allModifiers.filter(m => m.category === 'POSITIVE');
  const negative = allModifiers.filter(m => m.category === 'NEGATIVE');
  const neutral = allModifiers.filter(m => m.category === 'NEUTRAL');

  const modifiers: BattleModifier[] = [];

  // Always include 1 positive and 1 negative for balance
  modifiers.push(positive[Math.floor(Math.random() * positive.length)]);
  modifiers.push(negative[Math.floor(Math.random() * negative.length)]);

  // 50% chance to add a neutral modifier
  if (Math.random() > 0.5) {
    modifiers.push(neutral[Math.floor(Math.random() * neutral.length)]);
  }

  return modifiers;
}

/**
 * Apply modifiers to combat calculation
 */
export interface CombatModifiers {
  damageBonus: number;
  maxHpModifier: number;
  attackBonusModifier: number;
  counterattackChanceModifier: number;
  monsterHpMultiplier: number;
  monsterDamageModifier: number;
  critThreshold: number;
  hasRollAdvantage: boolean;
  rollAdvantageThreshold: number;
  damageMultiplier: number;
}

export function calculateCombatModifiers(modifiers: BattleModifier[]): CombatModifiers {
  const result: CombatModifiers = {
    damageBonus: 0,
    maxHpModifier: 0,
    attackBonusModifier: 0,
    counterattackChanceModifier: 0,
    monsterHpMultiplier: 1.0,
    monsterDamageModifier: 0,
    critThreshold: 20, // Natural 20 by default
    hasRollAdvantage: false,
    rollAdvantageThreshold: 15,
    damageMultiplier: 1.0,
  };

  for (const modifier of modifiers) {
    switch (modifier.statEffect) {
      case 'damage':
        result.damageBonus += modifier.effectValue;
        break;
      case 'max_hp':
        result.maxHpModifier += modifier.effectValue;
        break;
      case 'attack_bonus':
        result.attackBonusModifier += modifier.effectValue;
        break;
      case 'counterattack_chance':
        result.counterattackChanceModifier += modifier.effectValue;
        break;
      case 'roll_advantage':
        result.hasRollAdvantage = true;
        result.rollAdvantageThreshold = modifier.effectValue;
        break;
      case 'crit_threshold':
        result.critThreshold = modifier.effectValue;
        break;
      case 'damage_multiplier':
        result.damageMultiplier = modifier.effectValue / 100;
        break;
      case 'hp_damage_trade':
        // STURDY: +20% HP, -2 damage
        result.monsterHpMultiplier = 1 + (modifier.effectValue / 100);
        result.monsterDamageModifier = -2;
        break;
      case 'defensive_stance':
        // FEARFUL: Monster +1 AC, counterattacks deal half damage
        // This needs to be handled in combat logic
        break;
    }
  }

  return result;
}

/**
 * Get modifier display info for UI
 */
export function getModifierDisplay(modifiers: BattleModifier[]) {
  return modifiers.map(m => ({
    icon: m.icon,
    name: m.name,
    description: m.description,
    category: m.category,
  }));
}
