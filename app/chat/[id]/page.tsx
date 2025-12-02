import { unstable_noStore as noStore } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { ChatContainer } from '@/components/chat/chat-container';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatSidebarMobile } from '@/components/chat/chat-sidebar-mobile';
import { getChatMessages, getChats } from '@/app/actions/chat';
import type { Message } from '@/types/ai-models';
import { motion } from 'framer-motion';

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
        <motion.div
          key={id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.8, 0.25, 1] }}
          className="flex-1 min-w-0"
        >
          <ChatContainer initialMessages={messages} chatId={id} />
        </motion.div>
      </div>
    </>
  );
}


