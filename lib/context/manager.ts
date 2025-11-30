/**
 * Advanced Context Management
 * Context window visualization, selective inclusion/exclusion, summarization
 */

export interface ContextMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens: number;
  included: boolean;
  metadata?: Record<string, unknown>;
}

export interface ContextWindow {
  messages: ContextMessage[];
  totalTokens: number;
  maxTokens: number;
  summary?: string;
  excludedMessageIds: string[];
}

export class ContextManager {
  /**
   * Calculate token count for a message (approximate)
   */
  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Build context window from messages
   */
  buildContextWindow(
    messages: Array<{ id: string; role: string; content: string; tokens?: number }>,
    maxTokens: number,
    includedIds?: string[],
    excludedIds?: string[]
  ): ContextWindow {
    const includedIdsSet = new Set(includedIds || messages.map(m => m.id));
    const excludedIdsSet = new Set(excludedIds || []);

    const contextMessages: ContextMessage[] = messages
      .filter(msg => includedIdsSet.has(msg.id) && !excludedIdsSet.has(msg.id))
      .map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        tokens: msg.tokens || this.estimateTokens(msg.content),
        included: true,
      }));

    // Sort by most recent first, then trim to fit token limit
    const sortedMessages = contextMessages.sort((_a, _b) => {
      // Assuming messages have timestamps or order
      return 0; // Would sort by timestamp
    });

    let totalTokens = 0;
    const included: ContextMessage[] = [];
    const excluded: ContextMessage[] = [];

    // Add messages until we hit the token limit
    for (const msg of sortedMessages) {
      if (totalTokens + msg.tokens <= maxTokens) {
        included.push(msg);
        totalTokens += msg.tokens;
      } else {
        excluded.push(msg);
      }
    }

    return {
      messages: included,
      totalTokens,
      maxTokens,
      excludedMessageIds: excluded.map(m => m.id),
    };
  }

  /**
   * Summarize excluded messages to preserve context
   */
  async summarizeExcludedMessages(
    messages: ContextMessage[]
  ): Promise<string> {
    // This would call an AI model to summarize the messages
    // For now, return a placeholder
    if (messages.length === 0) return '';
    
    const totalTokens = messages.reduce((sum, m) => sum + m.tokens, 0);
    return `[Previous conversation: ${messages.length} messages, ~${totalTokens} tokens]`;
  }

  /**
   * Create a context summary for long conversations
   */
  async createContextSummary(
    messages: ContextMessage[],
    _maxSummaryTokens: number = 500
  ): Promise<string> {
    // This would use an AI model to create a concise summary
    // For now, return a basic summary
    const userMessages = messages.filter(m => m.role === 'user').length;
    const assistantMessages = messages.filter(m => m.role === 'assistant').length;
    
    return `Conversation summary: ${userMessages} user messages, ${assistantMessages} assistant responses. Total tokens: ${messages.reduce((sum, m) => sum + m.tokens, 0)}.`;
  }

  /**
   * Get token usage per message
   */
  getTokenUsagePerMessage(messages: ContextMessage[]): Array<{
    messageId: string;
    tokens: number;
    percentage: number;
  }> {
    const totalTokens = messages.reduce((sum, m) => sum + m.tokens, 0);
    
    return messages.map(msg => ({
      messageId: msg.id,
      tokens: msg.tokens,
      percentage: totalTokens > 0 ? (msg.tokens / totalTokens) * 100 : 0,
    }));
  }

  /**
   * Optimize context window by removing least important messages
   */
  optimizeContextWindow(
    window: ContextWindow,
    targetTokens: number
  ): ContextWindow {
    if (window.totalTokens <= targetTokens) {
      return window;
    }

    // Sort messages by some importance metric (could be recency, length, etc.)
    const sorted = [...window.messages].sort((a, b) => {
      // Prefer keeping system messages and recent messages
      if (a.role === 'system') return -1;
      if (b.role === 'system') return 1;
      return 0; // Would sort by timestamp
    });

    const optimized: ContextMessage[] = [];
    let totalTokens = 0;

    for (const msg of sorted) {
      if (totalTokens + msg.tokens <= targetTokens) {
        optimized.push(msg);
        totalTokens += msg.tokens;
      } else {
        window.excludedMessageIds.push(msg.id);
      }
    }

    return {
      ...window,
      messages: optimized,
      totalTokens,
    };
  }
}

