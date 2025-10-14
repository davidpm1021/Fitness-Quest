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
    const customization = await prisma.user_sprite_customizations.findUnique({
      where: { user_id: userId },
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
    const customization = await prisma.user_sprite_customizations.upsert({
      where: { user_id: userId },
      create: {
        id: crypto.randomUUID(),
        user_id: userId,
        base_sprite_path: baseSpritePath,
        hair_sprite_path: hairSpritePath || null,
        clothing_sprite_path: clothingSpritePath || null,
        accessory_sprite_path: accessorySpritePath || null,
        weapon_sprite_path: weaponSpritePath || null,
        hair_tint_color: hairTintColor || null,
        clothing_tint_color: clothingTintColor || null,
        accessory_tint_color: accessoryTintColor || null,
        updated_at: new Date(),
      },
      update: {
        base_sprite_path: baseSpritePath,
        hair_sprite_path: hairSpritePath || null,
        clothing_sprite_path: clothingSpritePath || null,
        accessory_sprite_path: accessorySpritePath || null,
        weapon_sprite_path: weaponSpritePath || null,
        hair_tint_color: hairTintColor || null,
        clothing_tint_color: clothingTintColor || null,
        accessory_tint_color: accessoryTintColor || null,
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
