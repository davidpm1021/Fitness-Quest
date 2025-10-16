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
import {
  calculateCheckInXP,
  calculateLevelFromXP,
  didLevelUp,
  calculateSkillPointsEarned,
} from "@/lib/progression";
import { createVictoryReward } from "@/lib/victoryRewards";
import { cache, CacheKeys } from "@/lib/cache";
import {
  applyBuffToAttackRoll,
  applyBuffToDamage,
  applyBuffToDefense,
  getBuffNotification,
  type BuffType,
} from "@/lib/encouragementBuffs";
import {
  calculateCombatModifiers,
  BATTLE_MODIFIERS,
  type BattleModifier,
} from "@/lib/game/battle-modifiers";

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
      select: {
        id: true,
        user_id: true,
        party_id: true,
        current_hp: true,
        max_hp: true,
        current_defense: true,
        current_streak: true,
        focus_points: true,
        xp: true,
        level: true,
        skill_points: true,
        active_buff_type: true,
        active_buff_value: true,
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

    // Extract active buff for combat (will be cleared after use)
    const activeBuff = partyMember?.active_buff_type as BuffType | null;

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

    // Calculate focus penalty for broken streak
    const streakWasBroken = !previousCheckIn && partyMember.current_streak > 1;
    const focusPenalty = streakWasBroken ? partyMember.focus_points : 0; // Lose all focus when streak breaks

    // Validate combat action requirements
    if (selectedAction === "DEFEND") {
      if (partyMember.focus_points < 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Not enough focus! Defend requires 1 focus point.",
          } as ApiResponse,
          { status: 400 }
        );
      }
    } else if (selectedAction === "SUPPORT") {
      if (partyMember.focus_points < 2) {
        return NextResponse.json(
          {
            success: false,
            error: "Not enough focus! Support requires 2 focus points.",
          } as ApiResponse,
          { status: 400 }
        );
      }
    } else if (selectedAction === "HEROIC_STRIKE") {
      if (partyMember.focus_points < 3) {
        return NextResponse.json(
          {
            success: false,
            error: "Not enough focus! Heroic Strike requires 3 focus points.",
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

    // Get active monster for the party with battle modifiers
    const activeMonster = await prisma.party_monsters.findFirst({
      where: {
        party_id: partyMember.party_id,
        is_active: true,
      },
      include: {
        monsters: true,
        battle_modifiers: true,
      },
    });

    // Calculate battle modifier effects
    const battleModifiers: BattleModifier[] = activeMonster
      ? activeMonster.battle_modifiers.map((dbMod) => {
          const modifierDef = BATTLE_MODIFIERS[dbMod.modifier_type];
          return modifierDef;
        })
      : [];

    const combatMods = calculateCombatModifiers(battleModifiers);

    console.log(
      "[Battle Modifiers] Active modifiers:",
      battleModifiers.map((m) => `${m.icon} ${m.name}`).join(", ")
    );

    // Check for active welcome back bonus
    const activeWelcomeBackBonus =
      partyMember.welcome_back_bonuses && partyMember.welcome_back_bonuses.length > 0
        ? partyMember.welcome_back_bonuses[0]
        : null;

    // Calculate attack bonuses (with battle modifier bonuses)
    const bonuses = calculateAttackBonuses({
      goalsMet,
      currentStreak: newStreak,
      currentHp: partyMember.current_hp,
      maxHp: partyMember.max_hp + combatMods.maxHpModifier, // Apply max HP modifier
      checkedInCount: todayCheckIns,
    });

    // Add battle modifier attack bonus
    bonuses.totalBonus += combatMods.attackBonusModifier;

    // Multiple attacks system: one attack per goal met (minimum 1)
    const numAttacks = Math.max(1, goalsMet);

    let focusEarned = 0;
    let damageMultiplier = 1.0;
    let autoHit = false;
    let healingTarget: string | null = null;
    let healingAmount = 0;

    // Apply combat action modifiers
    switch (selectedAction) {
      case "ATTACK":
        // Standard attack - free (no focus cost)
        focusEarned = 0;
        break;

      case "DEFEND":
        // Deal 50% damage, costs 1 focus, provides defense bonus (handled later)
        damageMultiplier = 0.5;
        focusEarned = -1;
        break;

      case "SUPPORT":
        // Deal 50% damage, heal a teammate, costs 2 focus
        damageMultiplier = 0.5;
        focusEarned = -2;

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
        // Auto-hit, double damage, costs 3 focus
        autoHit = true;
        damageMultiplier = 2.0;
        focusEarned = -3;
        break;
    }

    // Use active monster's AC or default to 12
    const monsterAC = activeMonster?.monsters.armor_class || 12;

    // Roll multiple attacks (one per goal met)
    const attacks: Array<{ hit: boolean; damage: number; roll: number; bonus: number }> = [];
    let totalDamage = 0;
    let buffWasUsed = false;

    for (let i = 0; i < numAttacks; i++) {
      const baseRoll = rollD20();

      // Apply buff to attack roll (MOTIVATED = +2, FOCUSED = advantage)
      // Only apply buff to first attack
      const rollWithBuff = i === 0 && activeBuff
        ? applyBuffToAttackRoll(baseRoll, activeBuff)
        : { roll: baseRoll, usedBuff: false };

      if (rollWithBuff.usedBuff) {
        buffWasUsed = true;
      }

      let baseDamage = rollBaseDamage();

      // Apply welcome back catch-up damage bonus (+5 damage per attack)
      if (activeWelcomeBackBonus) {
        baseDamage += 5;
      }

      // Apply battle modifier damage bonus
      baseDamage += combatMods.damageBonus;

      // Apply buff to damage (ENERGIZED = +3)
      // Only apply buff to first attack
      const damageWithBuff = i === 0 && activeBuff
        ? applyBuffToDamage(baseDamage, activeBuff)
        : { damage: baseDamage, usedBuff: false };

      if (damageWithBuff.usedBuff) {
        buffWasUsed = true;
      }

      // Each attack gets +1 modifier plus existing bonuses
      const attackBonus = bonuses.totalBonus + 1;

      let attackResult;
      if (autoHit) {
        // Heroic Strike always hits
        attackResult = {
          hit: true,
          damage: Math.floor(damageWithBuff.damage * damageMultiplier),
          roll: rollWithBuff.roll,
          bonus: attackBonus,
        };
      } else {
        const damageCalc = calculateDamage(
          rollWithBuff.roll,
          attackBonus,
          Math.floor(damageWithBuff.damage * damageMultiplier),
          monsterAC
        );
        attackResult = {
          hit: damageCalc.hit,
          damage: damageCalc.damage,
          roll: rollWithBuff.roll,
          bonus: attackBonus,
        };
      }

      attacks.push(attackResult);
      totalDamage += attackResult.damage;
    }

    // Apply battle modifier damage multiplier (ENRAGED)
    if (combatMods.damageMultiplier !== 1.0) {
      totalDamage = Math.floor(totalDamage * combatMods.damageMultiplier);
    }

    // Combined result for backward compatibility
    const result = {
      hit: attacks.some(a => a.hit),
      damage: totalDamage,
      attacks: attacks,
    };

    // Count recent encouragements received (last 7 days, for defense bonus)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEncouragementsCount = await prisma.encouragements.count({
      where: {
        to_party_member_id: partyMember.id,
        created_at: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Calculate new defense (streak + encouragements + buff)
    const baseDefense = calculateDefense(newStreak, recentEncouragementsCount);
    const newDefense = applyBuffToDefense(baseDefense, activeBuff);

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

      // Apply battle modifier counterattack chance modifier
      counterattackChance += combatMods.counterattackChanceModifier;

      wasCounterattacked = rollCounterattack(counterattackChance, newDefense);
      if (wasCounterattacked) {
        let monsterDamage = calculateCounterattackDamage(
          activeMonster.monsters.base_damage
        );

        // Apply battle modifier monster damage modifier
        monsterDamage += combatMods.monsterDamageModifier;

        // DEFEND action also reduces damage taken by 50%
        if (selectedAction === "DEFEND") {
          monsterDamage = Math.floor(monsterDamage * 0.5);
        }

        counterattackDamage = Math.max(1, monsterDamage); // Minimum 1 damage
      }
    }

    // Calculate XP earned and new level (before transaction)
    const xpEarned = calculateCheckInXP(goalsMet);
    const oldXP = partyMember.xp || 0;
    const newXP = oldXP + xpEarned;
    const newLevel = calculateLevelFromXP(newXP);
    const levelUpInfo = didLevelUp(oldXP, newXP);
    const skillPointsEarnedFromLevelUp = calculateSkillPointsEarned(levelUpInfo.oldLevel, levelUpInfo.newLevel);
    const totalSkillPoints = partyMember.skill_points + skillPointsEarnedFromLevelUp;

    // Create check-in with transaction
    let milestoneCrossed: 75 | 50 | 25 | null = null;
    let monsterWasDefeated = false;
    let victoryRewardId: string | null = null;
    const checkInResult = await prisma.$transaction(async (tx) => {
      // Create the check-in
      const checkIn = await tx.check_ins.create({
        data: {
          id: crypto.randomUUID(),
          party_member_id: partyMember.id,
          party_id: partyMember.party_id,
          check_in_date: today,
          goals_met: goalsMet,
          is_rest_day: goalCheckIns.every((g) => g.isRestDay),
          attack_roll: attacks[0].roll, // First attack roll for compatibility
          attack_bonus: bonuses.totalBonus + 1, // Includes the +1 per attack modifier
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
          id: crypto.randomUUID(),
          check_in_id: checkIn.id,
          goal_id: gr.goalId,
          actual_value: gr.actualValue,
          target_value: gr.targetValue,
          was_met: gr.wasMet,
        })),
      });

      // Calculate new focus points with base recovery and cap
      // Base recovery: +2 for checking in, +1 per goal met
      const baseFocusRecovery = 2 + goalsMet;
      let newFocus = partyMember.focus_points - focusPenalty + baseFocusRecovery + focusEarned;

      // Cap focus at 10 (prevents hoarding)
      newFocus = Math.min(10, Math.max(0, newFocus));

      // Calculate skill points earned if leveled up
      const skillPointsEarned = calculateSkillPointsEarned(levelUpInfo.oldLevel, levelUpInfo.newLevel);
      const newSkillPoints = partyMember.skill_points + skillPointsEarned;

      // Update party member stats and clear buff (consumed after use)
      const newHp = Math.max(0, partyMember.current_hp - counterattackDamage);
      await tx.party_members.update({
        where: { id: partyMember.id },
        data: {
          current_streak: newStreak,
          current_defense: newDefense,
          current_hp: newHp,
          focus_points: newFocus,
          xp: newXP,
          level: newLevel,
          skill_points: newSkillPoints,
          // Clear buff after use (one-time consumable)
          active_buff_type: null,
          active_buff_value: null,
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

      // Update monster HP if damage was dealt (hit or miss, effort counts!)
      if (activeMonster && result.damage > 0) {
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

    // Calculate new focus for response (same logic as in transaction)
    const baseFocusRecovery = 2 + goalsMet;
    const calculatedNewFocus = Math.min(10, Math.max(0, partyMember.focus_points - focusPenalty + baseFocusRecovery + focusEarned));

    // Build combat action result message
    let actionMessage = "";

    // Build attack summary for multiple attacks
    const attackSummary = numAttacks > 1
      ? `${numAttacks} attacks! ${attacks.map(a => a.damage).join('+')} = ${result.damage} total damage`
      : `${result.damage} damage`;

    if (selectedAction === "ATTACK") {
      if (numAttacks > 1) {
        // Multiple attacks messaging
        const hits = attacks.filter(a => a.hit).length;
        if (hits === numAttacks) {
          actionMessage = wasCounterattacked
            ? `All ${numAttacks} attacks hit! ${attackSummary} but the monster counterattacked for ${counterattackDamage} damage!`
            : `All ${numAttacks} attacks hit! ${attackSummary}!`;
        } else if (hits > 0) {
          actionMessage = wasCounterattacked
            ? `${hits}/${numAttacks} attacks hit! ${attackSummary} but the monster counterattacked for ${counterattackDamage} damage!`
            : `${hits}/${numAttacks} attacks hit! ${attackSummary}!`;
        } else {
          actionMessage = `All ${numAttacks} attacks missed! But your effort counts - ${attackSummary}!`;
        }
      } else {
        // Single attack messaging
        actionMessage = result.hit
          ? wasCounterattacked
            ? `Hit! You dealt ${result.damage} damage but the monster counterattacked for ${counterattackDamage} damage!`
            : `Hit! You dealt ${result.damage} damage!`
          : `Miss! But your effort counts - you still dealt ${result.damage} base damage!`;
      }
    } else if (selectedAction === "DEFEND") {
      const hitInfo = numAttacks > 1 ? attackSummary : `${result.damage} damage`;
      actionMessage = result.hit
        ? wasCounterattacked
          ? `Defensive Strike! You dealt ${hitInfo} and took only ${counterattackDamage} damage. Your party gained +5 defense!`
          : `Defensive Strike! You dealt ${hitInfo} and your party gained +5 defense!`
        : `Defensive stance! You dealt ${hitInfo} and your party gained +5 defense!`;
    } else if (selectedAction === "SUPPORT") {
      const healMessage = healingTarget
        ? ` You healed a teammate for ${healingAmount} HP!`
        : ` No injured teammates to heal.`;
      const hitInfo = numAttacks > 1 ? attackSummary : `${result.damage} damage`;
      actionMessage = result.hit
        ? `Supporting Attack! You dealt ${hitInfo}.${healMessage}`
        : `Supporting effort! You dealt ${hitInfo}.${healMessage}`;
    } else if (selectedAction === "HEROIC_STRIKE") {
      const hitInfo = numAttacks > 1 ? attackSummary : `${result.damage} damage`;
      actionMessage = `HEROIC STRIKE! You unleashed devastating power for ${hitInfo}!`;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          checkIn: checkInResult,
          attackResult: {
            attacks: attacks, // Individual attack details (roll, damage, hit, bonus)
            numAttacks: numAttacks,
            bonuses: bonuses,
            totalDamage: result.damage,
            hit: result.hit,
            wasCounterattacked,
            counterattackDamage,
          },
          combatAction: {
            action: selectedAction,
            focusChange: focusEarned,
            baseFocusRecovery: baseFocusRecovery,
            focusCost: Math.abs(Math.min(0, focusEarned)),
            oldFocusTotal: partyMember.focus_points,
            newFocusTotal: calculatedNewFocus,
            healingTarget: healingTarget,
            healingAmount: healingAmount,
            defenseBonus: selectedAction === "DEFEND" ? 5 : 0,
          },
          buff: activeBuff
            ? {
                type: activeBuff,
                wasUsed: buffWasUsed,
                notification: buffWasUsed
                  ? `${activeBuff === "INSPIRED" ? "🛡️" : activeBuff === "MOTIVATED" ? "⚡" : activeBuff === "ENERGIZED" ? "💥" : "🎯"} Your ${activeBuff.toLowerCase()} buff was consumed!`
                  : null,
              }
            : null,
          monster: activeMonster
            ? {
                name: activeMonster.monsters.name,
                currentHp: activeMonster.monsters.current_hp - result.damage,
                maxHp: activeMonster.monsters.max_hp,
              }
            : null,
          monsterDefeated: activeMonster
            ? activeMonster.monsters.current_hp - result.damage <= 0
            : false,
          victoryRewardId: victoryRewardId,
          milestoneCrossed: milestoneCrossed,
          streakUpdated: newStreak,
          defenseUpdated: newDefense,
          progression: {
            xpEarned: xpEarned,
            totalXP: newXP,
            level: newLevel,
            skillPoints: totalSkillPoints,
            leveledUp: levelUpInfo.leveledUp,
            oldLevel: levelUpInfo.oldLevel,
            newLevel: levelUpInfo.newLevel,
          },
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
