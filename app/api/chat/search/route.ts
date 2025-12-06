
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const searchSchema = z.object({
    q: z.string().min(1).max(100),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        const result = searchSchema.safeParse({ q: query });
        if (!result.success) {
            return new NextResponse('Invalid query', { status: 400 });
        }

        const searchQuery = result.data.q;

        // Search chats by title or message content
        const chats = await prisma.chat.findMany({
            where: {
                userId: session.user.id,
                OR: [
                    { title: { contains: searchQuery, mode: 'insensitive' } },
                    {
                        messages: {
                            some: {
                                content: { contains: searchQuery, mode: 'insensitive' }
                            }
                        }
                    }
                ]
            },
            select: {
                id: true,
                title: true,
                createdAt: true,
                messages: {
                    // Get the first message that matches to show as snippet, or just first message
                    where: { content: { contains: searchQuery, mode: 'insensitive' } },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return NextResponse.json(chats);
    } catch (error) {
        console.error('[CHAT_SEARCH]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
