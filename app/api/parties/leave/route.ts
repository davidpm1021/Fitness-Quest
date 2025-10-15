import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * POST /api/parties/leave - Leave current party
 * Removes the user from their current party
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    // Find user's current party membership
    const membership = await prisma.party_members.findFirst({
      where: {
        user_id: user.userId,
      },
      include: {
        parties: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not in a party",
        } as ApiResponse,
        { status: 404 }
      );
    }

    const partyName = membership.parties.name;

    // Delete the party membership
    await prisma.party_members.delete({
      where: {
        id: membership.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully left ${partyName}`,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error leaving party:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to leave party",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
