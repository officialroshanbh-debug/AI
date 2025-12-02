import { unstable_noStore as noStore } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { ChatContainer } from '@/components/chat/chat-container';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatSidebarMobile } from '@/components/chat/chat-sidebar-mobile';
import { ChatWrapper } from '@/components/chat/chat-wrapper';
import { getChatMessages, getChats } from '@/app/actions/chat';
import type { Message } from '@/types/ai-models';

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatIdPage({ params }: ChatPageProps) {
  noStore();
  const { id } = await params;

  if (!id) {
    redirect('/chat');
  }

  let messages: Message[] = [];

  try {
    const dbMessages = await getChatMessages(id);
    messages = dbMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })) as Message[];
  } catch {
    notFound();
  }

  const chats = await getChats();

  return (
    <>
      {/* Mobile drawer trigger */}
      <ChatSidebarMobile chats={chats} currentChatId={id} />

      <div className="flex h-[calc(100vh-3.5rem)] bg-gradient-to-br from-background via-background to-background/95">
        {/* Sidebar (desktop) */}
        <div className="hidden md:block w-72 border-r bg-background/60 backdrop-blur-md">
          <ChatSidebar chats={chats} currentChatId={id} />
        </div>

        {/* Main chat area */}
        <ChatWrapper chatId={id}>
          <ChatContainer initialMessages={messages} chatId={id} />
        </ChatWrapper>
      </div>
    </>
  );
}


