import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isErrorResponse } from '@/lib/middleware';
import { getVictoryRewardById } from '@/lib/victoryRewards';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  try {

    const victoryId = params.id;
    const victoryData = await getVictoryRewardById(victoryId);

    if (!victoryData) {
      return NextResponse.json(
        { success: false, error: 'Victory not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: victoryData,
    });
  } catch (error) {
    console.error('Error fetching victory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch victory' },
      { status: 500 }
    );
  }
}
