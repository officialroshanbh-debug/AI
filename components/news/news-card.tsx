import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, ExternalLink, Heart, MoreHorizontal, Bookmark } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/lib/news/nepal-news-sources';
import { toast } from 'sonner';

interface NewsCardProps {
    item: NewsItem;
    className?: string;
}

export function NewsCard({ item, className }: NewsCardProps) {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const publishedDate = typeof item.publishedAt === 'string'
        ? new Date(item.publishedAt)
        : item.publishedAt;

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const newStatus = !isBookmarked;
        setIsBookmarked(newStatus); // Optimistic update

        try {
            const method = newStatus ? 'POST' : 'DELETE';
            const res = await fetch('/api/bookmarks', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: item.link,
                    title: item.title,
                    source: item.source,
                    imageUrl: item.imageUrl,
                }),
            });

            if (!res.ok) throw new Error('Failed to update bookmark');
            toast.success(newStatus ? 'Article saved' : 'Removed from bookmarks');
        } catch {
            setIsBookmarked(!newStatus); // Revert
            toast.error('Failed to update bookmark');
        }
    };

    return (
        <Link
            href={`/discover/${item.id}`}
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10 hover:shadow-lg dark:border-white/5 dark:bg-black/20 dark:hover:bg-white/5",
                className
            )}
        >
            {/* Header: Source & Options */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {item.source.substring(0, 1)}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{item.source}</span>
                    {item.category && (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {item.category}
                        </span>
                    )}
                </div>
                <button
                    className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    onClick={(e) => e.preventDefault()}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            {/* Content Layout */}
            <div className="flex flex-col gap-4 sm:flex-row">
                {/* Text Content */}
                <div className="flex flex-1 flex-col justify-between gap-2">
                    <div>
                        <h3 className="line-clamp-3 text-lg font-semibold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                        </h3>
                        {item.description && (
                            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                                {item.description}
                            </p>
                        )}
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatRelativeTime(publishedDate)}</span>
                        </div>
                    </div>
                </div>

                {/* Image */}
                {item.imageUrl && (
                    <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-32 md:h-28 md:w-40">
                        <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            unoptimized
                        />
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {/* Placeholder for related sources count if we had it */}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className={cn(
                            "rounded-full p-1.5 transition-colors hover:bg-white/10",
                            isBookmarked ? "text-primary" : "text-muted-foreground hover:text-primary"
                        )}
                        onClick={handleBookmark}
                        title={isBookmarked ? "Remove bookmark" : "Save article"}
                    >
                        <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
                    </button>
                    <button
                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-red-500"
                        onClick={(e) => e.preventDefault()}
                    >
                        <Heart className="h-4 w-4" />
                    </button>
                    <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-primary"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </Link>
    );
}
