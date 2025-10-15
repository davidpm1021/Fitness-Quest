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
    const membership = await prisma.party_members.findFirst({
      where: {
        user_id: user.userId,
      },
      select: {
        id: true,
        current_hp: true,
        max_hp: true,
        current_defense: true,
        current_streak: true,
        joined_at: true,
        party_id: true,
        parties: {
          select: {
            id: true,
            name: true,
            invite_code: true,
            check_in_start_hour: true,
            check_in_end_hour: true,
            morning_report_hour: true,
            active_monster_id: true,
            created_at: true,
            updated_at: true,
            party_members: {
              select: {
                id: true,
                current_hp: true,
                max_hp: true,
                current_defense: true,
                current_streak: true,
                focus_points: true,
                xp: true,
                level: true,
                skill_points: true,
                users: {
                  select: {
                    id: true,
                    username: true,
                    display_name: true,
                    character_name: true,
                  },
                },
              },
              orderBy: {
                joined_at: "asc",
              },
            },
            party_monsters: {
              where: {
                is_active: true,
              },
              select: {
                monsters: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    monster_type: true,
                    max_hp: true,
                    current_hp: true,
                    armor_class: true,
                    base_damage: true,
                    counterattack_chance: true,
                    is_defeated: true,
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
    const activeMonster = membership.parties.party_monsters[0]?.monsters || null;

    // Map party members to camelCase
    const mappedMembers = membership.parties.party_members.map((member: any) => ({
      id: member.id,
      userId: member.users.id,
      currentHp: member.current_hp,
      maxHp: member.max_hp,
      currentDefense: member.current_defense,
      currentStreak: member.current_streak,
      focusPoints: member.focus_points,
      xp: member.xp,
      level: member.level,
      skillPoints: member.skill_points,
      user: {
        id: member.users.id,
        username: member.users.username,
        displayName: member.users.display_name,
        characterName: member.users.character_name,
      },
    }));

    // Map active monster to camelCase if it exists
    const mappedMonster = activeMonster ? {
      id: activeMonster.id,
      name: activeMonster.name,
      description: activeMonster.description,
      monsterType: activeMonster.monster_type,
      maxHp: activeMonster.max_hp,
      currentHp: activeMonster.current_hp,
      armorClass: activeMonster.armor_class,
      baseDamage: activeMonster.base_damage,
      counterattackChance: activeMonster.counterattack_chance,
      isDefeated: activeMonster.is_defeated,
    } : null;

    const responseData = {
      success: true,
      data: {
        party: {
          id: membership.parties.id,
          name: membership.parties.name,
          inviteCode: membership.parties.invite_code,
          checkInStartHour: membership.parties.check_in_start_hour,
          checkInEndHour: membership.parties.check_in_end_hour,
          morningReportHour: membership.parties.morning_report_hour,
          activeMonsterId: membership.parties.active_monster_id,
          created_at: membership.parties.created_at,
          updated_at: membership.parties.updated_at,
          members: mappedMembers,
          activeMonster: mappedMonster,
        },
        membership: {
          id: membership.id,
          currentHp: membership.current_hp,
          maxHp: membership.max_hp,
          currentDefense: membership.current_defense,
          currentStreak: membership.current_streak,
          joinedAt: membership.joined_at,
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
