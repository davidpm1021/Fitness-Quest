import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// GET /api/parties/:id - Get party details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;
  const { id } = await params;

  try {
    // Find party with all details
    const party = await prisma.parties.findUnique({
      where: { id },
      include: {
        members: {
          include: {
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
      },
    });

    if (!party) {
      return NextResponse.json(
        {
          success: false,
          error: "Party not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Check if user is a member of this party
    const isMember = party.members.some((member) => member.userId === user.userId);

    if (!isMember) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not a member of this party",
        } as ApiResponse,
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { party },
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching party:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch party details",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
