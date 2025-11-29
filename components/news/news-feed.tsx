'use client';

import React, { useState, useEffect } from 'react';
import { NewsCard } from './news-card';
import { Compass, Flame, Layers, Newspaper, TrendingUp, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { NewsItem } from '@/lib/news/nepal-news-sources';

const TABS = [
    { id: 'foryou', label: 'For You', icon: Compass },
    { id: 'top', label: 'Top', icon: Flame },
    { id: 'tech', label: 'Tech & Science', icon: Layers },
    { id: 'finance', label: 'Finance', icon: TrendingUp },
    { id: 'arts', label: 'Arts & Culture', icon: Newspaper },
];

export function NewsFeed() {
    const [activeTab, setActiveTab] = useState('foryou');
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchNews = async (showRefreshing = false) => {
        if (showRefreshing) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const response = await fetch('/api/news');
            const data = await response.json();
            setNewsItems(data.news || []);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNews();
        // Refresh news every 10 minutes
        const interval = setInterval(() => fetchNews(true), 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-6">
            {/* Header with Tabs and Refresh */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fetchNews(true)}
                    disabled={isRefreshing}
                    className="h-8 w-8 shrink-0"
                    title="Refresh news"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
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
                    <p>No news available at the moment</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchNews(true)}
                        className="mt-4"
                    >
                        Try again
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
