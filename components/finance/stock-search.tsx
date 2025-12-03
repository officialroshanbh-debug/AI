'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function StockSearch() {
    return (
        <div className="relative max-w-2xl mx-auto mb-8">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search for stocks, indices, or news..."
                    className="pl-10 h-12 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all rounded-xl"
                />
            </div>
        </div>
    );
}
