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
    const { email, password, displayName } = body;

    // Validate required fields
    if (!email || !password || !displayName) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Email, password, and display name are required",
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

    // Generate username from email (use email prefix before @)
    const emailPrefix = email.split('@')[0].toLowerCase();
    let username = emailPrefix;

    // Ensure username is unique by appending numbers if needed
    let usernameExists = await prisma.user.findUnique({
      where: { username },
    });

    let counter = 1;
    while (usernameExists) {
      username = `${emailPrefix}${counter}`;
      usernameExists = await prisma.user.findUnique({
        where: { username },
      });
      counter++;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        username,
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
