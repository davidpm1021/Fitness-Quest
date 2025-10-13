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

    // Get one monster of each type (TANK, BALANCED, GLASS_CANNON)
    // This gives players 3 strategic choices
    const tankMonster = await prisma.monsters.findFirst({
      where: {
        is_defeated: false,
        monster_type: "TANK",
      },
      orderBy: {
        created_at: "asc",
      },
    });

    const balancedMonster = await prisma.monsters.findFirst({
      where: {
        is_defeated: false,
        monster_type: "BALANCED",
      },
      orderBy: {
        created_at: "asc",
      },
    });

    const glassCannon = await prisma.monsters.findFirst({
      where: {
        is_defeated: false,
        monster_type: "GLASS_CANNON",
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // Build available monsters array (filter out nulls)
    const availableMonsters = [tankMonster, balancedMonster, glassCannon].filter(
      (m) => m !== null
    );

    return NextResponse.json({
      success: true,
      data: {
        activeMonster: activeMonster?.monsters || null,
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
