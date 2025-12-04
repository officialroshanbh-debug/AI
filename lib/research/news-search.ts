import { SearchResult } from './search';

interface NewsDataResponse {
    status: string;
    totalResults: number;
    results: Array<{
        title: string;
        link: string;
        description?: string;
        content?: string;
        pubDate: string;
        source_id: string;
        image_url?: string;
    }>;
}

export async function performNewsSearch(query: string, country?: string): Promise<SearchResult[]> {
    console.log(`[NewsSearch] Searching for: "${query}" (Country: ${country || 'global'})`);

    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) {
        console.warn('[NewsSearch] NEWSDATA_API_KEY not found, skipping news search');
        return [];
    }

    try {
        // Construct URL
        // We use 'q' for the query. If country is provided, we append it.
        // Note: newsdata.io 'country' param requires 2-letter code (e.g. 'np').
        // If the query itself contains the country name, we might not need the param if the API is smart,
        // but explicit param is better if we know it.

        let url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en`;

        if (country) {
            url += `&country=${country}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`[NewsSearch] API Error: ${response.status} ${response.statusText}`);
            return [];
        }

        const data: NewsDataResponse = await response.json();

        if (data.status !== 'success' || !data.results) {
            return [];
        }

        console.log(`[NewsSearch] Found ${data.results.length} results`);

        return data.results.map(item => ({
            url: item.link,
            title: item.title,
            // Use content if available, otherwise description, otherwise title
            content: item.content || item.description || item.title,
            snippet: item.description || item.title,
        }));

    } catch (error) {
        console.error('[NewsSearch] Failed to fetch news:', error);
        return [];
    }
}
