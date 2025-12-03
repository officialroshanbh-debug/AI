'use client';

import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    percentChange: number;
}

interface WatchlistProps {
    gainers: Stock[];
    losers: Stock[];
}

export function Watchlist({ gainers, losers }: WatchlistProps) {
    return (
        <div className="space-y-8">
            {/* Watchlist Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Watchlist</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                <div className="space-y-2">
                    {/* Mock Watchlist Items */}
                    {['NABIL', 'CIT', 'NTC'].map((symbol) => (
                        <div key={symbol} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                    {symbol[0]}
                                </div>
                                <div>
                                    <div className="font-medium text-sm">{symbol}</div>
                                    <div className="text-[10px] text-muted-foreground">Nepal Stock Exchange</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium">₹{(Math.random() * 1000 + 100).toFixed(0)}</div>
                                <div className="text-xs text-green-500 flex items-center justify-end gap-0.5">
                                    <Plus className="h-2 w-2" />
                                    {(Math.random() * 5).toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Gainers */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Top Gainers</h3>
                </div>
                <div className="space-y-2">
                    {gainers.map((stock) => (
                        <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                            <div>
                                <div className="font-medium text-sm">{stock.symbol}</div>
                                <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">{stock.name}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium">₹{stock.price}</div>
                                <div className="text-xs text-green-500">+{stock.percentChange}%</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Losers */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Top Losers</h3>
                </div>
                <div className="space-y-2">
                    {losers.map((stock) => (
                        <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                            <div>
                                <div className="font-medium text-sm">{stock.symbol}</div>
                                <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">{stock.name}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium">₹{stock.price}</div>
                                <div className="text-xs text-red-500">{stock.percentChange}%</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
