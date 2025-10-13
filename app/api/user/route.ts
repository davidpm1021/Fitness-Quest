import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, isErrorResponse } from '@/lib/middleware';

/**
 * PATCH /api/user - Update user profile
 */
export async function PATCH(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const body = await request.json();
    const { characterName, onboardingStep, onboardingCompletedAt } = body;

    const updateData: any = {};

    if (characterName !== undefined) {
      updateData.characterName = characterName;
    }

    if (onboardingStep !== undefined) {
      updateData.onboardingStep = onboardingStep;
    }

    if (onboardingCompletedAt !== undefined) {
      updateData.onboardingCompletedAt = onboardingCompletedAt ? new Date() : null;
    }

    const updatedUser = await prisma.users.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        character_name: true,
        onboarding_step: true,
        onboarding_completed_at: true,
        timezone: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
