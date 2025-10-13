import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";
import { ApiResponse } from "@/lib/types";

/**
 * PUT /api/profile
 * Update the current user's profile
 */
export async function PUT(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user: authUser } = authResult;

  try {
    const body = await request.json();
    const { displayName, timezone } = body;

    // Validate at least one field is provided
    if (!displayName && !timezone) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No fields provided for update" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: { displayName?: string; timezone?: string } = {};
    if (displayName) updateData.displayName = displayName;
    if (timezone) updateData.timezone = timezone;

    // Update user
    const user = await prisma.users.update({
      where: { id: authUser.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        timezone: true,
        updatedAt: true,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { user },
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "An error occurred while updating profile" },
      { status: 500 }
    );
  }
}
