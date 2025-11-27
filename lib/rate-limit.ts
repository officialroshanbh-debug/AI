import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Type for rate limiter interface we actually use
type RateLimiterInterface = {
  limit: (identifier: string) => Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }>;
};

// Fallback rate limiter that always allows requests if Redis is not configured
const noopLimiter: RateLimiterInterface = {
  limit: async () => ({ success: true, limit: 10, remaining: 10, reset: Date.now() }),
};

export const rateLimiter: RateLimiterInterface = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
    })
  : noopLimiter;

export const strictRateLimiter: RateLimiterInterface = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
    })
  : noopLimiter;

