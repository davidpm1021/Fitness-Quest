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
        { sortOrder: "asc" },
      ],
    });

    // Get user's unlocked cosmetics
    const unlockedCosmetics = await prisma.user_cosmetic_unlocks.findMany({
      where: { userId },
      select: { cosmeticItemId: true },
    });

    const unlockedIds = new Set(unlockedCosmetics.map((u) => u.cosmeticItemId));

    // Get user's stats for unlock calculations
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        partyMemberships: {
          select: {
            currentStreak: true,
            focusPoints: true,
            checkIns: {
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
    const totalCheckIns = user.partyMemberships.reduce(
      (sum, pm) => sum + pm.checkIns.length,
      0
    );
    const maxStreak = Math.max(
      ...user.partyMemberships.map((pm) => pm.currentStreak),
      0
    );
    const totalFocusPoints = user.partyMemberships.reduce(
      (sum, pm) => sum + pm.focusPoints,
      0
    );

    // Get monsters defeated
    const monstersDefeated = await prisma.check_ins.count({
      where: {
        partyMember: {
          userId,
        },
      },
    });

    // Check if each cosmetic should be unlocked
    const cosmeticsWithStatus = allCosmetics.map((cosmetic) => {
      const isUnlocked = unlockedIds.has(cosmetic.id);
      let canUnlock = false;
      let progress = 0;
      let progressMax = cosmetic.unlockThreshold;

      if (!isUnlocked && !cosmetic.isStarterItem) {
        switch (cosmetic.unlockConditionType) {
          case "CHECK_IN_COUNT":
            progress = totalCheckIns;
            canUnlock = totalCheckIns >= cosmetic.unlockThreshold;
            break;
          case "STREAK_DAYS":
            progress = maxStreak;
            canUnlock = maxStreak >= cosmetic.unlockThreshold;
            break;
          case "MONSTERS_DEFEATED":
            progress = monstersDefeated;
            canUnlock = monstersDefeated >= cosmetic.unlockThreshold;
            break;
          case "FOCUS_POINTS":
            progress = totalFocusPoints;
            canUnlock = totalFocusPoints >= cosmetic.unlockThreshold;
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
        spriteSheetPath: cosmetic.spriteSheetPath,
        unlockConditionType: cosmetic.unlockConditionType,
        unlockThreshold: cosmetic.unlockThreshold,
        isStarterItem: cosmetic.isStarterItem,
        isUnlocked: isUnlocked || cosmetic.isStarterItem,
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
