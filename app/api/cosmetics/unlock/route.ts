import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";

/**
 * POST /api/cosmetics/unlock
 * Unlocks a cosmetic item if the user meets the requirements
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;
  const userId = user.userId;

  try {

    // Get cosmetic ID from request body
    const body = await request.json();
    const { cosmeticItemId } = body;

    if (!cosmeticItemId) {
      return NextResponse.json(
        { success: false, error: "Cosmetic item ID is required" },
        { status: 400 }
      );
    }

    // Check if already unlocked
    const existing = await prisma.user_cosmetic_unlocks.findUnique({
      where: {
        user_id_cosmetic_item_id: {
          user_id: userId,
          cosmetic_item_id: cosmeticItemId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Cosmetic already unlocked" },
        { status: 400 }
      );
    }

    // Get the cosmetic item
    const cosmetic = await prisma.cosmetic_items.findUnique({
      where: { id: cosmeticItemId },
    });

    if (!cosmetic) {
      return NextResponse.json(
        { success: false, error: "Cosmetic item not found" },
        { status: 404 }
      );
    }

    // Get user's stats
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        party_members: {
          select: {
            current_streak: true,
            focus_points: true,
            check_ins: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate user's stats
    const totalCheckIns = user.party_members.reduce(
      (sum, pm) => sum + pm.check_ins.length,
      0
    );
    const maxStreak = Math.max(
      ...user.party_members.map((pm) => pm.current_streak),
      0
    );
    const totalFocusPoints = user.party_members.reduce(
      (sum, pm) => sum + pm.focus_points,
      0
    );

    // Get monsters defeated
    const monstersDefeated = await prisma.check_ins.count({
      where: {
        party_members: {
          user_id: userId,
        },
      },
    });

    // Check if user meets unlock requirements
    let meetsRequirements = false;
    let errorMessage = "";

    switch (cosmetic.unlock_condition_type) {
      case "CHECK_IN_COUNT":
        meetsRequirements = totalCheckIns >= cosmetic.unlock_threshold;
        errorMessage = `Need ${cosmetic.unlock_threshold} check-ins (you have ${totalCheckIns})`;
        break;
      case "STREAK_DAYS":
        meetsRequirements = maxStreak >= cosmetic.unlock_threshold;
        errorMessage = `Need ${cosmetic.unlock_threshold} day streak (you have ${maxStreak})`;
        break;
      case "MONSTERS_DEFEATED":
        meetsRequirements = monstersDefeated >= cosmetic.unlock_threshold;
        errorMessage = `Need ${cosmetic.unlock_threshold} monsters defeated (you have ${monstersDefeated})`;
        break;
      case "FOCUS_POINTS":
        meetsRequirements = totalFocusPoints >= cosmetic.unlock_threshold;
        errorMessage = `Need ${cosmetic.unlock_threshold} focus points (you have ${totalFocusPoints})`;
        break;
      case "STARTER_ITEM":
        meetsRequirements = true; // Starter items can always be unlocked
        break;
    }

    if (!meetsRequirements) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // Unlock the cosmetic
    const unlock = await prisma.user_cosmetic_unlocks.create({
      data: {
        user_id: userId,
        cosmetic_item_id: cosmeticItemId,
      },
    });

    return NextResponse.json({
      success: true,
      unlock,
      cosmetic,
    });
  } catch (error) {
    console.error("Error unlocking cosmetic:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unlock cosmetic" },
      { status: 500 }
    );
  }
}
