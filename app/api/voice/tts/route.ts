
import { OpenAI } from 'openai';
import { env } from '@/lib/env';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const mp3 = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'alloy',
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('TTS error:', error);
        return NextResponse.json(
            { error: 'Text-to-speech failed' },
            { status: 500 }
        );
    }
}
