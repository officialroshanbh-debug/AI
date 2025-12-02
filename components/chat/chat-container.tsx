'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentModel, setCurrentModel] = useState<ModelId>(initialModel);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { location } = useLocation();

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
      setMessages([]);
    }
  };

  const handleRegenerate = async () => {
    if (messages.length === 0 || isStreaming) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant') {
      // Remove the last assistant message and regenerate
      const newMessages = messages.slice(0, -1);
      setMessages(newMessages);

      // Find the last user message content to resend
      const lastUserMessage = newMessages[newMessages.length - 1];
      if (lastUserMessage && lastUserMessage.role === 'user') {
        setIsStreaming(true);
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              messages: newMessages,
              modelId: currentModel,
              chatId,
            }),
          });

          if (!response.body) throw new Error('No response body');

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          const assistantMessage: Message = { role: 'assistant', content: '' };

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
                } catch {
                  // ignore invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Error regenerating message:', error);
          setMessages([
            ...newMessages,
            { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
          ]);
        } finally {
          setIsStreaming(false);
        }
      }
    }
  };

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
        credentials: 'include', // Ensure cookies are sent with the request
        body: JSON.stringify({
          messages: newMessages,
          modelId: currentModel,
          chatId,
          ...(location && {
            userLocation: {
              latitude: location.latitude,
              longitude: location.longitude,
              city: location.city,
              country: location.country,
            },
          }),
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const assistantMessage: Message = { role: 'assistant', content: '' };

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
            } catch {
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
                    isStreaming={isStreaming && index === messages.length - 1}
                    onRegenerate={
                      index === messages.length - 1 && message.role === 'assistant' && !isStreaming
                        ? handleRegenerate
                        : undefined
                    }
                  />
                ))}
                <div ref={messagesEndRef} aria-hidden="true" className="h-4" />
              </div>
            )}
          </div>
        </Suspense>

        <div className="shrink-0 border-t bg-background/80 backdrop-blur-sm">
          <ChatInput ref={inputRef} onSend={handleSend} disabled={isStreaming} />
        </div>
      </div>
    </div>
  );
}