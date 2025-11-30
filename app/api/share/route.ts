/**
 * API Route for sharing chat sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ShareManager } from '@/lib/collaboration/share';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { chatId, accessLevel, expiresAt, password, allowEditing } = body;

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Verify chat belongs to user
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const shareManager = new ShareManager();
    const shareLink = await shareManager.createShareLink({
      chatId,
      accessLevel: accessLevel || 'private',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      password,
      allowEditing,
    });

    // Save to database
    const sharedChat = await prisma.sharedChat.create({
      data: {
        chatId,
        shareToken: shareLink.shareToken,
        accessLevel: shareLink.accessLevel,
        expiresAt: shareLink.expiresAt || null,
        password: password || null,
      },
    });

    const shareUrl = shareManager.getShareUrl(shareLink.shareToken, process.env.NEXT_PUBLIC_APP_URL);

    return NextResponse.json({
      shareLink: {
        ...sharedChat,
        url: shareUrl,
      },
    });
  } catch (error) {
    console.error('[Share API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (chatId) {
      const sharedChat = await prisma.sharedChat.findFirst({
        where: { chatId, chat: { userId } },
        include: { collaborators: true },
      });

      if (!sharedChat) {
        return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
      }

      return NextResponse.json({ sharedChat });
    }

    // Get all shared chats for user
    const sharedChats = await prisma.sharedChat.findMany({
      where: { chat: { userId } },
      include: { collaborators: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ sharedChats });
  } catch (error) {
    console.error('[Share API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share links' },
      { status: 500 }
    );
  }
}

