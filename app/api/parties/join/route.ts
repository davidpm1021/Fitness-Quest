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

    // Use transaction to leave old party and join new one
    const result = await prisma.$transaction(async (tx) => {
      // If user is in a different party, leave it first
      if (existingMembership && existingMembership.party_id !== party.id) {
        await tx.party_members.delete({
          where: {
            id: existingMembership.id,
          },
        });
      } else if (existingMembership && existingMembership.party_id === party.id) {
        // User is already in this party
        return {
          alreadyMember: true,
          partyMember: existingMembership,
        };
      }

      // Add user to new party
      const partyMember = await tx.party_members.create({
        data: {
          id: crypto.randomUUID(),
          party_id: party.id,
          user_id: user.userId,
          current_hp: 100,
          max_hp: 100,
          current_defense: 0,
          current_streak: 0,
          focus_points: 5, // Start with 5 focus points
          xp: 0,
          level: 1,
          skill_points: 0,
        },
      });

      return {
        alreadyMember: false,
        partyMember,
        leftParty: existingMembership ? existingMembership.parties.name : null,
      };
    });

    if (result.alreadyMember) {
      return NextResponse.json(
        {
          success: true,
          data: {
            party: {
              id: party.id,
              name: party.name,
              memberCount: party.party_members.length,
            },
            membership: result.partyMember,
          },
          message: `You are already in ${party.name}`,
        } as ApiResponse,
        { status: 200 }
      );
    }

    const successMessage = result.leftParty
      ? `Left ${result.leftParty} and joined ${party.name}!`
      : `Successfully joined ${party.name}!`;

    return NextResponse.json(
      {
        success: true,
        data: {
          party: {
            id: party.id,
            name: party.name,
            memberCount: party.party_members.length + 1,
          },
          membership: result.partyMember,
          leftParty: result.leftParty,
        },
        message: successMessage,
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
