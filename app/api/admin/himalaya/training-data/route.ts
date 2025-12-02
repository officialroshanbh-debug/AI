import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/himalaya/embeddings';
import { Prisma } from '@prisma/client';

/**
 * GET /api/admin/himalaya/training-data
 * List all training data with pagination and filters
 */
export async function GET(req: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const isActive = searchParams.get('isActive');

        const skip = (page - 1) * limit;

        // Build where clause
        const where: {
            category?: string;
            isActive?: boolean;
            OR?: Array<{ title?: { contains: string }; content?: { contains: string } }>;
        } = {};

        if (category) {
            where.category = category;
        }

        if (isActive !== null && isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { content: { contains: search } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.himalayaTrainingData.findMany({
                where,
                skip,
                take: limit,
                orderBy: { uploadedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.himalayaTrainingData.count({ where }),
        ]);

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching training data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch training data' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/himalaya/training-data
 * Create new training data with automatic embedding generation
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await requireAdmin();

        const body = await req.json();
        const { title, content, category, metadata } = body;

        if (!title || !content || !category) {
            return NextResponse.json(
                { error: 'Missing required fields: title, content, category' },
                { status: 400 }
            );
        }

        // Generate embedding
        const { embedding } = await generateEmbedding(content);

        // Store training data
        const trainingData = await prisma.himalayaTrainingData.create({
            data: {
                title,
                content,
                category,
                embedding: JSON.stringify(embedding),
                metadata: metadata || {},
                uploadedBy: userId,
            },
        });

        return NextResponse.json(trainingData, { status: 201 });
    } catch (error) {
        console.error('Error creating training data:', error);
        return NextResponse.json(
            { error: 'Failed to create training data' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/himalaya/training-data
 * Update training data
 */
export async function PATCH(req: NextRequest) {
    try {
        await requireAdmin();

        const body = await req.json();
        const { id, title, content, category, metadata, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Missing required field: id' },
                { status: 400 }
            );
        }

        const updateData: {
            title?: string;
            content?: string;
            category?: string;
            embedding?: string;
            metadata?: Prisma.InputJsonValue;
            isActive?: boolean;
        } = {};

        if (title) updateData.title = title;
        if (category) updateData.category = category;
        if (metadata) updateData.metadata = metadata;
        if (isActive !== undefined) updateData.isActive = isActive;

        // If content changed, regenerate embedding
        if (content) {
            updateData.content = content;
            const { embedding } = await generateEmbedding(content);
            updateData.embedding = JSON.stringify(embedding);
        }

        const trainingData = await prisma.himalayaTrainingData.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(trainingData);
    } catch (error) {
        console.error('Error updating training data:', error);
        return NextResponse.json(
            { error: 'Failed to update training data' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/himalaya/training-data
 * Delete training data
 */
export async function DELETE(req: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Missing required parameter: id' },
                { status: 400 }
            );
        }

        await prisma.himalayaTrainingData.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting training data:', error);
        return NextResponse.json(
            { error: 'Failed to delete training data' },
            { status: 500 }
        );
    }
}
