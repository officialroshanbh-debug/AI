import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const templateSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    template: z.string().min(1).max(10000),
    category: z.enum(['general', 'coding', 'writing', 'analysis', 'research']).default('general'),
    variables: z.array(z.string()).optional(),
    isPublic: z.boolean().default(false),
});

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

        // Get user's templates + public templates
        const templates = await prisma.promptTemplate.findMany({
            where: {
                OR: [
                    { userId },
                    { isPublic: true }
                ]
            },
            orderBy: [
                { usageCount: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        return NextResponse.json({ templates });
    } catch (error) {
        console.error('[Templates API] GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}

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
        const validationResult = templateSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid template data', details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Create template
        const template = await prisma.promptTemplate.create({
            data: {
                userId,
                name: data.name,
                description: data.description,
                template: data.template,
                category: data.category,
                variables: data.variables || [],
                isPublic: data.isPublic,
            }
        });

        return NextResponse.json({ template }, { status: 201 });
    } catch (error) {
        console.error('[Templates API] POST error:', error);
        return NextResponse.json(
            { error: 'Failed to create template' },
            { status: 500 }
        );
    }
}
