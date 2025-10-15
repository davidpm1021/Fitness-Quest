/**
 * Player Archetype Definitions for Simulation Testing
 *
 * Defines behavioral patterns for different player types to test game balance
 */

export interface Archetype {
  name: string;
  checkInRate: number; // 0-1, probability of checking in each day
  goalsMetRate: number; // 0-1, probability of meeting each goal
  goalsMetAverage: number; // Average number of goals met per check-in
  actionStrategy: ActionStrategy;
  encouragementFrequency: number; // 0-1, probability of sending encouragements
  skillStrategy: SkillStrategy;
  missPattern: MissPattern;
}

export type ActionStrategy =
  | 'optimized'        // Uses HEROIC_STRIKE when available, SUPPORT strategically
  | 'mostly-attack'    // 80% ATTACK, 10% DEFEND, 10% SUPPORT
  | 'attack-only'      // Only uses ATTACK
  | 'balanced'         // 40% ATTACK, 30% DEFEND, 20% SUPPORT, 10% HEROIC_STRIKE
  | 'support-heavy'    // 20% ATTACK, 30% DEFEND, 40% SUPPORT, 10% HEROIC_STRIKE
  | 'random';          // Random selection

export type SkillStrategy =
  | 'warrior-focused'  // Damage-oriented, Warrior tree
  | 'guardian-focused' // Defense-oriented, Guardian tree
  | 'healer-focused'   // Support-oriented, Healer tree
  | 'balanced'         // Mix of all trees
  | 'random'           // Random skill choices
  | 'never';           // Never spends skill points

export type MissPattern =
  | 'random'           // Random misses based on checkInRate
  | 'weekday-miss'     // Mostly misses weekdays
  | 'weekend-miss'     // Mostly misses weekends
  | 'clustered'        // Misses come in 2-3 day clusters
  | 'long-breaks';     // Includes 5-7 day breaks

/**
 * THE PERFECT PLAYER ("Max Effort")
 * Upper bound of progression - how powerful can players get?
 */
export const PERFECT: Archetype = {
  name: 'Perfect Player',
  checkInRate: 1.0,
  goalsMetRate: 1.0,
  goalsMetAverage: 5,
  actionStrategy: 'optimized',
  encouragementFrequency: 1.0,
  skillStrategy: 'warrior-focused',
  missPattern: 'random',
};

/**
 * THE CONSISTENT PLAYER ("Steady Eddie")
 * Realistic "good" player - target experience
 */
export const CONSISTENT: Archetype = {
  name: 'Consistent Player',
  checkInRate: 0.85,
  goalsMetRate: 0.70,
  goalsMetAverage: 3.5,
  actionStrategy: 'mostly-attack',
  encouragementFrequency: 0.3,
  skillStrategy: 'balanced',
  missPattern: 'random',
};

/**
 * THE CASUAL PLAYER ("Weekend Warrior")
 * Lower bound - minimum viable engagement
 */
export const CASUAL: Archetype = {
  name: 'Casual Player',
  checkInRate: 0.60,
  goalsMetRate: 0.50,
  goalsMetAverage: 2.5,
  actionStrategy: 'attack-only',
  encouragementFrequency: 0.05,
  skillStrategy: 'random',
  missPattern: 'weekday-miss',
};

/**
 * THE RETURNING PLAYER ("Comeback Kid")
 * Tests welcome-back system effectiveness
 */
export const RETURNING: Archetype = {
  name: 'Returning Player',
  checkInRate: 0.55,
  goalsMetRate: 0.60,
  goalsMetAverage: 3,
  actionStrategy: 'balanced',
  encouragementFrequency: 0.5,
  skillStrategy: 'healer-focused',
  missPattern: 'long-breaks',
};

/**
 * THE BURNOUT PLAYER ("Gave Up")
 * Negative case - does game prevent burnout?
 */
export const BURNOUT: Archetype = {
  name: 'Burnout Player',
  checkInRate: 0.25,
  goalsMetRate: 0.30,
  goalsMetAverage: 1.5,
  actionStrategy: 'attack-only',
  encouragementFrequency: 0,
  skillStrategy: 'never',
  missPattern: 'clustered',
};

/**
 * THE SOCIAL BUTTERFLY ("Team Player")
 * Tests maximum defense from encouragements, support role viability
 */
export const SOCIAL: Archetype = {
  name: 'Social Butterfly',
  checkInRate: 0.75,
  goalsMetRate: 0.60,
  goalsMetAverage: 3,
  actionStrategy: 'support-heavy',
  encouragementFrequency: 1.0,
  skillStrategy: 'healer-focused',
  missPattern: 'random',
};

/**
 * All available archetypes
 */
export const ARCHETYPES = {
  PERFECT,
  CONSISTENT,
  CASUAL,
  RETURNING,
  BURNOUT,
  SOCIAL,
};

/**
 * Party configurations for testing
 */
export interface PartyConfig {
  name: string;
  archetypes: Archetype[];
}

