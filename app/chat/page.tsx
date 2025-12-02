import { redirect } from 'next/navigation';
import { createChat } from '@/app/actions/chat';
import { auth } from '@/auth';

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const chat = await createChat();
  redirect(`/chat/${chat.id}`);
}

