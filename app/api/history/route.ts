import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;

    // Fetch user's chats with messages
    const chats = await prisma.chat.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Get first message as query
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100, // Limit to recent 100 chats
    });

    // Transform to history items
    const history = chats
      .filter((chat) => chat.messages.length > 0)
      .map((chat) => {
        const firstMessage = chat.messages[0];
        return {
          id: chat.id,
          chatId: chat.id,
          query: firstMessage.content.slice(0, 200),
          type: 'chat' as const,
          modelId: chat.modelId,
          timestamp: chat.createdAt,
          wordCount: firstMessage.content.split(/\s+/).length,
          isBookmarked: false, // Could add bookmark field to schema later
        };
      });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

