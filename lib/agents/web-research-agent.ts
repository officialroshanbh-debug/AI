import { performWebSearch } from '@/lib/research/search';
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
    static async research(query: string): Promise<{ citations: Citation[], context: string }> {
        console.log(`[WebResearchAgent] Searching for: ${query}`);

        try {
            const results = await performWebSearch(query);

            if (results.length === 0) {
                return { citations: [], context: '' };
            }

            // Format citations
            const citations: Citation[] = results.map((result, index) => ({
                id: `cit-${index}`,
                source: result.url, // Display URL as source
                url: result.url,
                title: result.title,
                quote: result.snippet,
                relevance: 1 - (index * 0.1), // Simple relevance decay
            }));

            // Generate context for the LLM
            const context = `
SYSTEM INSTRUCTION: REAL-TIME WEB RESEARCH RESULTS
You have been provided with real-time web search results for the query: "${query}".
You MUST use this information to answer the user's question.
Do NOT say you don't have real-time access or that you are an AI with a knowledge cutoff.
The following information is current and accurate as of right now.

Cite your sources using [1], [2], etc. corresponding to the order below.

SEARCH RESULTS:
${results.map((r, i) => `
[${i + 1}] Title: ${r.title}
Source: ${r.url}
Snippet: ${r.snippet}
Content: ${r.content.slice(0, 800)}...
`).join('\n\n')}
`;

            return { citations, context };
        } catch (error) {
            console.error('[WebResearchAgent] Research failed:', error);
            return { citations: [], context: '' };
        }
    }
}
