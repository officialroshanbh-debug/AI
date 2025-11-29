import React from 'react';
import Image from 'next/image';
import { Clock, ExternalLink, Heart, MoreHorizontal } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/lib/news/nepal-news-sources';

interface NewsCardProps {
    item: NewsItem;
    className?: string;
}

export function NewsCard({ item, className }: NewsCardProps) {
    const publishedDate = typeof item.publishedAt === 'string' 
        ? new Date(item.publishedAt) 
        : item.publishedAt;

    return (
        <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10 hover:shadow-lg dark:border-white/5 dark:bg-black/20 dark:hover:bg-white/5",
                className
            )}
        >
            {/* Header: Source & Options */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {item.source.substring(0, 1)}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{item.source}</span>
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
                        <h3 className="line-clamp-2 text-lg font-semibold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
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
                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-red-500"
                        onClick={(e) => e.preventDefault()}
                    >
                        <Heart className="h-4 w-4" />
                    </button>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
            </div>
        </a>
    );
}
