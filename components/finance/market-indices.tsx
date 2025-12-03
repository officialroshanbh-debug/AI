'use client';

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndexData {
    name: string;
    value: number | string;
    change: number;
    percentChange: number;
    status: 'up' | 'down' | 'neutral';
}

interface MarketIndicesProps {
    indices: IndexData[];
    isLoading?: boolean;
}

export function MarketIndices({ indices, isLoading }: MarketIndicesProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {indices.map((index) => (
                <div
                    key={index.name}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors"
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-muted-foreground">{index.name}</span>
                        <div className={cn(
                            "flex items-center text-xs font-medium px-1.5 py-0.5 rounded",
                            index.status === 'up' ? "text-green-500 bg-green-500/10" :
                                index.status === 'down' ? "text-red-500 bg-red-500/10" :
                                    "text-muted-foreground bg-muted"
                        )}>
                            {index.status === 'up' && <ArrowUp className="h-3 w-3 mr-1" />}
                            {index.status === 'down' && <ArrowDown className="h-3 w-3 mr-1" />}
                            {index.status === 'neutral' && <Minus className="h-3 w-3 mr-1" />}
                            {Math.abs(index.percentChange).toFixed(2)}%
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold tracking-tight">
                            {typeof index.value === 'number' ? index.value.toLocaleString() : index.value}
                        </span>
                        <span className={cn(
                            "text-xs mb-1.5 font-medium",
                            index.status === 'up' ? "text-green-500" :
                                index.status === 'down' ? "text-red-500" :
                                    "text-muted-foreground"
                        )}>
                            {index.change > 0 ? '+' : ''}{index.change}
                        </span>
                    </div>

                    {/* Simple Sparkline Visualization (CSS Gradient) */}
                    <div className="h-1 w-full mt-3 rounded-full overflow-hidden bg-muted/30">
                        <div
                            className={cn(
                                "h-full rounded-full opacity-50",
                                index.status === 'up' ? "bg-green-500" :
                                    index.status === 'down' ? "bg-red-500" :
                                        "bg-muted-foreground"
                            )}
                            style={{ width: `${Math.random() * 40 + 30}%` }} // Mock width for visual
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
