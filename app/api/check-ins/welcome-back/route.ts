import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, isErrorResponse } from '@/lib/middleware';
import { ApiResponse } from '@/lib/types';

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
      include: {
        check_ins: {
          orderBy: { check_in_date: 'desc' },
          take: 1,
        },
        welcome_back_bonuses: {
          where: { is_active: true },
          take: 1,
        },
      },
    });

    if (!partyMember) {
      return NextResponse.json(
        { success: false, error: 'No party membership found' },
        { status: 404 }
      );
    }

    // Check if user already has active bonuses
    if (partyMember.welcome_back_bonuses.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          hasActiveBonuses: true,
          bonuses: partyMember.welcome_back_bonuses[0],
        },
      });
    }

    // Check last check-in date
    const lastCheckIn = partyMember.check_ins[0];

    // If no check-ins yet, no need for welcome back
    if (!lastCheckIn) {
      return NextResponse.json({
        success: true,
        data: {
          needsWelcomeBack: false,
          daysAbsent: 0,
        },
      });
    }

    // Calculate days since last check-in
    const lastCheckInDate = new Date(lastCheckIn.check_in_date);
    const today = new Date();
    const daysSinceLastCheckIn = Math.floor(
      (today.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If user has been gone 3+ days, apply welcome back bonuses
    if (daysSinceLastCheckIn >= 3) {
      // Calculate HP to restore (bring them to at least 50% HP, or +20 HP, whichever is more)
      const hpToRestore = Math.max(
        20,
        Math.floor(partyMember.max_hp * 0.5) - partyMember.current_hp
      );

      // Create welcome back bonus
      const welcomeBackBonus = await prisma.welcome_back_bonuses.create({
        data: {
          id: `wb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          party_member_id: partyMember.id,
          days_absent: daysSinceLastCheckIn,
          hp_restored: hpToRestore,
          bonus_check_ins_remaining: 3, // Bonuses last for 3 check-ins
          is_active: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });

      // Restore HP
      await prisma.party_members.update({
        where: { id: partyMember.id },
        data: {
          current_hp: Math.min(
            partyMember.max_hp,
            partyMember.current_hp + hpToRestore
          ),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          needsWelcomeBack: true,
          daysAbsent: daysSinceLastCheckIn,
          hpRestored: hpToRestore,
          bonuses: {
            reducedCounterattack: true,
            catchUpDamage: 5, // +5 bonus damage
            daysRemaining: 3,
          },
          bonusRecord: welcomeBackBonus,
        },
      });
    }

    // User doesn't need welcome back
    return NextResponse.json({
      success: true,
      data: {
        needsWelcomeBack: false,
        daysAbsent: daysSinceLastCheckIn,
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
      include: {
        welcome_back_bonuses: {
          where: { is_active: true },
          take: 1,
        },
      },
    });

    if (!partyMember) {
      return NextResponse.json(
        { success: false, error: 'No party membership found' },
        { status: 404 }
      );
    }

    const activeBonus = partyMember.welcome_back_bonuses[0];

    return NextResponse.json({
      success: true,
      data: {
        hasActiveBonuses: !!activeBonus,
        bonuses: activeBonus || null,
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
