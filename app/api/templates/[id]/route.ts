import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    template: z.string().min(1).max(10000).optional(),
    category: z.enum(['general', 'coding', 'writing', 'analysis', 'research']).optional(),
    variables: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const template = await prisma.promptTemplate.findUnique({
            where: { id }
        });

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // Check access: owner or public template
        const userId = (session.user as { id?: string }).id;
        if (template.userId !== userId && !template.isPublic) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ template });
    } catch (error) {
        console.error('[Template API] GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch template' },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if template exists and user owns it
        const existing = await prisma.promptTemplate.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        if (existing.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const validationResult = updateSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid template data', details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Update template
        const template = await prisma.promptTemplate.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.template && { template: data.template }),
                ...(data.category && { category: data.category }),
                ...(data.variables && { variables: data.variables }),
                ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
                version: { increment: 1 },
            }
        });

        return NextResponse.json({ template });
    } catch (error) {
        console.error('[Template API] PUT error:', error);
        return NextResponse.json(
            { error: 'Failed to update template' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if template exists and user owns it
        const existing = await prisma.promptTemplate.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        if (existing.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete template
        await prisma.promptTemplate.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Template API] DELETE error:', error);
        return NextResponse.json(
            { error: 'Failed to delete template' },
            { status: 500 }
        );
    }
}
