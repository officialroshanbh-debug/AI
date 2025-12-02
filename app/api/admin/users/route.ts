import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/users
 * List all users with pagination and search
 */
export async function GET(req: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search');

        const skip = (page - 1) * limit;

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    _count: {
                        select: {
                            chats: true,
                            usageLogs: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/users
 * Update user role
 */
export async function PATCH(req: NextRequest) {
    try {
        await requireAdmin();

        const body = await req.json();
        const { userId, role } = body;

        if (!userId || !role) {
            return NextResponse.json(
                { error: 'Missing userId or role' },
                { status: 400 }
            );
        }

        if (role !== 'admin' && role !== 'user') {
            return NextResponse.json(
                { error: 'Invalid role. Must be "admin" or "user"' },
                { status: 400 }
            );
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}
