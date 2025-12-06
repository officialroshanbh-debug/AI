
'use client';

import * as React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResult {
    id: string;
    title: string;
    createdAt: string;
    messages: { content: string }[];
}

export function SidebarSearch() {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const router = useRouter();

    React.useEffect(() => {
        async function search() {
            if (!debouncedQuery) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/chat/search?q=${encodeURIComponent(debouncedQuery)}`);
                if (!res.ok) throw new Error('Search failed');
                const data = await res.json();
                setResults(data);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        }

        search();
    }, [debouncedQuery]);

    const handleSelect = (id: string) => {
        setIsOpen(false);
        setQuery('');
        router.push(`/chat/${id}`);
    };

    return (
        <div className="relative px-2 mb-2">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search chats..."
                    className="pl-8 bg-zinc-950/50 border-zinc-800"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {loading && (
                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {isOpen && query && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 mx-2 overflow-hidden rounded-md border bg-zinc-900 shadow-lg animate-in fade-in-0 zoom-in-95">
                    {results.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {loading ? 'Searching...' : 'No results found.'}
                        </div>
                    ) : (
                        <div className="max-h-[300px] overflow-y-auto">
                            {results.map((chat) => (
                                <button
                                    key={chat.id}
                                    className="w-full flex flex-col items-start gap-1 p-3 text-sm hover:bg-zinc-800/50 transition-colors border-b border-zinc-800 last:border-0"
                                    onClick={() => handleSelect(chat.id)}
                                >
                                    <span className="font-medium truncate w-full text-left">{chat.title}</span>
                                    {chat.messages.length > 0 && (
                                        <span className="text-xs text-muted-foreground truncate w-full text-left">
                                            {chat.messages[0].content}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {isOpen && query && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}
        </div>
    );
}
