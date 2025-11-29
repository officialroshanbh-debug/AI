import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { modelRouter } from '@/lib/models/router';
import { MODEL_IDS } from '@/types/ai-models';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, url } = body;

    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
    }

    // Use AI to generate a summary
    const provider = modelRouter.getProvider(MODEL_IDS.GPT_4_1);
    
    const prompt = `Please provide a concise summary (2-3 sentences) of the following news article. Focus on the key facts and main points.

Title: ${title}
${description ? `Description: ${description}` : ''}
URL: ${url}

Summary:`;

    const response = await provider.callModel({
      messages: [
        {
          role: 'system',
          content: 'You are a news summarization assistant. Provide clear, concise summaries of news articles.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: MODEL_IDS.GPT_4_1,
      temperature: 0.3,
      maxTokens: 200,
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

