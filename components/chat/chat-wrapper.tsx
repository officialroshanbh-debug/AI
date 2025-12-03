'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ChatWrapperProps {
    children: React.ReactNode;
    chatId?: string;
}

export function ChatWrapper({ children, chatId }: ChatWrapperProps) {
    return (
        <motion.div
            key={chatId}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.8, 0.25, 1] }}
            className="flex-1 min-w-0"
        >
            {children}
        </motion.div>
    );
}
