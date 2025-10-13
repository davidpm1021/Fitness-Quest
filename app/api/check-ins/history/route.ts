import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, isErrorResponse } from '@/lib/middleware';
import { ApiResponse } from '@/lib/types';

/**
 * GET /api/check-ins/history
 * Get user's check-in history for the last 30 days
 * Includes goal data, damage dealt, HP changes, etc.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
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

    // Calculate date range (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Get check-ins for the last 30 days
    const checkIns = await prisma.check_ins.findMany({
      where: {
        party_member_id: partyMember.id,
        check_in_date: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        goal_check_ins: {
          include: {
            goals: {
              select: {
                id: true,
                name: true,
                goal_type: true,
                target_value: true,
                target_unit: true,
              },
            },
          },
        },
      },
      orderBy: {
        check_in_date: 'desc',
      },
    });

    // Format the response
    const formattedHistory = checkIns.map((checkIn) => ({
      date: checkIn.check_in_date,
      goalsMet: checkIn.goals_met,
      totalGoals: checkIn.goal_check_ins.length,
      damageDealt: checkIn.damage_dealt,
      wasHit: checkIn.was_hit_by_monster,
      damageTaken: checkIn.damage_taken,
      attackRoll: checkIn.attack_roll,
      attackBonus: checkIn.attack_bonus,
      combatAction: checkIn.combat_action,
      focusEarned: checkIn.focus_earned,
      isRestDay: checkIn.is_rest_day,
      goals: checkIn.goal_check_ins.map((gc) => ({
        goalId: gc.goal_id,
        goalName: gc.goals.name,
        goalType: gc.goals.goal_type,
        actualValue: gc.actual_value,
        targetValue: gc.target_value,
        targetUnit: gc.goals.target_unit,
        wasMet: gc.was_met,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        checkIns: formattedHistory,
        totalCheckIns: checkIns.length,
        dateRange: {
          from: thirtyDaysAgo.toISOString(),
          to: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching check-in history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch check-in history',
      },
      { status: 500 }
    );
  }
}
