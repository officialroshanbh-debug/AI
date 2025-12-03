import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { performWebSearch, readUrls } from '@/lib/research/search';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query, urls } = await req.json();

        if (!query && (!urls || urls.length === 0)) {
            return NextResponse.json({ error: 'Query or URLs are required' }, { status: 400 });
        }

        let results;

        if (urls && Array.isArray(urls) && urls.length > 0) {
            results = await readUrls(urls);
        } else {
            results = await performWebSearch(query);
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error('[Web Search API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to perform web search' },
            { status: 500 }
        );
    }
}
