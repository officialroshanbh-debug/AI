import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import {
    getAnalyticsOverview,
    getUserGrowth,
    getModelUsage,
    getRecentSignups,
    getRecentChats,
} from '@/lib/analytics/analytics';

/**
 * GET /api/admin/analytics
 * Returns comprehensive analytics data for admin dashboard
 */
export async function GET() {
    try {
        await requireAdmin();

        // Parallel queries for speed (Vercel serverless optimized)
        const [overview, userGrowth, modelUsage, recentSignups, recentChats] =
            await Promise.all([
                getAnalyticsOverview(),
                getUserGrowth(),
                getModelUsage(),
                getRecentSignups(),
                getRecentChats(),
            ]);

        return NextResponse.json({
            overview,
            charts: {
                userGrowth,
                modelUsage,
            },
            recent: {
                signups: recentSignups,
                chats: recentChats,
            },
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
