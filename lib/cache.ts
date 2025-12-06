import { kv } from '@vercel/kv';

export async function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300 // 5 minutes default
): Promise<T> {
    try {
        // Try to get from cache
        const cached = await kv.get<T>(key);
        if (cached) {
            console.log(`[Cache] Hit: ${key}`);
            return cached;
        }
    } catch (error) {
        console.warn(`[Cache] Failed to read from KV: ${key}`, error);
    }

    // Fetch fresh data
    console.log(`[Cache] Miss: ${key}`);
    const data = await fetcher();

    try {
        // Store in cache (fire and forget)
        kv.set(key, data, { ex: ttlSeconds }).catch((err) =>
            console.error(`[Cache] Failed to set KV: ${key}`, err)
        );
    } catch (error) {
        console.error(`[Cache] Error setting KV: ${key}`, error);
    }

    return data;
}
