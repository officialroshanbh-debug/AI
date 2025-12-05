import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { scrapeCompanyDetails } from '@/lib/finance/sharesansar-scraper';
import { generateEmbedding } from '@/lib/himalaya/embeddings';

// List of major companies to ingest (Top 20 by capitalization/popularity)
const TARGET_STOCKS = [
    'NABIL', 'NICA', 'GBIME', 'EBL', 'SCB', // Commercial Banks
    'HIDCL', 'API', 'CHCL', 'SHPC', 'AHPC', // Hydro
    'NTC', // Telecom
    'CIT', 'NOC', // Investment/Others
    'NLIC', 'LICN', // Life Insurance
    'NIL', 'SICL', // Non-Life
    'SHIVM', 'HDL' // Manufacturing
];

export async function POST(req: Request) {
    try {
        const session = await auth();

        // Simple admin check (or allow if secret key provided)
        const url = new URL(req.url);
        const secretKey = url.searchParams.get('key');
        const isAdmin = session?.user?.role === 'admin' || secretKey === process.env.ADMIN_SECRET_KEY;

        if (!isAdmin && process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = [];
        let successCount = 0;

        // Process stocks
        for (const symbol of TARGET_STOCKS) {
            try {
                // 1. Scrape Data
                const details = await scrapeCompanyDetails(symbol);

                if (details) {
                    // 2. Format Content for LLM
                    const content = `
                        Stock Symbol: ${details.symbol}
                        Company Name: ${details.name}
                        Sector: ${details.sector}
                        Status: ${details.status}
                        Latest Price: Rs. ${details.price}
                        Change: ${details.change} (${details.percentChange}%)
                        As of: ${details.asOf}
                        
                        Description: ${details.name} is a listed company in the ${details.sector} sector in Nepal.
                    `.trim();

                    // 3. Generate Embedding
                    const { embedding } = await generateEmbedding(content);

                    // 4. Store in HimalayaTrainingData
                    // Check if exists first to update
                    const existing = await prisma.himalayaTrainingData.findFirst({
                        where: { title: `Market Data: ${details.symbol}` }
                    });

                    if (existing) {
                        await prisma.himalayaTrainingData.update({
                            where: { id: existing.id },
                            data: {
                                content,
                                embedding: JSON.stringify(embedding),
                                updatedAt: new Date()
                            }
                        });
                    } else {
                        await prisma.himalayaTrainingData.create({
                            data: {
                                title: `Market Data: ${details.symbol}`,
                                content,
                                category: 'knowledge',
                                embedding: JSON.stringify(embedding),
                                uploadedBy: session?.user?.id || 'system_admin', // Fallback ID if running via script
                                isActive: true,
                                metadata: { source: 'ShareSansar', symbol: details.symbol }
                            }
                        });
                    }

                    results.push({ symbol, status: 'success' });
                    successCount++;
                } else {
                    results.push({ symbol, status: 'failed', reason: 'Scraping failed' });
                }

            } catch (error) {
                console.error(`Error processing ${symbol}:`, error);
                results.push({ symbol, status: 'error', message: String(error) });
            }
        }

        return NextResponse.json({
            message: `Ingestion complete. Processed ${successCount}/${TARGET_STOCKS.length} stocks.`,
            results
        });

    } catch (error) {
        console.error('Ingestion error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
