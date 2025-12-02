'use client';

import { useEffect } from 'react';
import { useChat as useVercelChat } from 'ai/react';
import type { Message as UiMessage } from '@/types/ai-models';
import type { ModelId } from '@/types/ai-models';
import { saveMessage } from '@/app/actions/chat';

interface UseChatStreamParams {
  chatId?: string;
  initialMessages?: UiMessage[];
  modelId: ModelId;
  userLocation?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  } | null;
}

export function useChatStream({
  chatId,
  initialMessages,
  modelId,
  userLocation,
}: UseChatStreamParams) {
  const {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    setMessages,
  } = useVercelChat({
    api: '/api/chat',
    // hydrate from existing DB messages
    initialMessages: initialMessages?.map((m) => ({
      id: Math.random().toString(36).slice(2),
      role: m.role,
      content: m.content,
    })),
    body: {
      modelId,
      chatId,
      ...(userLocation && {
        userLocation,
      }),
    },
    onFinish: async (message) => {
      if (!chatId) return;
      try {
        await saveMessage({
          chatId,
          content: message.content,
          role: message.role as 'assistant' | 'user' | 'system',
          modelId,
        });
      } catch (error) {
        console.error('Failed to persist assistant message', error);
      }
    },
  });

  // Keep UI messages in sync if initialMessages change (e.g., navigation)
  useEffect(() => {
    if (!initialMessages) return;
    setMessages(
      initialMessages.map((m) => ({
        id: Math.random().toString(36).slice(2),
        role: m.role,
        content: m.content,
      }))
    );
  }, [initialMessages, setMessages]);

  return {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
  };
}


