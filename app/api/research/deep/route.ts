import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { performDeepResearch } from '@/lib/research/deep-research';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Perform deep research
        const result = await performDeepResearch(query);

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Deep Research API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to perform deep research' },
            { status: 500 }
        );
    }
}
