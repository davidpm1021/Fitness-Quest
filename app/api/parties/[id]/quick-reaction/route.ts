import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, isErrorResponse } from '@/lib/middleware';
import { ApiResponse } from '@/lib/types';

/**
 * POST /api/parties/[id]/quick-reaction
 * Send a quick reaction (emoji encouragement) to the party
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (isErrorResponse(authResult)) {
      return authResult;
    }

    const { user } = authResult;
    const { id: partyId } = await params;

    // Parse request body
    const body = await request.json();
    const { reaction } = body as { reaction: '💪' | '🔥' | '⭐' | '👏' };

    // Validate reaction
    const validReactions = ['💪', '🔥', '⭐', '👏'];
    if (!reaction || !validReactions.includes(reaction)) {
      return NextResponse.json(
        { success: false, error: 'Invalid reaction' },
        { status: 400 }
      );
    }

    // Verify user is a member of this party
    const partyMember = await prisma.party_members.findFirst({
      where: {
        party_id: partyId,
        user_id: user.userId,
      },
      include: {
        users: {
          select: {
            character_name: true,
            display_name: true,
          },
        },
      },
    });

    if (!partyMember) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this party' },
        { status: 403 }
      );
    }

    // Generate message based on reaction
    const userName = partyMember.users.character_name || partyMember.users.display_name;
    let message = '';

    switch (reaction) {
      case '💪':
        message = `${userName} sent encouragement: ${reaction} Keep pushing!`;
        break;
      case '🔥':
        message = `${userName} is hyped: ${reaction} You're on fire!`;
        break;
      case '⭐':
        message = `${userName} is impressed: ${reaction} Amazing work!`;
        break;
      case '👏':
        message = `${userName} is cheering: ${reaction} Well done!`;
        break;
    }

    // Create encouragement message
    const newMessage = await prisma.party_messages.create({
      data: {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        party_id: partyId,
        user_id: user.userId,
        message: message,
        message_type: 'ENCOURAGEMENT',
      },
      include: {
        users: {
          select: {
            id: true,
            display_name: true,
            character_name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: {
          id: newMessage.id,
          userId: newMessage.user_id,
          displayName: newMessage.users.character_name || newMessage.users.display_name,
          message: newMessage.message,
          messageType: newMessage.message_type,
          createdAt: newMessage.created_at,
        },
      },
    });
  } catch (error) {
    console.error('Error sending quick reaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send reaction',
      },
      { status: 500 }
    );
  }
}
