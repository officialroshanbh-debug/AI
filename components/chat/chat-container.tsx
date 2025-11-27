'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ModelSelector } from './model-selector';
import { NewsSidebar } from '@/components/news/news-sidebar';
import { Button } from '@/components/ui/button';
import { Newspaper, X } from 'lucide-react';
import type { Message, ModelId } from '@/types/ai-models';
import { MODEL_IDS } from '@/types/ai-models';

interface ChatContainerProps {
  initialMessages?: Message[];
  initialModel?: ModelId;
  chatId?: string;
}

export function ChatContainer({
  initialMessages = [],
  initialModel = MODEL_IDS.GPT_4_1,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentModel, setCurrentModel] = useState<ModelId>(initialModel);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showNewsSidebar, setShowNewsSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex h-screen relative">
      {/* News Sidebar - Desktop */}
      <div className="hidden lg:block w-80 shrink-0">
        <NewsSidebar />
      </div>

      {/* News Sidebar - Mobile (Overlay) */}
      {showNewsSidebar && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowNewsSidebar(false)}
          />
          <div className="fixed left-0 top-0 h-full w-80 z-50 lg:hidden">
            <NewsSidebar />
          </div>
        </>
      )}

      {/* Chat Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setShowNewsSidebar(!showNewsSidebar)}
              >
                <Newspaper className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">AI Chat</h1>
            </div>
            <ModelSelector
              value={currentModel}
              onValueChange={setCurrentModel}
              disabled={isStreaming}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold">Start a conversation</h2>
                <p className="text-muted-foreground">
                  Choose a model and ask anything you'd like to know.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  isStreaming={isStreaming && index === messages.length - 1}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}

