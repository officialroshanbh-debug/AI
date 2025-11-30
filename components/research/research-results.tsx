'use client';

import React from 'react';
import { Copy, Clock, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ResearchResult {
  modelId: string;
  modelName: string;
  response: string;
  responseTime: number;
  wordCount: number;
  readabilityScore: number;
  tokens?: number;
}

interface ResearchResultsProps {
  results: ResearchResult[];
  onCopy: (text: string) => void;
}

export function ResearchResults({ results, onCopy }: ResearchResultsProps) {
  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <Card key={result.modelId} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
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
                  onClick={() => onCopy(result.response)}
                  className="h-8 w-8"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
              <div className="rounded-lg bg-muted/50 p-4 border">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {result.response}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

