'use client';

import React, { useState, useEffect } from 'react';
import { NewsCard } from './news-card';
import { Compass, Flame, Newspaper, RefreshCw, Search, SortAsc } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NewsItem } from '@/lib/news/nepal-news-sources';

const TABS = [
    { id: 'foryou', label: 'For You', icon: Compass, category: null },
    { id: 'top', label: 'Trending', icon: Flame, category: null },
    // { id: 'tech', label: 'Tech & Science', icon: Layers, category: 'tech' as const },
    // { id: 'finance', label: 'Finance', icon: TrendingUp, category: 'finance' as const },
    // { id: 'sports', label: 'Sports', icon: Newspaper, category: 'sports' as const },
];

type SortOption = 'newest' | 'oldest';

export function NewsFeed() {
    const [activeTab, setActiveTab] = useState('foryou');
    const [forYouNews, setForYouNews] = useState<NewsItem[]>([]);
    const [trendingNews, setTrendingNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [userInterests, setUserInterests] = useState<string[]>([]);

    // Search & Sort State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    const fetchNews = async (showRefreshing = false) => {
        if (showRefreshing) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const response = await fetch('/api/discover');
            const data = await response.json();

            // Map API response to NewsItem format
            const mapToNewsItem = (item: any): NewsItem => ({
                id: item.url, // Use URL as ID
                title: item.title,
                description: item.snippet,
                link: item.url,
                source: 'News', // We could parse domain from URL
                publishedAt: item.pubDate || new Date().toISOString(),
                imageUrl: item.imageUrl,
                category: 'General'
            });

            if (data.forYou) setForYouNews(data.forYou.map(mapToNewsItem));
            if (data.trending) setTrendingNews(data.trending.map(mapToNewsItem));
            if (data.interests) setUserInterests(data.interests);

        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Filter & Sort Logic
    const getProcessedNews = (): NewsItem[] => {
        let items = activeTab === 'top' ? trendingNews : forYouNews;

        // 1. Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query)
            );
        }

        // 2. Sort
        return [...items].sort((a, b) => {
            const dateA = new Date(a.publishedAt || 0).getTime();
            const dateB = new Date(b.publishedAt || 0).getTime();
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });
    };

    const newsItems = getProcessedNews();

    useEffect(() => {
        fetchNews();
        // Refresh news every 10 minutes
        const interval = setInterval(() => fetchNews(true), 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-6">
            {/* Header Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                                        isActive
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="whitespace-nowrap">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Actions: Search, Sort, Refresh */}
                    <div className="flex items-center gap-2">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search news..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 bg-secondary/30 border-transparent focus:bg-background transition-colors"
                            />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                                    <SortAsc className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSortBy('newest')}>
                                    Newest First
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                                    Oldest First
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchNews(true)}
                            disabled={isRefreshing}
                            className="h-9 w-9 shrink-0"
                            title="Refresh news"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Interests Badge (Only on For You tab) */}
                {activeTab === 'foryou' && userInterests.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                        <span>Personalized for:</span>
                        <div className="flex gap-1 flex-wrap">
                            {userInterests.map((interest, i) => (
                                <span key={i} className="bg-secondary/50 px-2 py-0.5 rounded-md text-foreground">
                                    {interest}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="h-64 bg-muted animate-pulse rounded-xl"
                        />
                    ))}
                </div>
            ) : newsItems.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                    <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{searchQuery ? 'No news found matching your search' : 'No news available'}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSearchQuery(''); fetchNews(true); }}
                        className="mt-4"
                    >
                        Clear Search & Refresh
                    </Button>
                </div>
            ) : (
                /* Grid Layout */
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {newsItems.map((item) => (
                        <NewsCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