export const PARTY_CONFIGS = {
  SOLO: {
    name: 'Solo Player',
    archetypes: [CONSISTENT],
  },
  DUO: {
    name: 'Duo',
    archetypes: [PERFECT, CASUAL],
  },
  STANDARD_4: {
    name: 'Standard 4-Player Party',
    archetypes: [PERFECT, CONSISTENT, CONSISTENT, RETURNING],
  },
  LARGE_8: {
    name: 'Large 8-Player Party',
    archetypes: [
      PERFECT,
      CONSISTENT,
      CONSISTENT,
      CONSISTENT,
      CASUAL,
      CASUAL,
      RETURNING,
      BURNOUT,
    ],
  },
  SUPPORT_HEAVY: {
    name: 'Support-Heavy Party',
    archetypes: [SOCIAL, SOCIAL, CONSISTENT],
  },
};

/**
 * Determine if a player should check in on a given day
 */
export function shouldCheckIn(
  archetype: Archetype,
  day: number,
  previousCheckIns: boolean[]
): boolean {
  // First 2 weeks for BURNOUT archetype - always check in
  if (archetype.name === 'Burnout Player' && day <= 14) {
    return true;
  }

  // RETURNING archetype - specific break patterns
  if (archetype.name === 'Returning Player') {
    // 7-day break in week 3 (days 15-21)
    if (day >= 15 && day <= 21) return false;
    // 5-day break in week 6 (days 36-40)
    if (day >= 36 && day <= 40) return false;
  }

  // CASUAL archetype - weekend warrior pattern
  if (archetype.name === 'Casual Player') {
    const dayOfWeek = day % 7;
    // More likely on weekends (days 5, 6)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return Math.random() < 0.8;
    }
  }

  // BURNOUT archetype - clustered misses after day 14
  if (archetype.name === 'Burnout Player' && day > 14) {
    // Check if we're in a miss cluster
    const lastThreeDays = previousCheckIns.slice(-3);
    if (lastThreeDays.every(ci => !ci)) {
      // End the miss cluster, check in
      return Math.random() < 0.5;
    }
    // Otherwise very low check-in rate
    return Math.random() < 0.15;
  }

  // Default: random based on checkInRate
  return Math.random() < archetype.checkInRate;
}

/**
 * Determine how many goals were met for a check-in
 */
export function calculateGoalsMet(archetype: Archetype): number {
  const totalGoals = 5;
  let goalsMet = 0;

  for (let i = 0; i < totalGoals; i++) {
    if (Math.random() < archetype.goalsMetRate) {
      goalsMet++;
    }
  }

  // Ensure average is respected (simple adjustment)
  if (goalsMet === 0 && archetype.goalsMetAverage > 0) {
    goalsMet = 1; // At least 1 goal if average > 0
  }

  return goalsMet;
}

/**
 * Determine which combat action to use
 */
export function selectCombatAction(
  archetype: Archetype,
  focusPoints: number,
  partyMembers: Array<{ current_hp: number; max_hp: number }>
): 'ATTACK' | 'DEFEND' | 'SUPPORT' | 'HEROIC_STRIKE' {
  if (archetype.actionStrategy === 'attack-only') {
    return 'ATTACK';
  }

  if (archetype.actionStrategy === 'optimized') {
    // Use HEROIC_STRIKE if we have 3+ focus and it's valuable
    if (focusPoints >= 3 && Math.random() < 0.3) {
      return 'HEROIC_STRIKE';
    }
    // Use SUPPORT if teammate needs healing and we have 2+ focus
    const injuredTeammate = partyMembers.find(
      pm => pm.current_hp < pm.max_hp * 0.7
    );
    if (injuredTeammate && focusPoints >= 2 && Math.random() < 0.4) {
      return 'SUPPORT';
    }
    // Use DEFEND if low on focus
    if (focusPoints < 3 && Math.random() < 0.2) {
      return 'DEFEND';
    }
    return 'ATTACK';
  }

  if (archetype.actionStrategy === 'mostly-attack') {
    const rand = Math.random();
    if (rand < 0.8) return 'ATTACK';
    if (rand < 0.9) return 'DEFEND';
    return 'SUPPORT';
  }

  if (archetype.actionStrategy === 'balanced') {
    const rand = Math.random();
    if (rand < 0.4) return 'ATTACK';
    if (rand < 0.7 && focusPoints >= 1) return 'DEFEND';
    if (rand < 0.9 && focusPoints >= 2) return 'SUPPORT';
    if (focusPoints >= 3) return 'HEROIC_STRIKE';
    return 'ATTACK';
  }

  if (archetype.actionStrategy === 'support-heavy') {
    const rand = Math.random();
    if (rand < 0.2) return 'ATTACK';
    if (rand < 0.5 && focusPoints >= 1) return 'DEFEND';
    if (rand < 0.9 && focusPoints >= 2) return 'SUPPORT';
    if (focusPoints >= 3) return 'HEROIC_STRIKE';
    return 'ATTACK';
  }

  // Random
  const actions: Array<'ATTACK' | 'DEFEND' | 'SUPPORT' | 'HEROIC_STRIKE'> = [
    'ATTACK',
  ];
  if (focusPoints >= 1) actions.push('DEFEND');
  if (focusPoints >= 2) actions.push('SUPPORT');
  if (focusPoints >= 3) actions.push('HEROIC_STRIKE');
  return actions[Math.floor(Math.random() * actions.length)];
}

/**
 * Determine if player should send encouragements
 */
export function shouldSendEncouragements(archetype: Archetype): boolean {
  return Math.random() < archetype.encouragementFrequency;
}
