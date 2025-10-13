import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

export async function PATCH(req: NextRequest) {
  try {
    // Get token from header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No token provided",
        } as ApiResponse,
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Invalid token",
        } as ApiResponse,
        { status: 401 }
      );
    }

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

    // Check if email is already used by another user
    if (email !== payload.email) {
      const existingEmail = await prisma.user.findUnique({
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
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (username !== currentUser?.username) {
      const existingUsername = await prisma.user.findUnique({
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
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        email,
        username,
        displayName,
        timezone: timezone || "UTC",
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
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
