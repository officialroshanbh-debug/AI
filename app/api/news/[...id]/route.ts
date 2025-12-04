import { NextRequest, NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/news/news-fetcher';
import { scrapeArticleContent } from '@/lib/news/content-scraper';
import { readUrls } from '@/lib/research/search';
import type { NewsItem } from '@/lib/news/nepal-news-sources';

export const maxDuration = 60;
export const revalidate = 3600; // Revalidate every hour

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string[] }> }
) {
  try {
    const params = await context.params;
    // Reconstruct the URL from the catch-all segments
    // The ID might be encoded, so we decode it
    const urlString = params.id.map(segment => decodeURIComponent(segment)).join('/');

    // Check if it's a valid URL or just an ID
    const newsId = urlString;
    const targetUrl = urlString;

    // Fetch all recent news to find the item in cache first
    const allNews = await fetchAllNews(200, 4);
    let newsItem = allNews.find((item) => item.id === newsId || item.link === targetUrl);

    // If not found in cache, we'll create a basic item from the URL and try to scrape it
    if (!newsItem) {
      // Basic validation
      if (!targetUrl.startsWith('http')) {
        return NextResponse.json(
          { error: 'Invalid URL provided' },
          { status: 400 }
        );
      }

      newsItem = {
        id: targetUrl,
        title: 'Loading...',
        link: targetUrl,
        source: new URL(targetUrl).hostname.replace('www.', ''),
        sourceUrl: targetUrl,
        publishedAt: new Date(),
        category: 'general'
      };
    }

    // If we already have full content, return it
    if (newsItem.fullContent) {
      return NextResponse.json({ newsItem }, { status: 200 });
    }

    // Try to scrape with Jina Reader first (better quality)
    try {
      const jinaResults = await readUrls([targetUrl]);
      if (jinaResults && jinaResults.length > 0) {
        const result = jinaResults[0];

        // Better title extraction
        let title = result.title;
        if (!title || title === targetUrl || title.includes('http')) {
          // Try to extract from URL slug
          const urlObj = new URL(targetUrl);
          const slug = urlObj.pathname.split('/').pop() || '';
          if (slug) {
            title = slug.replace(/-/g, ' ').replace(/\d+/g, '').trim();
            // Capitalize first letter of each word
            title = title.replace(/\b\w/g, l => l.toUpperCase());
          }
        }

        const enrichedItem: NewsItem = {
          ...newsItem,
          title: title || newsItem.title,
          fullContent: result.content,
          summary: result.snippet || (result.content ? result.content.slice(0, 300) + '...' : ''),
          description: result.snippet || newsItem.description,
        };
        return NextResponse.json({ newsItem: enrichedItem }, { status: 200 });
      }
    } catch (e) {
      console.warn('Jina scraping failed, falling back to basic scraper', e);
    }

    // Fallback: Scrape the full content with basic scraper
    const scrapedContent = await scrapeArticleContent(targetUrl);

    if (scrapedContent) {
      const enrichedItem: NewsItem = {
        ...newsItem,
        title: scrapedContent.title || newsItem.title,
        fullContent: scrapedContent.content,
        summary: scrapedContent.content ? scrapedContent.content.slice(0, 300) + '...' : '', // Auto-generate summary from content
        imageUrl: scrapedContent.imageUrl || newsItem.imageUrl,
        publishedAt: scrapedContent.publishedDate || newsItem.publishedAt,
      };

      return NextResponse.json({ newsItem: enrichedItem }, { status: 200 });
    }

    // If scraping failed, return the item without full content
    return NextResponse.json({ newsItem }, { status: 200 });
  } catch (error) {
    console.error('Error fetching news item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news item' },
      { status: 500 }
    );
  }
}

