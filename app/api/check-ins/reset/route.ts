import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, isErrorResponse } from '@/lib/middleware';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// DELETE /api/check-ins/reset - Reset today's check-in (for testing)
export async function DELETE(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    // Get user's party membership
    const partyMember = await prisma.party_members.findFirst({
      where: { user_id: user.userId },
    });

    if (!partyMember) {
      return NextResponse.json(
        {
          success: false,
          error: 'You must be in a party',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's check-ins
    const checkIns = await prisma.check_ins.findMany({
      where: {
        party_member_id: partyMember.id,
        check_in_date: today,
      },
    });

    // Delete goal check-ins first (foreign key)
    for (const checkIn of checkIns) {
      await prisma.goal_check_ins.deleteMany({
        where: { check_in_id: checkIn.id },
      });
    }

    // Delete check-ins
    const result = await prisma.check_ins.deleteMany({
      where: {
        party_member_id: partyMember.id,
        check_in_date: today,
      },
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: result.count },
      message: `Deleted ${result.count} check-in(s). You can check in again!`,
    } as ApiResponse);
  } catch (error) {
    console.error('Error resetting check-in:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset check-in',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
