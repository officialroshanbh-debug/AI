'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { ChatSidebar } from './chat-sidebar';
import type { ChatSummary } from '@/app/actions/chat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatSidebarMobileProps {
  chats: ChatSummary[];
  currentChatId?: string;
}

export function ChatSidebarMobile({ chats, currentChatId }: ChatSidebarMobileProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Toggle button (mobile only) */}
      <div className="md:hidden fixed bottom-4 left-4 z-40">
        <Button
          size="icon"
          variant="outline"
          className={cn(
            'h-10 w-10 rounded-full shadow-lg glass border border-border/60 bg-background/80',
            'backdrop-blur-md'
          )}
          onClick={() => setOpen(true)}
          aria-label="Open chat history"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </Button>
      </div>

      {/* Drawer overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-80 max-w-[80vw] md:hidden shadow-2xl border-r border-border/60 bg-background/95 backdrop-blur-xl"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-3 py-3 border-b">
                  <span className="text-sm font-semibold">Chat History</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setOpen(false)}
                    aria-label="Close chat history"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatSidebar chats={chats} currentChatId={currentChatId} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}


