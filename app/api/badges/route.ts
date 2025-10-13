import { NextRequest, NextResponse } from 'next/server';
import { BadgeType } from '@prisma/client';
import { authenticateRequest, isErrorResponse } from '@/lib/middleware';
import { BADGE_INFO, checkAndAwardAllBadges } from '@/lib/badges';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/badges - Get user's earned badges and available badges
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const userId = user.userId;

    // Get user's earned badges
    const earnedBadges = await prisma.badge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });

    // Create complete badge list with unlock status
    const allBadges = Object.entries(BADGE_INFO).map(([badgeType, info]) => {
      const earned = earnedBadges.find((b) => b.badgeType === badgeType as BadgeType);
      return {
        badgeType,
        ...info,
        isUnlocked: !!earned,
        earnedAt: earned?.earnedAt || null,
        metadata: earned?.metadata || null,
      };
    });

    // Group badges by category
    const badgesByCategory = {
      monsterDefeat: allBadges.filter((b) =>
        ['FIRST_MONSTER', 'THREE_MONSTERS', 'TEN_MONSTERS', 'TWENTY_MONSTERS'].includes(b.badgeType)
      ),
      streaks: allBadges.filter((b) =>
        ['WEEK_STREAK', 'TWO_WEEK_STREAK', 'MONTH_STREAK', 'HUNDRED_DAY_STREAK'].includes(b.badgeType)
      ),
      goalAchievement: allBadges.filter((b) =>
        ['PERFECT_WEEK', 'PERFECT_MONTH', 'GOAL_MASTER'].includes(b.badgeType)
      ),
      teamPlayer: allBadges.filter((b) =>
        ['SUPPORT_HERO', 'HEALER', 'DEFENDER'].includes(b.badgeType)
      ),
      combat: allBadges.filter((b) =>
        ['CRITICAL_HERO', 'FOCUS_MASTER', 'HEROIC_WARRIOR'].includes(b.badgeType)
      ),
      consistency: allBadges.filter((b) =>
        ['EARLY_BIRD', 'NIGHT_OWL', 'COMEBACK_KID'].includes(b.badgeType)
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        earnedCount: earnedBadges.length,
        totalCount: Object.keys(BADGE_INFO).length,
        earnedBadges: earnedBadges.map((b) => ({
          ...b,
          ...BADGE_INFO[b.badgeType],
        })),
        allBadges,
        badgesByCategory,
      },
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/badges/check - Check for and award any new badges
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const userId = user.userId;

    // Check all badges and award any new ones
    const result = await checkAndAwardAllBadges(userId);

    return NextResponse.json({
      success: true,
      data: {
        newBadges: result.newBadges,
        totalBadges: result.totalBadges,
        message:
          result.newBadges.length > 0
            ? `You earned ${result.newBadges.length} new badge${result.newBadges.length > 1 ? 's' : ''}!`
            : 'No new badges earned',
      },
    });
  } catch (error) {
    console.error('Error checking badges:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check badges' },
      { status: 500 }
    );
  }
}
