import { readUrls } from '@/lib/research/search';

export interface NepseData {
    index: {
        value: number;
        change: number;
        percentChange: number;
        status: 'up' | 'down' | 'neutral';
        asOf: string;
    };
    marketSummary: {
        totalTurnover: string;
        totalTradedShares: string;
        totalTransactions: string;
        totalScripsTraded: string;
        totalMarketCap: string;
    };
    gainers: Array<{
        symbol: string;
        name: string;
        price: number;
        change: number;
        percentChange: number;
    }>;
    losers: Array<{
        symbol: string;
        name: string;
        price: number;
        change: number;
        percentChange: number;
    }>;
}

export async function scrapeNepseData(): Promise<NepseData | null> {
    try {
        // Use Jina Reader to fetch the rendered page content
        const results = await readUrls(['https://www.nepalstock.com/']);

        if (!results || results.length === 0 || !results[0].content) {
            console.error('Failed to fetch NEPSE data via Jina Reader');
            return null;
        }

        const content = results[0].content;

        // Parse NEPSE Index
        // Looking for patterns like "NEPSE Index 2,631.17 12.45 0.61%"
        // Note: Markdown parsing is fragile, so we'll use regex patterns that match the expected text structure

        const indexMatch = content.match(/NEPSE Index\s*([\d,]+\.?\d*)\s*([+-]?[\d,]+\.?\d*)\s*([+-]?[\d,]+\.?\d*)%/i);
        const indexValue = indexMatch ? parseFloat(indexMatch[1].replace(/,/g, '')) : 0;
        const indexChange = indexMatch ? parseFloat(indexMatch[2].replace(/,/g, '')) : 0;
        const indexPercent = indexMatch ? parseFloat(indexMatch[3].replace(/,/g, '')) : 0;

        // Parse Market Summary
        // Pattern: "Total Turnover Rs : 5,235,699,337.33"
        const turnoverMatch = content.match(/Total Turnover[^:]*:\s*([\d,]+\.?\d*)/i);
        const sharesMatch = content.match(/Total Traded Shares[^:]*:\s*([\d,]+\.?\d*)/i);
        const transactionsMatch = content.match(/Total Transactions[^:]*:\s*([\d,]+\.?\d*)/i);
        const scripsMatch = content.match(/Total Scrips Traded[^:]*:\s*([\d,]+\.?\d*)/i);
        const marketCapMatch = content.match(/Total Market Capitalization[^:]*:\s*([\d,]+\.?\d*)/i);

        // Parse Gainers/Losers
        // This is harder from unstructured text. We might need to look for specific table headers in markdown.
        // For now, we'll try to extract them if they appear in a predictable list format.
        // If Jina returns a markdown table, it looks like: | Symbol | LTP | ... |

        const gainers: any[] = [];
        const losers: any[] = [];

        // Helper to parse table rows
        const parseTableRows = (sectionText: string) => {
            const rows = sectionText.match(/\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|/g);
            return rows ? rows.slice(1).map(row => { // Skip header
                const cols = row.split('|').map(c => c.trim()).filter(c => c);
                if (cols.length >= 4) {
                    return {
                        symbol: cols[0],
                        name: cols[0], // Name might not be in the summary table
                        price: parseFloat(cols[1].replace(/,/g, '')),
                        change: parseFloat(cols[2].replace(/,/g, '')),
                        percentChange: parseFloat(cols[3].replace(/,/g, '').replace('%', ''))
                    };
                }
                return null;
            }).filter(x => x) : [];
        };

        // Find "Top Gainers" section
        const gainersSection = content.split('Top Gainers')[1]?.split('Top Losers')[0];
        if (gainersSection) {
            const parsedGainers = parseTableRows(gainersSection);
            gainers.push(...parsedGainers.slice(0, 5));
        }

        // Find "Top Losers" section
        const losersSection = content.split('Top Losers')[1]?.split('Top Turnovers')[0]; // Assuming Top Turnovers follows
        if (losersSection) {
            const parsedLosers = parseTableRows(losersSection);
            losers.push(...parsedLosers.slice(0, 5));
        }

        return {
            index: {
                value: indexValue,
                change: indexChange,
                percentChange: indexPercent,
                status: indexChange >= 0 ? 'up' : 'down',
                asOf: new Date().toISOString()
            },
            marketSummary: {
                totalTurnover: turnoverMatch ? turnoverMatch[1] : '0',
                totalTradedShares: sharesMatch ? sharesMatch[1] : '0',
                totalTransactions: transactionsMatch ? transactionsMatch[1] : '0',
                totalScripsTraded: scripsMatch ? scripsMatch[1] : '0',
                totalMarketCap: marketCapMatch ? marketCapMatch[1] : '0'
            },
            gainers,
            losers
        };

    } catch (error) {
        console.error('Error scraping NEPSE data:', error);
        return null;
    }
}
