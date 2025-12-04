/**
 * Embeddings generation and semantic search for Himalaya training data
 */

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = 'text-embedding-ada-002';

export interface EmbeddingResult {
    embedding: number[];
    tokens: number;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text.slice(0, 8000), // Limit to ~8k characters
    });

    return {
        embedding: response.data[0]?.embedding || [],
        tokens: response.usage?.total_tokens || 0,
    };
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddingsBatch(
    texts: string[]
): Promise<EmbeddingResult[]> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts.map((t) => t.slice(0, 8000)),
    });

    return response.data.map((item) => ({
        embedding: item.embedding,
        tokens: response.usage?.total_tokens || 0,
    }));
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += (a[i] || 0) * (b[i] || 0);
        normA += (a[i] || 0) * (a[i] || 0);
        normB += (b[i] || 0) * (b[i] || 0);
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Find most similar embeddings from a list
 */
export function findTopSimilar(
    queryEmbedding: number[],
    embeddings: Array<{ embedding: number[]; data: unknown }>,
    topK: number = 5
): Array<{ data: unknown; similarity: number }> {
    const similarities = embeddings.map((item) => ({
        data: item.data,
        similarity: cosineSimilarity(queryEmbedding, item.embedding),
    }));

    return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
}

/**
 * Search training data by semantic similarity
 */
export async function semanticSearch(
    query: string,
    trainingData: Array<{ id: string; content: string; embedding: string | null; title: string }>,
    topK: number = 5,
    similarityThreshold: number = 0.7
): Promise<Array<{ id: string; title: string; content: string; similarity: number }>> {
    // Generate query embedding
    const { embedding: queryEmbedding } = await generateEmbedding(query);

    // Parse stored embeddings and calculate similarities
    const results = trainingData
        .filter((item) => item.embedding) // Only process items with embeddings
        .map((item) => {
            const embedding = JSON.parse(item.embedding!) as number[];
            const similarity = cosineSimilarity(queryEmbedding, embedding);

            return {
                id: item.id,
                title: item.title,
                content: item.content,
                similarity,
            };
        })
        .filter((item) => item.similarity >= similarityThreshold) // Filter by threshold
        .sort((a, b) => b.similarity - a.similarity) // Sort by similarity
        .slice(0, topK); // Take top K

    return results;
}
