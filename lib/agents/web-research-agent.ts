import { performWebSearch } from '@/lib/research/search';
import type { SearchResult } from '@/lib/research/search';
import { generateText } from 'ai';
import { Citation } from '@/types/ai-models';

export class WebResearchAgent {
    private static RESEARCH_KEYWORDS = [
        'latest',
        'recent',
        'today',
        'news',
        '24 hours',
        'current',
        'update',
        'happened',
        'happening',
        'search for',
        'look up',
        'find out',
        'what is',
        'who is',
        'when is',
        'where is',
    ];

    /**
     * Detects if the user's message implies a need for web research.
     */
    static detectIntent(message: string): boolean {
        const lowerMessage = message.toLowerCase();

        // Check for explicit keywords
        const hasKeyword = this.RESEARCH_KEYWORDS.some(keyword =>
            lowerMessage.includes(keyword)
        );

        // Heuristic: If it has a keyword AND is a question or command, it's likely research
        // Or if it explicitly asks to "search" or "find"
        if (hasKeyword) return true;

        // Specific check for "what happened" or "news about"
        if (lowerMessage.includes('what happened') || lowerMessage.includes('news about')) {
            return true;
        }

        return false;
    }

    /**
     * Performs web research based on the user's query.
     */
    /**
     * Performs web research based on the user's query.
     */
    static async research(
        query: string,
        userLocation?: { country?: string, city?: string, latitude?: number, longitude?: number },
        onProgress?: (status: string) => void
    ): Promise<{ citations: Citation[], context: string }> {
        console.log(`[WebResearchAgent] Searching for: ${query}`);
        onProgress?.('Analyzing research intent...');

        const lowerQuery = query.toLowerCase();

        // Simple country code mapping (expand as needed)
        const countryMap: Record<string, string> = {
            'nepal': 'np',
            'india': 'in',
            'usa': 'us',
            'united states': 'us',
            'uk': 'gb',
            'united kingdom': 'gb',
            'china': 'cn',
            'japan': 'jp',
            'australia': 'au'
        };

        // 1. Detect explicit country in query
        let targetCountryCode: string | undefined;
        let targetCountryName: string | undefined;

        for (const [name, code] of Object.entries(countryMap)) {
            if (lowerQuery.includes(name)) {
                targetCountryCode = code;
                targetCountryName = name.charAt(0).toUpperCase() + name.slice(1);
                break;
            }
        }

        // 2. If no explicit country, use user location
        if (!targetCountryCode && userLocation?.country) {
            const locCountry = userLocation.country.toLowerCase();
            targetCountryCode = countryMap[locCountry] || undefined; // Try to map if it's a name
            // If it's already a code (2 letters), use it
            if (!targetCountryCode && locCountry.length === 2) {
                targetCountryCode = locCountry;
            }
            if (targetCountryCode) {
                targetCountryName = userLocation.country;
            }
        }

        const isNewsIntent = this.detectIntent(query);
        let results: SearchResult[] = [];

        try {
            // Special handling for Nepal (as requested) or generic local news
            if (isNewsIntent && targetCountryCode) {
                onProgress?.(`Fetching latest news for ${targetCountryName || targetCountryCode}...`);

                // 1. Fetch from NewsData.io
                const { performNewsSearch } = await import('@/lib/research/news-search');
                const newsResults = await performNewsSearch(query, targetCountryCode);

                // 2. Targeted Web Search (Conditional)
                // Only do web search if news results are insufficient (< 3)
                if (newsResults.length < 3) {
                    let targetedQuery = query;
                    if (targetCountryCode === 'np') {
                        targetedQuery = `${query} site:onlinekhabar.com OR site:ekantipur.com OR site:setopati.com OR site:ratopati.com OR site:thehimalayantimes.com`;
                    } else {
                        // For other countries, just append "news" to ensure freshness if not already present
                        if (!lowerQuery.includes('news')) targetedQuery += ' news';
                    }

                    // Use fastMode=true to skip deep scraping for these supplementary results
                    const webResults = await performWebSearch(targetedQuery, 5 - newsResults.length, true);

                    // Combine results
                    results = [...newsResults, ...webResults];
                } else {
                    results = newsResults.slice(0, 5);
                }

                // Deduplicate
                const seenUrls = new Set();
                results = results.filter(item => {
                    if (seenUrls.has(item.url)) return false;
                    seenUrls.add(item.url);
                    return true;
                });

            } else {
                // Standard search
                onProgress?.('Searching the web...');
                results = await performWebSearch(query);
            }

            onProgress?.(`Found ${results.length} results. Reading content...`);

            if (results.length === 0) {
                return { citations: [], context: '' };
            }

            // Format citations
            const citations: Citation[] = results.map((result, index) => ({
                id: `cit-${index}`,
                source: result.url,
                url: result.url,
                title: result.title,
                quote: result.snippet,
                relevance: 1 - (index * 0.1),
            }));

            // Generate context
            const context = `
SYSTEM INSTRUCTION: REAL-TIME WEB RESEARCH RESULTS
You have been provided with real-time web search results for the query: "${query}".
You MUST use this information to answer the user's question.
Do NOT say you don't have real-time access or that you are an AI with a knowledge cutoff.
The following information is current and accurate as of right now.

${targetCountryName ? `NOTE: The user is interested in news from/about ${targetCountryName}. Prioritize local sources provided below.` : ''}

Cite your sources using [1], [2], etc. corresponding to the order below.

SEARCH RESULTS:
${results.map((r, i) => `
[${i + 1}] Title: ${r.title}
Source: ${r.url}
Snippet: ${r.snippet}
Content: ${r.content.slice(0, 300)}...
`).join('\n\n')}
`;

            return { citations, context };
        } catch (error) {
            console.error('[WebResearchAgent] Research failed:', error);
            return { citations: [], context: '' };
        }
    }
}
