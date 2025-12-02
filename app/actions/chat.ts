'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { Message as DbMessage } from '@prisma/client';
import type { ModelId } from '@/types/ai-models';

type ChatRole = 'user' | 'assistant' | 'system';

export interface SaveMessageParams {
  chatId: string;
  content: string;
  role: ChatRole;
  modelId?: ModelId;
}

export interface ChatSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
}

async function requireUser() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | null)?.id;

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return userId;
}

export async function saveMessage(params: SaveMessageParams): Promise<DbMessage> {
  const userId = await requireUser();
  const { chatId, content, role, modelId } = params;

  // Ensure the chat belongs to the current user
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId,
    },
  });

  if (!chat) {
    throw new Error('Chat not found');
  }

  const message = await prisma.message.create({
    data: {
      chatId,
      role,
      content,
      modelId: modelId ?? chat.modelId,
    },
  });

  // Touch updatedAt on chat
  await prisma.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });

  return message;
}

export async function getChats(): Promise<ChatSummary[]> {
  const userId = await requireUser();

  const chats = await prisma.chat.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return chats;
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const userId = await requireUser();

  // Ensure the chat belongs to the current user
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId,
    },
    select: { id: true },
  });

  if (!chat) {
    throw new Error('Chat not found');
  }

  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  return messages as ChatMessage[];
}

export async function createChat(initialTitle?: string, modelId?: ModelId): Promise<ChatSummary> {
  const userId = await requireUser();

  const chat = await prisma.chat.create({
    data: {
      userId,
      title: initialTitle?.trim() || 'New Chat',
      modelId: modelId ?? 'gpt-4.1',
    },
  });

  return {
    id: chat.id,
    title: chat.title,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  };
}

export async function deleteChat(chatId: string): Promise<void> {
  const userId = await requireUser();

  // Ensure the chat belongs to the current user
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId,
    },
    select: { id: true },
  });

  if (!chat) {
    throw new Error('Chat not found');
  }

  await prisma.chat.delete({
    where: { id: chatId },
  });
}

// Optional: simple title generation from first message content
export async function generateChatTitle(message: string): Promise<string> {
  const fallback = message.trim().split('\n')[0].slice(0, 60);
  if (!fallback) return 'New Chat';
  return fallback.endsWith('…') ? fallback : `${fallback}${fallback.length === 60 ? '…' : ''}`;
}


