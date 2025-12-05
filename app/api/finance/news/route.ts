```
import { NextResponse } from 'next/server';
import { scrapeShareSansarNews } from '@/lib/finance/sharesansar-scraper';

export async function GET() {
    try {
        // Scrape real news from ShareSansar
        const newsItems = await scrapeShareSansarNews();
        
        if (newsItems.length > 0) {
            return NextResponse.json({
                status: 'success',
                results: newsItems
            });
        }

        // Fallback to mock data if scraping fails
        console.warn('ShareSansar scraping failed, using mock data');
        
        return NextResponse.json({
            status: 'success',
            results: [
                {
                    title: 'NEPSE Index surges by 25 points as market sentiment improves',
                    link: '#',
                    source_id: 'Mock Source',
                    pubDate: new Date().toISOString(),
                    description: 'The Nepal Stock Exchange (NEPSE) witnessed a significant jump today...',
                },
                {
                    title: 'Commercial Banks publish Q2 reports, profits soar',
                    link: '#',
                    source_id: 'Mock Source',
                    pubDate: new Date().toISOString(),
                    description: 'Major commercial banks have reported a healthy growth in net profit...',
                }
            ]
        });
    } catch (error) {
        console.error('Error fetching news:', error);
        return NextResponse.json(
            { error: 'Failed to fetch news' },
            { status: 500 }
        );
    }
}
```
