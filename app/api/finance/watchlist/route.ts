import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const watchlist = await prisma.watchlist.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(watchlist);
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { symbol, name } = await req.json();

        if (!symbol || !name) {
            return NextResponse.json({ error: 'Symbol and name are required' }, { status: 400 });
        }

        const item = await prisma.watchlist.create({
            data: {
                userId: session.user.id,
                symbol,
                name,
            },
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const symbol = searchParams.get('symbol');

        if (id) {
            await prisma.watchlist.delete({
                where: { id },
            });
        } else if (symbol) {
            await prisma.watchlist.deleteMany({
                where: {
                    userId: session.user.id,
                    symbol
                },
            });
        } else {
            return NextResponse.json({ error: 'ID or Symbol required' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
    }
}
