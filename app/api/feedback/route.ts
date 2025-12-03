import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const feedbackSchema = z.object({
    messageId: z.string(),
    rating: z.number().min(1).max(5), // 1 = thumbs down, 5 = thumbs up
    category: z.enum(['incorrect', 'harmful', 'not_helpful', 'other', 'positive']).optional(),
    comment: z.string().max(1000).optional(),
});

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
        const validationResult = feedbackSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid feedback data', details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const { messageId, rating, category, comment } = validationResult.data;

        // Verify message exists and belongs to user's chat
        const message = await prisma.message.findFirst({
            where: {
                id: messageId,
                chat: { userId },
            },
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }


        // Create or update feedback
        // First, check if feedback already exists
        const existingFeedback = await prisma.feedback.findFirst({
            where: {
                messageId,
                userId,
            },
        });

        const feedback = existingFeedback
            ? await prisma.feedback.update({
                where: { id: existingFeedback.id },
                data: {
                    rating,
                    category,
                    comment,
                },
            })
            : await prisma.feedback.create({
                data: {
                    messageId,
                    userId,
                    rating,
                    category,
                    comment,
                },
            });


        return NextResponse.json({ success: true, feedback }, { status: 201 });
    } catch (error) {
        console.error('[Feedback API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to submit feedback' },
            { status: 500 }
        );
    }
}

export async function GET(_req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get all feedback with message context
        const feedback = await prisma.feedback.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                message: {
                    select: {
                        content: true,
                        role: true,
                        modelId: true,
                        chat: {
                            select: {
                                title: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({ feedback });
    } catch (error) {
        console.error('[Feedback API] GET Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch feedback' },
            { status: 500 }
        );
    }
}
