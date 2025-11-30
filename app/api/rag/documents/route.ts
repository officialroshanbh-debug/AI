/**
 * API Route for RAG document management
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { RAGIndexer } from '@/lib/rag/indexer';

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
    const { title, type, source, content, metadata } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create document
    const document = await prisma.document.create({
      data: {
        userId,
        title,
        type: type || 'upload',
        source: source || null,
        content,
        metadata: metadata || {},
      },
    });

    // Index the document
    const indexer = new RAGIndexer();
    const chunks = await indexer.indexDocument({
      id: document.id,
      title: document.title,
      type: document.type as 'upload' | 'web' | 'knowledge_base',
      source: document.source || undefined,
      content: document.content,
      metadata: document.metadata as Record<string, unknown> | undefined,
    });

    // Save chunks to database
    await prisma.documentChunk.createMany({
      data: chunks.map(chunk => ({
        documentId: chunk.documentId,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        embedding: chunk.embedding ? JSON.stringify(chunk.embedding) : null,
        metadata: chunk.metadata || {},
      })),
    });

    return NextResponse.json({ document, chunks: chunks.length });
  } catch (error) {
    console.error('[RAG Documents API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const documents = await prisma.document.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      include: {
        chunks: {
          select: { id: true, chunkIndex: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('[RAG Documents API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

