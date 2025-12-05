'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    percentChange: number;
}

interface WatchlistItem {
    id: string;
    symbol: string;
    name: string;
}

interface WatchlistProps {
    gainers: Stock[];
    losers: Stock[];
}

export function Watchlist({ gainers, losers }: WatchlistProps) {
    const { data: session } = useSession();
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

    useEffect(() => {
        if (session?.user) {
            fetchWatchlist();
        }
    }, [session]);

    const fetchWatchlist = async () => {
        try {
            const res = await fetch('/api/finance/watchlist');
            if (res.ok) {
                const data = await res.json();
                setWatchlist(data);
            }
        } catch (error) {
            console.error('Failed to fetch watchlist:', error);
        }
    };

    const removeFromWatchlist = async (id: string) => {
        try {
            const res = await fetch(`/api/finance/watchlist?id=${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setWatchlist(prev => prev.filter(item => item.id !== id));
                toast.success('Removed from watchlist');
            }
        } catch {
            toast.error('Failed to remove');
        }
    };

    return (
        <div className="space-y-8">
            {/* Watchlist Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Watchlist</h3>
                    {/* Add button is handled via Search now */}
                </div>

                <div className="space-y-2">
                    {!session ? (
                        <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg bg-muted/20">
                            Sign in to create a watchlist
                        </div>
                    ) : watchlist.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg bg-muted/20">
                            Your watchlist is empty
                        </div>
                    ) : (
                        watchlist.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent hover:border-border">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                        {item.symbol[0]}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{item.symbol}</div>
                                        <div className="text-[10px] text-muted-foreground">{item.name}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Placeholder for price - in real app we'd fetch this too */}
                                    <div className="text-right hidden sm:block">
                                        <div className="text-sm font-medium">--</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => removeFromWatchlist(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
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
