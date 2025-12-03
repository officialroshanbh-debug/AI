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
