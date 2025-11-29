import type {
  AIModelProvider,
  Message,
  ModelCallParams,
  ModelResponse,
  ModelStreamChunk,
} from '@/types/ai-models';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export class ClaudeProvider implements AIModelProvider {
  id = 'anthropic';
  name = 'Anthropic Claude';
  supportsStreaming = true;

  private async makeRequest(
    messages: Message[],
    stream: boolean = false,
    temperature?: number,
    maxTokens?: number
  ) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    // Convert messages to Claude format
    const systemMessage = messages.find((msg) => msg.role === 'system');
    const conversationMessages = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

    const body: Record<string, unknown> = {
      model: 'claude-3-5-sonnet-20241022',
      messages: conversationMessages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 16384,
      stream: stream,
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    return response;
  }

  async callModel(params: ModelCallParams): Promise<ModelResponse> {
    const response = await this.makeRequest(
      params.messages,
      false,
      params.temperature,
      params.maxTokens
    );

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    return {
      content: text,
      tokens: data.usage?.input_tokens && data.usage?.output_tokens
        ? data.usage.input_tokens + data.usage.output_tokens
        : undefined,
      finishReason: data.stop_reason,
    };
  }

  async *streamModel(params: ModelCallParams): AsyncGenerator<ModelStreamChunk> {
    const response = await this.makeRequest(
      params.messages,
      true,
      params.temperature,
      params.maxTokens
    );

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { content: '', done: true };
              return;
            }

            try {
              const json = JSON.parse(data);
              if (json.type === 'content_block_delta') {
                const text = json.delta?.text || '';
                if (text) {
                  yield {
                    content: text,
                    done: false,
                  };
                }
              } else if (json.type === 'message_stop') {
                yield { content: '', done: true };
                return;
              }
            } catch (_e) {
              // Skip invalid JSON
            }
          }
        }
      }

      yield { content: '', done: true };
    } finally {
      reader.releaseLock();
    }
  }
}

