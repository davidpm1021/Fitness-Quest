import { checkAndAwardAllBadges } from './badges';
import { prisma } from '@/lib/prisma';
import { calculateMonsterDefeatXP, calculateLevelFromXP, calculateSkillPointsEarned } from './progression';

interface VictoryStats {
  partyId: string;
  monsterId: string;
  daysToDefeat: number;
  monsterName: string;
  monsterType: string;
}

interface MVPData {
  userId: string;
  displayName: string;
  stat: number;
}

/**
 * Create victory reward record and award badges to all party members
 */
export async function createVictoryReward(stats: VictoryStats) {
  try {
    // Get all check-ins for this party against this monster
    const monster = await prisma.monsters.findUnique({
      where: { id: stats.monsterId },
    });

    if (!monster) {
      throw new Error('Monster not found');
    }

    const monsterCreatedDate = new Date(monster.created_at);
    monsterCreatedDate.setHours(0, 0, 0, 0);

    // Get all check-ins since the monster was created
    const partyCheckIns = await prisma.check_ins.findMany({
      where: {
        party_id: stats.partyId,
        check_in_date: {
          gte: monsterCreatedDate,
        },
      },
      include: {
        party_members: {
          include: {
            users: {
              select: {
                id: true,
                display_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // Calculate total damage and heals
    const totalDamageDealt = partyCheckIns.reduce((sum, ci) => sum + ci.damage_dealt, 0);
    const totalHeals = await prisma.healing_actions.count({
      where: {
        from_party_member_id: {
          in: (await prisma.party_members.findMany({
            where: { party_id: stats.partyId },
            select: { id: true },
          })).map(pm => pm.id),
        },
        action_date: {
          gte: monsterCreatedDate,
        },
      },
    });

    // Calculate MVPs
    const mvpConsistent = calculateMVPConsistent(partyCheckIns);
    const mvpSupportive = calculateMVPSupportive(partyCheckIns);
    const mvpDamage = calculateMVPDamage(partyCheckIns);

    // Get all party member user IDs and current XP
    const partyMembers = await prisma.party_members.findMany({
      where: { party_id: stats.partyId },
      select: {
        id: true,
        xp: true,
        level: true,
        skill_points: true,
        users: {
          select: {
            id: true,
          },
        },
      },
    });

    const userIds = partyMembers.map((pm) => pm.users.id);

    // Check and award badges for all party members
    const badgesAwarded: Array<{ userId: string; badgeType: string; badgeName: string }> = [];
    for (const userId of userIds) {
      const result = await checkAndAwardAllBadges(userId);
      if (result.newBadges.length > 0) {
        result.newBadges.forEach((badge) => {
          badgesAwarded.push({
            userId,
            badgeType: badge.badgeType,
            badgeName: badge.name,
          });
        });
      }
    }

    // Create victory reward record
    const victoryReward = await prisma.victory_rewards.create({
      data: {
        id: crypto.randomUUID(),
        party_id: stats.partyId,
        monster_id: stats.monsterId,
        days_to_defeat: stats.daysToDefeat,
        total_damage_dealt: totalDamageDealt,
        total_heals: totalHeals,
        mvp_consistent: mvpConsistent?.userId || null,
        mvp_supportive: mvpSupportive?.userId || null,
        mvp_damage: mvpDamage?.userId || null,
        badges_awarded: badgesAwarded,
      },
    });

    // Grant XP to all party members for defeating the monster
    const xpReward = calculateMonsterDefeatXP(
      stats.monsterType as 'TANK' | 'BALANCED' | 'GLASS_CANNON'
    );

    // Update all party members with XP and reset focus
    for (const pm of partyMembers) {
      const currentXP = pm.xp || 0;
      const newXP = currentXP + xpReward;
      const oldLevel = pm.level || 1;
      const newLevel = calculateLevelFromXP(newXP);
      const skillPointsEarned = calculateSkillPointsEarned(oldLevel, newLevel);
      const newSkillPoints = (pm.skill_points || 0) + skillPointsEarned;

      await prisma.party_members.update({
        where: { id: pm.id },
        data: {
          xp: newXP,
          level: newLevel,
          skill_points: newSkillPoints,
          focus_points: 10, // Full focus reset on monster defeat
        },
      });
    }

    return {
      victoryReward,
      mvps: {
        consistent: mvpConsistent,
        supportive: mvpSupportive,
        damage: mvpDamage,
      },
      badgesAwarded,
      stats: {
        monsterName: stats.monsterName,
        monsterType: stats.monsterType,
        daysToDefeat: stats.daysToDefeat,
        totalDamageDealt,
        totalHeals,
      },
    };
  } catch (error) {
    console.error('Error creating victory reward:', error);
    throw error;
  }
}

/**
 * Calculate MVP for Most Consistent (highest check-in streak during battle)
 */
function calculateMVPConsistent(checkIns: any[]): MVPData | null {
  if (checkIns.length === 0) return null;

  // Group check-ins by user
  const userCheckIns = new Map<string, any[]>();
  checkIns.forEach((ci) => {
    const userId = ci.party_members.users.id;
    if (!userCheckIns.has(userId)) {
      userCheckIns.set(userId, []);
    }
    userCheckIns.get(userId)!.push(ci);
  });

  // Calculate max streak for each user during this battle
  let mvp: MVPData | null = null;
  let maxStreak = 0;

  userCheckIns.forEach((checkIns, userId) => {
    const sortedCheckIns = checkIns.sort(
      (a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime()
    );

    let currentStreak = 1;
    let longestStreak = 1;

    for (let i = 1; i < sortedCheckIns.length; i++) {
      const prevDate = new Date(sortedCheckIns[i - 1].check_in_date);
      const currDate = new Date(sortedCheckIns[i].check_in_date);
      const dayDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    if (longestStreak > maxStreak) {
      maxStreak = longestStreak;
      mvp = {
        userId,
        displayName: checkIns[0].party_members.users.display_name,
        stat: longestStreak,
      };
    }
  });

  return mvp;
}

/**
 * Calculate MVP for Most Supportive (most SUPPORT actions + heals during battle)
 */
function calculateMVPSupportive(checkIns: any[]): MVPData | null {
  if (checkIns.length === 0) return null;

  // Count support actions per user
  const userSupport = new Map<string, { displayName: string; count: number }>();
  checkIns.forEach((ci) => {
    const userId = ci.party_members.users.id;
    if (ci.combat_action === 'SUPPORT') {
      if (!userSupport.has(userId)) {
        userSupport.set(userId, {
          displayName: ci.party_members.users.display_name,
          count: 0,
        });
      }
      userSupport.get(userId)!.count++;
    }
  });

  // Find user with most support actions
  let mvp: MVPData | null = null;
  let maxCount = 0;

  userSupport.forEach((data, userId) => {
    if (data.count > maxCount) {
      maxCount = data.count;
      mvp = {
        userId,
        displayName: data.displayName,
        stat: data.count,
      };
    }
  });

  return mvp;
}

/**
 * Calculate MVP for Top Damage Dealer (most damage dealt during battle)
 */
function calculateMVPDamage(checkIns: any[]): MVPData | null {
  if (checkIns.length === 0) return null;

  // Sum damage per user
  const userDamage = new Map<string, { displayName: string; damage: number }>();
  checkIns.forEach((ci) => {
    const userId = ci.party_members.users.id;
    if (!userDamage.has(userId)) {
      userDamage.set(userId, {
        displayName: ci.party_members.users.display_name,
        damage: 0,
      });
    }
    userDamage.get(userId)!.damage += ci.damage_dealt;
  });

  // Find user with most damage
  let mvp: MVPData | null = null;
  let maxDamage = 0;

  userDamage.forEach((data, userId) => {
    if (data.damage > maxDamage) {
      maxDamage = data.damage;
      mvp = {
        userId,
        displayName: data.displayName,
        stat: data.damage,
      };
    }
  });

  return mvp;
}

/**
 * Get victory reward details by ID
 */
export async function getVictoryRewardById(victoryId: string) {
  const victory = await prisma.victory_rewards.findUnique({
    where: { id: victoryId },
  });

  if (!victory) {
    return null;
  }

  // Get monster details
  const monster = await prisma.monsters.findUnique({
    where: { id: victory.monster_id },
  });

  // Get MVP user details
  const mvpUsers = await prisma.users.findMany({
    where: {
      id: {
        in: [victory.mvp_consistent, victory.mvp_supportive, victory.mvp_damage].filter(
          (id): id is string => id !== null
        ),
      },
    },
    select: {
      id: true,
      display_name: true,
    },
  });

  const userMap = new Map(mvpUsers.map((u) => [u.id, u]));

  return {
    monsterName: monster?.name || 'Unknown Monster',
    monsterType: monster?.monster_type || 'BALANCED',
    daysToDefeat: victory.days_to_defeat,
    totalDamageDealt: victory.total_damage_dealt,
    totalHeals: victory.total_heals,
    mvps: {
      consistent: victory.mvp_consistent
        ? {
            userId: victory.mvp_consistent,
            displayName: userMap.get(victory.mvp_consistent)?.display_name || 'Unknown',
            streak: 0, // Can calculate from check-ins if needed
          }
        : undefined,
      supportive: victory.mvp_supportive
        ? {
            userId: victory.mvp_supportive,
            displayName: userMap.get(victory.mvp_supportive)?.display_name || 'Unknown',
            healsGiven: 0, // Can calculate from check-ins if needed
          }
        : undefined,
      damage: victory.mvp_damage
        ? {
            userId: victory.mvp_damage,
            displayName: userMap.get(victory.mvp_damage)?.display_name || 'Unknown',
            damageDealt: 0, // Can calculate from check-ins if needed
          }
        : undefined,
    },
  };
}
