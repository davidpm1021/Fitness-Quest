import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";
import { ApiResponse } from "@/lib/types";

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile
 */
export async function GET(request: NextRequest) {
  // Authenticate the request
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user: authUser } = authResult;

  try {
    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        characterName: true,
        timezone: true,
        onboardingStep: true,
        onboardingCompletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "An error occurred" },
      { status: 500 }
    );
  }
}
