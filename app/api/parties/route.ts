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
        user_id: user.userId,
      },
      include: {
        parties: true,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        {
          success: false,
          error: `You are already in party "${existingMembership.parties.name}"`,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let codeExists = await prisma.parties.findUnique({
      where: { invite_code: inviteCode },
    });

    // Regenerate if code already exists (very unlikely)
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await prisma.parties.findUnique({
        where: { invite_code: inviteCode },
      });
    }

    // Create party and add creator as first member in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the party
      const partyId = `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const party = await tx.parties.create({
        data: {
          id: partyId,
          name,
          invite_code: inviteCode,
          check_in_start_hour: checkInStartHour || 18,
          check_in_end_hour: checkInEndHour || 24,
          morning_report_hour: morningReportHour || 6,
          updated_at: new Date(),
        },
      });

      // Add creator as first member
      const memberId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const partyMember = await tx.party_members.create({
        data: {
          id: memberId,
          party_id: party.id,
          user_id: user.userId,
          current_hp: 100,
          max_hp: 100,
          current_defense: 0,
          current_streak: 0,
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
