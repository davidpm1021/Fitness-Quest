import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";

/**
 * GET /api/cosmetics/available
 * Returns all cosmetic items with unlock status for the current user
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;
  const userId = user.userId;

  try {

    // Get all cosmetic items
    const allCosmetics = await prisma.cosmetic_items.findMany({
      orderBy: [
        { category: "asc" },
        { sort_order: "asc" },
      ],
    });

    // Get user's unlocked cosmetics
    const unlockedCosmetics = await prisma.user_cosmetic_unlocks.findMany({
      where: { user_id: userId },
      select: { cosmetic_item_id: true },
    });

    const unlockedIds = new Set(unlockedCosmetics.map((u) => u.cosmetic_item_id));

    // Get user's stats for unlock calculations
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

    // Check if each cosmetic should be unlocked
    const cosmeticsWithStatus = allCosmetics.map((cosmetic) => {
      const isUnlocked = unlockedIds.has(cosmetic.id);
      let canUnlock = false;
      let progress = 0;
      let progressMax = cosmetic.unlock_threshold;

      if (!isUnlocked && !cosmetic.is_starter_item) {
        switch (cosmetic.unlock_condition_type) {
          case "CHECK_IN_COUNT":
            progress = totalCheckIns;
            canUnlock = totalCheckIns >= cosmetic.unlock_threshold;
            break;
          case "STREAK_DAYS":
            progress = maxStreak;
            canUnlock = maxStreak >= cosmetic.unlock_threshold;
            break;
          case "MONSTERS_DEFEATED":
            progress = monstersDefeated;
            canUnlock = monstersDefeated >= cosmetic.unlock_threshold;
            break;
          case "FOCUS_POINTS":
            progress = totalFocusPoints;
            canUnlock = totalFocusPoints >= cosmetic.unlock_threshold;
            break;
          case "STARTER_ITEM":
            canUnlock = false; // Starter items are auto-unlocked
            break;
        }
      }

      return {
        id: cosmetic.id,
        name: cosmetic.name,
        description: cosmetic.description,
        category: cosmetic.category,
        spriteSheetPath: cosmetic.sprite_sheet_path,
        unlockConditionType: cosmetic.unlock_condition_type,
        unlockThreshold: cosmetic.unlock_threshold,
        isStarterItem: cosmetic.is_starter_item,
        isUnlocked: isUnlocked || cosmetic.is_starter_item,
        canUnlock,
        progress,
        progressMax,
      };
    });

    // Group by category
    const grouped = {
      HAIR: cosmeticsWithStatus.filter((c) => c.category === "HAIR"),
      CLOTHING: cosmeticsWithStatus.filter((c) => c.category === "CLOTHING"),
      ACCESSORY: cosmeticsWithStatus.filter((c) => c.category === "ACCESSORY"),
      WEAPON: cosmeticsWithStatus.filter((c) => c.category === "WEAPON"),
      COLOR_PALETTE: cosmeticsWithStatus.filter((c) => c.category === "COLOR_PALETTE"),
    };

    return NextResponse.json({
      success: true,
      cosmetics: grouped,
      stats: {
        totalCheckIns,
        maxStreak,
        totalFocusPoints,
        monstersDefeated,
      },
    });
  } catch (error) {
    console.error("Error fetching available cosmetics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cosmetics" },
      { status: 500 }
    );
  }
}
