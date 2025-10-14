// lib/skills.ts
// Skill tree utilities: unlocking, skill points, and skill effects

import { prisma } from '@/lib/prisma';

/**
 * Calculate skill points earned per level
 * Players earn 1 skill point per level
 */
export function calculateSkillPointsForLevel(level: number): number {
  return level; // 1 skill point per level, total = level
}

/**
 * Calculate skill points to award when leveling up
 */
export function getSkillPointsEarned(oldLevel: number, newLevel: number): number {
  return Math.max(0, newLevel - oldLevel); // 1 point per level gained
}

/**
 * Check if player can unlock a skill
 */
export async function canUnlockSkill(
  partyMemberId: string,
  skillId: string
): Promise<{ canUnlock: boolean; reason?: string }> {
  // Get party member data
  const partyMember = await prisma.party_members.findUnique({
    where: { id: partyMemberId },
    select: {
      level: true,
      skill_points: true,
    },
  });

  if (!partyMember) {
    return { canUnlock: false, reason: 'Party member not found' };
  }

  // Get skill data
  const skill = await prisma.skills.findUnique({
    where: { id: skillId },
    select: {
      required_level: true,
      prerequisite_skill_id: true,
    },
  });

  if (!skill) {
    return { canUnlock: false, reason: 'Skill not found' };
  }

  // Check if already unlocked
  const existingUnlock = await prisma.party_member_skills.findUnique({
    where: {
      party_member_id_skill_id: {
        party_member_id: partyMemberId,
        skill_id: skillId,
      },
    },
  });

  if (existingUnlock) {
    return { canUnlock: false, reason: 'Skill already unlocked' };
  }

  // Check level requirement
  if (partyMember.level < skill.required_level) {
    return {
      canUnlock: false,
      reason: `Requires level ${skill.required_level} (current: ${partyMember.level})`,
    };
  }

  // Check skill points
  if (partyMember.skill_points < 1) {
    return { canUnlock: false, reason: 'Not enough skill points' };
  }

  // Check prerequisite skill
  if (skill.prerequisite_skill_id) {
    const hasPrerequisite = await prisma.party_member_skills.findUnique({
      where: {
        party_member_id_skill_id: {
          party_member_id: partyMemberId,
          skill_id: skill.prerequisite_skill_id,
        },
      },
    });

    if (!hasPrerequisite) {
      return { canUnlock: false, reason: 'Prerequisite skill not unlocked' };
    }
  }

  return { canUnlock: true };
}

/**
 * Unlock a skill for a party member
 */
export async function unlockSkill(
  partyMemberId: string,
  skillId: string
): Promise<{ success: boolean; error?: string }> {
  // Check if can unlock
  const canUnlock = await canUnlockSkill(partyMemberId, skillId);
  if (!canUnlock.canUnlock) {
    return { success: false, error: canUnlock.reason };
  }

  try {
    // Unlock skill and deduct skill point in a transaction
    await prisma.$transaction([
      prisma.party_member_skills.create({
        data: {
          id: crypto.randomUUID(),
          party_member_id: partyMemberId,
          skill_id: skillId,
        },
      }),
      prisma.party_members.update({
        where: { id: partyMemberId },
        data: {
          skill_points: {
            decrement: 1,
          },
        },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error unlocking skill:', error);
    return { success: false, error: 'Failed to unlock skill' };
  }
}

/**
 * Get all unlocked skills for a party member
 */
export async function getUnlockedSkills(partyMemberId: string) {
  const unlockedSkills = await prisma.party_member_skills.findMany({
    where: { party_member_id: partyMemberId },
    include: {
      skills: {
        include: {
          skill_trees: true,
        },
      },
    },
    orderBy: {
      unlocked_at: 'asc',
    },
  });

  return unlockedSkills.map((unlock) => ({
    id: unlock.skills.id,
    name: unlock.skills.name,
    description: unlock.skills.description,
    skillType: unlock.skills.skill_type,
    effectType: unlock.skills.effect_type,
    effectValue: unlock.skills.effect_value,
    tier: unlock.skills.tier,
    unlockedAt: unlock.unlocked_at,
    skillTree: {
      id: unlock.skills.skill_trees.id,
      name: unlock.skills.skill_trees.name,
      icon: unlock.skills.skill_trees.icon,
      color: unlock.skills.skill_trees.color,
    },
  }));
}

/**
 * Get all skill trees with their skills
 */
export async function getAllSkillTrees() {
  const skillTrees = await prisma.skill_trees.findMany({
    include: {
      skills: {
        orderBy: [{ tier: 'asc' }, { position: 'asc' }],
      },
    },
    orderBy: {
      sort_order: 'asc',
    },
  });

  return skillTrees.map((tree) => ({
    id: tree.id,
    name: tree.name,
    description: tree.description,
    icon: tree.icon,
    color: tree.color,
    skills: tree.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      tier: skill.tier,
      position: skill.position,
      skillType: skill.skill_type,
      effectType: skill.effect_type,
      effectValue: skill.effect_value,
      prerequisiteSkillId: skill.prerequisite_skill_id,
      requiredLevel: skill.required_level,
    })),
  }));
}

/**
 * Calculate total skill effects for a party member
 * This aggregates all unlocked passive skills
 */
export async function calculateSkillEffects(partyMemberId: string) {
  const unlockedSkills = await prisma.party_member_skills.findMany({
    where: { party_member_id: partyMemberId },
    include: {
      skills: {
        select: {
          skill_type: true,
          effect_type: true,
          effect_value: true,
        },
      },
    },
  });

  const effects = {
    damageBoost: 0,
    hpBoost: 0,
    maxHpBoost: 0,
    defenseBoost: 0,
    focusRegen: 0,
    focusMaxBoost: 0,
    healingBoost: 0,
    counterattackReduction: 0,
    criticalChance: 0,
    streakProtection: false,
    teamDamageBoost: 0,
    teamDefenseBoost: 0,
    xpBoost: 0,
  };

  unlockedSkills.forEach((unlock) => {
    const skill = unlock.skills;
    // Only apply passive and modifier skills automatically
    if (skill.skill_type === 'PASSIVE' || skill.skill_type === 'MODIFIER') {
      switch (skill.effect_type) {
        case 'DAMAGE_BOOST':
          effects.damageBoost += skill.effect_value;
          break;
        case 'HP_BOOST':
          effects.hpBoost += skill.effect_value;
          break;
        case 'MAX_HP_BOOST':
          effects.maxHpBoost += skill.effect_value;
          break;
        case 'DEFENSE_BOOST':
          effects.defenseBoost += skill.effect_value;
          break;
        case 'FOCUS_REGEN':
          effects.focusRegen += skill.effect_value;
          break;
        case 'FOCUS_MAX_BOOST':
          effects.focusMaxBoost += skill.effect_value;
          break;
        case 'HEALING_BOOST':
          effects.healingBoost += skill.effect_value;
          break;
        case 'COUNTERATTACK_REDUCTION':
          effects.counterattackReduction += skill.effect_value;
          break;
        case 'CRITICAL_CHANCE':
          effects.criticalChance += skill.effect_value;
          break;
        case 'STREAK_PROTECTION':
          effects.streakProtection = true;
          break;
        case 'TEAM_DAMAGE_BOOST':
          effects.teamDamageBoost += skill.effect_value;
          break;
        case 'TEAM_DEFENSE_BOOST':
          effects.teamDefenseBoost += skill.effect_value;
          break;
        case 'XP_BOOST':
          effects.xpBoost += skill.effect_value;
          break;
      }
    }
  });

  return effects;
}
