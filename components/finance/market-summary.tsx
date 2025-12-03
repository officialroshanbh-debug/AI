'use client';

import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
    title: string;
    link: string;
    source_id: string;
    pubDate: string;
    description?: string;
    image_url?: string;
}

interface MarketSummaryProps {
    news: NewsItem[];
    isLoading?: boolean;
}

export function MarketSummary({ news, isLoading }: MarketSummaryProps) {
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-40 bg-muted/50 rounded-xl animate-pulse" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* AI Summary Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Market Summary</h2>
                    <span className="text-xs text-muted-foreground">Updated just now</span>
                </div>
                <div className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        <span className="text-foreground font-medium">NEPSE shows resilience amidst regulatory changes. </span>
                        The market has responded positively to the recent directives from Nepal Rastra Bank regarding microfinance institutions.
                        Banking and Hydropower sectors are leading the gains, while trading volumes remain steady.
                        Investors are cautiously optimistic as liquidity in the banking system improves, potentially signaling lower interest rates in the near future.
                    </p>
                </div>
            </div>

            {/* News Feed */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Latest News</h3>
                <div className="grid gap-4">
                    {news.map((item, idx) => (
                        <a
                            key={idx}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all hover:border-primary/20"
                        >
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-2">
                                    <h4 className="font-medium leading-snug group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {item.description}
                                    </p>
                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
                                        <span className="font-medium text-foreground/80">{item.source_id}</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {item.pubDate ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true }) : 'Recently'}
                                        </span>
                                    </div>
                                </div>
                                {item.image_url && (
                                    <div className="hidden sm:block shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                )}
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
