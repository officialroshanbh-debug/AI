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

    let context = '';

    try {
      // 1. Get conversation memory
      const memory = await getHimalayaMemory(userId, chatId, messages);
      if (memory && memory.length > 0) {
        context += `\n\nRelevant context from previous interactions:\n${memory
          .map((m) => `- ${m.summary}`)
          .join('\n')}\n`;
      }

      // 2. RAG: Retrieve relevant training data
      const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
      if (lastUserMessage) {
        const { semanticSearch } = await import('@/lib/himalaya/embeddings');
        const trainingData = await prisma.himalayaTrainingData.findMany({
          where: { isActive: true },
          select: { id: true, title: true, content: true, embedding: true },
          take: 100, // Limit for performance
        });

        const relevantData = await semanticSearch(
          lastUserMessage.content,
          trainingData,
          3, // Top 3 results
          0.7 // 70% similarity threshold
        );

        if (relevantData.length > 0) {
          context += `\n\nRelevant knowledge from training data:\n${relevantData
            .map((item) => `- ${item.title}: ${item.content.slice(0, 200)}...`)
            .join('\n')}\n`;
        }
      }
    } catch (error) {
      console.error('Error fetching Himalaya context:', error);
    }

    return context;
  }

  private async getFineTunedModel(): Promise<string> {
    try {
      const { getLatestFineTunedModel } = await import('@/lib/himalaya/fine-tuning');
      const modelId = await getLatestFineTunedModel();
      return modelId || 'gpt-4o'; // Fallback to base model
    } catch (error) {
      console.error('Error getting fine-tuned model:', error);
      return 'gpt-4o';
    }
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

    // For Himalaya, we use fine-tuned model if available, otherwise GPT-4
    const { OpenAIProvider } = await import('./openai-provider');
    const openaiProvider = new OpenAIProvider();
    const modelId = await this.getFineTunedModel();

    const response = await openaiProvider.callModel({
      ...params,
      messages: enhancedMessages,
      model: modelId,
      maxTokens: params.maxTokens ?? 10000,
      temperature: params.temperature ?? 0.6,
    });

    // Apply long-form expansion if needed
    if (response.content.length < 1000 && params.maxTokens && params.maxTokens > 2000) {
      const expanded = await longFormPipeline(response.content, enhancedMessages);
      response.content = expanded;
    }

    // Store memory for future use - await to ensure it completes
    if (params.userId && params.chatId) {
      await this.storeMemory(response.content, params.userId, params.chatId).catch(
        (error) => {
          console.error('Error storing Himalaya memory:', error);
        }
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
    const modelId = await this.getFineTunedModel();

    let fullContent = '';
    let memoryPromise: Promise<void> | null = null;

    try {
      for await (const chunk of openaiProvider.streamModel({
        ...params,
        messages: enhancedMessages,
        model: modelId,
        maxTokens: params.maxTokens ?? 10000,
        temperature: params.temperature ?? 0.6,
      })) {
        if (chunk.content) {
          fullContent += chunk.content;
        }
        yield chunk;
      }

      // Store memory after streaming completes - track the promise
      if (params.userId && params.chatId && fullContent) {
        memoryPromise = this.storeMemory(fullContent, params.userId, params.chatId);
      }
    } finally {
      // Ensure memory is stored even if stream errors
      if (memoryPromise) {
        await memoryPromise.catch((error) => {
          console.error('Error storing Himalaya memory after stream:', error);
        });
      }
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

