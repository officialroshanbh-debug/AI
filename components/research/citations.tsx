'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText } from 'lucide-react';
import { useState } from 'react';

interface Citation {
    url: string;
    title: string;
    snippet: string;
}

interface CitationsProps {
    sources: Citation[];
    onViewSource?: (url: string) => void;
}

export function Citations({ sources, onViewSource }: CitationsProps) {
    const [expanded, setExpanded] = useState(false);

    if (!sources || sources.length === 0) {
        return null;
    }

    const displayedSources = expanded ? sources : sources.slice(0, 3);

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Sources ({sources.length})
                    </h3>
                    {sources.length > 3 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? 'Show Less' : `Show All ${sources.length}`}
                        </Button>
                    )}
                </div>

                <div className="space-y-3">
                    {displayedSources.map((source, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                            <Badge variant="outline" className="mt-1">
                                {index + 1}
                            </Badge>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-1">
                                    {source.title}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {source.snippet}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <a
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        Visit Source
                                    </a>
                                    {onViewSource && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs"
                                            onClick={() => onViewSource(source.url)}
                                        >
                                            View Content
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
