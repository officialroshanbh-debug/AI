'use client';

import React, { useState } from 'react';
import { Copy, Clock, FileText, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ResearchResult } from '@/types/research';
import { cn } from '@/lib/utils';

interface ResearchResultsProps {
  results: ResearchResult[];
  onCopy: (text: string) => void;
}

export function ResearchResults({ results, onCopy }: ResearchResultsProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (modelId: string) => {
    setExpanded((prev) => ({ ...prev, [modelId]: !prev[modelId] }));
  };

  return (
    <div className="space-y-4">
      {results.map((result) => {
        const isExpanded = expanded[result.modelId] ?? true;

        return (
          <Card key={result.modelId} className="overflow-hidden">
            <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleExpand(result.modelId)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{result.modelName}</CardTitle>
                  <CardDescription>Model Response</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {result.responseTime}ms
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopy(result.response);
                    }}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-4 text-sm text-muted-foreground border-b pb-2">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{result.responseTime}ms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{result.wordCount} words</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>Readability: {result.readabilityScore}/100</span>
                  </div>
                  {result.tokens && (
                    <Badge variant="secondary" className="text-xs">
                      {result.tokens} tokens
                    </Badge>
                  )}
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ inline, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            {...props}
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code {...props} className={cn(className, "bg-muted px-1 py-0.5 rounded")}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {result.response}
                  </ReactMarkdown>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
