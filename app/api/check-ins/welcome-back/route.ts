import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET /api/check-ins/welcome-back - Check if user needs welcome back bonuses
export async function GET(request: NextRequest) {
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
      return NextResponse.json({
        success: true,
        data: { needsWelcomeBack: false },
      } as ApiResponse);
    }

    // Check last check-in date
    const lastCheckIn = await prisma.checkIn.findFirst({
      where: { partyMemberId: partyMember.id },
      orderBy: { checkInDate: "desc" },
    });

    if (!lastCheckIn) {
      return NextResponse.json({
        success: true,
        data: { needsWelcomeBack: false },
      } as ApiResponse);
    }

    // Calculate days since last check-in
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastCheckInDate = new Date(lastCheckIn.checkInDate);
    lastCheckInDate.setHours(0, 0, 0, 0);
    const daysSinceLastCheckIn = Math.floor(
      (today.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if already has active welcome back bonus
    const existingBonus = await prisma.welcomeBackBonus.findFirst({
      where: {
        partyMemberId: partyMember.id,
        isActive: true,
      },
    });

    // Need welcome back if missed 3+ days and don't have active bonus
    if (daysSinceLastCheckIn >= 3 && !existingBonus) {
      // Calculate HP to restore (20 HP, but don't exceed max)
      const hpToRestore = Math.min(20, partyMember.maxHp - partyMember.currentHp);
      const newHp = partyMember.currentHp + hpToRestore;

      // Apply HP bonus immediately
      await prisma.partyMember.update({
        where: { id: partyMember.id },
        data: {
          currentHp: newHp,
        },
      });

      // Create welcome back bonus record
      const welcomeBackBonus = await prisma.welcomeBackBonus.create({
        data: {
          partyMemberId: partyMember.id,
          daysAbsent: daysSinceLastCheckIn,
          hpRestored: hpToRestore,
          bonusCheckInsRemaining: 3,
          isActive: true,
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
            catchUpDamage: 2,
            daysRemaining: 3,
          },
          bonusId: welcomeBackBonus.id,
        },
      } as ApiResponse);
    }

    return NextResponse.json({
      success: true,
      data: { needsWelcomeBack: false },
    } as ApiResponse);
  } catch (error) {
    console.error("Error checking welcome back:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check welcome back status",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
