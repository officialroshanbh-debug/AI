import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url, title, source, imageUrl } = await req.json();
        const userId = (session.user as { id: string }).id;

        const saved = await prisma.savedArticle.create({
            data: {
                userId,
                url,
                title,
                source,
                imageUrl,
            },
        });

        return NextResponse.json(saved);
    } catch (error) {
        console.error('Error saving article:', error);
        return NextResponse.json({ error: 'Failed to save article' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url } = await req.json();
        const userId = (session.user as { id: string }).id;

        await prisma.savedArticle.deleteMany({
            where: {
                userId,
                url,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing bookmark:', error);
        return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
    }
}

export async function GET(_req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id: string }).id;
        const bookmarks = await prisma.savedArticle.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(bookmarks);
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
    }
}
