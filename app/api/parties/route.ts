import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";
import { generateInviteCode } from "@/lib/utils";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// POST /api/parties - Create a new party
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const body = await request.json();
    const { name, checkInStartHour, checkInEndHour, morningReportHour } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Party name is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if user is already in a party
    const existingMembership = await prisma.party_members.findFirst({
      where: {
        userId: user.userId,
      },
      include: {
        party: true,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        {
          success: false,
          error: `You are already in party "${existingMembership.party.name}"`,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let codeExists = await prisma.party.findUnique({
      where: { inviteCode },
    });

    // Regenerate if code already exists (very unlikely)
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await prisma.party.findUnique({
        where: { inviteCode },
      });
    }

    // Create party and add creator as first member in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the party
      const party = await tx.party.create({
        data: {
          name,
          inviteCode,
          checkInStartHour: checkInStartHour || 18,
          checkInEndHour: checkInEndHour || 24,
          morningReportHour: morningReportHour || 6,
        },
      });

      // Add creator as first member
      const partyMember = await tx.partyMember.create({
        data: {
          partyId: party.id,
          userId: user.userId,
          currentHp: 100,
          maxHp: 100,
          currentDefense: 0,
          currentStreak: 0,
        },
      });

      return { party, partyMember };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          party: result.party,
          membership: result.partyMember,
        },
        message: "Party created successfully",
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating party:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create party",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
