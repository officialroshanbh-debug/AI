import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { InterestAgent } from '@/lib/agents/interest-agent';
import { performNewsSearch } from '@/lib/research/news-search';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id: string }).id;

        // 1. Get user profile and interests
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { interests: true, lastAnalyzedAt: true },
        });

        // 2. Check if we need to re-analyze interests (e.g., every 24 hours)
        const shouldAnalyze = !user?.lastAnalyzedAt ||
            (new Date().getTime() - new Date(user.lastAnalyzedAt).getTime() > 24 * 60 * 60 * 1000);

        if (shouldAnalyze) {
            // Trigger analysis in background (fire-and-forget)
            InterestAgent.analyzeUserInterests(userId).catch(console.error);
        }

        // 3. Fetch "For You" News
        let forYouNews: any[] = [];
        const interests = user?.interests || [];

        if (interests.length > 0) {
            // Pick top 3 interests to search
            const query = interests.slice(0, 3).join(' OR ');
            forYouNews = await performNewsSearch(query);
        } else {
            // Fallback if no interests yet
            forYouNews = await performNewsSearch('Technology OR Science OR Health');
        }

        // 4. Fetch "Trending" News (Nepal/Global)
        // TODO: Get user location from request or profile if available
        const trendingNews = await performNewsSearch('top headlines', 'np');

        return NextResponse.json({
            forYou: forYouNews,
            trending: trendingNews,
            interests: interests,
        });

    } catch (error) {
        console.error('[DiscoverAPI] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
