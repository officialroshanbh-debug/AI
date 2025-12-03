

export interface SearchResult {
    url: string;
    title: string;
    content: string;
    snippet: string;
}

export async function performWebSearch(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    try {
        // Search the web using Jina
        const searchResponse = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
            headers: {
                'Accept': 'application/json',
                'X-Return-Format': 'json',
            },
        });

        if (searchResponse.ok) {
            await searchResponse.json();

            // Jina search returns data in a text format, we'll need to parse it
            // For now, let's use Google Custom Search as fallback for better structured results
            const fallbackSearch = await fetch(
                `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=5`
            );

            if (fallbackSearch.ok) {
                const googleData = await fallbackSearch.json();

                // Now scrape each result with Jina Reader
                for (const item of googleData.items || []) {
                    try {
                        const readResponse = await fetch(`https://r.jina.ai/${encodeURIComponent(item.link)}`, {
                            headers: {
                                'Accept': 'application/json',
                                'X-Return-Format': 'json',
                            },
                        });

                        if (readResponse.ok) {
                            const pageData = await readResponse.json();
                            results.push({
                                url: item.link,
                                title: pageData.title || item.title,
                                content: pageData.content || '',
                                snippet: pageData.description || item.snippet || '',
                            });
                        }
                    } catch (error) {
                        console.error(`Failed to read ${item.link}:`, error);
                        // Add basic result even if reading fails
                        results.push({
                            url: item.link,
                            title: item.title,
                            content: '',
                            snippet: item.snippet || '',
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Search failed:', error);
    }

    return results;
}

export async function readUrls(urls: string[]): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const url of urls.slice(0, 5)) {
        try {
            const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Return-Format': 'json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                results.push({
                    url,
                    title: data.title || url,
                    content: data.content || '',
                    snippet: data.description || data.content?.substring(0, 200) || '',
                });
            }
        } catch (error) {
            console.error(`Failed to read ${url}:`, error);
        }
    }

    return results;
}
