import { redirect } from 'next/navigation';
import { createChat } from '@/app/actions/chat';

export default async function ChatPage() {
  const chat = await createChat();
  redirect(`/chat/${chat.id}`);
}

