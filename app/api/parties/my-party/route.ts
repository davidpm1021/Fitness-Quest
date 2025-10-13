import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";
import { cache, CacheKeys, CacheTTL } from "@/lib/cache";

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
    // Check cache first
    const cacheKey = CacheKeys.partyDashboard(user.userId);
    const cachedData = cache.get<ApiResponse>(cacheKey);

    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Find user's party membership with optimized single query
    const membership = await prisma.partyMember.findFirst({
      where: {
        userId: user.userId,
      },
      select: {
        id: true,
        currentHp: true,
        maxHp: true,
        currentDefense: true,
        currentStreak: true,
        joinedAt: true,
        partyId: true,
        party: {
          select: {
            id: true,
            name: true,
            inviteCode: true,
            checkInStartHour: true,
            checkInEndHour: true,
            morningReportHour: true,
            activeMonsterId: true,
            created_at: true,
            updated_at: true,
            members: {
              select: {
                id: true,
                currentHp: true,
                maxHp: true,
                currentDefense: true,
                currentStreak: true,
                focusPoints: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    display_name: true,
                  },
                },
              },
              orderBy: {
                joinedAt: "asc",
              },
            },
            partyMonsters: {
              where: {
                isActive: true,
              },
              select: {
                monster: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    monsterType: true,
                    maxHp: true,
                    currentHp: true,
                    armorClass: true,
                    baseDamage: true,
                    counterattackChance: true,
                    isDefeated: true,
                  },
                },
              },
              take: 1,
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

    // Extract active monster from optimized query result
    const activeMonster = membership.party.partyMonsters[0]?.monster || null;

    const responseData = {
      success: true,
      data: {
        party: {
          id: membership.party.id,
          name: membership.party.name,
          inviteCode: membership.party.inviteCode,
          checkInStartHour: membership.party.checkInStartHour,
          checkInEndHour: membership.party.checkInEndHour,
          morningReportHour: membership.party.morningReportHour,
          activeMonsterId: membership.party.activeMonsterId,
          created_at: membership.party.createdAt,
          updated_at: membership.party.updatedAt,
          members: membership.party.members,
          activeMonster,
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
    } as ApiResponse;

    // Cache the response
    cache.set(cacheKey, responseData, CacheTTL.party);

    return NextResponse.json(responseData);
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
