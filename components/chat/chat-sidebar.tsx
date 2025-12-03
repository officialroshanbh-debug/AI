'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, MessageSquare } from 'lucide-react';
import type { ChatSummary } from '@/app/actions/chat';
import { deleteChat } from '@/app/actions/chat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  chats: ChatSummary[];
  currentChatId?: string;
}

type GroupLabel = 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Older';

interface GroupedChats {
  label: GroupLabel;
  items: ChatSummary[];
}

function groupChats(chats: ChatSummary[]): GroupedChats[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - 7);

  const groups: Record<GroupLabel, ChatSummary[]> = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  for (const chat of chats) {
    const updated = new Date(chat.updatedAt);
    if (updated >= startOfToday) {
      groups.Today.push(chat);
    } else if (updated >= startOfYesterday) {
      groups.Yesterday.push(chat);
    } else if (updated >= startOfWeek) {
      groups['Previous 7 Days'].push(chat);
    } else {
      groups.Older.push(chat);
    }
  }

  return (Object.entries(groups) as [GroupLabel, ChatSummary[]][])
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export function ChatSidebar({ chats, currentChatId }: ChatSidebarProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const grouped = useMemo(() => groupChats(chats), [chats]);

  const handleSelectChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleNewChat = () => {
    router.push('/chat');
    router.refresh();
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Delete this chat? This action cannot be undone.')) return;
    setIsDeleting(chatId);
    try {
      await deleteChat(chatId);
      // If the current chat was deleted, go to a fresh chat page
      if (currentChatId === chatId) {
        router.push('/chat');
      } else {
        router.refresh();
      }
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex h-full flex-col border-r bg-background/60 backdrop-blur-md glass">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-accent text-primary-foreground shadow-subtle">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Chats</span>
            <span className="text-xs text-muted-foreground">{chats.length} conversations</span>
          </div>
        </div>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 rounded-xl bg-background/60"
          onClick={handleNewChat}
          aria-label="New chat"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {grouped.length === 0 ? (
          <div className="text-xs text-muted-foreground px-2 py-4">
            No chats yet. Start a new conversation to see it here.
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label}>
              <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </div>
              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {group.items.map((chat) => {
                    const isActive = chat.id === currentChatId;
                    return (
                      <motion.button
                        key={chat.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        onClick={() => handleSelectChat(chat.id)}
                        className={cn(
                          'group flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left text-xs transition-all',
                          'hover:bg-muted/70 hover:shadow-sm',
                          isActive
                            ? 'bg-primary/10 border border-primary/40'
                            : 'border border-transparent'
                        )}
                      >
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[13px] font-medium">
                            {chat.title || 'Untitled chat'}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(chat.updatedAt).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteChat(chat.id);
                          }}
                          aria-label="Delete chat"
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors',
                            'hover:bg-destructive/10 hover:text-destructive',
                            'opacity-0 group-hover:opacity-100',
                            isDeleting === chat.id && 'opacity-100'
                          )}
                        >
                          <Trash2 className={cn('h-3.5 w-3.5', isDeleting === chat.id && 'animate-pulse')} />
                        </button>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


