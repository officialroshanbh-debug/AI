import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ChatContainer } from '@/components/chat/chat-container';
import type { Message } from '@/types/ai-models';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  if (!token) {
    redirect('/');
  }

  // Find shared chat by token
  const sharedChat = await prisma.sharedChat.findUnique({
    where: { shareToken: token },
    include: {
      chat: {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  if (!sharedChat) {
    notFound();
  }

  // Check if expired
  if (sharedChat.expiresAt && sharedChat.expiresAt < new Date()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
          <p className="text-muted-foreground">
            This shared chat link has expired.
          </p>
        </div>
      </div>
    );
  }

  // Increment view count
  await prisma.sharedChat.update({
    where: { id: sharedChat.id },
    data: { viewCount: { increment: 1 } },
  });

  // Convert DB messages to UI format
  const messages: Message[] = sharedChat.chat.messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-semibold">Shared Chat</h1>
          <p className="text-sm text-muted-foreground">
            {sharedChat.accessLevel === 'public' ? 'Public' : 'Private'} •{' '}
            {sharedChat.viewCount} views
          </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto">
        <ChatContainer initialMessages={messages} chatId={sharedChat.chatId} />
      </div>
    </div>
  );
}

