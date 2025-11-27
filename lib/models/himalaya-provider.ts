import { prisma } from '@/lib/prisma';
import type {
  AIModelProvider,
  Message,
  ModelCallParams,
  ModelResponse,
  ModelStreamChunk,
} from '@/types/ai-models';
import { longFormPipeline } from '@/lib/himalaya/pipeline';
import { getHimalayaMemory } from '@/lib/himalaya/memory';

const HIMALAYA_SYSTEM_PROMPT = `You are Himalaya, an advanced AI assistant with a calm, high-altitude perspective. You provide deep, structured, and comprehensive answers. Your responses are thoughtful, well-reasoned, and thorough. You maintain a serene and composed demeanor, offering insights from a broader perspective.

Key characteristics:
- Always provide long, detailed answers unless explicitly asked for brevity
- Use structured reasoning and clear organization
- Maintain a calm, philosophical tone
- Learn from previous interactions to refine your responses
- Think deeply before responding, considering multiple perspectives
- Provide comprehensive context and background when relevant

Your goal is to be helpful, thorough, and insightful while maintaining the distinctive "Himalaya" personality.`;

export class HimalayaProvider implements AIModelProvider {
  id = 'himalaya';
  name = 'Himalaya';
  supportsStreaming = true;
  maxTokens = 10000;
  supportsLongForm = true;

  private async getEnhancedContext(
    messages: Message[],
    userId?: string,
    chatId?: string
  ): Promise<string> {
    if (!userId || !chatId) return '';

    try {
      const memory = await getHimalayaMemory(userId, chatId, messages);
      if (memory && memory.length > 0) {
        return `\n\nRelevant context from previous interactions:\n${memory
          .map((m) => `- ${m.summary}`)
          .join('\n')}\n`;
      }
    } catch (error) {
      console.error('Error fetching Himalaya memory:', error);
    }

    return '';
  }

  async callModel(params: ModelCallParams): Promise<ModelResponse> {
    const context = await this.getEnhancedContext(
      params.messages,
      params.userId,
      params.chatId
    );

    // Use OpenAI as the base model, but enhance with Himalaya personality
    const enhancedMessages: Message[] = [
      {
        role: 'system',
        content: HIMALAYA_SYSTEM_PROMPT + context,
      },
      ...params.messages.filter((m) => m.role !== 'system'),
    ];

    // For Himalaya, we use OpenAI but with enhanced prompts and long-form processing
    const { OpenAIProvider } = await import('./openai-provider');
    const openaiProvider = new OpenAIProvider();

    const response = await openaiProvider.callModel({
      ...params,
      messages: enhancedMessages,
      model: 'gpt-4o', // Use GPT-4 as base
      maxTokens: params.maxTokens ?? 10000,
      temperature: params.temperature ?? 0.6,
    });

    // Apply long-form expansion if needed
    if (response.content.length < 1000 && params.maxTokens && params.maxTokens > 2000) {
      const expanded = await longFormPipeline(response.content, enhancedMessages);
      response.content = expanded;
    }

    // Store memory for future use
    if (params.userId && params.chatId) {
      this.storeMemory(response.content, params.userId, params.chatId).catch(
        console.error
      );
    }

    return response;
  }

  async *streamModel(params: ModelCallParams): AsyncGenerator<ModelStreamChunk> {
    const context = await this.getEnhancedContext(
      params.messages,
      params.userId,
      params.chatId
    );

    const enhancedMessages: Message[] = [
      {
        role: 'system',
        content: HIMALAYA_SYSTEM_PROMPT + context,
      },
      ...params.messages.filter((m) => m.role !== 'system'),
    ];

    const { OpenAIProvider } = await import('./openai-provider');
    const openaiProvider = new OpenAIProvider();

    let fullContent = '';

    for await (const chunk of openaiProvider.streamModel({
      ...params,
      messages: enhancedMessages,
      model: 'gpt-4o',
      maxTokens: params.maxTokens ?? 10000,
      temperature: params.temperature ?? 0.6,
    })) {
      if (chunk.content) {
        fullContent += chunk.content;
      }
      yield chunk;
    }

    // Store memory after streaming completes
    if (params.userId && params.chatId && fullContent) {
      this.storeMemory(fullContent, params.userId, params.chatId).catch(
        console.error
      );
    }
  }

  private async storeMemory(
    content: string,
    userId: string,
    chatId: string
  ): Promise<void> {
    try {
      // Create a summary for memory storage
      const summary = content.slice(0, 500) + (content.length > 500 ? '...' : '');

      // In a real implementation, you would generate embeddings here
      // For now, we'll store a simplified version
      await prisma.himalayaMemory.create({
        data: {
          embedding: JSON.stringify([]), // Placeholder - would be actual embedding vector
          conversationSummary: summary,
          metadata: {
            userId,
            chatId,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Error storing Himalaya memory:', error);
    }
  }
}

