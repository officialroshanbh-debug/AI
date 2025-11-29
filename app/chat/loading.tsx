'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function ChatLoading() {
  return (
    <div className="flex h-screen">
      {/* Sidebar Skeleton */}
      <div className="hidden w-80 border-r border-border bg-muted/20 lg:block">
        <div className="space-y-4 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass h-24 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>

      {/* Chat Skeleton */}
      <div className="flex flex-1 flex-col">
        {/* Header Skeleton */}
        <div className="glass border-b border-border/40 p-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>

        {/* Messages Skeleton */}
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="h-8 w-8 text-primary" />
          </motion.div>
        </div>

        {/* Input Skeleton */}
        <div className="border-t border-border/40 p-4">
          <div className="glass h-12 animate-pulse rounded-xl" />
        </div>
      </div>
    </div>
  );
}