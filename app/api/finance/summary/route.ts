import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { env } from '@/lib/env';
import { HimalayaProvider } from '@/lib/models/himalaya-provider';
import { scrapeNepseData } from '@/lib/finance/nepse-scraper';

// Simple in-memory cache for the summary (reset on server restart/redeploy)
let cachedSummary: { content: string; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET() {
    try {
        const session = await auth();
        // Allow public access for now, or restrict to logged in users
        // if (!session?.user) { ... }

        // Check cache
        if (cachedSummary && Date.now() - cachedSummary.timestamp < CACHE_DURATION) {
            return NextResponse.json({ summary: cachedSummary.content, cached: true });
        }

        // 1. Fetch Market Data
        const marketData = await scrapeNepseData();

        // 2. Fetch News (simulated or real)
        // We'll use a quick fetch to our own news API or just mock it for the prompt context
        // Ideally we'd import the news fetching logic directly
        const newsRes = await fetch(`${env.NEXTAUTH_URL || 'http://localhost:3000'}/api/finance/news`);
        const newsData = await newsRes.ok ? await newsRes.json() : { results: [] };
        const newsHeadlines = newsData.results?.slice(0, 5).map((n: { title: string }) => n.title).join('\n') || "No recent news.";

        // 3. Generate Summary
        const provider = new HimalayaProvider();

        const prompt = `Analyze the current Nepal Stock Exchange (NEPSE) market status based on the following data:

Market Data:
NEPSE Index: ${marketData?.index.value || 'N/A'} (${marketData?.index.change || 0} points, ${marketData?.index.percentChange || 0}%)
Status: ${marketData?.index.status || 'Neutral'}
Turnover: ${marketData?.marketSummary.totalTurnover || 'N/A'}
Top Gainers: ${marketData?.gainers.map(g => `${g.symbol} (+${g.percentChange}%)`).join(', ') || 'N/A'}
Top Losers: ${marketData?.losers.map(l => `${l.symbol} (${l.percentChange}%)`).join(', ') || 'N/A'}

Recent News Headlines:
${newsHeadlines}

Provide a concise, professional market summary (max 100 words). Focus on the trend, key movers, and overall sentiment. Do not mention that you are an AI.`;

        const response = await provider.callModel({
            messages: [{ role: 'user', content: prompt }],
            model: 'himalaya',
            temperature: 0.7,
            maxTokens: 200,
            userId: session?.user?.id || 'system',
            chatId: 'market-summary',
        });

        const summary = response.content;

        // Update cache
        cachedSummary = { content: summary, timestamp: Date.now() };

        return NextResponse.json({ summary, cached: false });
    } catch (error) {
        console.error('Error generating market summary:', error);
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
}
