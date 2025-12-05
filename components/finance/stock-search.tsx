'use client';

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Mock list of NEPSE stocks for demo
const STOCK_LIST = [
    { symbol: 'NABIL', name: 'Nabil Bank Ltd.' },
    { symbol: 'NICA', name: 'NIC Asia Bank Ltd.' },
    { symbol: 'GBIME', name: 'Global IME Bank Ltd.' },
    { symbol: 'NTC', name: 'Nepal Telecom' },
    { symbol: 'CIT', name: 'Citizen Investment Trust' },
    { symbol: 'HIDCL', name: 'Hydroelectricity Investment' },
    { symbol: 'UPPER', name: 'Upper Tamakoshi Hydropower' },
    { symbol: 'SHIVM', name: 'Shivam Cements' },
    { symbol: 'HDL', name: 'Himalayan Distillery' },
    { symbol: 'NLIC', name: 'Nepal Life Insurance' },
];

export function StockSearch() {
    const { data: session } = useSession();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<typeof STOCK_LIST>([]);
    const [isOpen, setIsOpen] = useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length > 0) {
            const filtered = STOCK_LIST.filter(stock =>
                stock.symbol.toLowerCase().includes(value.toLowerCase()) ||
                stock.name.toLowerCase().includes(value.toLowerCase())
            );
            setResults(filtered);
            setIsOpen(true);
        } else {
            setResults([]);
            setIsOpen(false);
        }
    };

    const addToWatchlist = async (stock: typeof STOCK_LIST[0]) => {
        if (!session) {
            toast.error('Please sign in to add to watchlist');
            return;
        }

        try {
            const res = await fetch('/api/finance/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stock),
            });

            if (res.ok) {
                toast.success(`Added ${stock.symbol} to watchlist`);
                setQuery('');
                setIsOpen(false);
                // Ideally trigger a refresh of the watchlist component here
                // For now, page refresh or context update would be needed
                window.location.reload(); // Simple brute force refresh for demo
            } else {
                toast.error('Failed to add to watchlist');
            }
        } catch {
            toast.error('Error adding to watchlist');
        }
    };

    return (
        <div className="relative max-w-2xl mx-auto mb-8">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={handleSearch}
                    placeholder="Search for stocks (e.g., NABIL, NTC)..."
                    className="pl-10 h-12 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all rounded-xl"
                />
            </div>

            {/* Search Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-lg z-50 overflow-hidden">
                    {results.map((stock) => (
                        <div
                            key={stock.symbol}
                            className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                        >
                            <Link href={`/finance/stock/${stock.symbol}`} className="flex-1 cursor-pointer">
                                <div>
                                    <div className="font-medium">{stock.symbol}</div>
                                    <div className="text-xs text-muted-foreground">{stock.name}</div>
                                </div>
                            </Link>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addToWatchlist(stock);
                                }}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
