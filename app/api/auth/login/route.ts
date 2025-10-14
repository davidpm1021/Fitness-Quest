import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateToken } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Return user data (without password hash) and map to camelCase
    const mappedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      characterName: user.character_name,
      timezone: user.timezone,
      onboardingStep: user.onboarding_step,
      onboardingCompletedAt: user.onboarding_completed_at,
      createdAt: user.created_at,
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        user: mappedUser,
        token,
      },
      message: "Login successful!",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
