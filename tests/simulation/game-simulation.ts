/**
 * Game Simulation Framework
 *
 * Simulates days/weeks/months of gameplay to test game balance
 */

import { prisma } from '@/lib/prisma';
import {
  rollD20,
  rollBaseDamage,
  calculateAttackBonuses,
  calculateDamage,
  calculateDefense,
  updateStreak,
  rollCounterattack,
  calculateCounterattackDamage,
} from '@/lib/combat';
import {
  calculateCheckInXP,
  calculateLevelFromXP,
  didLevelUp,
  calculateSkillPointsEarned,
} from '@/lib/progression';
import {
  Archetype,
  shouldCheckIn,
  calculateGoalsMet,
  selectCombatAction,
  shouldSendEncouragements,
} from './archetypes';

export interface SimulationPlayer {
  id: string;
  userId: string;
  partyMemberId: string;
  archetype: Archetype;
  checkIns: boolean[]; // Track which days they checked in
  stats: {
    totalCheckIns: number;
    totalGoalsMet: number;
    totalDamageDealt: number;
    totalHPLost: number;
    deaths: number;
    currentStreak: number;
    maxStreak: number;
    finalLevel: number;
    finalXP: number;
    finalSkillPoints: number;
    encouragementsSent: number;
    encouragementsReceived: number;
    actionUsage: {
      ATTACK: number;
      DEFEND: number;
      SUPPORT: number;
      HEROIC_STRIKE: number;
    };
  };
}

export interface SimulationResult {
  partyConfig: string;
  durationDays: number;
  monstersDefeated: number;
  averageDaysPerMonster: number;
  players: SimulationPlayer[];
  dailySnapshots: DailySnapshot[];
  analysis: BalanceAnalysis;
}

export interface DailySnapshot {
  day: number;
  monsterHp: number;
  monsterMaxHp: number;
  partyDamage: number;
  playerHp: number[];
  playerLevels: number[];
}

export interface BalanceAnalysis {
  summary: string;
  redFlags: RedFlag[];
  recommendations: string[];
}

export interface RedFlag {
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  issue: string;
  metric: string;
  recommendation: string;
}

/**
 * Create a test party with specified archetypes
 */
