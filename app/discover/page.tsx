import React from 'react';
import { NewsFeed } from '@/components/news/news-feed';
import { Newspaper } from 'lucide-react';
import { InterestsWidget } from '@/components/discover/interests-widget';
import { WeatherWidget } from '@/components/discover/weather-widget';

import { BreakingNewsTicker } from '@/components/news/breaking-news-ticker';

export default function DiscoverPage() {
    return (
        <div className="min-h-screen bg-background">
            <BreakingNewsTicker />
            <div className="container py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Newspaper className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-medium tracking-tight">Discover</h1>
                            <p className="text-sm text-muted-foreground">Latest news from around the world</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                    {/* Main Feed */}
                    <div className="lg:col-span-3">
                        <NewsFeed />
                    </div>

                    {/* Sidebar */}
                    <div className="hidden lg:block">
                        <div className="sticky top-24 space-y-6">
                            <InterestsWidget />
                            <WeatherWidget />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
