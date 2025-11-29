import { NextRequest, NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/news/news-fetcher';
import { scrapeArticleContent } from '@/lib/news/content-scraper';
import type { NewsItem } from '@/lib/news/nepal-news-sources';

export const maxDuration = 60;
export const revalidate = 3600; // Revalidate every hour

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const newsId = params.id;

    // Fetch all recent news to find the item
    const allNews = await fetchAllNews(200, 4);
    const newsItem = allNews.find((item) => item.id === newsId);

    if (!newsItem) {
      return NextResponse.json(
        { error: 'News item not found' },
        { status: 404 }
      );
    }

    // If we already have full content, return it
    if (newsItem.fullContent) {
      return NextResponse.json({ newsItem }, { status: 200 });
    }

    // Scrape the full content
    const scrapedContent = await scrapeArticleContent(newsItem.link);

    if (scrapedContent) {
      const enrichedItem: NewsItem = {
        ...newsItem,
        fullContent: scrapedContent.content,
        summary: scrapedContent.content.slice(0, 300) + '...', // Auto-generate summary from content
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

