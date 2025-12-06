
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Prompt ID required' }, { status: 400 });
        }

        await prisma.promptTemplate.update({
            where: { id },
            data: {
                usageCount: {
                    increment: 1
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating usage count:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
