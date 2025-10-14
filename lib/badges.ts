import { BadgeType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface BadgeDefinition {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  checkCondition: (userId: string) => Promise<boolean>;
}

// Badge metadata for display
export const BADGE_INFO: Record<BadgeType, { name: string; description: string; icon: string }> = {
  // Monster Defeat Badges
  FIRST_MONSTER: {
    name: 'Monster Slayer',
    description: 'Defeated your first monster',
    icon: '🗡️',
  },
  THREE_MONSTERS: {
    name: 'Beast Hunter',
    description: 'Defeated 3 monsters',
    icon: '⚔️',
  },
  TEN_MONSTERS: {
    name: 'Monster Master',
    description: 'Defeated 10 monsters',
    icon: '🏆',
  },
  TWENTY_MONSTERS: {
    name: 'Legend',
    description: 'Defeated 20 monsters',
    icon: '👑',
  },

  // Streak Badges
  WEEK_STREAK: {
    name: 'Week Warrior',
    description: 'Maintained a 7-day check-in streak',
    icon: '🔥',
  },
  TWO_WEEK_STREAK: {
    name: 'Fortnight Champion',
    description: 'Maintained a 14-day check-in streak',
    icon: '🔥🔥',
  },
  MONTH_STREAK: {
    name: 'Monthly Legend',
    description: 'Maintained a 30-day check-in streak',
    icon: '💎',
  },
  HUNDRED_DAY_STREAK: {
    name: 'Centurion',
    description: 'Maintained a 100-day check-in streak',
    icon: '🌟',
  },

  // Goal Achievement Badges
  PERFECT_WEEK: {
    name: 'Perfect Week',
    description: 'Met all goals for 7 consecutive days',
    icon: '✨',
  },
  PERFECT_MONTH: {
    name: 'Perfection',
    description: 'Met all goals for 30 consecutive days',
    icon: '💫',
  },
  GOAL_MASTER: {
    name: 'Goal Master',
    description: 'Met 100 total goals',
    icon: '🎯',
  },

  // Team Player Badges
  SUPPORT_HERO: {
    name: 'Support Hero',
    description: 'Gave 50 encouragements to teammates',
    icon: '💚',
  },
  HEALER: {
    name: 'Healer',
    description: 'Healed teammates 25 times',
    icon: '❤️‍🩹',
  },
  DEFENDER: {
    name: 'Defender',
    description: 'Used DEFEND action 20 times',
    icon: '🛡️',
  },

  // Combat Badges
  CRITICAL_HERO: {
    name: 'Critical Hero',
    description: 'Rolled natural 20 ten times',
    icon: '🎲',
  },
  FOCUS_MASTER: {
    name: 'Focus Master',
    description: 'Earned 50 focus points total',
    icon: '🧘',
  },
  HEROIC_WARRIOR: {
    name: 'Heroic Warrior',
    description: 'Used HEROIC_STRIKE 10 times',
    icon: '💥',
  },

  // Consistency Badges
  EARLY_BIRD: {
    name: 'Early Bird',
    description: 'Checked in before 8 AM 10 times',
    icon: '🌅',
  },
  NIGHT_OWL: {
    name: 'Night Owl',
    description: 'Checked in after 10 PM 10 times',
    icon: '🦉',
  },
  COMEBACK_KID: {
    name: 'Comeback Kid',
    description: 'Returned after 7+ day absence and checked in 5 times',
    icon: '🔄',
  },
};

/**
 * Check if a user has earned a specific badge
 */
export async function checkBadgeCondition(
  userId: string,
  badgeType: BadgeType
): Promise<boolean> {
  // Check if badge already earned
  const existingBadge = await prisma.badges.findUnique({
    where: {
      user_id_badge_type: {
        user_id: userId,
        badge_type: badgeType,
      },
    },
  });

  if (existingBadge) {
    return false; // Already has this badge
  }

  // Get user's party memberships for stats
  const partyMembers = await prisma.party_members.findMany({
    where: { user_id: userId },
    include: {
      check_ins: {
        include: {
          goal_check_ins: true,
        },
      },
    },
  });

  // Calculate total check-ins across all parties
  const allCheckIns = partyMembers.flatMap((pm: any) => pm.check_ins);
  const totalCheckIns = allCheckIns.length;

  // Get current streak (use highest across all parties)
  const maxStreak = Math.max(...partyMembers.map((pm: any) => pm.current_streak), 0);

  switch (badgeType) {
    // Monster Defeat Badges (check via victory rewards)
    case BadgeType.FIRST_MONSTER:
    case BadgeType.THREE_MONSTERS:
    case BadgeType.TEN_MONSTERS:
    case BadgeType.TWENTY_MONSTERS: {
      const monstersDefeated = await getMonstersDefeatedCount(userId);
      const thresholds = {
        FIRST_MONSTER: 1,
        THREE_MONSTERS: 3,
        TEN_MONSTERS: 10,
        TWENTY_MONSTERS: 20,
      };
      return monstersDefeated >= thresholds[badgeType];
    }

    // Streak Badges
    case BadgeType.WEEK_STREAK:
      return maxStreak >= 7;
    case BadgeType.TWO_WEEK_STREAK:
      return maxStreak >= 14;
    case BadgeType.MONTH_STREAK:
      return maxStreak >= 30;
    case BadgeType.HUNDRED_DAY_STREAK:
      return maxStreak >= 100;

    // Goal Achievement Badges
    case BadgeType.PERFECT_WEEK:
      return await hasPerfectStreak(userId, 7);
    case BadgeType.PERFECT_MONTH:
      return await hasPerfectStreak(userId, 30);
    case BadgeType.GOAL_MASTER: {
      const totalGoalsMet = allCheckIns.reduce(
        (sum: number, checkIn: any) =>
          sum +
          checkIn.goal_check_ins.filter((gc: any) => gc.was_met).length,
        0
      );
      return totalGoalsMet >= 100;
    }

    // Team Player Badges
    case BadgeType.SUPPORT_HERO: {
      const encouragementCount = await prisma.encouragements.count({
        where: { from_user_id: userId },
      });
      return encouragementCount >= 50;
    }
    case BadgeType.HEALER: {
      const healCount = await prisma.healing_actions.count({
        where: {
          from_party_member_id: {
            in: (await prisma.party_members.findMany({
              where: { user_id: userId },
              select: { id: true },
            })).map(pm => pm.id),
          },
        },
      });
      return healCount >= 25;
    }
    case BadgeType.DEFENDER: {
      const defendCount = allCheckIns.filter(
        (ci: any) => ci.combat_action === 'DEFEND'
      ).length;
      return defendCount >= 20;
    }

    // Combat Badges
    case BadgeType.CRITICAL_HERO: {
      const nat20Count = allCheckIns.filter((ci: any) => ci.attack_roll === 20).length;
      return nat20Count >= 10;
    }
    case BadgeType.FOCUS_MASTER: {
      const totalFocus = partyMembers.reduce((sum: number, pm: any) => sum + pm.focus_points, 0);
      return totalFocus >= 50;
    }
    case BadgeType.HEROIC_WARRIOR: {
      const heroicStrikeCount = allCheckIns.filter(
        (ci: any) => ci.combat_action === 'HEROIC_STRIKE'
      ).length;
      return heroicStrikeCount >= 10;
    }

    // Consistency Badges
    case BadgeType.EARLY_BIRD: {
      const earlyCheckIns = allCheckIns.filter((ci: any) => {
        const hour = new Date(ci.created_at).getHours();
        return hour < 8;
      });
      return earlyCheckIns.length >= 10;
    }
    case BadgeType.NIGHT_OWL: {
      const lateCheckIns = allCheckIns.filter((ci: any) => {
        const hour = new Date(ci.created_at).getHours();
        return hour >= 22;
      });
      return lateCheckIns.length >= 10;
    }
    case BadgeType.COMEBACK_KID: {
      // Check if user has welcome back bonuses and has checked in 5+ times since
      const welcomeBackBonuses = await prisma.welcome_back_bonuses.findMany({
        where: {
          party_members: {
            user_id: userId,
          },
          days_absent: {
            gte: 7,
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 1,
      });

      if (welcomeBackBonuses.length === 0) return false;

      const lastWelcomeBack = welcomeBackBonuses[0];
      const checkInsSinceReturn = allCheckIns.filter(
        (ci: any) => new Date(ci.created_at) > lastWelcomeBack.created_at
      ).length;

      return checkInsSinceReturn >= 5;
    }

    default:
      return false;
  }
}

/**
 * Award a badge to a user if they've earned it
 */
export async function awardBadge(
  userId: string,
  badgeType: BadgeType,
  metadata?: Record<string, any>
): Promise<{ awarded: boolean; badge?: any }> {
  const hasEarned = await checkBadgeCondition(userId, badgeType);

  if (!hasEarned) {
    return { awarded: false };
  }

  try {
    const badge = await prisma.badges.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        badge_type: badgeType,
        metadata: metadata || {},
      },
    });

    return { awarded: true, badge };
  } catch (error) {
    // Badge already exists (unique constraint)
    return { awarded: false };
  }
}

