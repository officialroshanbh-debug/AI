import { ResearchOutline, ResearchSection } from '@/types/research';

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
