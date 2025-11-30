/**
 * API Route for RAG search
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { RAGIndexer } from '@/lib/rag/indexer';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { query, limit, filters } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const indexer = new RAGIndexer();
    const results = await indexer.search(query, limit || 5, filters);
    const citations = indexer.generateCitations(results);

    return NextResponse.json({
      results: results.map(({ chunk, score }) => ({
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

