'use client';

import React, { useState } from 'react';
import { MOCK_NEWS } from '@/lib/news-sources';
import { NewsCard } from './news-card';
import { Compass, Flame, Layers, Newspaper, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
    { id: 'foryou', label: 'For You', icon: Compass },
    { id: 'top', label: 'Top', icon: Flame },
    { id: 'tech', label: 'Tech & Science', icon: Layers },
    { id: 'finance', label: 'Finance', icon: TrendingUp },
    { id: 'arts', label: 'Arts & Culture', icon: Newspaper },
];

export function NewsFeed() {
    const [activeTab, setActiveTab] = useState('foryou');

    // For now, we just show the mock news for all tabs, 
    // but in a real app we would filter based on the tab.
    const newsItems = MOCK_NEWS;

    return (
        <div className="flex flex-col gap-6">
            {/* Tabs */}
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

            {/* Grid Layout */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {newsItems.map((item) => (
                    <NewsCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}
