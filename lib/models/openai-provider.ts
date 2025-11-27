import OpenAI from 'openai';
import type {
  AIModelProvider,
  Message,
  ModelCallParams,
  ModelResponse,
  ModelStreamChunk,
} from '@/types/ai-models';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL_MAP: Record<string, string> = {
  'gpt-5.1': 'gpt-4o', // Fallback to available model
  'gpt-4.1': 'gpt-4-turbo-preview',
  'o3-mini': 'gpt-3.5-turbo',
};

export class OpenAIProvider implements AIModelProvider {
  id = 'openai';
  name = 'OpenAI';
  supportsStreaming = true;

  private getModelName(modelId?: string): string {
    if (!modelId) return 'gpt-4o';
    return MODEL_MAP[modelId] || 'gpt-4o';
  }

  async callModel(params: ModelCallParams): Promise<ModelResponse> {
    const model = this.getModelName(params.model);
    const messages = params.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens,
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      tokens: response.usage?.total_tokens,
      finishReason: choice.finish_reason || undefined,
    };
  }

  async *streamModel(params: ModelCallParams): AsyncGenerator<ModelStreamChunk> {
    const model = this.getModelName(params.model);
    const messages = params.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const stream = await openai.chat.completions.create({
      model,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      yield {
        content: delta,
        done: false,
        finishReason: chunk.choices[0]?.finish_reason || undefined,
      };
    }

    yield { content: '', done: true };
  }
}

