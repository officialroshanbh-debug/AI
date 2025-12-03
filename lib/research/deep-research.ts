import OpenAI from 'openai';
import { MODEL_IDS } from '@/types/ai-models';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ResearchOutline {
    title: string;
    summary: string;
    sections: Array<{
        id: string;
        title: string;
        description: string;
        keywords: string[];
    }>;
}

export interface ResearchSection {
    id: string;
    title: string;
    content: string;
    sources: Array<{
        url: string;
        title: string;
        snippet: string;
    }>;
    wordCount: number;
}

export interface DeepResearchResult {
    outline: ResearchOutline;
    sections: ResearchSection[];
    totalWordCount: number;
    totalSources: number;
}

/**
 * Helper to try multiple models if one fails (e.g. due to access rights)
 */
async function createCompletionWithFallback(params: Omit<OpenAI.Chat.ChatCompletionCreateParams, 'model'>): Promise<OpenAI.Chat.ChatCompletion> {
    // Try models in this order: GPT-4o -> GPT-5.1 -> GPT-4 Turbo
    const modelsToTry = [MODEL_IDS.GPT_4O, MODEL_IDS.GPT_5_1, MODEL_IDS.GPT_4_TURBO];
    let lastError;

    for (const model of modelsToTry) {
        try {
            console.log(`[Deep Research] Attempting with model: ${model}`);
            return await openai.chat.completions.create({
                ...params,
                model,
            }) as unknown as Promise<OpenAI.Chat.ChatCompletion>;
        } catch (error) {
            console.warn(`[Deep Research] Model ${model} failed:`, error);
            lastError = error;
            // Continue to next model
        }
    }

    // If all failed, throw the last error
    throw lastError;
}

/**
 * Generate a comprehensive outline for deep research
 */
export async function generateOutline(query: string): Promise<ResearchOutline> {
    const systemPrompt = `You are a research assistant that creates comprehensive outlines for in-depth research reports.
Create a detailed outline with 5-8 main sections that thoroughly cover the topic.
Each section should have a clear focus and contribute to a complete understanding of the subject.`;

    const userPrompt = `Create a comprehensive research outline for: "${query}"

Return a JSON object with this structure:
{
  "title": "Report title",
  "summary": "Brief overview of what the report will cover",
  "sections": [
    {
      "id": "section-1",
      "title": "Section title",
      "description": "What this section will explore",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

Make it thorough and academic. Include 5-8 sections.`;

    const completion = await createCompletionWithFallback({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return result as ResearchOutline;
}

/**
 * Research a single section with web sources
 */
export async function researchSection(
    section: ResearchOutline['sections'][0],
    mainQuery: string,
    webSources?: Array<{ url: string; title: string; content: string; snippet: string }>
): Promise<ResearchSection> {
    // Prepare context from web sources
    let sourceContext = '';
    const relevantSources: ResearchSection['sources'] = [];

    if (webSources && webSources.length > 0) {
        // Find sources relevant to this section
        const filtered = webSources
            .filter(s => {
                const content = (s.content + s.title + s.snippet).toLowerCase();
                return section.keywords.some(kw => content.includes(kw.toLowerCase()));
            })
            .slice(0, 5);

        filtered.forEach(source => {
            sourceContext += `\n\nSource: ${source.title}\nURL: ${source.url}\nContent: ${source.content.substring(0, 2000)}\n`;
            relevantSources.push({
                url: source.url,
                title: source.title,
                snippet: source.snippet,
            });
        });
    }

    const systemPrompt = `You are an expert research writer creating comprehensive, well-researched content.
Write in an academic but accessible style. Include specific details, examples, and evidence.
When referencing sources, use inline citations like [1], [2], etc.`;

    const userPrompt = `Write a comprehensive section for a research report about "${mainQuery}".

Section Title: ${section.title}
Section Focus: ${section.description}
Keywords to cover: ${section.keywords.join(', ')}

${sourceContext ? `Use the following sources as references:\n${sourceContext}` : ''}

Write 800-1200 words for this section. Be thorough and informative.
Include specific examples, data points, and explanations.
Structure with clear paragraphs and logical flow.`;

    const completion = await createCompletionWithFallback({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || '';
    const wordCount = content.split(/\s+/).length;

    return {
        id: section.id,
        title: section.title,
        content,
        sources: relevantSources,
        wordCount,
    };
}

/**
 * Combine sections into a complete report
 */
export function combineReport(
    outline: ResearchOutline,
    sections: ResearchSection[]
): string {
    let report = `# ${outline.title}\n\n`;
    report += `${outline.summary}\n\n`;
    report += `---\n\n`;

    // Table of Contents
    report += `## Table of Contents\n\n`;
    sections.forEach((section, i) => {
        report += `${i + 1}. ${section.title}\n`;
    });
    report += `\n---\n\n`;

    // Sections
    sections.forEach((section, i) => {
        report += `## ${i + 1}. ${section.title}\n\n`;
        report += `${section.content}\n\n`;

        if (section.sources.length > 0) {
            report += `**Sources:**\n`;
            section.sources.forEach((source, j) => {
                report += `[${j + 1}] ${source.title} - ${source.url}\n`;
            });
            report += `\n`;
        }

        report += `---\n\n`;
    });

    // References
    const allSources = sections.flatMap(s => s.sources);
    const uniqueSources = Array.from(
        new Map(allSources.map(s => [s.url, s])).values()
    );

    if (uniqueSources.length > 0) {
        report += `## References\n\n`;
        uniqueSources.forEach((source, i) => {
            report += `${i + 1}. ${source.title}\n   ${source.url}\n\n`;
        });
    }

    return report;
}

/**
 * Main deep research function
 */
export async function performDeepResearch(
    query: string,
    onProgress?: (status: string, progress: number) => void
): Promise<DeepResearchResult> {
    try {
        // Step 1: Generate outline
        onProgress?.('Generating research outline...', 10);
        const outline = await generateOutline(query);

        // Step 2: Get web sources for the main query
        onProgress?.('Searching web for sources...', 20);
        let webSources: Array<{ url: string; title: string; content: string; snippet: string }> = [];

        // Try to fetch web sources (optional, will work without them too)
        try {
            const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/research/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });

            if (searchResponse.ok) {
                const data = await searchResponse.json();
                webSources = data.results || [];
            }
        } catch (error) {
            console.warn('Web search failed, continuing without sources:', error);
        }

        // Step 3: Research each section
        const sections: ResearchSection[] = [];
        const totalSections = outline.sections.length;

        for (let i = 0; i < outline.sections.length; i++) {
            const section = outline.sections[i];
            const progress = 20 + ((i + 1) / totalSections) * 70;
            onProgress?.(`Researching: ${section.title} (${i + 1}/${totalSections})`, progress);

            const researchedSection = await researchSection(section, query, webSources);
            sections.push(researchedSection);
        }

        onProgress?.('Finalizing report...', 95);

        const totalWordCount = sections.reduce((sum, s) => sum + s.wordCount, 0);
        const totalSources = Array.from(
            new Set(sections.flatMap(s => s.sources.map(src => src.url)))
        ).length;

        onProgress?.('Complete!', 100);

        return {
            outline,
            sections,
            totalWordCount,
            totalSources,
        };
    } catch (error) {
        console.error('Deep research error:', error);
        throw error;
    }
}
