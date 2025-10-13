import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";
import {
  rollD20,
  rollBaseDamage,
  calculateAttackBonuses,
  evaluateGoal,
  calculateDamage,
  updateStreak,
  calculateDefense,
  rollCounterattack,
  calculateCounterattackDamage,
} from "@/lib/combat";
import { createVictoryReward } from "@/lib/victoryRewards";
import { cache, CacheKeys } from "@/lib/cache";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface GoalCheckIn {
  goalId: string;
  actualValue: number | null;
  isRestDay: boolean;
}

// POST /api/check-ins - Create daily check-in
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const body = await request.json();
    const { goalCheckIns, combatAction } = body as {
      goalCheckIns: GoalCheckIn[];
      combatAction?: "ATTACK" | "DEFEND" | "SUPPORT" | "HEROIC_STRIKE";
    };

    // Default to ATTACK if not specified
    const selectedAction = combatAction || "ATTACK";

    // Get user's party membership
    const partyMember = await prisma.party_members.findFirst({
      where: { userId: user.userId },
      include: {
        party: {
          include: {
            members: {
              select: {
                id: true,
                currentHp: true,
                maxHp: true,
                currentDefense: true,
                currentStreak: true,
                focusPoints: true,
              },
            },
          },
        },
        welcomeBackBonuses: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!partyMember) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be in a party to check in",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        partyMemberId: partyMember.id,
        checkInDate: today,
      },
      include: {
        goalCheckIns: {
          include: {
            goal: true,
          },
        },
      },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        {
          success: false,
          error: "You've already completed your check-in for today! Your party appreciates your dedication. Come back tomorrow to continue the quest.",
          data: {
            checkIn: existingCheckIn,
            alreadyCheckedIn: true,
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get user's goals
    const goals = await prisma.goals.findMany({
      where: {
        userId: user.userId,
        isActive: true,
      },
    });

    // Evaluate goals
    let goalsMet = 0;
    const goalResults = goalCheckIns.map((checkIn) => {
      const goal = goals.find((g) => g.id === checkIn.goalId);
      if (!goal) {
        throw new Error(`Goal ${checkIn.goalId} not found`);
      }

      let wasMet = false;
      if (checkIn.isRestDay) {
        wasMet = true; // Rest days count as met
      } else if (checkIn.actualValue !== null && goal.targetValue !== null) {
        wasMet = evaluateGoal(
          checkIn.actualValue,
          goal.targetValue,
          goal.flexPercentage
        );
      }

      if (wasMet) {
        goalsMet++;
      }

      return {
        goalId: goal.id,
        actualValue: checkIn.actualValue,
        targetValue: goal.targetValue,
        wasMet,
      };
    });

    // Check for previous day check-in for streak calculation
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const previousCheckIn = await prisma.checkIn.findFirst({
      where: {
        partyMemberId: partyMember.id,
        checkInDate: yesterday,
      },
    });

    // Update streak
    const newStreak = updateStreak(
      !!previousCheckIn,
      partyMember.currentStreak
    );

    // Validate combat action requirements
    if (selectedAction === "HEROIC_STRIKE") {
      if (partyMember.focusPoints < 3) {
        return NextResponse.json(
          {
            success: false,
            error: "Not enough focus! Heroic Strike requires 3 focus points.",
          } as ApiResponse,
          { status: 400 }
        );
      }
      if (newStreak < 7) {
        return NextResponse.json(
          {
            success: false,
            error: "Heroic Strike requires a 7-day streak to unlock!",
          } as ApiResponse,
          { status: 400 }
        );
      }
    }

    // Count how many party members have checked in today (before this check-in)
    const todayCheckIns = await prisma.checkIn.count({
      where: {
        partyId: partyMember.partyId,
        checkInDate: today,
      },
    });

    // Get active monster for the party
    const activeMonster = await prisma.party_monsters.findFirst({
      where: {
        partyId: partyMember.partyId,
        isActive: true,
      },
      include: {
        monster: true,
      },
    });

    // Check for active welcome back bonus
    const activeWelcomeBackBonus =
      partyMember.welcomeBackBonuses && partyMember.welcomeBackBonuses.length > 0
        ? partyMember.welcomeBackBonuses[0]
        : null;

    // Calculate attack bonuses
    const bonuses = calculateAttackBonuses({
      goalsMet,
      currentStreak: newStreak,
      currentHp: partyMember.currentHp,
      maxHp: partyMember.maxHp,
      checkedInCount: todayCheckIns,
    });

    // Roll d20 and calculate damage (modified by combat action)
    let attackRoll = rollD20();
    let baseDamage = rollBaseDamage();
    let focusEarned = 0;
    let damageMultiplier = 1.0;
    let autoHit = false;
    let healingTarget: string | null = null;
    let healingAmount = 0;

    // Apply combat action modifiers
    switch (selectedAction) {
      case "ATTACK":
        // Standard attack - earn 1 focus
        focusEarned = 1;
        break;

      case "DEFEND":
        // Deal 50% damage, but provide defense bonus (handled later)
        damageMultiplier = 0.5;
        break;

      case "SUPPORT":
        // Deal 50% damage, heal a teammate, earn 1 focus
        damageMultiplier = 0.5;
        focusEarned = 1;

        // Find a random teammate with less than max HP
        const injuredTeammates = partyMember.party.members.filter(
          (m) => m.id !== partyMember.id && m.currentHp < m.maxHp
        );

        if (injuredTeammates.length > 0) {
          const randomTeammate =
            injuredTeammates[Math.floor(Math.random() * injuredTeammates.length)];
          healingTarget = randomTeammate.id;
          healingAmount = 10;
        }
        break;

      case "HEROIC_STRIKE":
        // Auto-hit, double damage, costs 3 focus (no focus earned)
        autoHit = true;
        damageMultiplier = 2.0;
        focusEarned = 0;
        break;
    }

    // Apply welcome back catch-up damage bonus (+5 damage)
    if (activeWelcomeBackBonus) {
      baseDamage += 5;
    }

    // Use active monster's AC or default to 12
    const monsterAC = activeMonster?.monster.armorClass || 12;

    let result;
    if (autoHit) {
      // Heroic Strike always hits
      result = {
        hit: true,
        damage: Math.floor(baseDamage * damageMultiplier),
        roll: attackRoll,
        targetAC: monsterAC,
      };
    } else {
      result = calculateDamage(
        attackRoll,
        bonuses.totalBonus,
        Math.floor(baseDamage * damageMultiplier),
        monsterAC
      );
    }

    // Calculate new defense
    const newDefense = calculateDefense(newStreak);

    // Roll for counterattack if there's an active monster and player hit
    let wasCounterattacked = false;
    let counterattackDamage = 0;
    if (activeMonster && result.hit) {
      // Apply welcome back bonus: reduce counterattack chance by 50%
      let counterattackChance = activeMonster.monster.counterattackChance;
      if (activeWelcomeBackBonus) {
        counterattackChance = Math.floor(counterattackChance * 0.5);
      }

      // Apply DEFEND action: reduce counterattack chance by additional 50%
      if (selectedAction === "DEFEND") {
        counterattackChance = Math.floor(counterattackChance * 0.5);
      }

      wasCounterattacked = rollCounterattack(counterattackChance, newDefense);
      if (wasCounterattacked) {
        counterattackDamage = calculateCounterattackDamage(
          activeMonster.monster.baseDamage
        );

        // DEFEND action also reduces damage taken by 50%
        if (selectedAction === "DEFEND") {
          counterattackDamage = Math.floor(counterattackDamage * 0.5);
        }
      }
    }

    // Create check-in with transaction
    let milestoneCrossed: 75 | 50 | 25 | null = null;
    let monsterWasDefeated = false;
    let victoryRewardId: string | null = null;
    const checkInResult = await prisma.$transaction(async (tx) => {
      // Create the check-in
      const checkIn = await tx.checkIn.create({
        data: {
          partyMemberId: partyMember.id,
          partyId: partyMember.partyId,
          checkInDate: today,
          goalsMet,
          isRestDay: goalCheckIns.every((g) => g.isRestDay),
          attackRoll,
          attackBonus: bonuses.totalBonus,
          damageDealt: result.damage,
          wasHitByMonster: wasCounterattacked,
          damageTaken: counterattackDamage,
          combatAction: selectedAction,
          focusEarned: focusEarned,
        },
      });

      // Create goal check-in records
      await tx.goalCheckIn.createMany({
        data: goalResults.map((gr) => ({
          checkInId: checkIn.id,
          goalId: gr.goalId,
          actualValue: gr.actualValue,
          targetValue: gr.targetValue,
          wasMet: gr.wasMet,
        })),
      });

      // Calculate new focus points
      let newFocus = partyMember.focusPoints + focusEarned;
      if (selectedAction === "HEROIC_STRIKE") {
        newFocus -= 3; // Deduct focus cost
      }

      // Update party member stats
      const newHp = Math.max(0, partyMember.currentHp - counterattackDamage);
      await tx.partyMember.update({
        where: { id: partyMember.id },
        data: {
          currentStreak: newStreak,
          currentDefense: newDefense,
          currentHp: newHp,
          focusPoints: newFocus,
        },
      });

      // Apply DEFEND defense bonus to all party members
      if (selectedAction === "DEFEND") {
        const partyMemberIds = partyMember.party.members.map((m) => m.id);
        await tx.partyMember.updateMany({
          where: {
            id: { in: partyMemberIds },
          },
          data: {
            currentDefense: {
              increment: 5,
            },
          },
        });
      }

      // Apply SUPPORT healing to teammate
      if (healingTarget && healingAmount > 0) {
        const teammate = await tx.partyMember.findUnique({
          where: { id: healingTarget },
        });
        if (teammate) {
          const newTeammateHp = Math.min(teammate.maxHp, teammate.currentHp + healingAmount);
          await tx.partyMember.update({
            where: { id: healingTarget },
            data: {
              currentHp: newTeammateHp,
            },
          });
        }
      }

      // Update welcome back bonus - decrement remaining check-ins
      if (activeWelcomeBackBonus) {
        const newRemainingCheckIns = activeWelcomeBackBonus.bonusCheckInsRemaining - 1;
        const isStillActive = newRemainingCheckIns > 0;

        await tx.welcomeBackBonus.update({
          where: { id: activeWelcomeBackBonus.id },
          data: {
            bonusCheckInsRemaining: newRemainingCheckIns,
            isActive: isStillActive,
            expiresAt: !isStillActive ? new Date() : undefined,
          },
        });
      }

      // Update monster HP if hit and detect milestones
      if (activeMonster && result.hit) {
        const oldHp = activeMonster.monster.currentHp;
        const newMonsterHp = Math.max(
          0,
          activeMonster.monster.currentHp - result.damage
        );
        const isDefeated = newMonsterHp === 0;

        // Calculate HP percentages
        const oldPercentage = (oldHp / activeMonster.monster.maxHp) * 100;
        const newPercentage = (newMonsterHp / activeMonster.monster.maxHp) * 100;

        // Check if we crossed a milestone (75%, 50%, 25%)
        const milestones: Array<75 | 50 | 25> = [75, 50, 25];
        for (const milestone of milestones) {
          if (oldPercentage > milestone && newPercentage <= milestone) {
            milestoneCrossed = milestone;
            break; // Only celebrate the highest milestone crossed
          }
        }

        await tx.monster.update({
          where: { id: activeMonster.monster.id },
          data: {
            currentHp: newMonsterHp,
            isDefeated,
            defeatedAt: isDefeated ? new Date() : undefined,
          },
        });

        // Deactivate the party monster if defeated
        if (isDefeated) {
          await tx.partyMonster.update({
            where: { id: activeMonster.id },
            data: { isActive: false },
          });
          monsterWasDefeated = true;
        }
      }

      return checkIn;
    });

    // Create victory reward after transaction if monster was defeated
    if (monsterWasDefeated && activeMonster) {
      try {
        // Calculate days to defeat
        const monsterCreatedDate = new Date(activeMonster.monster.createdAt);
        monsterCreatedDate.setHours(0, 0, 0, 0);
        const daysToDefeat = Math.max(
          1,
          Math.ceil((today.getTime() - monsterCreatedDate.getTime()) / (1000 * 60 * 60 * 24))
        );

        const victoryResult = await createVictoryReward({
          partyId: partyMember.partyId,
          monsterId: activeMonster.monster.id,
          daysToDefeat,
          monsterName: activeMonster.monster.name,
          monsterType: activeMonster.monster.monsterType,
        });

        victoryRewardId = victoryResult.victoryReward.id;
      } catch (error) {
        console.error("Error creating victory reward:", error);
        // Don't fail the check-in if victory reward fails
      }
    }

    // Invalidate party dashboard cache for all party members after check-in
    try {
      const allPartyMembers = await prisma.party_members.findMany({
        where: { partyId: partyMember.partyId },
        select: { userId: true },
      });

      // Clear cache for all party members since their party data changed
      allPartyMembers.forEach((pm) => {
        cache.delete(CacheKeys.partyDashboard(pm.userId));
      });
    } catch (error) {
      console.error("Error invalidating cache:", error);
      // Don't fail the check-in if cache invalidation fails
    }

    // Build combat action result message
    let actionMessage = "";
    if (selectedAction === "ATTACK") {
      actionMessage = result.hit
        ? wasCounterattacked
          ? `Hit! You dealt ${result.damage} damage but the monster counterattacked for ${counterattackDamage} damage!`
          : `Hit! You dealt ${result.damage} damage!`
        : "Miss! Better luck tomorrow!";
    } else if (selectedAction === "DEFEND") {
      actionMessage = result.hit
        ? wasCounterattacked
          ? `Defensive Strike! You dealt ${result.damage} damage and took only ${counterattackDamage} damage. Your party gained +5 defense!`
          : `Defensive Strike! You dealt ${result.damage} damage and your party gained +5 defense!`
        : `You took a defensive stance. Your party gained +5 defense!`;
    } else if (selectedAction === "SUPPORT") {
      const healMessage = healingTarget
        ? ` You healed a teammate for ${healingAmount} HP!`
        : ` No injured teammates to heal.`;
      actionMessage = result.hit
        ? `Supporting Attack! You dealt ${result.damage} damage.${healMessage}`
        : `Supporting effort! You dealt base damage.${healMessage}`;
    } else if (selectedAction === "HEROIC_STRIKE") {
      actionMessage = `HEROIC STRIKE! You unleashed devastating power for ${result.damage} damage!`;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          checkIn: checkInResult,
          attackResult: {
            roll: attackRoll,
            bonuses: bonuses,
            baseDamage,
            totalDamage: result.damage,
            hit: result.hit,
            wasCounterattacked,
            counterattackDamage,
          },
          combatAction: {
            action: selectedAction,
            focusEarned: focusEarned,
            focusCost: selectedAction === "HEROIC_STRIKE" ? 3 : 0,
            newFocusTotal: partyMember.focusPoints + focusEarned - (selectedAction === "HEROIC_STRIKE" ? 3 : 0),
            healingTarget: healingTarget,
            healingAmount: healingAmount,
            defenseBonus: selectedAction === "DEFEND" ? 5 : 0,
          },
          monster: activeMonster
            ? {
                name: activeMonster.monster.name,
                currentHp: activeMonster.monster.currentHp - (result.hit ? result.damage : 0),
                maxHp: activeMonster.monster.maxHp,
              }
            : null,
          monsterDefeated: activeMonster
            ? activeMonster.monster.currentHp - result.damage <= 0 && result.hit
            : false,
          victoryRewardId: victoryRewardId,
          milestoneCrossed: milestoneCrossed,
          streakUpdated: newStreak,
          defenseUpdated: newDefense,
          welcomeBackBonus: activeWelcomeBackBonus
            ? {
                daysRemaining: Math.max(
                  0,
                  activeWelcomeBackBonus.bonusCheckInsRemaining - 1
                ),
                catchUpDamageBonus: 5,
                reducedCounterattack: true,
              }
            : null,
        },
        message: actionMessage,
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating check-in:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create check-in",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// GET /api/check-ins - Get check-ins for user's party
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    // Get user's party membership
    const partyMember = await prisma.party_members.findFirst({
      where: { userId: user.userId },
    });

    if (!partyMember) {
      return NextResponse.json({
        success: true,
        data: { checkIns: [] },
      } as ApiResponse);
    }

    // Get recent check-ins for the party
    const checkIns = await prisma.checkIn.findMany({
      where: {
        partyId: partyMember.partyId,
      },
      include: {
        partyMember: {
          include: {
            user: {
              select: {
                username: true,
                display_name: true,
              },
            },
          },
        },
        goalCheckIns: {
          include: {
            goal: {
              select: {
                name: true,
                goalType: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: { checkIns },
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch check-ins",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
