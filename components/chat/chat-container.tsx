'use client';

import { useState, useEffect, useRef, Suspense, FormEvent } from 'react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ModelSelector } from './model-selector';
import { ChatSkeleton } from './chat-skeleton';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Message, ModelId } from '@/types/ai-models';
import { MODEL_IDS } from '@/types/ai-models';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useLocation } from '@/hooks/use-location';
import { useChatStream } from '@/hooks/use-chat-stream';

interface ChatContainerProps {
  initialMessages?: Message[];
  initialModel?: ModelId;
  chatId?: string;
}

export function ChatContainer({
  initialMessages = [],
  initialModel = MODEL_IDS.GPT_4_1,
  chatId,
}: ChatContainerProps) {
  const [currentModel, setCurrentModel] = useState<ModelId>(initialModel);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { location } = useLocation();

  const {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
  } = useChatStream({
    chatId,
    initialMessages,
    modelId: currentModel,
    userLocation: location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city,
          country: location.country,
        }
      : null,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      metaKey: true,
      handler: () => {
        inputRef.current?.focus();
      },
      description: 'Focus input',
    },
  ]);

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      // Client-only clear; persisted messages remain but UI resets
      window.location.reload();
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (isLoading) return;
    handleSubmit(event);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)] relative w-full">
      {/* Chat Container */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full">
        <header className="border-b bg-background/80 backdrop-blur-sm px-3 py-2 md:px-4 md:py-4 sticky top-0 z-10 shrink-0">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg md:text-xl font-semibold truncate">AI Chat</h1>
            </div>
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <ModelSelector
                value={currentModel}
                onValueChange={setCurrentModel}
                disabled={isStreaming}
                aria-label="Select AI model"
              />
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearChat}
                  title="Clear chat"
                  disabled={isLoading}
                  className="h-8 w-8 md:h-10 md:w-10"
                >
                  <Trash2 className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>
          </div>
        </header>

        <Suspense fallback={<ChatSkeleton />}>
          <div
            className="flex-1 overflow-y-auto overscroll-contain pb-4"
            role="log"
            aria-label="Chat messages"
            aria-live="polite"
            aria-atomic="false"
          >
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4">
                <div className="text-center space-y-4 w-full max-w-2xl">
                  <h2 className="text-xl md:text-2xl font-semibold">Start a conversation</h2>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Choose a model and ask anything you&apos;d like to know.
                  </p>
                  <div className="text-xs text-muted-foreground mt-8 space-y-1 hidden md:block">
                    <p>Keyboard shortcuts:</p>
                    <p>⌘K - Focus input</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={`${message.role}-${index}`}
                    message={message}
                    isStreaming={isLoading && index === messages.length - 1}
                  />
                ))}
                <div ref={messagesEndRef} aria-hidden="true" className="h-4" />
              </div>
            )}
          </div>
        </Suspense>

        <div className="shrink-0 border-t bg-background/80 backdrop-blur-sm">
          <form onSubmit={handleFormSubmit}>
            <ChatInput
              ref={inputRef}
              onSend={(value) => {
                // Bridge existing ChatInput signature with useChat
                handleInputChange({
                  target: { value },
                } as React.ChangeEvent<HTMLTextAreaElement>);
                // Manually submit since ChatInput doesn't provide the event
                void handleSubmit(new Event('submit') as unknown as FormEvent<HTMLFormElement>);
              }}
              disabled={isLoading}
              value={input}
              onChange={handleInputChange}
            />
          </form>
        </div>
      </div>
    </div>
  );
}