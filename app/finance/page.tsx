'use client';

import { useEffect, useState } from 'react';
import { MarketIndices } from '@/components/finance/market-indices';
import { MarketSummary } from '@/components/finance/market-summary';
import { Watchlist } from '@/components/finance/watchlist';
import { StockSearch } from '@/components/finance/stock-search';

export default function FinancePage() {
    const [marketData, setMarketData] = useState<any>(null);
    const [news, setNews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [marketRes, newsRes] = await Promise.all([
                    fetch('/api/finance/market'),
                    fetch('/api/finance/news')
                ]);

                const market = await marketRes.json();
                const newsData = await newsRes.json();

                setMarketData(market);
                setNews(newsData.results || []);
            } catch (error) {
                console.error('Failed to fetch finance data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Nepal Market Overview</h1>
                    <p className="text-muted-foreground">Real-time data from NEPSE and latest financial news.</p>
                </div>

                {/* Search */}
                <StockSearch />

                {/* Market Indices */}
                <MarketIndices
                    indices={marketData?.indices || []}
                    isLoading={isLoading}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Market Summary & News */}
                    <div className="lg:col-span-2">
                        <MarketSummary
                            news={news}
                            isLoading={isLoading}
                        />
                    </div>

                    {/* Sidebar: Watchlist & Gainers */}
                    <div className="lg:col-span-1">
                        <Watchlist
                            gainers={marketData?.gainers || []}
                            losers={marketData?.losers || []}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
