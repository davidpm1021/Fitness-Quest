import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, isErrorResponse } from '@/lib/middleware';
import { getAllSkillTrees, getUnlockedSkills } from '@/lib/skills';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// GET /api/skills - Get all skill trees and user's unlocked skills
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
      select: {
        id: true,
        level: true,
        skill_points: true,
        xp: true,
      },
    });

    if (!partyMember) {
      return NextResponse.json(
        {
          success: false,
          error: 'You must be in a party to access skills',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get all skill trees with their skills
    const skillTrees = await getAllSkillTrees();

    // Get user's unlocked skills
    const unlockedSkills = await getUnlockedSkills(partyMember.id);

    // Create a set of unlocked skill IDs for easy lookup
    const unlockedSkillIds = new Set(unlockedSkills.map((s) => s.id));

    // Map skill trees to include unlock status
    const skillTreesWithStatus = skillTrees.map((tree) => ({
      ...tree,
      skills: tree.skills.map((skill) => ({
        ...skill,
        unlocked: unlockedSkillIds.has(skill.id),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        skillTrees: skillTreesWithStatus,
        unlockedSkills,
        playerStats: {
          level: partyMember.level,
          skillPoints: partyMember.skill_points,
          xp: partyMember.xp,
        },
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch skills',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
