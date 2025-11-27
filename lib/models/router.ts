import type { AIModelProvider, ModelId } from '@/types/ai-models';
import { MODEL_CONFIGS } from '@/types/ai-models';
import { OpenAIProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';
import { ClaudeProvider } from './claude-provider';
import { HimalayaProvider } from './himalaya-provider';

class ModelRouter {
  private providers: Map<string, AIModelProvider> = new Map();

  constructor() {
    // Initialize providers
    const openai = new OpenAIProvider();
    const gemini = new GeminiProvider();
    const claude = new ClaudeProvider();
    const himalaya = new HimalayaProvider();

    this.providers.set('openai', openai);
    this.providers.set('google', gemini);
    this.providers.set('anthropic', claude);
    this.providers.set('himalaya', himalaya);
  }

  getProvider(modelId: ModelId): AIModelProvider {
    const config = MODEL_CONFIGS[modelId];
    if (!config) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    const provider = this.providers.get(config.provider);
    if (!provider) {
      throw new Error(`Provider not found: ${config.provider}`);
    }

    return provider;
  }

  getModelConfig(modelId: ModelId) {
    return MODEL_CONFIGS[modelId];
  }

  getAllModels(): ModelId[] {
    return Object.keys(MODEL_CONFIGS) as ModelId[];
  }
}

export const modelRouter = new ModelRouter();

