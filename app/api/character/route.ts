import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, isErrorResponse } from '@/lib/middleware';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// GET /api/character - Get user's character appearance
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const appearance = await prisma.characterAppearance.findUnique({
      where: { userId: user.userId },
    });

    return NextResponse.json({
      success: true,
      data: { appearance },
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching character appearance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch character appearance',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/character - Create or update character appearance
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const body = await request.json();
    const {
      bodyType,
      skinColor,
      hairStyle,
      hairColor,
      facialHair,
      outfit,
      outfitColor,
      accessoryColor,
    } = body;

    // Upsert character appearance
    const appearance = await prisma.characterAppearance.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        bodyType,
        skinColor,
        hairStyle,
        hairColor,
        facialHair,
        outfit,
        outfitColor,
        accessoryColor,
      },
      update: {
        bodyType,
        skinColor,
        hairStyle,
        hairColor,
        facialHair,
        outfit,
        outfitColor,
        accessoryColor,
      },
    });

    return NextResponse.json({
      success: true,
      data: { appearance },
      message: 'Character appearance saved successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error saving character appearance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save character appearance',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
