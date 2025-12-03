import type { AIModelProvider, ModelId } from '@/types/ai-models';
import { MODEL_CONFIGS } from '@/types/ai-models';
import { OpenAIProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';
import { ClaudeProvider } from './claude-provider';
import { HimalayaProvider } from './himalaya-provider';

class ModelRouter {
  private providers: Map<string, AIModelProvider> = new Map();

  constructor() {
    // Providers are now lazy-loaded
  }

  getProvider(modelId: ModelId): AIModelProvider {
    const config = MODEL_CONFIGS[modelId];
    if (!config) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    // Lazy load provider if not already initialized
    if (!this.providers.has(config.provider)) {
      switch (config.provider) {
        case 'openai':
          this.providers.set('openai', new OpenAIProvider());
          break;
        case 'google':
          this.providers.set('google', new GeminiProvider());
          break;
        case 'anthropic':
          this.providers.set('anthropic', new ClaudeProvider());
          break;
        case 'himalaya':
          this.providers.set('himalaya', new HimalayaProvider());
          break;
        default:
          throw new Error(`Unknown provider: ${config.provider}`);
      }
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

