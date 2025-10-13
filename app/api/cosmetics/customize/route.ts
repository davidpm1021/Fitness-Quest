import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";

/**
 * GET /api/cosmetics/customize
 * Returns the user's current sprite customization
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;
  const userId = user.userId;

  try {

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
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;
  const userId = user.userId;

  try {

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
