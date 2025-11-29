import { fetchAllNews, fetchNewsByCategory } from '@/lib/news/news-fetcher';
import { NextRequest, NextResponse } from 'next/server';
import type { NewsItem } from '@/lib/news/nepal-news-sources';

export const maxDuration = 60; // Increased for multiple sources
export const revalidate = 300; // Revalidate every 5 minutes

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get('category') as NewsItem['category'] | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const maxDaysOld = parseInt(searchParams.get('maxDaysOld') || '4', 10);

    let news: NewsItem[];
    
    if (category && ['tech', 'finance', 'sports', 'entertainment', 'science', 'politics', 'general'].includes(category)) {
      news = await fetchNewsByCategory(category, limit, maxDaysOld);
    } else {
      news = await fetchAllNews(limit, maxDaysOld);
    }

    // Group by category for easier frontend consumption
    const newsByCategory: Record<string, NewsItem[]> = {};
    news.forEach((item) => {
      const cat = item.category || 'general';
      if (!newsByCategory[cat]) {
        newsByCategory[cat] = [];
      }
      newsByCategory[cat].push(item);
    });
    
    return NextResponse.json({ 
      news,
      newsByCategory,
      total: news.length,
      categories: Object.keys(newsByCategory),
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', news: [], newsByCategory: {}, total: 0, categories: [] },
      { status: 500 }
    );
  }
}

