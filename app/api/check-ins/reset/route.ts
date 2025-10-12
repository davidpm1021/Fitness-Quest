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
    const partyMember = await prisma.partyMember.findFirst({
      where: { userId: user.userId },
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
    const checkIns = await prisma.checkIn.findMany({
      where: {
        partyMemberId: partyMember.id,
        checkInDate: today,
      },
    });

    // Delete goal check-ins first (foreign key)
    for (const checkIn of checkIns) {
      await prisma.goalCheckIn.deleteMany({
        where: { checkInId: checkIn.id },
      });
    }

    // Delete check-ins
    const result = await prisma.checkIn.deleteMany({
      where: {
        partyMemberId: partyMember.id,
        checkInDate: today,
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
