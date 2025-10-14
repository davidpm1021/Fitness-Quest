import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";

export async function PATCH(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {

    const { email, username, displayName, timezone } = await req.json();

    // Validate inputs
    if (!email || !username || !displayName) {
      return NextResponse.json(
        {
          success: false,
          error: "Email, username, and display name are required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get current user data
    const currentUser = await prisma.users.findUnique({
      where: { id: user.userId },
      select: { email: true, username: true },
    });

    // Check if email is already used by another user
    if (email !== currentUser?.email) {
      const existingEmail = await prisma.users.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            error: "Email is already in use",
          } as ApiResponse,
          { status: 400 }
        );
      }
    }

    // Check if username is already used by another user
    if (username !== currentUser?.username) {
      const existingUsername = await prisma.users.findUnique({
        where: { username },
      });

      if (existingUsername) {
        return NextResponse.json(
          {
            success: false,
            error: "Username is already in use",
          } as ApiResponse,
          { status: 400 }
        );
      }
    }

    // Update user settings
    const updatedUser = await prisma.users.update({
      where: { id: user.userId },
      data: {
        email,
        username,
        display_name: displayName,
        timezone: timezone || "UTC",
      },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        timezone: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { user: updatedUser },
        message: "Settings updated successfully",
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update settings",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
