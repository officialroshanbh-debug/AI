
import { OpenAI } from 'openai';
import { env } from '@/lib/env';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // OpenAI expects a File object, but Next.js Request FormData might need handling
        // In node environment, we might need to cast or convert. 
        // Usually 'file' from formData is sufficient for OpenAI SDK v4+.

        const response = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
        });

        return NextResponse.json({ text: response.text });
    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json(
            { error: 'Transcription failed' },
            { status: 500 }
        );
    }
}
