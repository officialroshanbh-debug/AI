'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Plotly to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = dynamic(() => import('react-plotly.js') as any, { ssr: false });

interface ResearchResult {
  modelId: string;
  modelName: string;
  response: string;
  responseTime: number;
  wordCount: number;
  readabilityScore: number;
  tokens?: number;
}

interface ResearchComparisonChartProps {
  results: ResearchResult[];
}

export function ResearchComparisonChart({ results }: ResearchComparisonChartProps) {
  if (results.length === 0) {
    return null;
  }

  // Prepare data for charts
  const modelNames = results.map((r) => r.modelName);
  const responseTimes = results.map((r) => r.responseTime / 1000); // Convert to seconds
  const wordCounts = results.map((r) => r.wordCount);
  const readabilityScores = results.map((r) => r.readabilityScore);

  // Response Time Chart
  const responseTimeData = [
    {
      x: modelNames,
      y: responseTimes,
      type: 'bar',
      marker: { color: 'rgb(37, 99, 235)' },
      name: 'Response Time (s)',
    },
  ];

  // Word Count Chart
  const wordCountData = [
    {
      x: modelNames,
      y: wordCounts,
      type: 'bar',
      marker: { color: 'rgb(6, 182, 212)' },
      name: 'Word Count',
    },
  ];

  // Readability Score Chart
  const readabilityData = [
    {
      x: modelNames,
      y: readabilityScores,
      type: 'bar',
      marker: { color: 'rgb(34, 197, 94)' },
      name: 'Readability Score',
    },
  ];

  const layout = {
    autosize: true,
    margin: { l: 40, r: 20, t: 20, b: 40 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: 'hsl(var(--foreground))', size: 12 },
    xaxis: {
      gridcolor: 'hsl(var(--border))',
      color: 'hsl(var(--muted-foreground))',
    },
    yaxis: {
      gridcolor: 'hsl(var(--border))',
      color: 'hsl(var(--muted-foreground))',
    },
  };

  const config = {
    displayModeBar: false,
    responsive: true,
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-2">Response Time</h4>
        <div className="h-48">
          <Plot
            data={responseTimeData}
            layout={{ ...layout, title: '' }}
            config={config}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Word Count</h4>
        <div className="h-48">
          <Plot
            data={wordCountData}
            layout={{ ...layout, title: '' }}
            config={config}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Readability Score</h4>
        <div className="h-48">
          <Plot
            data={readabilityData}
            layout={{ ...layout, title: '' }}
            config={config}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}

