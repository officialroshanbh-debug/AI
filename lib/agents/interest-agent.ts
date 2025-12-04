import { prisma } from '@/lib/prisma';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export class InterestAgent {
    /**
     * Analyzes the user's recent chat history to identify top interests.
     * Updates the user's profile with these interests.
     */
    static async analyzeUserInterests(userId: string) {
        try {
            // 1. Fetch recent user messages
            const recentMessages = await prisma.message.findMany({
                where: {
                    chat: { userId },
                    role: 'user',
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: { content: true },
            });

            if (recentMessages.length < 5) {
                console.log('[InterestAgent] Not enough history to analyze');
                return;
            }

            const historyText = recentMessages.map(m => m.content).join('\n');

            // 2. Ask LLM to extract interests
            const { text } = await generateText({
                model: openai('gpt-4o-mini') as any, // Use a cheap, fast model
                system: `You are an expert at analyzing user behavior and interests. 
        Analyze the provided chat history and extract the top 5 broad topics the user is interested in.
        Return ONLY a JSON array of strings, e.g., ["Cricket", "Nepal Politics", "Artificial Intelligence"].
        Focus on broad categories suitable for news searching.
        If the user asks about specific locations (e.g., "Kathmandu"), include those as interests.`,
                prompt: `Chat History:\n${historyText}`,
            });

            // 3. Parse and save interests
            let interests: string[] = [];
            try {
                // Clean up potential markdown code blocks
                const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                interests = JSON.parse(cleanText);
            } catch {
                // Fallback or ignore if parsing fails
                console.warn('Failed to parse interests from LLM');
            }

            if (Array.isArray(interests) && interests.length > 0) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        interests: interests.slice(0, 10), // Limit to 10
                        lastAnalyzedAt: new Date(),
                    },
                });
                console.log(`[InterestAgent] Updated interests for ${userId}:`, interests);
            }
        } catch (error) {
            console.error('[InterestAgent] Error analyzing interests:', error);
        }
    }
}
