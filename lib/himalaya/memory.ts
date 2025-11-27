import { prisma } from '@/lib/prisma';
import type { Message } from '@/types/ai-models';

export interface MemoryEntry {
  summary: string;
  relevance: number;
  metadata?: Record<string, unknown>;
}

export async function getHimalayaMemory(
  userId: string,
  chatId: string,
  currentMessages: Message[]
): Promise<MemoryEntry[]> {
  try {
    // Get recent memories for this user
    const memories = await prisma.himalayaMemory.findMany({
      where: {
        metadata: {
          path: ['userId'],
          equals: userId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Extract the last user message for relevance scoring
    const lastUserMessage = currentMessages
      .filter((m) => m.role === 'user')
      .pop()?.content || '';

    // Simple relevance scoring based on keyword matching
    // In production, you'd use proper embedding similarity
    const scoredMemories = memories.map((memory) => {
      const summary = memory.conversationSummary.toLowerCase();
      const query = lastUserMessage.toLowerCase();
      const words = query.split(/\s+/);
      const matches = words.filter((word) => summary.includes(word)).length;
      const relevance = matches / Math.max(words.length, 1);

      return {
        summary: memory.conversationSummary,
        relevance,
        metadata: memory.metadata as Record<string, unknown> | undefined,
      };
    });

    // Return top 5 most relevant memories
    return scoredMemories
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);
  } catch (error) {
    console.error('Error fetching Himalaya memory:', error);
    return [];
  }
}

export async function storeHimalayaMemory(
  content: string,
  userId: string,
  chatId: string,
  embedding?: number[]
): Promise<void> {
  try {
    const summary = content.length > 500 ? content.slice(0, 500) + '...' : content;

    await prisma.himalayaMemory.create({
      data: {
        embedding: embedding ? JSON.stringify(embedding) : JSON.stringify([]),
        conversationSummary: summary,
        metadata: {
          userId,
          chatId,
          timestamp: new Date().toISOString(),
          contentLength: content.length,
        },
      },
    });
  } catch (error) {
    console.error('Error storing Himalaya memory:', error);
  }
}

