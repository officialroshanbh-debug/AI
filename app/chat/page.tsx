import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { ChatContainer } from '@/components/chat/chat-container';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatSidebarMobile } from '@/components/chat/chat-sidebar-mobile';
import { ChatWrapper } from '@/components/chat/chat-wrapper';
import { getChats } from '@/app/actions/chat';
import { auth } from '@/auth';

export default async function ChatPage() {
  noStore();

  const session = await auth();
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const chats = await getChats();

  return (
    <>
      {/* Mobile drawer trigger */}
      <ChatSidebarMobile chats={chats} currentChatId={undefined} />

      <div className="flex h-[calc(100vh-3.5rem)] bg-gradient-to-br from-background via-background to-background/95">
        {/* Sidebar (desktop) */}
        <div className="hidden md:block w-72 border-r bg-background/60 backdrop-blur-md">
          <ChatSidebar chats={chats} currentChatId={undefined} />
        </div>

        {/* Main chat area - no chatId, will be created on first message */}
        <ChatWrapper chatId={undefined}>
          <ChatContainer initialMessages={[]} chatId={undefined} />
        </ChatWrapper>
      </div>
    </>
  );
}
