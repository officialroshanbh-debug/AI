/**
 * Analytics data aggregation utilities
 * Optimized for Vercel serverless (fast queries, no heavy computation)
 */

import { prisma } from '@/lib/prisma';

export interface AnalyticsOverview {
    users: {
        total: number;
        newToday: number;
        activeWeek: number;
    };
    chats: {
        total: number;
        totalMessages: number;
    };
    usage: {
        apiCallsToday: number;
        tokensUsed: number;
    };
}

export interface UserGrowth {
    date: string;
    count: number;
}

export interface ModelUsage {
    modelId: string;
    count: number;
    percentage: number;
}

/**
 * Get overview analytics (optimized for serverless)
 */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Parallel queries for speed
    const [
        totalUsers,
        newUsersToday,
        activeUsersWeek,
        totalChats,
        totalMessages,
        apiCallsToday,
        tokensUsed,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.user.count({
            where: {
                chats: {
                    some: {
                        updatedAt: { gte: weekAgo },
                    },
                },
            },
        }),
        prisma.chat.count(),
        prisma.message.count(),
        prisma.usageLog.count({ where: { createdAt: { gte: today } } }),
        prisma.usageLog.aggregate({
            _sum: { tokens: true },
            where: { createdAt: { gte: weekAgo } },
        }),
    ]);

    return {
        users: {
            total: totalUsers,
            newToday: newUsersToday,
            activeWeek: activeUsersWeek,
        },
        chats: {
            total: totalChats,
            totalMessages,
        },
        usage: {
            apiCallsToday,
            tokensUsed: tokensUsed._sum.tokens || 0,
        },
    };
}

/**
 * Get user growth data (last 30 days)
 */
export async function getUserGrowth(): Promise<UserGrowth[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const users = await prisma.user.findMany({
        where: {
            createdAt: { gte: thirtyDaysAgo },
        },
        select: {
            createdAt: true,
        },
        orderBy: {
            createdAt: 'asc',
        },
    });

    // Group by date
    const growthMap = new Map<string, number>();
    users.forEach((user) => {
        const date = user.createdAt.toISOString().split('T')[0];
        growthMap.set(date, (growthMap.get(date) || 0) + 1);
    });

    // Convert to array and fill missing dates
    const result: UserGrowth[] = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
            date: dateStr,
            count: growthMap.get(dateStr) || 0,
        });
    }

    return result;
}

/**
 * Get model usage breakdown
 */
export async function getModelUsage(): Promise<ModelUsage[]> {
    const usage = await prisma.usageLog.groupBy({
        by: ['modelId'],
        _count: {
            modelId: true,
        },
        where: {
            modelId: { not: null },
        },
    });

    const total = usage.reduce((sum, item) => sum + item._count.modelId, 0);

    return usage
        .map((item) => ({
            modelId: item.modelId || 'unknown',
            count: item._count.modelId,
            percentage: total > 0 ? (item._count.modelId / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Get recent signups (last 10)
 */
export async function getRecentSignups() {
    return prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            _count: {
                select: {
                    chats: true,
                },
            },
        },
    });
}

/**
 * Get recent chats
 */
export async function getRecentChats() {
    return prisma.chat.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            createdAt: true,
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    messages: true,
                },
            },
        },
    });
}