/**
 * Check all possible badges for a user and award any new ones
 */
export async function checkAndAwardAllBadges(
  userId: string
): Promise<{ newBadges: any[]; totalBadges: number }> {
  const allBadgeTypes = Object.keys(BADGE_INFO) as BadgeType[];
  const newBadges: any[] = [];

  for (const badgeType of allBadgeTypes) {
    const result = await awardBadge(userId, badgeType);
    if (result.awarded && result.badge) {
      newBadges.push({
        ...result.badge,
        ...BADGE_INFO[badgeType],
      });
    }
  }

  const totalBadges = await prisma.badges.count({
    where: { user_id: userId },
  });

  return { newBadges, totalBadges };
}

/**
 * Get count of monsters defeated by user
 */
async function getMonstersDefeatedCount(userId: string): Promise<number> {
  // Check VictoryRewards where user was in the party
  const partyIds = await prisma.party_members
    .findMany({
      where: { user_id: userId },
      select: { party_id: true },
    })
    .then((pms: any[]) => pms.map((pm: any) => pm.party_id));

  const victories = await prisma.victory_rewards.count({
    where: {
      party_id: {
        in: partyIds,
      },
    },
  });

  return victories;
}

/**
 * Check if user has a perfect streak of meeting all goals
 */
async function hasPerfectStreak(userId: string, days: number): Promise<boolean> {
  const partyMembers = await prisma.party_members.findMany({
    where: { user_id: userId },
    include: {
      check_ins: {
        orderBy: {
          check_in_date: 'desc',
        },
        take: days,
        include: {
          goal_check_ins: true,
        },
      },
    },
  });

  // Get most recent check-ins across all parties
  const recentCheckIns = partyMembers
    .flatMap((pm: any) => pm.check_ins)
    .sort(
      (a: any, b: any) =>
        new Date(b.check_in_date).getTime() - new Date(a.check_in_date).getTime()
    )
    .slice(0, days);

  if (recentCheckIns.length < days) return false;

  // Check if all check-ins had all goals met
  return recentCheckIns.every((checkIn: any) => {
    const goalCheckIns = checkIn.goal_check_ins;
    return (
      goalCheckIns.length > 0 && goalCheckIns.every((gc: any) => gc.was_met)
    );
  });
}
