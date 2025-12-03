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

        // Create a TransformStream for streaming the response
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Start processing in the background
        (async () => {
            try {
                const result = await performDeepResearch(query, async (status, progress) => {
                    // Send progress update
                    const data = JSON.stringify({ type: 'progress', status, progress });
                    await writer.write(encoder.encode(`data: ${data}\n\n`));
                }, async (section) => {
                    // Send section update
                    const data = JSON.stringify({ type: 'section', section });
                    await writer.write(encoder.encode(`data: ${data}\n\n`));
                });

                // Send final result
                const finalData = JSON.stringify({ type: 'result', result });
                await writer.write(encoder.encode(`data: ${finalData}\n\n`));
                await writer.write(encoder.encode('data: [DONE]\n\n'));
            } catch (error) {
                console.error('[Deep Research API] Error:', error);
                const errorData = JSON.stringify({
                    type: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                await writer.write(encoder.encode(`data: ${errorData}\n\n`));
            } finally {
                await writer.close();
            }
        })();

        return new NextResponse(stream.readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('[Deep Research API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to perform deep research' },
            { status: 500 }
        );
    }
}
