export type ModelRole = 'user' | 'assistant' | 'system';

export interface Message {
  role: ModelRole;
  content: string;
}

export interface ModelResponse {
  content: string;
  tokens?: number;
  finishReason?: string;
  metadata?: Record<string, unknown>;
}

export interface ModelStreamChunk {
  content: string;
  done: boolean;
  finishReason?: string;
}

export interface AIModelProvider {
  id: string;
  name: string;
  callModel: (params: ModelCallParams) => Promise<ModelResponse>;
  streamModel: (params: ModelCallParams) => AsyncGenerator<ModelStreamChunk>;
  supportsStreaming: boolean;
  maxTokens?: number;
  supportsLongForm?: boolean;
}

export interface ModelCallParams {
  messages: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  userId?: string;
  chatId?: string;
}

export const MODEL_IDS = {
  GPT_5_1: 'gpt-5.1',
  GPT_4_1: 'gpt-4.1',
  O3_MINI: 'o3-mini',
  GEMINI_2_0: 'gemini-2.0',
  CLAUDE_3_7: 'claude-3.7',
  HIMALAYA: 'himalaya',
} as const;

export type ModelId = (typeof MODEL_IDS)[keyof typeof MODEL_IDS];

export interface ModelConfig {
  id: ModelId;
  name: string;
  description: string;
  provider: string;
  supportsStreaming: boolean;
  supportsLongForm: boolean;
  maxTokens: number;
  defaultTemperature: number;
}

export const MODEL_CONFIGS: Record<ModelId, ModelConfig> = {
  [MODEL_IDS.GPT_5_1]: {
    id: MODEL_IDS.GPT_5_1,
    name: 'GPT-5.1',
    description: 'OpenAI\'s most advanced model (Nov 2025) - 128k context, enhanced reasoning',
    provider: 'openai',
    supportsStreaming: true,
    supportsLongForm: true,
    maxTokens: 16384, // Max output tokens (context window is 128k)
    defaultTemperature: 0.7,
  },
  [MODEL_IDS.GPT_4_1]: {
    id: MODEL_IDS.GPT_4_1,
    name: 'GPT-4.1',
    description: 'Enhanced GPT-4 with improved reasoning',
    provider: 'openai',
    supportsStreaming: true,
    supportsLongForm: true,
    maxTokens: 8192,
    defaultTemperature: 0.7,
  },
  [MODEL_IDS.O3_MINI]: {
    id: MODEL_IDS.O3_MINI,
    name: 'o3-mini',
    description: 'Fast and efficient reasoning model (maps to gpt-3.5-turbo, max 4096 tokens)',
    provider: 'openai',
    supportsStreaming: true,
    supportsLongForm: false,
    maxTokens: 4096, // gpt-3.5-turbo actual limit
    defaultTemperature: 0.5,
  },
  [MODEL_IDS.GEMINI_2_0]: {
    id: MODEL_IDS.GEMINI_2_0,
    name: 'Gemini 2.0',
    description: 'Google\'s latest multimodal AI',
    provider: 'google',
    supportsStreaming: true,
    supportsLongForm: true,
    maxTokens: 8192,
    defaultTemperature: 0.7,
  },
  [MODEL_IDS.CLAUDE_3_7]: {
    id: MODEL_IDS.CLAUDE_3_7,
    name: 'Claude 3.7',
    description: 'Anthropic\'s advanced assistant',
    provider: 'anthropic',
    supportsStreaming: true,
    supportsLongForm: true,
    maxTokens: 16384,
    defaultTemperature: 0.7,
  },
  [MODEL_IDS.HIMALAYA]: {
    id: MODEL_IDS.HIMALAYA,
    name: 'Himalaya',
    description: 'Custom learning model with deep reasoning',
    provider: 'himalaya',
    supportsStreaming: true,
    supportsLongForm: true,
    maxTokens: 10000,
    defaultTemperature: 0.6,
  },
};

