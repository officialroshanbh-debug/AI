import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import {
    formatAsJSONL,
    uploadTrainingFile,
    createFineTuneJob,
    getFineTuneStatus,
    cancelFineTuneJob,
} from '@/lib/himalaya/fine-tuning';

/**
 * GET /api/admin/himalaya/fine-tune
 * List all fine-tune jobs
 */
export async function GET(req: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const where = status ? { status } : {};

        const jobs = await prisma.himalayaFineTune.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({ jobs });
    } catch (error) {
        console.error('Error fetching fine-tune jobs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch fine-tune jobs' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/himalaya/fine-tune
 * Create a new fine-tune job
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await requireAdmin();

        const body = await req.json();
        const { trainingDataIds, hyperparameters } = body;

        if (!trainingDataIds || !Array.isArray(trainingDataIds) || trainingDataIds.length === 0) {
            return NextResponse.json(
                { error: 'Missing or invalid trainingDataIds' },
                { status: 400 }
            );
        }

        // Fetch training data
        const trainingData = await prisma.himalayaTrainingData.findMany({
            where: {
                id: { in: trainingDataIds },
                isActive: true,
            },
        });

        if (trainingData.length === 0) {
            return NextResponse.json(
                { error: 'No valid training data found' },
                { status: 400 }
            );
        }

        // Format as JSONL
        const examples = trainingData.map((item) => ({
            messages: [
                {
                    role: 'system' as const,
                    content: 'You are Himalaya, an advanced AI assistant with deep reasoning capabilities.',
                },
                {
                    role: 'user' as const,
                    content: item.title, // Use title as question/prompt
                },
                {
                    role: 'assistant' as const,
                    content: item.content, // Use content as response
                },
            ],
        }));

        const jsonlContent = formatAsJSONL(examples);

        // Upload to OpenAI
        const fileId = await uploadTrainingFile(jsonlContent);

        // Create fine-tune job
        const jobId = await createFineTuneJob({
            trainingFileId: fileId,
            hyperparameters: hyperparameters || {},
            userId,
        });

        return NextResponse.json({
            success: true,
            jobId,
            message: 'Fine-tune job created successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating fine-tune job:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create fine-tune job' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/himalaya/fine-tune
 * Update fine-tune job status (refresh from OpenAI)
 */
export async function PATCH(req: NextRequest) {
    try {
        await requireAdmin();

        const body = await req.json();
        const { jobId, action } = body;

        if (!jobId) {
            return NextResponse.json(
                { error: 'Missing required field: jobId' },
                { status: 400 }
            );
        }

        if (action === 'cancel') {
            const job = await cancelFineTuneJob(jobId);
            return NextResponse.json({ job });
        }

        // Default: refresh status
        const job = await getFineTuneStatus(jobId);
        return NextResponse.json({ job });
    } catch (error) {
        console.error('Error updating fine-tune job:', error);
        return NextResponse.json(
            { error: 'Failed to update fine-tune job' },
            { status: 500 }
        );
    }
}
