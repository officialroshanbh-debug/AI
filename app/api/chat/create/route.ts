import { auth } from '@/auth';
import { createChat } from '@/app/actions/chat';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MODEL_IDS } from '@/types/ai-models';

const createChatSchema = z.object({
    title: z.string().optional(),
    modelId: z.enum([
        MODEL_IDS.GPT_5,
        MODEL_IDS.GPT_5_1,
        MODEL_IDS.GPT_4_TURBO,
        MODEL_IDS.GPT_4O,
        MODEL_IDS.GPT_4O_MINI,
        MODEL_IDS.GPT_REALTIME,
        MODEL_IDS.GPT_4,
        MODEL_IDS.GEMINI_2_0,
        MODEL_IDS.CLAUDE_3_7,
        MODEL_IDS.HIMALAYA,
    ] as const).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validationResult = createChatSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const { title, modelId } = validationResult.data;

        const chat = await createChat(title, modelId);


        return NextResponse.json({ chatId: chat.id, title: chat.title });
    } catch (error) {
        console.error('[Create Chat API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to create chat' },
            { status: 500 }
        );
    }
}
