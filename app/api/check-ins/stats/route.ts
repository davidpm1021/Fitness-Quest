import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, isErrorResponse } from '@/lib/middleware';
import { ApiResponse } from '@/lib/types';

/**
 * GET /api/check-ins/stats
 * Get aggregated statistics for user's check-ins
 * Includes streaks, totals, averages, and records
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (isErrorResponse(authResult)) {
      return authResult;
    }

    const { user } = authResult;

    // Get user's party member
    const partyMember = await prisma.party_members.findFirst({
      where: { user_id: user.userId },
    });

    if (!partyMember) {
      return NextResponse.json(
        { success: false, error: 'No party membership found' },
        { status: 404 }
      );
    }

    // Get all check-ins for this user
    const allCheckIns = await prisma.check_ins.findMany({
      where: {
        party_member_id: partyMember.id,
      },
      include: {
        goal_check_ins: true,
      },
      orderBy: {
        check_in_date: 'desc',
      },
    });

    // Calculate stats
    const totalCheckIns = allCheckIns.length;
    const currentStreak = partyMember.current_streak;

    // Calculate longest streak
    let longestStreak = 0;
    let currentStreakCount = 0;

    // Sort by date ascending for streak calculation
    const sortedCheckIns = [...allCheckIns].sort((a, b) =>
      new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime()
    );

    for (let i = 0; i < sortedCheckIns.length; i++) {
      if (i === 0) {
        currentStreakCount = 1;
      } else {
        const prevDate = new Date(sortedCheckIns[i - 1].check_in_date);
        const currDate = new Date(sortedCheckIns[i].check_in_date);

        // Calculate day difference
        const dayDiff = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (dayDiff === 1) {
          // Consecutive day
          currentStreakCount++;
        } else {
          // Streak broken
          longestStreak = Math.max(longestStreak, currentStreakCount);
          currentStreakCount = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, currentStreakCount);

    // Calculate total damage dealt
    const totalDamageDealt = allCheckIns.reduce(
      (sum, checkIn) => sum + checkIn.damage_dealt,
      0
    );

    // Find best damage in a single hit
    const bestDamage = allCheckIns.reduce(
      (max, checkIn) => Math.max(max, checkIn.damage_dealt),
      0
    );

    // Calculate total goals met vs total goals
    const totalGoalAttempts = allCheckIns.reduce(
      (sum, checkIn) => sum + checkIn.goal_check_ins.length,
      0
    );
    const totalGoalsMet = allCheckIns.reduce(
      (sum, checkIn) => sum + checkIn.goals_met,
      0
    );
    const averageGoalsMet = totalCheckIns > 0 ? totalGoalsMet / totalCheckIns : 0;
    const goalCompletionRate = totalGoalAttempts > 0
      ? (totalGoalsMet / totalGoalAttempts) * 100
      : 0;

    // Calculate average damage per check-in
    const averageDamage = totalCheckIns > 0 ? totalDamageDealt / totalCheckIns : 0;

    // Count times hit by monster
    const timesHit = allCheckIns.filter((c) => c.was_hit_by_monster).length;
    const totalDamageTaken = allCheckIns.reduce(
      (sum, checkIn) => sum + checkIn.damage_taken,
      0
    );

    // Count rest days
    const restDays = allCheckIns.filter((c) => c.is_rest_day).length;

    // Combat action breakdown
    const combatActionCounts = {
      ATTACK: allCheckIns.filter((c) => c.combat_action === 'ATTACK').length,
      DEFEND: allCheckIns.filter((c) => c.combat_action === 'DEFEND').length,
      SUPPORT: allCheckIns.filter((c) => c.combat_action === 'SUPPORT').length,
      HEROIC_STRIKE: allCheckIns.filter((c) => c.combat_action === 'HEROIC_STRIKE').length,
    };

    // Total focus earned
    const totalFocusEarned = allCheckIns.reduce(
      (sum, checkIn) => sum + (checkIn.focus_earned || 0),
      0
    );

    // Most recent check-in date
    const lastCheckInDate = allCheckIns.length > 0
      ? allCheckIns[0].check_in_date
      : null;

    // Calculate check-ins by day of week
    const checkInsByDay = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    allCheckIns.forEach((checkIn) => {
      const date = new Date(checkIn.check_in_date);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      checkInsByDay[dayName as keyof typeof checkInsByDay]++;
    });

    return NextResponse.json({
      success: true,
      data: {
        streaks: {
          current: currentStreak,
          longest: longestStreak,
        },
        totals: {
          checkIns: totalCheckIns,
          damageDealt: totalDamageDealt,
          damageTaken: totalDamageTaken,
          goalsMet: totalGoalsMet,
          goalAttempts: totalGoalAttempts,
          timesHit: timesHit,
          restDays: restDays,
          focusEarned: totalFocusEarned,
        },
        averages: {
          goalsMet: parseFloat(averageGoalsMet.toFixed(2)),
          damage: parseFloat(averageDamage.toFixed(2)),
        },
        records: {
          bestDamage: bestDamage,
          longestStreak: longestStreak,
        },
        percentages: {
          goalCompletionRate: parseFloat(goalCompletionRate.toFixed(1)),
          hitRate: totalCheckIns > 0 ? parseFloat(((timesHit / totalCheckIns) * 100).toFixed(1)) : 0,
        },
        combatActions: combatActionCounts,
        checkInsByDay: checkInsByDay,
        lastCheckIn: lastCheckInDate,
      },
    });
  } catch (error) {
    console.error('Error calculating check-in stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate stats',
      },
      { status: 500 }
    );
  }
}
