'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ModelSelector } from './model-selector';
import { NewsSidebar } from '@/components/news/news-sidebar';
import { Button } from '@/components/ui/button';
import { Newspaper, Sparkles, Zap, Code } from 'lucide-react';
import type { Message, ModelId } from '@/types/ai-models';
import { MODEL_IDS } from '@/types/ai-models';

interface ChatContainerProps {
  initialMessages?: Message[];
  initialModel?: ModelId;
  chatId?: string;
}

const SUGGESTED_PROMPTS = [
  { icon: Sparkles, text: 'Explain quantum computing in simple terms' },
  { icon: Code, text: 'Write a React component with TypeScript' },
  { icon: Zap, text: 'Best practices for Next.js 15 in 2025' },
];

export function ChatContainer({
  initialMessages = [],
  initialModel = MODEL_IDS.GPT_4_1,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentModel, setCurrentModel] = useState<ModelId>(initialModel);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showNewsSidebar, setShowNewsSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleCloseSidebar = () => setShowNewsSidebar(false);
    window.addEventListener('close-news-sidebar', handleCloseSidebar);
    return () => window.removeEventListener('close-news-sidebar', handleCloseSidebar);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSend = async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          modelId: currentModel,
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: Message = { role: 'assistant', content: '' };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsStreaming(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMessage.content += parsed.content;
                setMessages([...newMessages, assistantMessage]);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  return (
    <div className="relative flex h-screen">
      {/* Gradient Mesh Background */}
      <div className="fixed inset-0 gradient-mesh opacity-30" />

      {/* News Sidebar - Desktop */}
      <div className="relative z-10 hidden w-80 shrink-0 lg:block">
        <NewsSidebar />
      </div>

      {/* News Sidebar - Mobile (Overlay) */}
      <AnimatePresence>
        {showNewsSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setShowNewsSidebar(false)}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-full w-80 lg:hidden"
            >
              <NewsSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat Container */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Header with glassmorphism */}
        <header
          className="glass sticky top-0 z-20 border-b border-border/40 p-4 shadow-subtle backdrop-blur-xl"
          role="banner"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setShowNewsSidebar(!showNewsSidebar)}
                aria-label="Toggle news sidebar"
              >
                <Newspaper className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">
                <span className="gradient-text">Roshan AI</span>
              </h1>
            </div>
            <ModelSelector
              value={currentModel}
              onValueChange={setCurrentModel}
              disabled={isStreaming}
            />
          </div>
        </header>

        {/* Messages Area */}
        <main
          className="flex-1 overflow-y-auto scroll-smooth"
          role="main"
          aria-label="Chat messages"
          aria-live="polite"
          aria-atomic="false"
        >
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex h-full items-center justify-center p-4"
            >
              <div className="max-w-2xl space-y-8 text-center">
                <div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10"
                  >
                    <Sparkles className="h-10 w-10 text-primary" />
                  </motion.div>
                  <h2 className="mb-3 text-3xl font-bold">Start a Conversation</h2>
                  <p className="text-lg text-muted-foreground">
                    Ask me anything. I&apos;m here to help with coding, writing, analysis, and more.
                  </p>
                </div>

                {/* Suggested Prompts */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Try asking:</p>
                  <div className="grid gap-3">
                    {SUGGESTED_PROMPTS.map((prompt, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSuggestionClick(prompt.text)}
                        className="glass flex items-center gap-3 rounded-xl border border-border/50 p-4 text-left shadow-subtle transition-all hover:shadow-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <prompt.icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="flex-1 font-medium">{prompt.text}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Keyboard Shortcut Hint */}
                <div className="text-xs text-muted-foreground">
                  <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono">
                    ⌘K
                  </kbd>{' '}
                  to focus input
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-0 p-4">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    message={message}
                    isStreaming={isStreaming && index === messages.length - 1}
                  />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input Area */}
        <ChatInput
          ref={inputRef}
          onSend={handleSend}
          disabled={isStreaming}
          currentModel={currentModel}
        />
      </div>
    </div>
  );
}