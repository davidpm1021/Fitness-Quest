import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {

    const { currentPassword, newPassword } = await req.json();

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Current password and new password are required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "New password must be at least 8 characters",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get current user data
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      userData.passwordHash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Current password is incorrect",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.userId },
      data: {
        passwordHash: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password changed successfully",
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to change password",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
