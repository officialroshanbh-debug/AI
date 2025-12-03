import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query, urls } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Use Jina Reader API for web search
        // Format: https://r.jina.ai/{url} for reading a single page
        // Format: https://s.jina.ai/{query} for searching

        const results: Array<{
            url: string;
            title: string;
            content: string;
            snippet: string;
        }> = [];

        if (urls && Array.isArray(urls)) {
            // Read specific URLs
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
        } else {
            // Search the web
            try {
                const searchResponse = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Return-Format': 'json',
                    },
                });

                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();

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
                return NextResponse.json(
                    { error: 'Search failed' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error('[Web Search API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to perform web search' },
            { status: 500 }
        );
    }
}
