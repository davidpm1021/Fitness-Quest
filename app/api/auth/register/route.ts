import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  generateToken,
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from "@/lib/auth";
import { ApiResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, displayName } = body;

    // Validate required fields
    if (!email || !password || !username || !displayName) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "All fields are required: email, password, username, displayName",
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Password must be at least 8 characters with letters and numbers",
        },
        { status: 400 }
      );
    }

    // Validate username format
    if (!isValidUsername(username)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Username must be 3-20 characters, alphanumeric and underscores only",
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Username already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        username: username.toLowerCase(),
        displayName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        timezone: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          user,
          token,
        },
        message: "Registration successful!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
