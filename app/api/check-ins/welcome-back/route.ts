import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, isErrorResponse } from '@/lib/middleware';
import {
  checkWelcomeBackEligibility,
  activateWelcomeBackBuff,
  getWelcomeBackStatus,
} from '@/lib/welcomeBack';

/**
 * POST /api/check-ins/welcome-back
 * Check if user needs welcome back bonuses and apply them
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (isErrorResponse(authResult)) {
      return authResult;
    }

    const { user } = authResult;

    // Get user's active party member
    const partyMember = await prisma.party_members.findFirst({
      where: { user_id: user.userId },
      select: {
        id: true,
        current_hp: true,
        max_hp: true,
      },
    });

    if (!partyMember) {
      return NextResponse.json(
        { success: false, error: 'No party membership found' },
        { status: 404 }
      );
    }

    // Check eligibility
    const eligibility = await checkWelcomeBackEligibility(partyMember.id);

    if (!eligibility.isEligible) {
      return NextResponse.json({
        success: true,
        data: {
          needsWelcomeBack: false,
          daysAbsent: eligibility.daysMissed,
          reason: eligibility.reason,
        },
      });
    }

    // Activate welcome-back buff
    const result = await activateWelcomeBackBuff(partyMember.id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to activate welcome-back buff',
        },
        { status: 500 }
      );
    }

    const healAmount = (result.newHp || partyMember.current_hp) - partyMember.current_hp;

    return NextResponse.json({
      success: true,
      data: {
        needsWelcomeBack: true,
        daysAbsent: eligibility.daysMissed,
        healAmount,
        newHp: result.newHp,
        maxHp: partyMember.max_hp,
        bonuses: {
          extraDamage: 5, // +5 bonus damage for 3 check-ins
          counterattackReduction: 0.5, // 50% reduction for 3 check-ins
          checkInsRemaining: 3,
        },
        message: result.message,
      },
    });
  } catch (error) {
    console.error('Error in welcome-back endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process welcome back bonuses',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/check-ins/welcome-back
 * Check if user has active welcome back bonuses
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (isErrorResponse(authResult)) {
      return authResult;
    }

    const { user } = authResult;

    // Get user's active party member
    const partyMember = await prisma.party_members.findFirst({
      where: { user_id: user.userId },
      select: {
        id: true,
      },
    });

    if (!partyMember) {
      return NextResponse.json(
        { success: false, error: 'No party membership found' },
        { status: 404 }
      );
    }

    // Get welcome-back status
    const status = await getWelcomeBackStatus(partyMember.id);

    return NextResponse.json({
      success: true,
      data: {
        hasActiveBonuses: status.isActive,
        checkInsRemaining: status.checkInsRemaining,
        bonuses: status.isActive ? status.bonuses : null,
      },
    });
  } catch (error) {
    console.error('Error checking welcome back bonuses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check welcome back bonuses',
      },
      { status: 500 }
    );
  }
}
