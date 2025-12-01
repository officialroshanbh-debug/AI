import OpenAI from 'openai';
import type {
  AIModelProvider,
  ModelCallParams,
  ModelResponse,
  ModelStreamChunk,
} from '@/types/ai-models';

// Type definitions for OpenAI API responses
type ChatCompletion = OpenAI.Chat.Completions.ChatCompletion;
type ChatCompletionStream = AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model mapping with fallbacks - using current OpenAI models (as of 2025)
// Based on OpenAI Platform documentation: https://platform.openai.com/docs/overview
const MODEL_MAP: Record<string, string[]> = {
  'gpt-5.1': ['gpt-5.1-chat-latest', 'gpt-4o', 'gpt-4-turbo', 'gpt-4'], // GPT-5.1 is the latest (Nov 2025)
  'gpt-4.1': ['gpt-4-turbo', 'gpt-4o', 'gpt-4'], // gpt-4-turbo for long context
  'o3-mini': ['gpt-3.5-turbo', 'gpt-3.5-turbo-0125'], // Use latest gpt-3.5-turbo by default
};

// Model context window sizes (total tokens including input + output)
// Source: OpenAI API documentation (updated Nov 2025)
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  'gpt-5.1-chat-latest': 128000, // 128k context window (GPT-5.1, Nov 2025)
  'gpt-4': 8192,
  'gpt-4o': 128000, // 128k context window
  'gpt-4-turbo': 128000, // 128k context window
  'gpt-3.5-turbo': 16385, // 16k context window
  'gpt-3.5-turbo-0125': 16385,
  'gpt-3.5-turbo-1106': 16385,
};

// Improved token estimation using OpenAI's recommended approximation
// For English text: ~4 characters per token, but accounts for common patterns
function estimateTokens(text: string): number {
  if (!text) return 0;
  // More accurate estimation: account for spaces, punctuation, and common words
  // This is still an approximation - for production, consider using tiktoken
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  // Average: ~0.75 tokens per word, or ~4 chars per token (whichever is more conservative)
  return Math.max(Math.ceil(words * 0.75), Math.ceil(chars / 4));
}

// Calculate safe max_tokens if needed, but prefer not setting it (let OpenAI decide)
// According to OpenAI docs: max_tokens is optional. If not set, model generates until stop or context limit
function calculateSafeMaxTokens(model: string, messages: Array<{ role: string; content: string }>, requestedMax?: number): number | undefined {
  // If maxTokens is explicitly requested, validate it against context window
  if (requestedMax) {
    const contextWindow = MODEL_CONTEXT_WINDOWS[model] || 8192;
    
    // Estimate input tokens (rough)
    const inputTokens = messages.reduce((sum, msg) => {
      return sum + 4 + estimateTokens(msg.content); // 4 tokens overhead per message
    }, 0);
    
    // Ensure requested max doesn't exceed available context
    const maxAvailable = contextWindow - inputTokens - 100; // 100 token safety buffer
    return Math.min(requestedMax, Math.max(100, maxAvailable));
  }
  
  // If not requested, return undefined (let OpenAI handle it)
  // This follows OpenAI best practice: only set max_tokens when you need to limit output
  return undefined;
}

export class OpenAIProvider implements AIModelProvider {
  id = 'openai';
  name = 'OpenAI';
  supportsStreaming = true;

  private async tryModelWithFallback<T>(
    models: string[],
    createRequest: (model: string) => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (const model of models) {
      try {
        return await createRequest(model);
      } catch (error: unknown) {
        const err = error as { code?: string; status?: number; message?: string };
        lastError = error instanceof Error ? error : new Error(String(error));
        // If it's a model_not_found error, try next model
        if (err?.code === 'model_not_found' || err?.status === 403) {
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

    const response = await this.tryModelWithFallback<ChatCompletion>(models, async (model) => {
      // According to OpenAI docs: max_tokens is optional
      // Only set it if explicitly requested, and validate against context window
      const maxTokens = calculateSafeMaxTokens(model, messages, params.maxTokens);

      // Build request - only include max_tokens if it's defined
      const requestParams: Parameters<typeof openai.chat.completions.create>[0] = {
        model,
        messages,
        temperature: params.temperature ?? 0.7,
        stream: false, // Explicitly set to false for non-streaming
      };

      // Only add max_tokens if it was requested (following OpenAI best practices)
      if (maxTokens !== undefined) {
        requestParams.max_tokens = maxTokens;
      }

      const result = await openai.chat.completions.create(requestParams);
      return result as ChatCompletion;
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

    let stream: ChatCompletionStream | null = null;

    // Try models with fallback
    for (const model of models) {
      try {
        // According to OpenAI docs: max_tokens is optional
        // Only set it if explicitly requested, and validate against context window
        const maxTokens = calculateSafeMaxTokens(model, messages, params.maxTokens);

        // Build request - only include max_tokens if it's defined
        const requestParams: Parameters<typeof openai.chat.completions.create>[0] = {
          model,
          messages,
          temperature: params.temperature ?? 0.7,
          stream: true,
        };

        // Only add max_tokens if it was requested (following OpenAI best practices)
        if (maxTokens !== undefined) {
          requestParams.max_tokens = maxTokens;
        }

        stream = await openai.chat.completions.create(requestParams) as ChatCompletionStream;
        break; // Success, exit loop
      } catch (error: unknown) {
        const err = error as { code?: string; status?: number; message?: string };
        // If it's a model_not_found error, try next model
        if (err?.code === 'model_not_found' || err?.status === 403) {
          console.warn(`[OpenAI] Model ${model} not available, trying next...`);
          if (model === models[models.length - 1]) {
            // Last model failed, throw error
            throw new Error(`None of the available models (${models.join(', ')}) are accessible. Please check your OpenAI API key permissions.`);
          }
          continue;
        }
        // Handle context_length_exceeded error
        // This means input + max_tokens exceeds context window
        if (err?.code === 'context_length_exceeded') {
          console.warn(`[OpenAI] Context length exceeded for ${model}`);
          
          // If max_tokens was set, try without it (let OpenAI decide)
          if (params.maxTokens) {
            try {
              stream = await openai.chat.completions.create({
                model,
                messages,
                temperature: params.temperature ?? 0.7,
                stream: true,
                // Don't set max_tokens - let OpenAI use available context
              }) as ChatCompletionStream;
              break; // Success without max_tokens limit
            } catch {
              // If still fails, input itself is too long - try next model
              if (model === models[models.length - 1]) {
                throw new Error(`Context length exceeded: Input messages are too long for all available models. Please reduce message length.`);
              }
              continue;
            }
          } else {
            // Input itself exceeds context window - try next model
            if (model === models[models.length - 1]) {
              throw new Error(`Context length exceeded: Input messages are too long for all available models. Please reduce message length.`);
            }
            continue;
          }
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

