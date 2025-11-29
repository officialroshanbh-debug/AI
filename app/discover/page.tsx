import React from 'react';
import { NewsFeed } from '@/components/news/news-feed';
import { Newspaper, Settings2, Sparkles } from 'lucide-react';

export default function DiscoverPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Newspaper className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-medium tracking-tight">Discover</h1>
                            <p className="text-sm text-muted-foreground">Latest news from Nepal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary">
                            <Settings2 className="h-4 w-4" />
                            <span>Customize</span>
                        </button>
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
                            {/* Make it yours card */}
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="font-semibold">Make it yours</h3>
                                    <button className="text-muted-foreground hover:text-foreground">
                                        <span className="sr-only">Close</span>
                                        ×
                                    </button>
                                </div>
                                <p className="mb-6 text-sm text-muted-foreground">
                                    Select topics and interests to customize your Discover experience
                                </p>

                                <div className="mb-6 flex flex-wrap gap-2">
                                    {['Tech & Science', 'Finance', 'Arts & Culture', 'Sports', 'Entertainment'].map((topic) => (
                                        <span key={topic} className="rounded-md border bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground">
                                            {topic}
                                        </span>
                                    ))}
                                </div>

                                <button className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                    Save Interests
                                </button>
                            </div>

                            {/* Weather Widget (Mock) */}
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-yellow-500" />
                                        <span className="font-medium">Kathmandu</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">Sunny</span>
                                </div>
                                <div className="mt-4">
                                    <div className="text-3xl font-bold">22°C</div>
                                    <div className="mt-1 text-xs text-muted-foreground">H: 24° L: 12°</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
