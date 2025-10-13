import { checkAndAwardAllBadges } from './badges';
import { prisma } from '@/lib/prisma';

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
    const monster = await prisma.monster.findUnique({
      where: { id: stats.monsterId },
    });

    if (!monster) {
      throw new Error('Monster not found');
    }

    const monsterCreatedDate = new Date(monster.createdAt);
    monsterCreatedDate.setHours(0, 0, 0, 0);

    // Get all check-ins since the monster was created
    const partyCheckIns = await prisma.checkIn.findMany({
      where: {
        partyId: stats.partyId,
        checkInDate: {
          gte: monsterCreatedDate,
        },
      },
      include: {
        partyMember: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate total damage and heals
    const totalDamageDealt = partyCheckIns.reduce((sum, ci) => sum + ci.damageDealt, 0);
    const totalHeals = await prisma.healingAction.count({
      where: {
        fromPartyMember: {
          partyId: stats.partyId,
        },
        actionDate: {
          gte: monsterCreatedDate,
        },
      },
    });

    // Calculate MVPs
    const mvpConsistent = calculateMVPConsistent(partyCheckIns);
    const mvpSupportive = calculateMVPSupportive(partyCheckIns);
    const mvpDamage = calculateMVPDamage(partyCheckIns);

    // Get all party member user IDs
    const partyMembers = await prisma.partyMember.findMany({
      where: { partyId: stats.partyId },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    const userIds = partyMembers.map((pm) => pm.user.id);

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
    const victoryReward = await prisma.victoryReward.create({
      data: {
        partyId: stats.partyId,
        monsterId: stats.monsterId,
        daysToDefeat: stats.daysToDefeat,
        totalDamageDealt,
        totalHeals,
        mvpConsistent: mvpConsistent?.userId || null,
        mvpSupportive: mvpSupportive?.userId || null,
        mvpDamage: mvpDamage?.userId || null,
        badgesAwarded: badgesAwarded,
      },
    });

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
    const userId = ci.partyMember.user.id;
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
      (a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime()
    );

    let currentStreak = 1;
    let longestStreak = 1;

    for (let i = 1; i < sortedCheckIns.length; i++) {
      const prevDate = new Date(sortedCheckIns[i - 1].checkInDate);
      const currDate = new Date(sortedCheckIns[i].checkInDate);
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
        displayName: checkIns[0].partyMember.user.displayName,
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
    const userId = ci.partyMember.user.id;
    if (ci.combatAction === 'SUPPORT') {
      if (!userSupport.has(userId)) {
        userSupport.set(userId, {
          displayName: ci.partyMember.user.displayName,
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
    const userId = ci.partyMember.user.id;
    if (!userDamage.has(userId)) {
      userDamage.set(userId, {
        displayName: ci.partyMember.user.displayName,
        damage: 0,
      });
    }
    userDamage.get(userId)!.damage += ci.damageDealt;
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
  const victory = await prisma.victoryReward.findUnique({
    where: { id: victoryId },
  });

  if (!victory) {
    return null;
  }

  // Get monster details
  const monster = await prisma.monster.findUnique({
    where: { id: victory.monsterId },
  });

  // Get MVP user details
  const mvpUsers = await prisma.user.findMany({
    where: {
      id: {
        in: [victory.mvpConsistent, victory.mvpSupportive, victory.mvpDamage].filter(
          (id): id is string => id !== null
        ),
      },
    },
    select: {
      id: true,
      displayName: true,
    },
  });

  const userMap = new Map(mvpUsers.map((u) => [u.id, u]));

  return {
    monsterName: monster?.name || 'Unknown Monster',
    monsterType: monster?.monsterType || 'BALANCED',
    daysToDefeat: victory.daysToDefeat,
    totalDamageDealt: victory.totalDamageDealt,
    totalHeals: victory.totalHeals,
    mvps: {
      consistent: victory.mvpConsistent
        ? {
            userId: victory.mvpConsistent,
            displayName: userMap.get(victory.mvpConsistent)?.displayName || 'Unknown',
            streak: 0, // Can calculate from check-ins if needed
          }
        : undefined,
      supportive: victory.mvpSupportive
        ? {
            userId: victory.mvpSupportive,
            displayName: userMap.get(victory.mvpSupportive)?.displayName || 'Unknown',
            healsGiven: 0, // Can calculate from check-ins if needed
          }
        : undefined,
      damage: victory.mvpDamage
        ? {
            userId: victory.mvpDamage,
            displayName: userMap.get(victory.mvpDamage)?.displayName || 'Unknown',
            damageDealt: 0, // Can calculate from check-ins if needed
          }
        : undefined,
    },
  };
}
