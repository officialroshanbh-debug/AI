/**
 * API Route for exporting chats
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ChatExporter } from '@/lib/export/formatters';

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

    const body = await req.json();
    const { chatId, format, options } = body;

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Fetch chat and messages
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const exporter = new ChatExporter();
    const exportOptions = {
      format: format || 'markdown',
      includeCodeHighlighting: options?.includeCodeHighlighting ?? true,
      includeTimestamps: options?.includeTimestamps ?? true,
      includeMetadata: options?.includeMetadata ?? true,
    };

    const messages = chat.messages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: msg.createdAt,
      modelId: msg.modelId || undefined,
      tokens: msg.tokens || undefined,
    }));

    let exportedContent: string;
    let mimeType: string;
    let filename: string;

    switch (exportOptions.format) {
      case 'markdown':
        exportedContent = exporter.exportMarkdown(messages, exportOptions);
        mimeType = 'text/markdown';
        filename = `${chat.title || 'chat'}-${Date.now()}.md`;
        break;
      case 'html':
        exportedContent = exporter.exportHTML(messages, exportOptions);
        mimeType = 'text/html';
        filename = `${chat.title || 'chat'}-${Date.now()}.html`;
        break;
      case 'json':
        exportedContent = exporter.exportJSON(messages, exportOptions);
        mimeType = 'application/json';
        filename = `${chat.title || 'chat'}-${Date.now()}.json`;
        break;
      case 'pdf':
        // PDF export would require a library like puppeteer or pdfkit
        // For now, return HTML that can be printed to PDF
        exportedContent = exporter.exportHTML(messages, exportOptions);
        mimeType = 'text/html';
        filename = `${chat.title || 'chat'}-${Date.now()}.html`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    return new NextResponse(exportedContent, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Export API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export chat' },
      { status: 500 }
    );
  }
}

