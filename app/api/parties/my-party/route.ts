import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// GET /api/parties/my-party - Get current user's party
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    // Find user's party membership
    const membership = await prisma.partyMember.findFirst({
      where: {
        userId: user.userId,
      },
      include: {
        party: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
              orderBy: {
                joinedAt: "asc",
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({
        success: true,
        data: { party: null },
        message: "User is not in any party",
      } as ApiResponse);
    }

    // Get active monster for the party
    const activeMonster = await prisma.partyMonster.findFirst({
      where: {
        partyId: membership.partyId,
        isActive: true,
      },
      include: {
        monster: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        party: {
          ...membership.party,
          activeMonster: activeMonster?.monster || null,
        },
        membership: {
          id: membership.id,
          currentHp: membership.currentHp,
          maxHp: membership.maxHp,
          currentDefense: membership.currentDefense,
          currentStreak: membership.currentStreak,
          joinedAt: membership.joinedAt,
        },
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching user's party:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch party",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
