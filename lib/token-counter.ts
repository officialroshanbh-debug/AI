
import { get_encoding } from 'tiktoken';
import { Message } from 'ai/react';

const encoding = get_encoding('cl100k_base'); // encoding for gpt-4, gpt-3.5-turbo

export function countTokens(text: string): number {
    return encoding.encode(text).length;
}

export function countMessageTokens(messages: Message[]): number {
    let totalTokens = 0;
    for (const message of messages) {
        totalTokens += countTokens(message.content);
        // Add tokens for role, etc. (approximate)
        totalTokens += 4;
    }
    return totalTokens;
}

export function freeTokenMemory() {
    encoding.free();
}
