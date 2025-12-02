import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { generateEmbeddingsBatch } from '@/lib/himalaya/embeddings';
import { Prisma } from '@prisma/client';

/**
 * POST /api/admin/himalaya/upload
 * Bulk upload training data from various formats
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await requireAdmin();

        const body = await req.json();
        const { data, category } = body;

        if (!data || !Array.isArray(data) || data.length === 0) {
            return NextResponse.json(
                { error: 'Invalid data format. Expected array of { title, content }' },
                { status: 400 }
            );
        }

        if (!category) {
            return NextResponse.json(
                { error: 'Missing required field: category' },
                { status: 400 }
            );
        }

        // Validate data format
        for (const item of data) {
            if (!item.title || !item.content) {
                return NextResponse.json(
                    { error: 'Each item must have title and content' },
                    { status: 400 }
                );
            }
        }

        // Generate embeddings in batch
        const contents = data.map((item: { content: string }) => item.content);
        const embeddings = await generateEmbeddingsBatch(contents);

        // Create training data records
        const trainingDataRecords = data.map((item: { title: string; content: string; metadata?: Prisma.InputJsonValue }, index: number) => ({
            title: item.title,
            content: item.content,
            category,
            embedding: JSON.stringify(embeddings[index]?.embedding || []),
            metadata: item.metadata || {},
            uploadedBy: userId,
        }));

        const result = await prisma.himalayaTrainingData.createMany({
            data: trainingDataRecords,
        });

        return NextResponse.json({
            success: true,
            count: result.count,
            message: `Successfully uploaded ${result.count} training examples`,
        }, { status: 201 });
    } catch (error) {
        console.error('Error uploading training data:', error);
        return NextResponse.json(
            { error: 'Failed to upload training data' },
            { status: 500 }
        );
    }
}
