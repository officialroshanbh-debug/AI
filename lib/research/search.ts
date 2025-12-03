

export interface SearchResult {
    url: string;
    title: string;
    content: string;
    snippet: string;
}

export async function performWebSearch(query: string, limit: number = 5): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    console.log(`[Search] Performing search for: "${query}"`);

    try {
        // 1. Try Jina Search first
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'X-Return-Format': 'json',
        };

        if (process.env.JINA_API_KEY) {
            headers['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`;
        }

        const searchResponse = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
            headers,
        });

        if (searchResponse.ok) {
            const data = await searchResponse.json();
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                console.log(`[Search] Jina returned ${data.data.length} results`);
                // Jina returns a list of results directly
                for (const item of data.data.slice(0, limit)) {
                    results.push({
                        url: item.url,
                        title: item.title,
                        content: item.content || '',
                        snippet: item.description || item.content?.substring(0, 200) || '',
                    });
                }
                return results;
            }
        }

        console.log('[Search] Jina search failed or returned no results, trying Google fallback');

        // 2. Fallback to Google Custom Search
        if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
            const fallbackSearch = await fetch(
                `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=${limit}`
            );

            if (fallbackSearch.ok) {
                const googleData = await fallbackSearch.json();
                console.log(`[Search] Google returned ${googleData.items?.length || 0} results`);

                interface GoogleSearchItem {
                    link: string;
                    title: string;
                    snippet?: string;
                }

                // Now scrape each result with Jina Reader in parallel
                const scrapePromises = (googleData.items || []).map(async (item: GoogleSearchItem) => {
                    try {
                        const readResponse = await fetch(`https://r.jina.ai/${encodeURIComponent(item.link)}`, {
                            headers: {
                                'Accept': 'application/json',
                                'X-Return-Format': 'json',
                            },
                        });

                        if (readResponse.ok) {
                            const pageData = await readResponse.json();
                            return {
                                url: item.link,
                                title: pageData.title || item.title,
                                content: pageData.content || '',
                                snippet: pageData.description || item.snippet || '',
                            };
                        } else {
                            // If read fails, return basic Google result
                            return {
                                url: item.link,
                                title: item.title,
                                content: '',
                                snippet: item.snippet || '',
                            };
                        }
                    } catch (error) {
                        console.error(`Failed to read ${item.link}:`, error);
                        // Return basic result even if reading fails
                        return {
                            url: item.link,
                            title: item.title,
                            content: '',
                            snippet: item.snippet || '',
                        };
                    }
                });

                const scrapedResults = await Promise.all(scrapePromises);
                results.push(...scrapedResults);
            } else {
                console.error('[Search] Google search failed:', await fallbackSearch.text());
            }
        } else {
            console.warn('[Search] Google Search credentials missing, skipping fallback');
        }
    } catch (error) {
        console.error('[Search] Search failed:', error);
    }

    return results;
}

export async function readUrls(urls: string[]): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    const promises = urls.slice(0, 5).map(async (url) => {
        try {
            const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Return-Format': 'json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    url,
                    title: data.title || url,
                    content: data.content || '',
                    snippet: data.description || data.content?.substring(0, 200) || '',
                };
            }
        } catch (error) {
            console.error(`Failed to read ${url}:`, error);
        }
        return null;
    });

    const scrapedResults = await Promise.all(promises);
    // Filter out nulls
    results.push(...scrapedResults.filter((r): r is SearchResult => r !== null));

    return results;
}
