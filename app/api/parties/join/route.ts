import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";
import { isValidInviteCode } from "@/lib/utils";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// POST /api/parties/join - Join a party with invite code
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const body = await request.json();
    const { inviteCode } = body;

    // Validate invite code format
    if (!inviteCode || !isValidInviteCode(inviteCode.toUpperCase())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid invite code format. Code should be 6 characters.",
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

    // Find party by invite code
    const party = await prisma.parties.findUnique({
      where: {
        invite_code: inviteCode.toUpperCase(),
      },
      include: {
        party_members: true,
      },
    });

    if (!party) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid invite code. Party not found.",
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Check party size limit (2-8 members)
    if (party.party_members.length >= 8) {
      return NextResponse.json(
        {
          success: false,
          error: "This party is full (maximum 8 members)",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Add user to party
    const partyMember = await prisma.party_members.create({
      data: {
        id: crypto.randomUUID(),
        party_id: party.id,
        user_id: user.userId,
        current_hp: 100,
        max_hp: 100,
        current_defense: 0,
        current_streak: 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          party: {
            id: party.id,
            name: party.name,
            memberCount: party.party_members.length + 1,
          },
          membership: partyMember,
        },
        message: `Successfully joined ${party.name}!`,
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error joining party:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to join party",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
