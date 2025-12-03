export type ModelRole = 'user' | 'assistant' | 'system';

export interface Citation {
  id?: string;
  source: string;
  quote?: string;
  relevance?: number;
  title?: string;
  url?: string;
}

export interface Message {
  role: ModelRole;
  content: string;
  citations?: Citation[];
  status?: string;
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
  GPT_5: 'gpt-5',
  GPT_5_1: 'gpt-5.1-chat-latest',
  GPT_4_TURBO: 'gpt-4-turbo',
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_REALTIME: 'gpt-realtime',
  GPT_4: 'gpt-4',
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
  [MODEL_IDS.GPT_5]: {
    id: MODEL_IDS.GPT_5,
    name: 'GPT-5',
    description: 'The next generation of AI reasoning and capability',
    provider: 'openai',
    supportsStreaming: true,
    supportsLongForm: true,
    maxTokens: 16384,
    defaultTemperature: 0.7,
  },
  [MODEL_IDS.GPT_5_1]: {
    id: MODEL_IDS.GPT_5_1,
    name: 'GPT-5.1 Chat Latest',
    description: 'Most advanced model with enhanced reasoning capabilities',
    provider: 'openai',
    supportsStreaming: true,
    supportsLongForm: true,
    maxTokens: 16384,
    defaultTemperature: 0.7,
  },
  [MODEL_IDS.GPT_4_TURBO]: {
    id: MODEL_IDS.GPT_4_TURBO,
    name: 'GPT-4 Turbo',
    description: 'High-intelligence model with updated knowledge cutoff',
    provider: 'openai',
    supportsStreaming: true,
    supportsLongForm: true,
    maxTokens: 4096,
    defaultTemperature: 0.7,
  },
  [MODEL_IDS.GPT_4O]: {
    id: MODEL_IDS.GPT_4O,
    name: 'GPT-4o',
    description: 'Omni model with faster performance and vision capabilities',
    provider: 'openai',
    supportsStreaming: true,
    supportsLongForm: true,
    maxTokens: 4096,
    defaultTemperature: 0.7,
  },
  [MODEL_IDS.GPT_4O_MINI]: {
    id: MODEL_IDS.GPT_4O_MINI,
    name: 'GPT-4o Mini',
    description: 'Cost-efficient small model for fast tasks',
    provider: 'openai',
    supportsStreaming: true,
    supportsLongForm: false,
    maxTokens: 4096,
    defaultTemperature: 0.5,
  },
  [MODEL_IDS.GPT_REALTIME]: {
    id: MODEL_IDS.GPT_REALTIME,
    name: 'GPT Realtime',
    description: 'Low-latency model optimized for real-time interactions',
    provider: 'openai',
    supportsStreaming: true,
    supportsLongForm: false,
    maxTokens: 4096,
    defaultTemperature: 0.6,
  },
  [MODEL_IDS.GPT_4]: {
    id: MODEL_IDS.GPT_4,
    name: 'GPT-4',
    description: 'Legacy high-intelligence model',
    provider: 'openai',
    supportsStreaming: true,
    supportsLongForm: true,
    maxTokens: 8192,
    defaultTemperature: 0.7,
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

