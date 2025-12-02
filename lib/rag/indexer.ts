/**
 * Advanced RAG (Retrieval-Augmented Generation)
 * Document upload/indexing, web scraping, knowledge base, citations
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Document {
  id: string;
  title: string;
  type: 'upload' | 'web' | 'knowledge_base';
  source?: string; // URL or file path
  content: string;
  metadata?: {
    author?: string;
    date?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

export interface Citation {
  id: string;
  documentId?: string;
  source: string;
  quote?: string;
  relevance: number;
  pageNumber?: number;
}

export class RAGIndexer {
  /**
   * Chunk a document into smaller pieces for embedding
   */
  chunkDocument(
    document: Document,
    chunkSize: number = 1000,
    overlap: number = 200
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const content = document.content;

    let start = 0;
    let chunkIndex = 0;

    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length);
      const chunkContent = content.slice(start, end);

      chunks.push({
        id: `${document.id}-chunk-${chunkIndex}`,
        documentId: document.id,
        content: chunkContent,
        chunkIndex,
        metadata: {
          ...document.metadata,
          startChar: start,
          endChar: end,
        },
      });

      start = end - overlap;
      chunkIndex++;
    }

    return chunks;
  }

  /**
   * Generate embeddings for document chunks using OpenAI
   */
  async generateEmbeddings(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[RAG] OPENAI_API_KEY not set, skipping embeddings');
      return chunks;
    }

    try {
      // Batch process chunks (OpenAI allows up to 2048 inputs per request)
      const batchSize = 100;
      const embeddedChunks: DocumentChunk[] = [];

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const texts = batch.map((chunk) => chunk.content);

        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small', // or 'text-embedding-ada-002'
          input: texts,
        });

        batch.forEach((chunk, index) => {
          embeddedChunks.push({
            ...chunk,
            embedding: response.data[index]?.embedding || [],
          });
        });
      }

      return embeddedChunks;
    } catch (error) {
      console.error('[RAG] Embedding generation failed:', error);
      // Return chunks without embeddings on error
      return chunks;
    }
  }

  /**
   * Index a document (chunk and embed)
   */
  async indexDocument(document: Document): Promise<DocumentChunk[]> {
    const chunks = this.chunkDocument(document);
    const embeddedChunks = await this.generateEmbeddings(chunks);

    // In production, this would save to vector database (Pinecone, Supabase Vector, etc.)

    return embeddedChunks;
  }

  /**
   * Generate embedding for a query string
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not set');
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });


    return response.data[0]?.embedding || [];
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Search for relevant documents/chunks using semantic similarity
   */
  async search(
    query: string,
    _limit: number = 5,
    _filters?: Record<string, unknown>
  ): Promise<Array<{ chunk: DocumentChunk; score: number }>> {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[RAG] OPENAI_API_KEY not set, returning empty results');
      return [];
    }

    try {
      // Generate query embedding (used in actual implementation via API route)
      await this.generateQueryEmbedding(query);

      // In production, this would query a vector database (Pinecone, Supabase Vector, etc.)
      // For now, we'll do a simple in-memory search using cosine similarity
      // This requires chunks to be loaded from the database with their embeddings

      // This is a placeholder - actual implementation would:
      // 1. Load chunks from database (with embeddings) matching filters
      // 2. Calculate cosine similarity for each chunk
      // 3. Sort by score and return top N

      return [];
    } catch (error) {
      console.error('[RAG] Search failed:', error);
      return [];
    }
  }

  /**
   * Generate citations for retrieved chunks
   */
  generateCitations(
    chunks: Array<{ chunk: DocumentChunk; score: number }>
  ): Citation[] {
    return chunks.map(({ chunk, score }) => ({
      id: `citation-${chunk.id}`,
      documentId: chunk.documentId,
      source: chunk.metadata?.source as string || 'Unknown',
      quote: chunk.content.slice(0, 200), // First 200 chars as quote
      relevance: score,
    }));
  }

  /**
   * Scrape and index a web page
   */
  async scrapeAndIndex(url: string): Promise<Document> {
    // In production, this would:
    // 1. Fetch the web page
    // 2. Parse HTML and extract content
    // 3. Clean and structure the content
    // 4. Create a document and index it

    return {
      id: `web-${Date.now()}`,
      title: 'Web Page',
      type: 'web',
      source: url,
      content: 'Content would be scraped here',
      metadata: {
        url,
        scrapedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Delete a document and its chunks
   */
  async deleteDocument(_documentId: string): Promise<void> {
    // Implementation would delete from database and vector store
  }
}

