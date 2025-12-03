'use client';

import React, { useState } from 'react';
import { Search, Share2, Download, BarChart3, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MODEL_CONFIGS, MODEL_IDS, type ModelId } from '@/types/ai-models';
import { ResearchComparisonChart } from '@/components/research/comparison-chart';
import { ResearchResults } from '@/components/research/research-results';
import { combineReport } from '@/lib/research/utils';
import { Progress } from '@/components/ui/progress';
import { ResearchSection, ResearchResult } from '@/types/research';

interface WebSource {
  url: string;
  title: string;
  content: string;
  snippet: string;
}



// ... existing imports

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [selectedModels, setSelectedModels] = useState<ModelId[]>([MODEL_IDS.GPT_4O]);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [webSources, setWebSources] = useState<WebSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchMode, setResearchMode] = useState<'quick' | 'deep'>('quick');
  const [isDeepResearching, setIsDeepResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState(0);
  const [researchStatus, setResearchStatus] = useState('');
  const [streamedSections, setStreamedSections] = useState<ResearchSection[]>([]);

  // Available models for research
  const availableModels = [
    { id: MODEL_IDS.GPT_4O, name: 'GPT-4o' },
    { id: MODEL_IDS.GPT_5_1, name: 'GPT-5.1' },
    { id: MODEL_IDS.GPT_4_TURBO, name: 'GPT-4 Turbo' },
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
    setWebSources([]); // Clear previous sources

    try {
      const researchResults: ResearchResult[] = [];
      let sources: WebSource[] = [];

      // Step 1: Fetch web sources for context (always enabled - it's free!)
      try {
        const searchResponse = await fetch('/api/research/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          sources = searchData.results || [];
          setWebSources(sources);
        }
      } catch (err) {
        console.error('Web search failed:', err);
        // Continue without web sources
      }

      // Call each selected model in parallel
      const promises = selectedModels.map(async (modelId: ModelId) => {
        const startTime = Date.now();
        const config = MODEL_CONFIGS[modelId as ModelId];

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

  const handleDeepResearch = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setIsDeepResearching(true);
    setError(null);
    setResults([]); // Clear previous results
    setResearchProgress(0);
    setResearchStatus('Initializing...');
    setStreamedSections([]);

    try {
      const response = await fetch('/api/research/deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Deep research failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response stream');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');

        // Keep the last part in the buffer as it might be incomplete
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'progress') {
                setResearchProgress(parsed.progress);
                setResearchStatus(parsed.status);
              } else if (parsed.type === 'section') {
                setStreamedSections((prev: ResearchSection[]) => [...prev, parsed.section]);
              } else if (parsed.type === 'result') {
                const result = parsed.result;

                const deepResult: ResearchResult = {
                  modelId: MODEL_IDS.GPT_4O,
                  modelName: 'Deep Research Report',
                  response: combineReport(result.outline, result.sections),
                  responseTime: 0,
                  wordCount: result.totalWordCount,
                  readabilityScore: calculateReadability(combineReport(result.outline, result.sections)),
                  tokens: 0
                };

                setResults([deepResult]);

                // Save research to database
                try {
                  const { saveResearch } = await import('@/app/actions/research');
                  await saveResearch(result);
                } catch (err) {
                  console.error('Failed to save research:', err);
                }
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error);
              }
            } catch (e) {
              console.error('Error parsing stream:', e);
            }
          }
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform deep research');
    } finally {
      setIsDeepResearching(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExportMarkdown = () => {
    let markdown = `# Research Results\n\n`;
    markdown += `**Query:** ${query}\n\n`;
    markdown += `**Date:** ${new Date().toLocaleString()}\n\n`;
    markdown += `**Models Compared:** ${selectedModels.map((id: ModelId) => MODEL_CONFIGS[id].name).join(', ')}\n\n`;

    if (webSources.length > 0) {
      markdown += `## Sources\n\n`;
      webSources.forEach((source: WebSource, i: number) => {
        markdown += `${i + 1}. [${source.title}](${source.url})\n   ${source.snippet}\n\n`;
      });
    }

    markdown += `## Results\n\n`;
    results.forEach((r: ResearchResult) => {
      markdown += `### ${r.modelName}\n\n`;
      markdown += `**Response Time:** ${r.responseTime}ms | **Words:** ${r.wordCount} | **Readability:** ${r.readabilityScore}\n\n`;
      markdown += `${r.response}\n\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    let yPos = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    // Title
    doc.setFontSize(18);
    doc.text('Research Results', margin, yPos);
    yPos += 10;

    // Query info
    doc.setFontSize(10);
    doc.text(`Query: ${query}`, margin, yPos);
    yPos += 6;
    doc.text(`Date: ${new Date().toLocaleString()}`, margin, yPos);
    yPos += 6;
    doc.text(`Models: ${selectedModels.map((id: ModelId) => MODEL_CONFIGS[id].name).join(', ')}`, margin, yPos);
    yPos += 12;

    // Sources
    if (webSources.length > 0) {
      doc.setFontSize(14);
      doc.text('Sources', margin, yPos);
      yPos += 8;
      doc.setFontSize(9);

      webSources.slice(0, 5).forEach((source: WebSource, i: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const sourceText = `${i + 1}. ${source.title}`;
        const lines = doc.splitTextToSize(sourceText, maxWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 5;
      });
      yPos += 6;
    }

    // Results
    results.forEach((r: ResearchResult) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.text(r.modelName, margin, yPos);
      yPos += 6;

      doc.setFontSize(8);
      doc.text(`Time: ${r.responseTime}ms | Words: ${r.wordCount} | Readability: ${r.readabilityScore}`, margin, yPos);
      yPos += 8;

      doc.setFontSize(9);
      const responseLines = doc.splitTextToSize(r.response, maxWidth);
      responseLines.forEach((line: string) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin, yPos);
        yPos += 4;
      });
      yPos += 8;
    });

    doc.save(`research-${Date.now()}.pdf`);
  };

  const handleExportJSON = () => {
    const data = {
      query,
      timestamp: new Date().toISOString(),
      models: selectedModels,
      results: results.map((r: ResearchResult) => ({
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-medium tracking-tight mb-2">Research</h1>
            <p className="text-sm text-muted-foreground">
              Compare responses from multiple AI models {researchMode === 'deep' && '| Generate comprehensive 10-20 page reports'}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/research/history">
              <FileText className="mr-2 h-4 w-4" />
              History
            </Link>
          </Button>
        </div>

        {/* Mode Toggle */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Tabs value={researchMode} onValueChange={(v) => setResearchMode(v as 'quick' | 'deep')}>
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="quick">Quick Research</TabsTrigger>
                <TabsTrigger value="deep">Deep Research (10-20 pages)</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground mt-3">
              {researchMode === 'quick'
                ? 'Compare AI models side-by-side with fast responses'
                : 'Generate comprehensive research reports with multiple sections, citations, and 5,000-10,000 words (takes 2-5 minutes)'}
            </p>
          </CardContent>
        </Card>

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
                  onClick={researchMode === 'quick' ? handleResearch : handleDeepResearch}
                  disabled={isLoading || isDeepResearching || !query.trim() || (researchMode === 'quick' && selectedModels.length === 0)}
                  className="w-full"
                  size="lg"
                >
                  {researchMode === 'quick' ? (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      {isLoading ? 'Researching...' : 'Start Quick Research'}
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      {isDeepResearching ? 'Generating Report...' : 'Start Deep Research'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Progress Bar */}
            {isDeepResearching && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{researchStatus}</span>
                      <span className="text-muted-foreground">{Math.round(researchProgress)}%</span>
                    </div>
                    <Progress value={researchProgress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Streamed Sections (while researching) */}
            {isDeepResearching && streamedSections.length > 0 && results.length === 0 && (
              <div className="space-y-6 mb-8">
                {streamedSections.map((section) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap">{section.content}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <>
                <ResearchResults results={results} onCopy={handleCopy} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportMarkdown}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Markdown
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportJSON}>
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
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

