'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, MessageSquare, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import dynamic from 'next/dynamic';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false }) as React.ComponentType<{
  data: Array<{ x: string[]; y: number[]; type: string; name: string; marker?: { color: string } }>;
  layout: Record<string, unknown>;
  config?: Record<string, unknown>;
  style?: Record<string, unknown>;
}>;

interface UsageStats {
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  modelBreakdown: Array<{ modelId: string; count: number; tokens: number; cost: number }>;
  dailyUsage: Array<{ date: string; messages: number; tokens: number; cost: number }>;
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-12 text-muted-foreground">No analytics data available</div>;
  }

  const chartData = {
    data: [
      {
        x: stats.dailyUsage.map((d) => d.date),
        y: stats.dailyUsage.map((d) => d.messages),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Messages',
        marker: { color: 'rgb(59, 130, 246)' },
      },
      {
        x: stats.dailyUsage.map((d) => d.date),
        y: stats.dailyUsage.map((d) => d.tokens / 1000),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Tokens (K)',
        yaxis: 'y2',
        marker: { color: 'rgb(16, 185, 129)' },
      },
    ],
    layout: {
      title: 'Daily Usage',
      xaxis: { title: 'Date' },
      yaxis: { title: 'Messages' },
      yaxis2: {
        title: 'Tokens (K)',
        overlaying: 'y',
        side: 'right',
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: 'rgb(148, 163, 184)' },
    },
    config: { displayModeBar: false },
    style: { width: '100%', height: '400px' },
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Chat interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalTokens / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">Tokens processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Estimated cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">Average latency</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage Over Time</CardTitle>
            <CardDescription>Messages and tokens per day</CardDescription>
          </CardHeader>
          <CardContent>
            <Plot {...chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Breakdown</CardTitle>
            <CardDescription>Usage by AI model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.modelBreakdown.map((model) => (
                <div key={model.modelId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{model.modelId}</span>
                    <span className="text-muted-foreground">
                      {model.count} messages • ${model.cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(model.count / stats.totalMessages) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

