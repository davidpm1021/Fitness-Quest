import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/auth/jwt";

/**
 * GET /api/cosmetics/customize
 * Returns the user's current sprite customization
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = payload.userId as string;

    // Get user's customization
    const customization = await prisma.userSpriteCustomization.findUnique({
      where: { userId },
    });

    if (!customization) {
      // Return default customization
      return NextResponse.json({
        success: true,
        customization: {
          baseSpritePath: "/sprites/body/male-light.png",
          hairSpritePath: "/sprites/hair-short.png",
          clothingSpritePath: "/sprites/shirt-basic.png",
          accessorySpritePath: null,
          weaponSpritePath: null,
          hairTintColor: "#8B4513",
          clothingTintColor: "#4169E1",
          accessoryTintColor: "#FF4500",
        },
      });
    }

    return NextResponse.json({
      success: true,
      customization,
    });
  } catch (error) {
    console.error("Error fetching customization:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customization" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cosmetics/customize
 * Saves the user's sprite customization
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = payload.userId as string;

    // Get customization from request body
    const body = await request.json();
    const {
      baseSpritePath,
      hairSpritePath,
      clothingSpritePath,
      accessorySpritePath,
      weaponSpritePath,
      hairTintColor,
      clothingTintColor,
      accessoryTintColor,
    } = body;

    // Validate required field
    if (!baseSpritePath) {
      return NextResponse.json(
        { success: false, error: "Base sprite path is required" },
        { status: 400 }
      );
    }

    // Upsert customization
    const customization = await prisma.userSpriteCustomization.upsert({
      where: { userId },
      create: {
        userId,
        baseSpritePath,
        hairSpritePath: hairSpritePath || null,
        clothingSpritePath: clothingSpritePath || null,
        accessorySpritePath: accessorySpritePath || null,
        weaponSpritePath: weaponSpritePath || null,
        hairTintColor: hairTintColor || null,
        clothingTintColor: clothingTintColor || null,
        accessoryTintColor: accessoryTintColor || null,
      },
      update: {
        baseSpritePath,
        hairSpritePath: hairSpritePath || null,
        clothingSpritePath: clothingSpritePath || null,
        accessorySpritePath: accessorySpritePath || null,
        weaponSpritePath: weaponSpritePath || null,
        hairTintColor: hairTintColor || null,
        clothingTintColor: clothingTintColor || null,
        accessoryTintColor: accessoryTintColor || null,
      },
    });

    return NextResponse.json({
      success: true,
      customization,
    });
  } catch (error) {
    console.error("Error saving customization:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save customization" },
      { status: 500 }
    );
  }
}
