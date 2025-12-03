'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Bookmark, BookmarkCheck, Trash2, Share2, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { formatRelativeTime } from '@/lib/utils';
import { MODEL_CONFIGS, type ModelId } from '@/types/ai-models';

interface HistoryItem {
  id: string;
  chatId: string;
  query: string;
  type: 'chat' | 'research';
  modelId: ModelId;
  timestamp: Date;
  wordCount: number;
  isBookmarked: boolean;
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch chat history from API
      const response = await fetch('/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      // Use mock data for now
      setHistory(generateMockHistory());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateMockHistory = (): HistoryItem[] => {
    const models: ModelId[] = ['gpt-4o', 'gpt-5.1-chat-latest', 'gpt-4-turbo'];
    const queries = [
      'What is quantum computing?',
      'Explain the theory of relativity',
      'Latest developments in AI',
      'How does blockchain work?',
      'Climate change solutions',
      'Python vs JavaScript',
      'Machine learning basics',
      'Web development trends',
    ];

    return Array.from({ length: 20 }, (_, i) => ({
      id: `history-${i}`,
      chatId: `chat-${i}`,
      query: queries[i % queries.length],
      type: i % 3 === 0 ? 'research' : 'chat',
      modelId: models[i % models.length] as ModelId,
      timestamp: new Date(Date.now() - i * 3600000),
      wordCount: Math.floor(Math.random() * 500) + 100,
      isBookmarked: i % 5 === 0,
    }));
  };

  const filterHistory = useCallback(() => {
    let filtered = [...history];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.query.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    // Model filter
    if (modelFilter !== 'all') {
      filtered = filtered.filter((item) => item.modelId === modelFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.timestamp);
        switch (dateFilter) {
          case 'today':
            return itemDate.toDateString() === now.toDateString();
          case 'week':
            return now.getTime() - itemDate.getTime() < 7 * 24 * 60 * 60 * 1000;
          case 'month':
            return now.getTime() - itemDate.getTime() < 30 * 24 * 60 * 60 * 1000;
          default:
            return true;
        }
      });
    }

    // Bookmarked filter
    if (bookmarkedOnly) {
      filtered = filtered.filter((item) => item.isBookmarked);
    }

    setFilteredHistory(filtered);
  }, [history, searchQuery, typeFilter, modelFilter, dateFilter, bookmarkedOnly]);

  useEffect(() => {
    if (session?.user) {
      fetchHistory();
    }
  }, [session, fetchHistory]);

  useEffect(() => {
    filterHistory();
  }, [filterHistory]);

  const toggleBookmark = (id: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      setHistory([]);
    }
  };

  const shareItem = (item: HistoryItem) => {
    const shareText = `Query: ${item.query}\nModel: ${MODEL_CONFIGS[item.modelId].name}\nTime: ${formatRelativeTime(item.timestamp)}`;
    navigator.clipboard.writeText(shareText);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-medium tracking-tight mb-2">History</h1>
            <p className="text-sm text-muted-foreground">
              View and manage your search history
            </p>
          </div>
          {history.length > 0 && (
            <Button variant="destructive" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <Input
                  placeholder="Search queries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                </SelectContent>
              </Select>
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                  <SelectItem value="gpt-5.1">GPT-5.1</SelectItem>
                  <SelectItem value="o3-mini">O3-Mini</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <Button
                variant={bookmarkedOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
              >
                <BookmarkCheck className="h-4 w-4 mr-2" />
                Bookmarked Only
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No history items found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{item.query}</h3>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {MODEL_CONFIGS[item.modelId].name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(item.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{item.wordCount} words</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleBookmark(item.id)}
                      >
                        {item.isBookmarked ? (
                          <BookmarkCheck className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => shareItem(item)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