export async function createTestParty(
  partyConfig: { name: string; archetypes: Archetype[] },
  testId: string
): Promise<{
  partyId: string;
  players: SimulationPlayer[];
}> {
  // Create party
  const party = await prisma.parties.create({
    data: {
      id: `sim_party_${testId}_${Date.now()}`,
      name: `Simulation: ${partyConfig.name}`,
      invite_code: `SIM_${testId}`,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  // Create users and party members for each archetype
  const players: SimulationPlayer[] = [];

  for (let i = 0; i < partyConfig.archetypes.length; i++) {
    const archetype = partyConfig.archetypes[i];
    const userId = `sim_user_${testId}_${i}_${Date.now()}`;
    const partyMemberId = `sim_pm_${testId}_${i}_${Date.now()}`;

    // Create user
    await prisma.users.create({
      data: {
        id: userId,
        email: `sim_${testId}_${i}@test.com`,
        password_hash: 'simulated',
        username: `sim_${testId}_${i}`,
        display_name: `${archetype.name} ${i + 1}`,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Create party member
    await prisma.party_members.create({
      data: {
        id: partyMemberId,
        party_id: party.id,
        user_id: userId,
        current_hp: 100,
        max_hp: 100,
        current_defense: 0,
        current_streak: 0,
        focus_points: 5,
        xp: 0,
        level: 1,
        skill_points: 0,
        joined_at: new Date(),
      },
    });

    // Create 5 goals for this user
    const goalTypes = ['CARDIO', 'STRENGTH', 'PROTEIN', 'SLEEP', 'CUSTOM'] as const;
    for (let g = 0; g < 5; g++) {
      await prisma.goals.create({
        data: {
          id: `sim_goal_${testId}_${i}_${g}_${Date.now()}`,
          user_id: userId,
          goal_type: goalTypes[g],
          name: `Goal ${g + 1}`,
          target_value: 30,
          target_unit: 'minutes',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    players.push({
      id: userId,
      userId,
      partyMemberId,
      archetype,
      checkIns: [],
      stats: {
        totalCheckIns: 0,
        totalGoalsMet: 0,
        totalDamageDealt: 0,
        totalHPLost: 0,
        deaths: 0,
        currentStreak: 0,
        maxStreak: 0,
        finalLevel: 1,
        finalXP: 0,
        finalSkillPoints: 0,
        encouragementsSent: 0,
        encouragementsReceived: 0,
        actionUsage: {
          ATTACK: 0,
          DEFEND: 0,
          SUPPORT: 0,
          HEROIC_STRIKE: 0,
        },
      },
    });
  }

  return { partyId: party.id, players };
}

/**
 * Create a monster for the party
 */
export async function createMonster(
  partyId: string,
  monsterType: 'TANK' | 'BALANCED' | 'GLASS_CANNON',
  testId: string
): Promise<string> {
  // Monster stats based on type
  const stats = {
    TANK: { maxHp: 300, ac: 14, baseDamage: [3, 4], counterattack: 40 },
    BALANCED: { maxHp: 200, ac: 12, baseDamage: [4, 5], counterattack: 30 },
    GLASS_CANNON: { maxHp: 150, ac: 10, baseDamage: [5, 6], counterattack: 20 },
  };

  const monsterStats = stats[monsterType];

  // Create monster
  const monster = await prisma.monsters.create({
    data: {
      id: `sim_monster_${testId}_${Date.now()}`,
      name: `Simulation ${monsterType}`,
      description: `Test monster for simulation`,
      monster_type: monsterType,
      max_hp: monsterStats.maxHp,
      current_hp: monsterStats.maxHp,
      armor_class: monsterStats.ac,
      base_damage: monsterStats.baseDamage,
      counterattack_chance: monsterStats.counterattack,
      is_defeated: false,
      created_at: new Date(),
    },
  });

  // Link to party
  await prisma.party_monsters.create({
    data: {
      id: `sim_pm_${testId}_${Date.now()}`,
      party_id: partyId,
      monster_id: monster.id,
      is_active: true,
      votes: 0,
      created_at: new Date(),
    },
  });

  return monster.id;
}

/**
 * Simulate a single day for the entire party
 */
export async function simulateDay(
  day: number,
  partyId: string,
  players: SimulationPlayer[],
  baseDate: Date
): Promise<DailySnapshot> {
  const currentDate = new Date(baseDate);
  currentDate.setDate(currentDate.getDate() + day);
  currentDate.setHours(0, 0, 0, 0);

  // Get active monster
  const activeMonster = await prisma.party_monsters.findFirst({
    where: {
      party_id: partyId,
      is_active: true,
    },
    include: {
      monsters: true,
    },
  });

  let totalPartyDamage = 0;
  const playerHp: number[] = [];
  const playerLevels: number[] = [];

  // Each player decides whether to check in
  for (const player of players) {
    const shouldCheckInToday = shouldCheckIn(
      player.archetype,
      day,
      player.checkIns
    );
    player.checkIns.push(shouldCheckInToday);

    if (!shouldCheckInToday) {
      // Player didn't check in - get current stats
      const partyMember = await prisma.party_members.findUnique({
        where: { id: player.partyMemberId },
      });
      if (partyMember) {
        playerHp.push(partyMember.current_hp);
        playerLevels.push(partyMember.level);
      }
      continue;
    }

    // Player checks in!
    const damage = await simulatePlayerCheckIn(
      player,
      currentDate,
      partyId,
      activeMonster,
      players
    );
    totalPartyDamage += damage;

    // Get updated stats after check-in
    const partyMember = await prisma.party_members.findUnique({
      where: { id: player.partyMemberId },
    });
    if (partyMember) {
      playerHp.push(partyMember.current_hp);
      playerLevels.push(partyMember.level);
    }
  }

  // Update monster HP
  let finalMonsterHp = 0;
  const monsterMaxHp = activeMonster ? activeMonster.monsters.max_hp : 0;

  if (activeMonster && totalPartyDamage > 0) {
    const newHp = Math.max(0, activeMonster.monsters.current_hp - totalPartyDamage);
    finalMonsterHp = newHp;

    await prisma.monsters.update({
      where: { id: activeMonster.monsters.id },
      data: {
        current_hp: newHp,
        is_defeated: newHp === 0,
        defeated_at: newHp === 0 ? new Date() : undefined,
      },
    });

    if (newHp === 0) {
      await prisma.party_monsters.update({
        where: { id: activeMonster.id },
        data: { is_active: false },
      });
    }
  } else if (activeMonster) {
    // No damage dealt, but monster exists - use current HP
    finalMonsterHp = activeMonster.monsters.current_hp;
  }

  return {
    day,
    monsterHp: finalMonsterHp,
    monsterMaxHp: monsterMaxHp,
    partyDamage: totalPartyDamage,
    playerHp,
    playerLevels,
  };
}

/**
 * Simulate a single player's check-in
 */
async function simulatePlayerCheckIn(
  player: SimulationPlayer,
  date: Date,
  partyId: string,
  activeMonster: any,
  allPlayers: SimulationPlayer[]
): Promise<number> {
  // Get current party member state
  const partyMember = await prisma.party_members.findUnique({
    where: { id: player.partyMemberId },
    include: {
      parties: {
        include: {
          party_members: true,
        },
      },
    },
  });

  if (!partyMember) return 0;

  // Calculate goals met
  const goalsMet = calculateGoalsMet(player.archetype);
  player.stats.totalGoalsMet += goalsMet;

  // Check for previous day check-in for streak
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);

  const previousCheckIn = await prisma.check_ins.findFirst({
    where: {
      party_member_id: partyMember.id,
      check_in_date: yesterday,
    },
  });

  const newStreak = updateStreak(!!previousCheckIn, partyMember.current_streak);
  if (newStreak > player.stats.maxStreak) {
    player.stats.maxStreak = newStreak;
  }

  // Count recent encouragements for defense
  const sevenDaysAgo = new Date(date);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentEncouragementsCount = await prisma.encouragements.count({
    where: {
      to_party_member_id: partyMember.id,
      created_at: {
        gte: sevenDaysAgo,
      },
    },
  });

  player.stats.encouragementsReceived = recentEncouragementsCount;

  // Calculate new defense
  const newDefense = calculateDefense(newStreak, recentEncouragementsCount);

  // Select combat action
  const combatAction = selectCombatAction(
    player.archetype,
    partyMember.focus_points,
    partyMember.parties.party_members
  );
  player.stats.actionUsage[combatAction]++;

  // Calculate bonuses
  const todayCheckIns = allPlayers.filter(
    p => p.checkIns[p.checkIns.length - 1] === true
  ).length - 1; // Exclude current player

  const bonuses = calculateAttackBonuses({
    goalsMet,
    currentStreak: newStreak,
    currentHp: partyMember.current_hp,
    maxHp: partyMember.max_hp,
    checkedInCount: todayCheckIns,
  });

  // Multiple attacks system
  const numAttacks = Math.max(1, goalsMet);
  let totalDamage = 0;
  let anyHit = false;

  // Apply combat action modifiers
  let damageMultiplier = 1.0;
  let autoHit = false;
  let focusChange = 0;

  switch (combatAction) {
    case 'ATTACK':
      // Free, no modifiers
      break;
    case 'DEFEND':
      damageMultiplier = 0.5;
      focusChange = -1;
      break;
    case 'SUPPORT':
      damageMultiplier = 0.5;
      focusChange = -2;
      // Could heal a teammate, but simplified for simulation
      break;
    case 'HEROIC_STRIKE':
      autoHit = true;
      damageMultiplier = 2.0;
      focusChange = -3;
      break;
  }

  // Roll attacks
  for (let i = 0; i < numAttacks; i++) {
    const attackRoll = rollD20();
    let baseDamage = rollBaseDamage();
    const attackBonus = bonuses.totalBonus + 1;

    let attackResult;
    if (autoHit) {
      attackResult = {
        hit: true,
        damage: Math.floor(baseDamage * damageMultiplier),
      };
    } else {
      attackResult = calculateDamage(
        attackRoll,
        attackBonus,
        Math.floor(baseDamage * damageMultiplier),
        activeMonster?.monsters.armor_class || 12
      );
    }

    if (attackResult.hit) anyHit = true;
    totalDamage += attackResult.damage;
  }

  player.stats.totalDamageDealt += totalDamage;

  // Roll for counterattack
  let counterattackDamage = 0;
  if (activeMonster && anyHit) {
    let counterattackChance = activeMonster.monsters.counterattack_chance;
    if (combatAction === 'DEFEND') {
      counterattackChance = Math.floor(counterattackChance * 0.5);
    }

    const wasCounterattacked = rollCounterattack(counterattackChance, newDefense);
    if (wasCounterattacked) {
      counterattackDamage = calculateCounterattackDamage(
        activeMonster.monsters.base_damage
      );
      if (combatAction === 'DEFEND') {
        counterattackDamage = Math.floor(counterattackDamage * 0.5);
      }
      player.stats.totalHPLost += counterattackDamage;
    }
  }

  // Calculate XP
  const xpEarned = calculateCheckInXP(goalsMet);
  const newXP = partyMember.xp + xpEarned;
  const newLevel = calculateLevelFromXP(newXP);
  const levelUpInfo = didLevelUp(partyMember.xp, newXP);
  const skillPointsEarned = calculateSkillPointsEarned(
    levelUpInfo.oldLevel,
    levelUpInfo.newLevel
  );

  // Calculate focus
  const baseFocusRecovery = 2 + goalsMet;
  let newFocus = partyMember.focus_points + baseFocusRecovery + focusChange;
  newFocus = Math.min(10, Math.max(0, newFocus));

  // Update party member
  const newHp = Math.max(0, partyMember.current_hp - counterattackDamage);
  if (newHp === 0) {
    player.stats.deaths++;
  }

  await prisma.party_members.update({
    where: { id: partyMember.id },
    data: {
      current_streak: newStreak,
      current_defense: newDefense,
      current_hp: newHp,
      focus_points: newFocus,
      xp: newXP,
      level: newLevel,
      skill_points: partyMember.skill_points + skillPointsEarned,
    },
  });

  // Apply DEFEND bonus to all party members
  if (combatAction === 'DEFEND') {
    await prisma.party_members.updateMany({
      where: {
        party_id: partyId,
      },
      data: {
        current_defense: {
          increment: 5,
        },
      },
    });
  }

  // Create check-in record
  await prisma.check_ins.create({
    data: {
      id: crypto.randomUUID(),
      party_member_id: partyMember.id,
      party_id: partyId,
      check_in_date: date,
      goals_met: goalsMet,
      is_rest_day: false,
      attack_roll: 10, // Simplified
      attack_bonus: bonuses.totalBonus + 1,
      damage_dealt: totalDamage,
      was_hit_by_monster: counterattackDamage > 0,
      damage_taken: counterattackDamage,
      combat_action: combatAction,
      focus_earned: focusChange + baseFocusRecovery,
      created_at: new Date(),
    },
  });

  // Send encouragements if archetype dictates
  if (shouldSendEncouragements(player.archetype)) {
    const teammates = partyMember.parties.party_members.filter(
      pm => pm.id !== partyMember.id
    );
    for (const teammate of teammates) {
      await prisma.encouragements.create({
        data: {
          id: crypto.randomUUID(),
          from_user_id: player.userId,
          to_party_member_id: teammate.id,
          reaction_type: 'FIRE',
          created_at: new Date(),
        },
      });
      player.stats.encouragementsSent++;
    }
  }

  player.stats.totalCheckIns++;

  return totalDamage;
}

/**
 * Clean up simulation data
 */
export async function cleanupSimulation(testId: string): Promise<void> {
  // Delete in reverse order of dependencies
  await prisma.encouragements.deleteMany({
    where: {
      OR: [
        { from_user_id: { contains: `sim_user_${testId}` } },
        {
          party_members: {
            user_id: { contains: `sim_user_${testId}` },
          },
        },
      ],
    },
  });

  await prisma.check_ins.deleteMany({
    where: {
      party_members: {
        user_id: { contains: `sim_user_${testId}` },
      },
    },
  });

  await prisma.party_monsters.deleteMany({
    where: {
      party_id: { contains: `sim_party_${testId}` },
    },
  });

  await prisma.monsters.deleteMany({
    where: {
      id: { contains: `sim_monster_${testId}` },
    },
  });

  await prisma.goals.deleteMany({
    where: {
      user_id: { contains: `sim_user_${testId}` },
    },
  });

  await prisma.party_members.deleteMany({
    where: {
      user_id: { contains: `sim_user_${testId}` },
    },
  });

  await prisma.parties.deleteMany({
    where: {
      id: { contains: `sim_party_${testId}` },
    },
  });

  await prisma.users.deleteMany({
    where: {
      id: { contains: `sim_user_${testId}` },
    },
  });
}
