
import { Message } from 'ai';
import { OpenAI } from 'openai';
import { env } from '@/lib/env';

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

export async function summarizeMessages(messages: Message[]): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'Synthesize the following conversation into a concise summary that retains all key details, user preferences, and context. The goal is to compress the history while keeping the logic intact for future turns.'
                },
                ...messages.map(m => ({
                    role: m.role as 'user' | 'assistant' | 'system',
                    content: m.content
                }))
            ],
            max_tokens: 500,
        });

        return response.choices[0].message.content || '';
    } catch (error) {
        console.error('Summarization failed:', error);
        return '';
    }
}
