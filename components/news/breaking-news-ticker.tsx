'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/lib/news/nepal-news-sources';
import Link from 'next/link';

export function BreakingNewsTicker() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBreakingNews = async () => {
            try {
                // Fetch trending news as "breaking"
                const response = await fetch('/api/discover');
                const data = await response.json();

                if (data.trending && data.trending.length > 0) {
                    const mapToNewsItem = (item: any): NewsItem => ({
                        id: item.url,
                        title: item.title,
                        description: item.snippet,
                        link: item.url,
                        source: 'News',
                        publishedAt: item.pubDate || new Date().toISOString(),
                        imageUrl: item.imageUrl,
                        category: 'General'
                    });
                    setNews(data.trending.slice(0, 5).map(mapToNewsItem));
                }
            } catch (error) {
                console.error('Failed to fetch breaking news:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBreakingNews();
    }, []);

    useEffect(() => {
        if (news.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % news.length);
        }, 5000); // Auto-rotate every 5 seconds

        return () => clearInterval(interval);
    }, [news.length]);

    const nextNews = () => {
        setCurrentIndex((prev) => (prev + 1) % news.length);
    };

    const prevNews = () => {
        setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
    };

    if (isLoading || news.length === 0) return null;

    const currentItem = news[currentIndex];

    return (
        <div className="w-full bg-red-500/10 border-y border-red-500/20 py-2 mb-6">
            <div className="container flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-red-500 text-white text-xs font-bold uppercase tracking-wider shrink-0 animate-pulse">
                        <AlertCircle className="h-3 w-3" />
                        Breaking
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <div className="flex flex-col transition-all duration-500">
                            <Link
                                href={currentItem.link}
                                target="_blank"
                                className="text-sm font-medium hover:underline truncate"
                            >
                                {currentItem.title}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={prevNews}
                        className="p-1 hover:bg-red-500/10 rounded-full transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={nextNews}
                        className="p-1 hover:bg-red-500/10 rounded-full transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
