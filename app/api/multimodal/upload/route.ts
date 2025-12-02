/**
 * API Route for uploading and processing multimodal content
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { MultimodalProcessor } from '@/lib/multimodal/processor';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const chatId = formData.get('chatId') as string | null;
    const messageId = formData.get('messageId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const processor = new MultimodalProcessor();
    
    // Process the media file (now includes upload to Vercel Blob + AI analysis)
    const result = await processor.processMedia(file, file.name);

    // Save to database with blob URL and analysis results
    const mediaFile = await prisma.mediaFile.create({
      data: {
        userId,
        chatId: chatId || null,
        messageId: messageId || null,
        type: result.mediaFile.type,
        url: result.mediaFile.url, // Now includes Vercel Blob URL
        filename: result.mediaFile.filename,
        mimeType: result.mediaFile.mimeType,
        size: result.mediaFile.size,
        metadata: (result.mediaFile.metadata || {}) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      mediaFile,
      analysis: result.analysis,
    });
  } catch (error) {
    console.error('[Multimodal Upload API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process media file' },
      { status: 500 }
    );
  }
}

