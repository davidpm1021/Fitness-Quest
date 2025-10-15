import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ActivityItem {
  id: string;
  type: "check_in" | "damage" | "heal" | "level_up" | "monster_defeated";
  displayName: string;
  message: string;
  createdAt: string;
  icon: string;
}

/**
 * GET /api/parties/[id]/activity - Get recent party activity
 * Returns a feed of recent check-ins, attacks, heals, level-ups, etc.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;
  const partyId = params.id;

  try {
    // Verify user is in this party
    const membership = await prisma.party_members.findFirst({
      where: {
        party_id: partyId,
        user_id: user.userId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not a member of this party",
        } as ApiResponse,
        { status: 403 }
      );
    }

    const activities: ActivityItem[] = [];

    // Get recent check-ins (last 24 hours)
    const recentCheckIns = await prisma.check_ins.findMany({
      where: {
        party_id: partyId,
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        party_members: {
          include: {
            users: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: 20,
    });

    for (const checkIn of recentCheckIns) {
      // Check-in activity
      activities.push({
        id: `checkin-${checkIn.id}`,
        type: "check_in",
        displayName: checkIn.party_members.users.display_name,
        message: `checked in (${checkIn.goals_met} goals met)`,
        createdAt: checkIn.created_at.toISOString(),
        icon: "✅",
      });

      // Damage activity
      if (checkIn.damage_dealt > 0) {
        activities.push({
          id: `damage-${checkIn.id}`,
          type: "damage",
          displayName: checkIn.party_members.users.display_name,
          message: `dealt ${checkIn.damage_dealt} damage to the monster!`,
          createdAt: checkIn.created_at.toISOString(),
          icon: "⚔️",
        });
      }
    }

    // Get recent healing actions (last 24 hours)
    const recentHeals = await prisma.healing_actions.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        party_members_healing_actions_from_party_member_idToparty_members: {
          party_id: partyId,
        },
      },
      include: {
        party_members_healing_actions_from_party_member_idToparty_members: {
          include: {
            users: true,
          },
        },
        party_members_healing_actions_to_party_member_idToparty_members: {
          include: {
            users: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: 10,
    });

    for (const heal of recentHeals) {
      const fromName =
        heal.party_members_healing_actions_from_party_member_idToparty_members
          .users.display_name;
      const toName =
        heal.party_members_healing_actions_to_party_member_idToparty_members
          .users.display_name;

      activities.push({
        id: `heal-${heal.id}`,
        type: "heal",
        displayName: fromName,
        message: `healed ${toName} for ${heal.hp_restored} HP`,
        createdAt: heal.created_at.toISOString(),
        icon: "💚",
      });
    }

    // Get level-ups (check for recent XP gains that resulted in level-ups)
    // This would require tracking level-up events separately
    // For now, we'll skip this and can add it later

    // Get recent monster defeats
    const recentDefeats = await prisma.monsters.findMany({
      where: {
        is_defeated: true,
        defeated_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
        party_monsters: {
          some: {
            party_id: partyId,
          },
        },
      },
      orderBy: {
        defeated_at: "desc",
      },
      take: 5,
    });

    for (const monster of recentDefeats) {
      if (monster.defeated_at) {
        activities.push({
          id: `defeat-${monster.id}`,
          type: "monster_defeated",
          displayName: "Party",
          message: `defeated ${monster.name}!`,
          createdAt: monster.defeated_at.toISOString(),
          icon: "🎉",
        });
      }
    }

    // Sort all activities by date
    activities.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          activities: activities.slice(0, 30), // Return top 30 activities
        },
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching party activity:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch party activity",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
