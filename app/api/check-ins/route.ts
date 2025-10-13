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
      where: { user_id: user.userId },
      include: {
        parties: {
          include: {
            party_members: {
              select: {
                id: true,
                current_hp: true,
                max_hp: true,
                current_defense: true,
                current_streak: true,
                focus_points: true,
              },
            },
          },
        },
        welcome_back_bonuses: {
          where: {
            is_active: true,
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

    const existingCheckIn = await prisma.check_ins.findFirst({
      where: {
        party_member_id: partyMember.id,
        check_in_date: today,
      },
      include: {
        goal_check_ins: {
          include: {
            goals: true,
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
        user_id: user.userId,
        is_active: true,
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
      } else if (checkIn.actualValue !== null && goal.target_value !== null) {
        wasMet = evaluateGoal(
          checkIn.actualValue,
          goal.target_value,
          goal.flex_percentage
        );
      }

      if (wasMet) {
        goalsMet++;
      }

      return {
        goalId: goal.id,
        actualValue: checkIn.actualValue,
        targetValue: goal.target_value,
        wasMet,
      };
    });

    // Check for previous day check-in for streak calculation
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const previousCheckIn = await prisma.check_ins.findFirst({
      where: {
        party_member_id: partyMember.id,
        check_in_date: yesterday,
      },
    });

    // Update streak
    const newStreak = updateStreak(
      !!previousCheckIn,
      partyMember.current_streak
    );

    // Validate combat action requirements
    if (selectedAction === "HEROIC_STRIKE") {
      if (partyMember.focus_points < 3) {
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
    const todayCheckIns = await prisma.check_ins.count({
      where: {
        party_id: partyMember.party_id,
        check_in_date: today,
      },
    });

    // Get active monster for the party
    const activeMonster = await prisma.party_monsters.findFirst({
      where: {
        party_id: partyMember.party_id,
        is_active: true,
      },
      include: {
        monsters: true,
      },
    });

    // Check for active welcome back bonus
    const activeWelcomeBackBonus =
      partyMember.welcome_back_bonuses && partyMember.welcome_back_bonuses.length > 0
        ? partyMember.welcome_back_bonuses[0]
        : null;

    // Calculate attack bonuses
    const bonuses = calculateAttackBonuses({
      goalsMet,
      currentStreak: newStreak,
      currentHp: partyMember.current_hp,
      maxHp: partyMember.max_hp,
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
        const injuredTeammates = partyMember.parties.party_members.filter(
          (m) => m.id !== partyMember.id && m.current_hp < m.max_hp
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
    const monsterAC = activeMonster?.monsters.armor_class || 12;

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
      let counterattackChance = activeMonster.monsters.counterattack_chance;
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
          activeMonster.monsters.base_damage
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
      const checkIn = await tx.check_ins.create({
        data: {
          party_member_id: partyMember.id,
          party_id: partyMember.party_id,
          check_in_date: today,
          goals_met: goalsMet,
          is_rest_day: goalCheckIns.every((g) => g.isRestDay),
          attack_roll: attackRoll,
          attack_bonus: bonuses.totalBonus,
          damage_dealt: result.damage,
          was_hit_by_monster: wasCounterattacked,
          damage_taken: counterattackDamage,
          combat_action: selectedAction,
          focus_earned: focusEarned,
        },
      });

      // Create goal check-in records
      await tx.goal_check_ins.createMany({
        data: goalResults.map((gr) => ({
          check_in_id: checkIn.id,
          goal_id: gr.goalId,
          actual_value: gr.actualValue,
          target_value: gr.targetValue,
          was_met: gr.wasMet,
        })),
      });

      // Calculate new focus points
      let newFocus = partyMember.focus_points + focusEarned;
      if (selectedAction === "HEROIC_STRIKE") {
        newFocus -= 3; // Deduct focus cost
      }

      // Update party member stats
      const newHp = Math.max(0, partyMember.current_hp - counterattackDamage);
      await tx.party_members.update({
        where: { id: partyMember.id },
        data: {
          current_streak: newStreak,
          current_defense: newDefense,
          current_hp: newHp,
          focus_points: newFocus,
        },
      });

      // Apply DEFEND defense bonus to all party members
      if (selectedAction === "DEFEND") {
        const partyMemberIds = partyMember.parties.party_members.map((m) => m.id);
        await tx.party_members.updateMany({
          where: {
            id: { in: partyMemberIds },
          },
          data: {
            current_defense: {
              increment: 5,
            },
          },
        });
      }

      // Apply SUPPORT healing to teammate
      if (healingTarget && healingAmount > 0) {
        const teammate = await tx.party_members.findUnique({
          where: { id: healingTarget },
        });
        if (teammate) {
          const newTeammateHp = Math.min(teammate.max_hp, teammate.current_hp + healingAmount);
          await tx.party_members.update({
            where: { id: healingTarget },
            data: {
              current_hp: newTeammateHp,
            },
          });
        }
      }

      // Update welcome back bonus - decrement remaining check-ins
      if (activeWelcomeBackBonus) {
        const newRemainingCheckIns = activeWelcomeBackBonus.bonus_check_ins_remaining - 1;
        const isStillActive = newRemainingCheckIns > 0;

        await tx.welcome_back_bonuses.update({
          where: { id: activeWelcomeBackBonus.id },
          data: {
            bonus_check_ins_remaining: newRemainingCheckIns,
            is_active: isStillActive,
            expires_at: !isStillActive ? new Date() : undefined,
          },
        });
      }

      // Update monster HP if hit and detect milestones
      if (activeMonster && result.hit) {
        const oldHp = activeMonster.monsters.current_hp;
        const newMonsterHp = Math.max(
          0,
          activeMonster.monsters.current_hp - result.damage
        );
        const isDefeated = newMonsterHp === 0;

        // Calculate HP percentages
        const oldPercentage = (oldHp / activeMonster.monsters.max_hp) * 100;
        const newPercentage = (newMonsterHp / activeMonster.monsters.max_hp) * 100;

        // Check if we crossed a milestone (75%, 50%, 25%)
        const milestones: Array<75 | 50 | 25> = [75, 50, 25];
        for (const milestone of milestones) {
          if (oldPercentage > milestone && newPercentage <= milestone) {
            milestoneCrossed = milestone;
            break; // Only celebrate the highest milestone crossed
          }
        }

        await tx.monsters.update({
          where: { id: activeMonster.monsters.id },
          data: {
            current_hp: newMonsterHp,
            is_defeated: isDefeated,
            defeated_at: isDefeated ? new Date() : undefined,
          },
        });

        // Deactivate the party monster if defeated
        if (isDefeated) {
          await tx.party_monsters.update({
            where: { id: activeMonster.id },
            data: { is_active: false },
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
        const monsterCreatedDate = new Date(activeMonster.monsters.created_at);
        monsterCreatedDate.setHours(0, 0, 0, 0);
        const daysToDefeat = Math.max(
          1,
          Math.ceil((today.getTime() - monsterCreatedDate.getTime()) / (1000 * 60 * 60 * 24))
        );

        const victoryResult = await createVictoryReward({
          partyId: partyMember.party_id,
          monsterId: activeMonster.monsters.id,
          daysToDefeat,
          monsterName: activeMonster.monsters.name,
          monsterType: activeMonster.monsters.monster_type,
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
        where: { party_id: partyMember.party_id },
        select: { user_id: true },
      });

      // Clear cache for all party members since their party data changed
      allPartyMembers.forEach((pm) => {
        cache.delete(CacheKeys.partyDashboard(pm.user_id));
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
            newFocusTotal: partyMember.focus_points + focusEarned - (selectedAction === "HEROIC_STRIKE" ? 3 : 0),
            healingTarget: healingTarget,
            healingAmount: healingAmount,
            defenseBonus: selectedAction === "DEFEND" ? 5 : 0,
          },
          monster: activeMonster
            ? {
                name: activeMonster.monsters.name,
                currentHp: activeMonster.monsters.current_hp - (result.hit ? result.damage : 0),
                maxHp: activeMonster.monsters.max_hp,
              }
            : null,
          monsterDefeated: activeMonster
            ? activeMonster.monsters.current_hp - result.damage <= 0 && result.hit
            : false,
          victoryRewardId: victoryRewardId,
          milestoneCrossed: milestoneCrossed,
          streakUpdated: newStreak,
          defenseUpdated: newDefense,
          welcomeBackBonus: activeWelcomeBackBonus
            ? {
                daysRemaining: Math.max(
                  0,
                  activeWelcomeBackBonus.bonus_check_ins_remaining - 1
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
      where: { user_id: user.userId },
    });

    if (!partyMember) {
      return NextResponse.json({
        success: true,
        data: { checkIns: [] },
      } as ApiResponse);
    }

    // Get recent check-ins for the party
    const checkIns = await prisma.check_ins.findMany({
      where: {
        party_id: partyMember.party_id,
      },
      include: {
        party_members: {
          include: {
            users: {
              select: {
                username: true,
                display_name: true,
              },
            },
          },
        },
        goal_check_ins: {
          include: {
            goals: {
              select: {
                name: true,
                goal_type: true,
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
