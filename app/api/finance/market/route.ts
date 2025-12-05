import { NextResponse } from 'next/server';
import { scrapeNepseData } from '@/lib/finance/nepse-scraper';

// Using a free unofficial NEPSE API
// Source: https://nepse-data-api.vercel.app (or similar community API)
// Note: Direct NEPSE API access is difficult without a paid subscription or complex scraping.
// For this implementation, we will use a mock/simulated data structure if the external API is unavailable,
// or try to hit a known public endpoint. 

// Actually, a better approach for a demo is to use a reliable public endpoint if available, 
// or fallback to mock data to ensure the UI works.
// Let's try to fetch from a known unofficial source, but handle failures gracefully.

export async function GET() {
    try {
        // Try to scrape real data first
        const realData = await scrapeNepseData();

        if (realData && (realData.index.value > 0 || realData.gainers.length > 0)) {
            return NextResponse.json({
                indices: [
                    { name: 'NEPSE', ...realData.index },
                    { name: 'Sensitive', value: 0, change: 0, percentChange: 0, status: 'neutral' }, // Placeholder
                    { name: 'Float', value: 0, change: 0, percentChange: 0, status: 'neutral' }, // Placeholder
                    { name: 'Turnover', value: realData.marketSummary.totalTurnover, change: 0, percentChange: 0, status: 'neutral' },
                ],
                gainers: realData.gainers,
                losers: realData.losers,
                isOpen: true, // Simplified
                asOf: realData.index.asOf
            });
        }

        // Fallback to mock data if scraping fails
        console.warn('Scraping failed, using mock data');

        // Simulating a fetch delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const marketData = {
            indices: [
                { name: 'NEPSE', value: 2045.67, change: 12.45, percentChange: 0.61, status: 'up' },
                { name: 'Sensitive', value: 389.12, change: -1.23, percentChange: -0.32, status: 'down' },
                { name: 'Float', value: 145.34, change: 0.89, percentChange: 0.62, status: 'up' },
                { name: 'Turnover', value: '3.45B', change: 0, percentChange: 0, status: 'neutral' },
            ],
            gainers: [
                { symbol: 'NABIL', name: 'Nabil Bank Ltd.', price: 450.00, change: 12.00, percentChange: 2.74 },
                { symbol: 'HIDCL', name: 'Hydroelectricity Inv.', price: 189.00, change: 8.00, percentChange: 4.42 },
                { symbol: 'NICA', name: 'NIC Asia Bank', price: 390.00, change: 5.00, percentChange: 1.30 },
            ],
            losers: [
                { symbol: 'UPPER', name: 'Upper Tamakoshi', price: 210.00, change: -5.00, percentChange: -2.33 },
                { symbol: 'NTC', name: 'Nepal Telecom', price: 850.00, change: -10.00, percentChange: -1.16 },
            ],
            isOpen: true,
            asOf: new Date().toISOString()
        };

        return NextResponse.json(marketData);
    } catch (error) {
        console.error('Error fetching market data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch market data' },
            { status: 500 }
        );
    }
}
