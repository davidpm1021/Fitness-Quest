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
    const { goalCheckIns } = body as { goalCheckIns: GoalCheckIn[] };

    // Get user's party membership
    const partyMember = await prisma.partyMember.findFirst({
      where: { userId: user.userId },
      include: {
        party: {
          include: {
            members: true,
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

    // Check if already checked in today - DISABLED FOR TESTING
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // const existingCheckIn = await prisma.checkIn.findFirst({
    //   where: {
    //     partyMemberId: partyMember.id,
    //     checkInDate: today,
    //   },
    // });

    // if (existingCheckIn) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "You have already checked in today",
    //     } as ApiResponse,
    //     { status: 400 }
    //   );
    // }

    // Get user's goals
    const goals = await prisma.goal.findMany({
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

    // Count how many party members have checked in today (before this check-in)
    const todayCheckIns = await prisma.checkIn.count({
      where: {
        partyId: partyMember.partyId,
        checkInDate: today,
      },
    });

    // Get active monster for the party
    const activeMonster = await prisma.partyMonster.findFirst({
      where: {
        partyId: partyMember.partyId,
        isActive: true,
      },
      include: {
        monster: true,
      },
    });

    // Calculate attack bonuses
    const bonuses = calculateAttackBonuses({
      goalsMet,
      currentStreak: newStreak,
      currentHp: partyMember.currentHp,
      maxHp: partyMember.maxHp,
      checkedInCount: todayCheckIns,
    });

    // Roll d20 and calculate damage
    const attackRoll = rollD20();
    const baseDamage = rollBaseDamage();

    // Use active monster's AC or default to 12
    const monsterAC = activeMonster?.monster.armorClass || 12;
    const result = calculateDamage(
      attackRoll,
      bonuses.totalBonus,
      baseDamage,
      monsterAC
    );

    // Calculate new defense
    const newDefense = calculateDefense(newStreak);

    // Roll for counterattack if there's an active monster and player hit
    let wasCounterattacked = false;
    let counterattackDamage = 0;
    if (activeMonster && result.hit) {
      wasCounterattacked = rollCounterattack(
        activeMonster.monster.counterattackChance,
        newDefense
      );
      if (wasCounterattacked) {
        counterattackDamage = calculateCounterattackDamage(
          activeMonster.monster.baseDamage
        );
      }
    }

    // Create check-in with transaction
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

      // Update party member stats
      const newHp = Math.max(0, partyMember.currentHp - counterattackDamage);
      await tx.partyMember.update({
        where: { id: partyMember.id },
        data: {
          currentStreak: newStreak,
          currentDefense: newDefense,
          currentHp: newHp,
        },
      });

      // Update monster HP if hit
      if (activeMonster && result.hit) {
        const newMonsterHp = Math.max(
          0,
          activeMonster.monster.currentHp - result.damage
        );
        const isDefeated = newMonsterHp === 0;

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
        }
      }

      return checkIn;
    });

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
          streakUpdated: newStreak,
          defenseUpdated: newDefense,
        },
        message: result.hit
          ? wasCounterattacked
            ? `Hit! You dealt ${result.damage} damage but the monster counterattacked for ${counterattackDamage} damage!`
            : `Hit! You dealt ${result.damage} damage!`
          : "Miss! Better luck tomorrow!",
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
    const partyMember = await prisma.partyMember.findFirst({
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
                displayName: true,
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
        createdAt: "desc",
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
