import { readUrls } from '@/lib/research/search';

export interface ShareSansarNewsItem {
    title: string;
    link: string;
    source_id: string;
    pubDate: string;
    image_url?: string;
    description?: string;
}

export interface CompanyDetails {
    symbol: string;
    name: string;
    sector: string;
    price: number;
    change: number;
    percentChange: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    previousClose: number;
    status: string;
    asOf: string;
}

export async function scrapeShareSansarNews(): Promise<ShareSansarNewsItem[]> {
    try {
        const url = 'https://www.sharesansar.com/category/latest';
        const results = await readUrls([url]);

        if (!results || results.length === 0 || !results[0].content) {
            console.error('Failed to fetch ShareSansar news via Jina Reader');
            return [];
        }

        const content = results[0].content;
        const newsItems: ShareSansarNewsItem[] = [];

        // Markdown parsing for news items
        // Pattern: [Title](link) ... #### Title ... Date
        // This is a bit heuristic based on the Jina output structure we saw

        // We'll look for links that look like news articles
        const linkRegex = /\[([^\]]+)\]\((https:\/\/www\.sharesansar\.com\/newsdetail\/[^)]+)\)/g;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            const title = match[1];
            const link = match[2];

            // Avoid duplicates and non-news links
            if (!newsItems.some(n => n.link === link) && title !== 'Read More') {
                newsItems.push({
                    title,
                    link,
                    source_id: 'ShareSansar',
                    pubDate: new Date().toISOString(), // We might not get exact date easily from markdown summary
                    description: title // Use title as description for now
                });
            }

            if (newsItems.length >= 10) break;
        }

        return newsItems;
    } catch (error) {
        console.error('Error scraping ShareSansar news:', error);
        return [];
    }
}

export async function scrapeCompanyDetails(symbol: string): Promise<CompanyDetails | null> {
    try {
        const url = `https://www.sharesansar.com/company/${symbol.toLowerCase()}`;
        const results = await readUrls([url]);

        if (!results || results.length === 0 || !results[0].content) {
            console.error(`Failed to fetch company details for ${symbol}`);
            return null;
        }

        const content = results[0].content;

        // Extract basic info from markdown
        // We saw: "Nabil Bank Limited ( NABIL )"
        // "Sector: Commercial Bank"

        const nameMatch = content.match(/^(.*)\(\s*[A-Z]+\s*\)/m);
        const name = nameMatch ? nameMatch[1].trim() : symbol;

        const sectorMatch = content.match(/Sector:\s*(.*)/i);
        const sector = sectorMatch ? sectorMatch[1].trim() : 'Unknown';

        // Price data might be harder to find in the markdown if it's dynamic or in a table
        // We'll look for patterns like "Market Price : 1,234" or table rows
        // For now, we might need to rely on the "Market Summary" scraper for price if this page doesn't show it clearly in markdown
        // Or we can try to find the "Last Traded Price" or similar

        // Heuristic: look for a number that looks like a price near the top
        // This part is tricky without seeing the exact live markdown for a specific company page with price data
        // We'll set placeholders for now and refine if we can see the price pattern

        return {
            symbol: symbol.toUpperCase(),
            name,
            sector,
            price: 0, // Placeholder
            change: 0,
            percentChange: 0,
            open: 0,
            high: 0,
            low: 0,
            volume: 0,
            previousClose: 0,
            status: 'Active',
            asOf: new Date().toISOString()
        };

    } catch (error) {
        console.error(`Error scraping company details for ${symbol}:`, error);
        return null;
    }
}
