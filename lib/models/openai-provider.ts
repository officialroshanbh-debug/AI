import OpenAI from 'openai';
import type {
  AIModelProvider,
  ModelCallParams,
  ModelResponse,
  ModelStreamChunk,
} from '@/types/ai-models';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model mapping with fallbacks - using more universally available models
const MODEL_MAP: Record<string, string[]> = {
  'gpt-5.1': ['gpt-4', 'gpt-4o', 'gpt-4-turbo'], // Try gpt-4 first (most widely available)
  'gpt-4.1': ['gpt-4', 'gpt-4-turbo', 'gpt-4-turbo-preview'],
  'o3-mini': ['gpt-3.5-turbo-0125', 'gpt-3.5-turbo-1106', 'gpt-3.5-turbo'],
};

// Model-specific max token limits (actual API limits)
const MODEL_MAX_TOKENS: Record<string, number> = {
  'gpt-4': 8192,
  'gpt-4o': 16384,
  'gpt-4-turbo': 128000,
  'gpt-4-turbo-preview': 8192,
  'gpt-3.5-turbo-0125': 16385,
  'gpt-3.5-turbo-1106': 16385,
  'gpt-3.5-turbo': 4096,
};

export class OpenAIProvider implements AIModelProvider {
  id = 'openai';
  name = 'OpenAI';
  supportsStreaming = true;

  private async tryModelWithFallback(
    models: string[],
    createRequest: (model: string) => Promise<any>
  ): Promise<any> {
    let lastError: Error | null = null;
    
    for (const model of models) {
      try {
        return await createRequest(model);
      } catch (error: any) {
        lastError = error;
        // If it's a model_not_found error, try next model
        if (error?.code === 'model_not_found' || error?.status === 403) {
          console.warn(`[OpenAI] Model ${model} not available, trying next...`);
          continue;
        }
        // For other errors, throw immediately
        throw error;
      }
    }
    
    // If all models failed, throw the last error
    throw lastError || new Error('All model fallbacks failed');
  }

  async callModel(params: ModelCallParams): Promise<ModelResponse> {
    const modelId = params.model || 'gpt-4.1';
    const models = MODEL_MAP[modelId] || ['gpt-4'];
    const messages = params.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const response = await this.tryModelWithFallback(models, async (model) => {
      // Cap max_tokens to the model's actual limit
      const modelMaxTokens = MODEL_MAX_TOKENS[model] || 4096;
      const maxTokens = params.maxTokens 
        ? Math.min(params.maxTokens, modelMaxTokens)
        : modelMaxTokens;

      return await openai.chat.completions.create({
        model,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: maxTokens,
      });
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      tokens: response.usage?.total_tokens,
      finishReason: choice.finish_reason || undefined,
    };
  }

  async *streamModel(params: ModelCallParams): AsyncGenerator<ModelStreamChunk> {
    const modelId = params.model || 'gpt-4.1';
    const models = MODEL_MAP[modelId] || ['gpt-4'];
    const messages = params.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    let stream: any;

    // Try models with fallback
    for (const model of models) {
      try {
        // Cap max_tokens to the model's actual limit
        const modelMaxTokens = MODEL_MAX_TOKENS[model] || 4096;
        const maxTokens = params.maxTokens 
          ? Math.min(params.maxTokens, modelMaxTokens)
          : modelMaxTokens;

        stream = await openai.chat.completions.create({
          model,
          messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: maxTokens,
          stream: true,
        });
        break; // Success, exit loop
      } catch (error: any) {
        // If it's a model_not_found error, try next model
        if (error?.code === 'model_not_found' || error?.status === 403) {
          console.warn(`[OpenAI] Model ${model} not available, trying next...`);
          if (model === models[models.length - 1]) {
            // Last model failed, throw error
            throw new Error(`None of the available models (${models.join(', ')}) are accessible. Please check your OpenAI API key permissions.`);
          }
          continue;
        }
        // For other errors, throw immediately
        throw error;
      }
    }

    if (!stream) {
      throw new Error('Failed to create stream with any available model');
    }

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

