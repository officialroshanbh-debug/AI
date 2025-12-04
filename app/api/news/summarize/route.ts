import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { HimalayaProvider } from '@/lib/models/himalaya-provider';

export const maxDuration = 60; // Increased duration for longer content

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, url, content } = body;

    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
    }

    // Use Himalaya model for summarization
    const provider = new HimalayaProvider();

    // If content is missing, try to scrape it
    let articleContent = content;
    if (!articleContent && url) {
      try {
        const { scrapeArticleContent } = await import('@/lib/news/content-scraper');
        const scraped = await scrapeArticleContent(url);
        if (scraped && scraped.content) {
          articleContent = scraped.content;
        }
      } catch (e) {
        console.warn('Failed to scrape content for summary:', e);
      }
    }

    const prompt = `Please provide a comprehensive and insightful summary of the following news article. 
Focus on the key facts, main arguments, and broader context. Maintain a neutral and objective tone.

Title: ${title}
URL: ${url}
${description ? `Description: ${description}` : ''}

${articleContent ? `Full Article Content:
${articleContent.slice(0, 15000)}` : ''}

Summary:`;

    const response = await provider.callModel({
      messages: [
        {
          role: 'system',
          content: 'You are Himalaya, an advanced AI assistant. Provide deep, structured, and comprehensive summaries of news articles.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'himalaya', // Use fine-tuned model if available
      temperature: 0.3,
      maxTokens: 1000,
      userId: session.user.id,
      chatId: 'news-summary', // Virtual chat ID for summaries
    });

    return NextResponse.json({
      summary: response.content,
      title,
      url,
    }, { status: 200 });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

