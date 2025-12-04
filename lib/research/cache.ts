import { SearchResult } from './search';

// Simple in-memory cache (production: use Redis/Vercel KV)
const searchCache = new Map<string, { results: SearchResult[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedSearch(query: string) {
    const cached = searchCache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.results;
    }
    return null;
}

export function setCachedSearch(query: string, results: SearchResult[]) {
    searchCache.set(query, { results, timestamp: Date.now() });
    // Limit cache size
    if (searchCache.size > 100) {
        const firstKey = searchCache.keys().next().value;
        if (firstKey) searchCache.delete(firstKey);
    }
}
