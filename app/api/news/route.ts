import { fetchAllNepalNews } from '@/lib/news/news-fetcher';
import { NextResponse } from 'next/server';

export const maxDuration = 30;
export const revalidate = 300; // Revalidate every 5 minutes

export async function GET() {
  try {
    const news = await fetchAllNepalNews(20);
    
    return NextResponse.json({ news }, { status: 200 });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', news: [] },
      { status: 500 }
    );
  }
}

