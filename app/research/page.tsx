'use client';

import React, { useState } from 'react';
import { Search, Share2, Download, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MODEL_CONFIGS, MODEL_IDS, type ModelId } from '@/types/ai-models';
import { ResearchComparisonChart } from '@/components/research/comparison-chart';
import { ResearchResults } from '@/components/research/research-results';

interface ResearchResult {
  modelId: ModelId;
  modelName: string;
  response: string;
  responseTime: number;
  wordCount: number;
  readabilityScore: number;
  tokens?: number;
}

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [selectedModels, setSelectedModels] = useState<ModelId[]>([MODEL_IDS.GPT_4_1]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const availableModels = [
    { id: MODEL_IDS.GPT_4_1, name: 'GPT-4.1' },
    { id: MODEL_IDS.GPT_5_1, name: 'GPT-5.1' },
    { id: MODEL_IDS.O3_MINI, name: 'O3-Mini' },
  ];

  const toggleModel = (modelId: ModelId) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const calculateReadability = (text: string): number => {
    // Simple Flesch Reading Ease approximation
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;
    const syllables = text.split(/\s+/).reduce((acc, word) => {
      const matches = word.match(/[aeiouy]+/gi);
      return acc + (matches ? matches.length : 1);
    }, 0);

    if (sentences === 0 || words === 0) return 0;

    const score =
      206.835 -
      1.015 * (words / sentences) -
      84.6 * (syllables / words);

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const handleResearch = async () => {
    if (!query.trim() || selectedModels.length === 0) {
      setError('Please enter a query and select at least one model');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const researchResults: ResearchResult[] = [];

      // Call each selected model in parallel
      const promises = selectedModels.map(async (modelId) => {
        const startTime = Date.now();
        const config = MODEL_CONFIGS[modelId];

        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
              messages: [{ role: 'user' as const, content: query }],
              modelId,
            }),
          });

          if (!response.ok) {
            throw new Error(`Model ${config.name} failed: ${response.statusText}`);
          }

          // Handle streaming response
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let responseText = '';
          let tokens: number | undefined;

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n').filter(Boolean);

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                      responseText += parsed.content;
                    }
                    if (parsed.tokens) {
                      tokens = parsed.tokens;
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }
              }
            }
          }

          const responseTime = Date.now() - startTime;
          const wordCount = responseText.split(/\s+/).length;
          const readabilityScore = calculateReadability(responseText);

          return {
            modelId,
            modelName: config.name,
            response: responseText || 'No response received',
            responseTime,
            wordCount,
            readabilityScore,
            tokens,
          };
        } catch (err) {
          console.error(`Error calling model ${config.name}:`, err);
          return {
            modelId,
            modelName: config.name,
            response: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
            responseTime: Date.now() - startTime,
            wordCount: 0,
            readabilityScore: 0,
          };
        }
      });

      const modelResults = await Promise.all(promises);
      researchResults.push(...modelResults);
      setResults(researchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform research');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExport = () => {
    const data = {
      query,
      timestamp: new Date().toISOString(),
      models: selectedModels,
      results: results.map((r) => ({
        model: r.modelName,
        response: r.response,
        metrics: {
          responseTime: r.responseTime,
          wordCount: r.wordCount,
          readabilityScore: r.readabilityScore,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-medium tracking-tight mb-2">Research</h1>
          <p className="text-sm text-muted-foreground">
            Compare responses from multiple AI models side-by-side
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Research Query</CardTitle>
                <CardDescription>Enter your question or topic to research</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="What are the latest developments in quantum computing?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={6}
                  className="resize-none"
                />

                <div>
                  <label className="text-sm font-medium mb-2 block">Select Models</label>
                  <div className="flex flex-wrap gap-2">
                    {availableModels.map((model) => {
                      const isSelected = selectedModels.includes(model.id);
                      return (
                        <Button
                          key={model.id}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleModel(model.id)}
                        >
                          {model.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleResearch}
                  disabled={isLoading || !query.trim() || selectedModels.length === 0}
                  className="w-full"
                  size="lg"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isLoading ? 'Researching...' : 'Start Research'}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {results.length > 0 && (
              <>
                <ResearchResults results={results} onCopy={handleCopy} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const shareText = `Research Query: ${query}\n\nResults:\n${results
                        .map((r) => `${r.modelName}: ${r.response.slice(0, 100)}...`)
                        .join('\n\n')}`;
                      navigator.clipboard.writeText(shareText);
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Metrics Sidebar */}
          <div className="space-y-6">
            {results.length > 0 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResearchComparisonChart results={results} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Fastest Response</span>
                      <span className="font-medium">
                        {results.reduce((prev, curr) =>
                          curr.responseTime < prev.responseTime ? curr : prev
                        ).modelName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Longest Response</span>
                      <span className="font-medium">
                        {results.reduce((prev, curr) =>
                          curr.wordCount > prev.wordCount ? curr : prev
                        ).modelName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Best Readability</span>
                      <span className="font-medium">
                        {results.reduce((prev, curr) =>
                          curr.readabilityScore > prev.readabilityScore ? curr : prev
                        ).modelName}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

