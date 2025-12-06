import { z } from 'zod';

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url(),

    // Auth
    NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"), // min(32) is recommended but might break dev if using short secrets
    NEXTAUTH_URL: z.string().url().optional(), // Optional in some deployments (Vercel infers it)

    // AI APIs
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_AI_API_KEY: z.string().optional(),

    // OAuth
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    AUTH_SECRET: z.string().optional(),

    // Rate Limiting (Upstash)
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // Pusher (Real-time)
    PUSHER_APP_ID: z.string().optional(),
    PUSHER_KEY: z.string().optional(),
    PUSHER_SECRET: z.string().optional(),
    NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
    NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional(),

    // App
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Sentry
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    SENTRY_DSN: z.string().optional(),

    // Vercel Blob/KV (Optional as they might not be set in local dev without pull)
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    KV_URL: z.string().optional(),
    KV_REST_API_URL: z.string().optional(),
    KV_REST_API_TOKEN: z.string().optional(),
    KV_REST_API_READ_ONLY_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
