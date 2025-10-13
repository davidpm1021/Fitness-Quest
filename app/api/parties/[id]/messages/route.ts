import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, isErrorResponse } from '@/lib/middleware';
import { ApiResponse } from '@/lib/types';

/**
 * GET /api/parties/[id]/messages
 * Fetch recent messages for a party
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (isErrorResponse(authResult)) {
      return authResult;
    }

    const { user } = authResult;
    const { id: partyId } = await params;

    // Verify user is a member of this party
    const partyMember = await prisma.party_members.findFirst({
      where: {
        party_id: partyId,
        user_id: user.userId,
      },
    });

    if (!partyMember) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this party' },
        { status: 403 }
      );
    }

    // Get messages (last 50)
    const messages = await prisma.party_messages.findMany({
      where: {
        party_id: partyId,
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
      orderBy: {
        created_at: 'desc',
      },
      take: 50,
    });

    // Reverse to show oldest first
    const formattedMessages = messages.reverse().map((msg) => ({
      id: msg.id,
      userId: msg.user_id,
      displayName: msg.users.character_name || msg.users.display_name,
      message: msg.message,
      messageType: msg.message_type,
      createdAt: msg.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        messages: formattedMessages,
      },
    });
  } catch (error) {
    console.error('Error fetching party messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch messages',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/parties/[id]/messages
 * Send a new message to the party
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { message, messageType = 'CHAT' } = body as {
      message: string;
      messageType?: 'CHAT' | 'ENCOURAGEMENT' | 'SYSTEM';
    };

    // Validate message
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // Verify user is a member of this party
    const partyMember = await prisma.party_members.findFirst({
      where: {
        party_id: partyId,
        user_id: user.userId,
      },
    });

    if (!partyMember) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this party' },
        { status: 403 }
      );
    }

    // Create message
    const newMessage = await prisma.party_messages.create({
      data: {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        party_id: partyId,
        user_id: user.userId,
        message: message.trim(),
        message_type: messageType,
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
    console.error('Error sending party message:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send message',
      },
      { status: 500 }
    );
  }
}
