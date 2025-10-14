import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// GET /api/monsters - Get available monsters for party selection
export async function GET(request: NextRequest) {
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
          error: "You must be in a party to view monsters",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if party has an active monster
    const activeMonster = await prisma.party_monsters.findFirst({
      where: {
        party_id: partyMember.party_id,
        is_active: true,
      },
      include: {
        monsters: true,
      },
    });

    // Get all undefeated monsters, grouped by type
    const allMonsters = await prisma.monsters.findMany({
      where: {
        is_defeated: false,
      },
      orderBy: [
        {
          monster_type: "asc", // Group by type first
        },
        {
          created_at: "asc", // Then by creation date
        },
      ],
    });

    // Map snake_case to camelCase for frontend
    const availableMonsters = allMonsters.map((monster) => ({
      id: monster.id,
      name: monster.name,
      description: monster.description,
      monsterType: monster.monster_type,
      maxHp: monster.max_hp,
      currentHp: monster.current_hp,
      armorClass: monster.armor_class,
      baseDamage: monster.base_damage,
      counterattackChance: monster.counterattack_chance,
      isDefeated: monster.is_defeated,
    }));

    // Map active monster to camelCase if it exists
    const mappedActiveMonster = activeMonster
      ? {
          id: activeMonster.monsters.id,
          name: activeMonster.monsters.name,
          description: activeMonster.monsters.description,
          monsterType: activeMonster.monsters.monster_type,
          maxHp: activeMonster.monsters.max_hp,
          currentHp: activeMonster.monsters.current_hp,
          armorClass: activeMonster.monsters.armor_class,
          baseDamage: activeMonster.monsters.base_damage,
          counterattackChance: activeMonster.monsters.counterattack_chance,
          isDefeated: activeMonster.monsters.is_defeated,
        }
      : null;

    return NextResponse.json({
      success: true,
      data: {
        activeMonster: mappedActiveMonster,
        availableMonsters,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching monsters:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch monsters",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/monsters/activate - Activate a monster for the party (simplified for MVP)
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const body = await request.json();
    const { monsterId } = body as { monsterId: string };

    // Get user's party membership
    const partyMember = await prisma.party_members.findFirst({
      where: { user_id: user.userId },
    });

    if (!partyMember) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be in a party to select a monster",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if monster exists and is not defeated
    const monster = await prisma.monsters.findUnique({
      where: { id: monsterId },
    });

    if (!monster || monster.is_defeated) {
      return NextResponse.json(
        {
          success: false,
          error: "Monster not found or already defeated",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if party already has an active monster
    const existingActive = await prisma.party_monsters.findFirst({
      where: {
        party_id: partyMember.party_id,
        is_active: true,
      },
    });

    if (existingActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Party already has an active monster",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Create party monster relationship and activate it
    const partyMonster = await prisma.party_monsters.create({
      data: {
        id: crypto.randomUUID(),
        party_id: partyMember.party_id,
        monster_id: monster.id,
        is_active: true,
      },
      include: {
        monsters: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { partyMonster },
        message: `${monster.name} is now active!`,
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error activating monster:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to activate monster",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
