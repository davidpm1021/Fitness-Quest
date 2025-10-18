import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface GoalResult {
  goalId: string;
  goalName: string;
  actualValue: number | null;
  isRestDay: boolean;
  goalMet: boolean;
  action?: "ATTACK" | "DEFEND" | "SUPPORT" | "HEROIC_STRIKE";
  d20Roll?: number;
  monsterAttackDamage?: number;
  counterattackDamage?: number;
}

// POST /api/check-ins/modal-flow - Handle new modal-based check-in flow
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const body = await request.json();
    const { goalResults }: { goalResults: GoalResult[] } = body;

    // Get party member data
    const partyMember = await prisma.party_members.findFirst({
      where: { user_id: user.userId },
      include: {
        parties: {
          include: {
            party_monsters: {
              where: { is_active: true },
              include: {
                monsters: true,
              },
            },
          },
        },
      },
    });

    if (!partyMember || !partyMember.parties) {
      return NextResponse.json(
        {
          success: false,
          error: "No active party found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    const party = partyMember.parties;
    const activeMonster = party.party_monsters[0];

    if (!activeMonster) {
      return NextResponse.json(
        {
          success: false,
          error: "No active monster found",
        } as ApiResponse,
        { status: 404 }
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
    });

    if (existingCheckIn) {
      return NextResponse.json(
        {
          success: false,
          error: "You've already completed your check-in for today! Your party appreciates your dedication. Come back tomorrow to continue the quest.",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const monster = activeMonster.monsters;

    // Calculate bonuses based on total goals met
    const goalsMetCount = goalResults.filter(r => r.goalMet).length;
    const goalBonus = goalsMetCount;
    const streakBonus = partyMember.current_streak >= 3 ? 2 : 0;
    const totalBonus = goalBonus + streakBonus;

    // Calculate total focus changes
    const oldFocus = partyMember.focus_points || 0;
    let focusChange = 0;
    let totalDefenseBonus = 0;

    // Helper function to calculate monster damage
    const calculateMonsterDamage = (): number => {
      const diceCount = monster.damage_dice_count || 2;
      const diceSides = monster.damage_dice_sides || 6;
      const damageBonus = monster.damage_bonus || 0;

      let totalDamage = 0;
      for (let i = 0; i < diceCount; i++) {
        totalDamage += Math.floor(Math.random() * diceSides) + 1;
      }
      return totalDamage + damageBonus;
    };

    // Process each goal result
    const updatedResults = goalResults.map((result) => {
      if (result.goalMet && result.d20Roll !== undefined && result.action) {
        // Apply bonus to roll
        const finalRoll = result.d20Roll + totalBonus;
        const hit = finalRoll >= (monster.armor_class || 10);

        // Calculate damage if hit
        let damageDealt = 0;
        let counterattackDamage = 0;

        if (hit) {
          const baseDamage = Math.floor(Math.random() * 3) + 3; // 3-5 base damage

          if (result.action === "HEROIC_STRIKE") {
            damageDealt = (baseDamage + totalBonus) * 2; // Double damage - always hits, no counterattack
          } else if (result.action === "DEFEND" || result.action === "SUPPORT") {
            damageDealt = Math.floor((baseDamage + totalBonus) * 0.5); // 50% damage
          } else {
            damageDealt = baseDamage + totalBonus;
          }
        } else if (result.action !== "HEROIC_STRIKE") {
          // Missed attack (except heroic strike which auto-hits) - potential counterattack
          // Counterattack chance based on defense (higher defense = less chance)
          const counterattackChance = Math.max(0, 100 - partyMember.current_defense);
          const roll = Math.random() * 100;

          if (roll < counterattackChance) {
            counterattackDamage = calculateMonsterDamage();
          }
        }

        // Track focus changes
        if (result.action === "DEFEND") {
          focusChange += 1;
          totalDefenseBonus += 5;
        } else if (result.action === "ATTACK") {
          focusChange -= 1;
        } else if (result.action === "SUPPORT") {
          focusChange -= 2;
        } else if (result.action === "HEROIC_STRIKE") {
          focusChange -= 3;
        }

        return {
          ...result,
          bonusApplied: totalBonus,
          finalRoll,
          hit,
          damageDealt,
          counterattackDamage,
        };
      } else if (!result.goalMet) {
        // Failed goal - monster attacks automatically
        const monsterAttackDamage = calculateMonsterDamage();
        return {
          ...result,
          monsterAttackDamage,
        };
      }

      return result;
    });

    // Calculate totals
    const totalDamageDealt = updatedResults.reduce((sum, r) => sum + (r.damageDealt || 0), 0);
    const totalDamageTaken = updatedResults.reduce((sum, r) => sum + (r.monsterAttackDamage || 0) + (r.counterattackDamage || 0), 0);

    // Update monster HP (HP is stored in the monsters table, not party_monsters)
    const oldMonsterHp = monster.current_hp || monster.max_hp;
    const newMonsterHp = Math.max(0, oldMonsterHp - totalDamageDealt);
    const monsterDefeated = newMonsterHp === 0;

    await prisma.monsters.update({
      where: { id: monster.id },
      data: { current_hp: newMonsterHp },
    });

    // Update party member
    const newHp = Math.max(0, partyMember.current_hp - totalDamageTaken);
    const newFocus = Math.min(10, Math.max(0, oldFocus + focusChange));
    const newDefense = Math.min(50, partyMember.current_defense + totalDefenseBonus);
    const newStreak = partyMember.current_streak + 1;

    // Calculate XP
    const xpEarned = goalsMetCount * 2 + totalDamageDealt;
    const newXP = (partyMember.xp || 0) + xpEarned;
    const currentLevel = partyMember.level || 1;
    const xpForNextLevel = currentLevel * 100;
    const leveledUp = newXP >= xpForNextLevel;
    const newLevel = leveledUp ? currentLevel + 1 : currentLevel;
    const newSkillPoints = leveledUp ? (partyMember.skill_points || 0) + 1 : (partyMember.skill_points || 0);

    await prisma.party_members.update({
      where: { id: partyMember.id },
      data: {
        current_hp: newHp,
        focus_points: newFocus,
        current_defense: newDefense,
        current_streak: newStreak,
        xp: newXP,
        level: newLevel,
        skill_points: newSkillPoints,
      },
    });

    // Save check-in records (parent first, then children)
    const checkInDate = new Date();
    checkInDate.setHours(0, 0, 0, 0);

    // Create parent check_ins record
    const checkIn = await prisma.check_ins.create({
      data: {
        id: crypto.randomUUID(),
        party_member_id: partyMember.id,
        party_id: party.id,
        check_in_date: checkInDate,
        goals_met: goalsMetCount,
        is_rest_day: goalResults.every(r => r.isRestDay),
        attack_roll: 0, // Modal flow doesn't use single roll
        attack_bonus: totalBonus,
        damage_dealt: totalDamageDealt,
        was_hit_by_monster: totalDamageTaken > 0,
        damage_taken: totalDamageTaken,
        combat_action: "ATTACK", // Default, modal flow uses per-goal actions
        focus_earned: focusChange,
      },
    });

    // Create child goal_check_ins records linked to parent
    await prisma.goal_check_ins.createMany({
      data: goalResults.map((result) => ({
        id: crypto.randomUUID(),
        check_in_id: checkIn.id, // Link to parent check-in
        goal_id: result.goalId,
        actual_value: result.actualValue,
        target_value: null, // Could be added if needed
        was_met: result.goalMet,
      })),
    });

    // Check for milestone
    let milestoneCrossed: 75 | 50 | 25 | null = null;
    const percentageRemaining = (newMonsterHp / monster.max_hp) * 100;
    const oldPercentage = (oldMonsterHp / monster.max_hp) * 100;
    if (percentageRemaining <= 25 && oldPercentage > 25) {
      milestoneCrossed = 25;
    } else if (percentageRemaining <= 50 && oldPercentage > 50) {
      milestoneCrossed = 50;
    } else if (percentageRemaining <= 75 && oldPercentage > 75) {
      milestoneCrossed = 75;
    }

    return NextResponse.json({
      success: true,
      data: {
        goalResults: updatedResults,
        totalDamageDealt,
        totalDamageTaken,
        monsterDefeated,
        monster: {
          name: monster.name,
          currentHp: newMonsterHp,
          maxHp: monster.max_hp,
        },
        milestoneCrossed,
        progression: {
          xpEarned,
          totalXP: newXP,
          level: newLevel,
          skillPoints: newSkillPoints,
          leveledUp,
          oldLevel: currentLevel,
          newLevel: newLevel,
        },
        focusData: {
          oldFocus,
          newFocus,
          change: focusChange,
        },
        defenseUpdated: newDefense,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Error processing modal check-in:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process check-in",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
