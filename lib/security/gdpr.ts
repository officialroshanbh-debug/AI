/**
 * GDPR Compliance Tools
 * Data export and deletion functionality
 */

import { prisma } from '@/lib/prisma';
import { ChatExporter } from '@/lib/export/formatters';

export interface UserDataExport {
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
  chats: Array<{
    id: string;
    title: string;
    modelId: string;
    createdAt: Date;
    updatedAt: Date;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      createdAt: Date;
    }>;
  }>;
  usageLogs: Array<{
    id: string;
    modelId: string | null;
    tokens: number;
    cost: number | null;
    createdAt: Date;
  }>;
  agents: Array<{
    id: string;
    name: string;
    role: string;
    createdAt: Date;
  }>;
  documents: Array<{
    id: string;
    title: string;
    type: string;
    createdAt: Date;
  }>;
  apiKeys: Array<{
    id: string;
    name: string;
    keyPrefix: string;
    createdAt: Date;
    lastUsedAt: Date | null;
  }>;
}

/**
 * Export all user data in JSON format (GDPR compliance)
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const [chats, usageLogs, agents, documents, apiKeys] = await Promise.all([
    prisma.chat.findMany({
      where: { userId },
      include: {
        messages: {
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.usageLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.agent.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.document.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
      },
    }),
    prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
      },
    }),
  ]);

  return {
    user,
    chats: chats.map((chat) => ({
      id: chat.id,
      title: chat.title,
      modelId: chat.modelId,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messages: chat.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    })),
    usageLogs: usageLogs.map((log) => ({
      id: log.id,
      modelId: log.modelId,
      tokens: log.tokens,
      cost: log.cost,
      createdAt: log.createdAt,
    })),
    agents: agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      createdAt: agent.createdAt,
    })),
    documents: documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      createdAt: doc.createdAt,
    })),
    apiKeys: apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
    })),
  };
}

/**
 * Delete all user data (GDPR right to be forgotten)
 */
export async function deleteUserData(userId: string): Promise<void> {
  // Delete all user-related data
  // Prisma cascades will handle related records
  await prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * Anonymize user data (alternative to deletion)
 */
export async function anonymizeUserData(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: 'Deleted User',
      email: `deleted-${userId}@deleted.local`,
      image: null,
    },
  });

  // Delete sensitive data but keep anonymized records
  await prisma.chat.deleteMany({ where: { userId } });
  await prisma.usageLog.deleteMany({ where: { userId } });
  await prisma.agent.deleteMany({ where: { userId } });
  await prisma.document.deleteMany({ where: { userId } });
  await prisma.apiKey.deleteMany({ where: { userId } });
}

