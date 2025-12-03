'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/auth';
import { DeepResearchResult } from '@/types/research';
import { revalidatePath } from 'next/cache';

export async function saveResearch(result: DeepResearchResult) {
    const userId = await requireUser();

    try {
        const research = await prisma.research.create({
            data: {
                userId,
                title: result.outline.title,
                summary: result.outline.summary,
                totalWordCount: result.totalWordCount,
                totalSources: result.totalSources,
                sections: {
                    create: result.sections.map((section, index) => ({
                        title: section.title,
                        content: section.content,
                        wordCount: section.wordCount,
                        order: index,
                        sources: {
                            create: section.sources.map((source) => ({
                                url: source.url,
                                title: source.title,
                                snippet: source.snippet,
                            })),
                        },
                    })),
                },
            },
        });

        revalidatePath('/research/history');
        return { success: true, id: research.id };
    } catch (error) {
        console.error('Failed to save research:', error);
        return { success: false, error: 'Failed to save research' };
    }
}

export async function getResearchHistory() {
    const userId = await requireUser();

    try {
        const history = await prisma.research.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                summary: true,
                totalWordCount: true,
                totalSources: true,
                createdAt: true,
            },
        });

        return history;
    } catch (error) {
        console.error('Failed to fetch research history:', error);
        return [];
    }
}

export async function getResearchById(id: string) {
    const userId = await requireUser();

    try {
        const research = await prisma.research.findUnique({
            where: { id, userId },
            include: {
                sections: {
                    orderBy: { order: 'asc' },
                    include: {
                        sources: true,
                    },
                },
            },
        });

        return research;
    } catch (error) {
        console.error('Failed to fetch research:', error);
        return null;
    }
}
