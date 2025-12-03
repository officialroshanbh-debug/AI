import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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

        // Check if key exists and user owns it
        const existing = await prisma.apiKey.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'API key not found' }, { status: 404 });
        }

        if (existing.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Revoke key (soft delete)
        await prisma.apiKey.update({
            where: { id },
            data: { revoked: true }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API Key DELETE] Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete API key' },
            { status: 500 }
        );
    }
}
