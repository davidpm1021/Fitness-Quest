import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, isErrorResponse } from '@/lib/middleware';
import { unlockSkill, canUnlockSkill } from '@/lib/skills';
import { cache, CacheKeys } from '@/lib/cache';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// POST /api/skills/unlock - Unlock a skill for the user
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const body = await request.json();
    const { skillId } = body as { skillId: string };

    if (!skillId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Skill ID is required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get user's party membership
    const partyMember = await prisma.party_members.findFirst({
      where: { user_id: user.userId },
      select: {
        id: true,
        party_id: true,
      },
    });

    if (!partyMember) {
      return NextResponse.json(
        {
          success: false,
          error: 'You must be in a party to unlock skills',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if can unlock
    const canUnlock = await canUnlockSkill(partyMember.id, skillId);
    if (!canUnlock.canUnlock) {
      return NextResponse.json(
        {
          success: false,
          error: canUnlock.reason || 'Cannot unlock this skill',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Unlock the skill
    const result = await unlockSkill(partyMember.id, skillId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to unlock skill',
        } as ApiResponse,
        { status: 500 }
      );
    }

    // Get the unlocked skill details
    const skill = await prisma.skills.findUnique({
      where: { id: skillId },
      include: {
        skill_trees: true,
      },
    });

    // Get updated party member stats
    const updatedPartyMember = await prisma.party_members.findUnique({
      where: { id: partyMember.id },
      select: {
        level: true,
        skill_points: true,
      },
    });

    // Invalidate party dashboard cache
    cache.delete(CacheKeys.partyDashboard(user.userId));

    return NextResponse.json(
      {
        success: true,
        data: {
          skill: {
            id: skill?.id,
            name: skill?.name,
            description: skill?.description,
            skillType: skill?.skill_type,
            effectType: skill?.effect_type,
            effectValue: skill?.effect_value,
            tier: skill?.tier,
            skillTree: {
              name: skill?.skill_trees.name,
              icon: skill?.skill_trees.icon,
              color: skill?.skill_trees.color,
            },
          },
          playerStats: {
            level: updatedPartyMember?.level,
            skillPoints: updatedPartyMember?.skill_points,
          },
        },
        message: `Successfully unlocked ${skill?.name}!`,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error unlocking skill:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to unlock skill',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
