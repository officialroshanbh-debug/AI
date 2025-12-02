/**
 * API Route for RAG search
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { RAGIndexer } from '@/lib/rag/indexer';
import type { DocumentChunk } from '@/lib/rag/indexer';

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
    const { query, limit = 5, filters } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const indexer = new RAGIndexer();
    
    // Generate query embedding
    const queryEmbedding = await indexer['generateQueryEmbedding'](query);

    // Load chunks from database with embeddings
    const chunks = await prisma.documentChunk.findMany({
      where: {
        document: {
          userId,
          ...(filters?.documentId ? { id: filters.documentId as string } : {}),
          ...(filters?.type ? { type: filters.type as string } : {}),
        },
        embedding: { not: null }, // Only chunks with embeddings
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            type: true,
            source: true,
          },
        },
      },
      take: 100, // Load more chunks for similarity calculation
    });

    // Calculate cosine similarity for each chunk
    const results: Array<{ chunk: DocumentChunk; score: number }> = [];
    
    for (const dbChunk of chunks) {
      if (!dbChunk.embedding) continue;

      const chunkEmbedding = JSON.parse(dbChunk.embedding) as number[];
      const similarity = indexer['cosineSimilarity'](queryEmbedding, chunkEmbedding);

      results.push({
        chunk: {
          id: dbChunk.id,
          documentId: dbChunk.documentId,
          content: dbChunk.content,
          chunkIndex: dbChunk.chunkIndex,
          embedding: chunkEmbedding,
          metadata: (dbChunk.metadata as Record<string, unknown>) || {},
        },
        score: similarity,
      });
    }

    // Sort by score and take top N
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, limit);

    const citations = indexer.generateCitations(topResults);

    return NextResponse.json({
      results: topResults.map(({ chunk, score }) => ({
        chunk: {
          id: chunk.id,
          content: chunk.content,
          documentId: chunk.documentId,
          metadata: chunk.metadata,
        },
        score,
      })),
      citations,
    });
  } catch (error) {
    console.error('[RAG Search API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to search documents' },
      { status: 500 }
    );
  }
}

