import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@/lib/env';

// Create a new ratelimiter, that allows requests per the tiered limits
// Using Upstash Redis for distributed state
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL!,
  token: env.UPSTASH_REDIS_REST_TOKEN!,
});

type RateLimitTier = 'free' | 'pro' | 'enterprise';

interface RateLimitConfig {
  requests: number;
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`;
}

const TIER_LIMITS: Record<RateLimitTier, RateLimitConfig> = {
  free: { requests: 10, window: '1 m' },      // 10 req/min
  pro: { requests: 50, window: '1 m' },       // 50 req/min
  enterprise: { requests: 1000, window: '1 m' } // High limit
};

export const rateLimiter = {
  limit: async (userId: string, tier: RateLimitTier = 'free') => {
    if (tier === 'enterprise') return { success: true, limit: 1000, remaining: 1000, reset: 0 };

    const config = TIER_LIMITS[tier];
    const limiter = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      analytics: true,
      prefix: `@upstash/ratelimit/${tier}`,
    });

    return await limiter.limit(userId);
  }
};
