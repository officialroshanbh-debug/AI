'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import type { NewsItem } from '@/lib/news/nepal-news-sources';

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    // Fetch news item with full content from API
    const fetchNews = async () => {
      try {
        // Reconstruct URL from catch-all params
        const idParam = params.id;
        const newsId = Array.isArray(idParam)
          ? idParam.map(segment => decodeURIComponent(segment)).join('/')
          : idParam;

        // Encode the ID for the API call
        // If it's a URL, we need to encode each segment or the whole thing safely
        // Since we changed the API to accept [...id], we can pass the segments as is
        const apiPath = Array.isArray(idParam) ? idParam.join('/') : idParam;

        const response = await fetch(`/api/news/${apiPath}`);
        const data = await response.json();
        if (data.newsItem) {
          setNewsItem(data.newsItem);
          // Use full content as summary if available, or existing summary
          if (data.newsItem.fullContent) {
            // Don't auto-set summary from content, let user generate it with AI
            // unless it's already summarized
            if (data.newsItem.summary && data.newsItem.summary.length < 500) {
              setSummary(data.newsItem.summary);
            }
          } else if (data.newsItem.summary) {
            setSummary(data.newsItem.summary);
          }
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchNews();
    }
  }, [params.id]);

  const handleSummarize = async () => {
    if (!newsItem) return;

    setIsSummarizing(true);
    try {
      const response = await fetch('/api/news/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newsItem.title,
          description: newsItem.description,
          url: newsItem.link,
          content: newsItem.fullContent, // Pass full content for better summary
        }),
      });

      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">News not found</h1>
          <Button onClick={() => router.push('/discover')}>Back to Discover</Button>
        </div>
      </div>
    );
  }

  const publishedDate = typeof newsItem.publishedAt === 'string'
    ? new Date(newsItem.publishedAt)
    : newsItem.publishedAt;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <article className="bg-card rounded-xl border p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded">
                {newsItem.source}
              </span>
              {newsItem.category && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                  {newsItem.category}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(publishedDate)}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{newsItem.title}</h1>
            {newsItem.description && (
              <p className="text-lg text-muted-foreground mb-6">{newsItem.description}</p>
            )}
          </div>

          {/* Image */}
          {newsItem.imageUrl && (
            <div className="relative w-full h-64 md:h-96 mb-6 rounded-lg overflow-hidden">
              <Image
                src={newsItem.imageUrl}
                alt={newsItem.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Full Content Section */}
          {newsItem.fullContent ? (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4">Article Content</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {newsItem.fullContent.split('\n').map((paragraph, idx) => (
                    paragraph.trim() && (
                      <p key={idx} className="mb-4 text-base">
                        {paragraph.trim()}
                      </p>
                    )
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            {summary ? (
              <div>
                <h2 className="text-lg font-semibold mb-2">Himalaya Summary</h2>
                <p className="text-muted-foreground leading-relaxed">{summary}</p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-1">AI Summary</h2>
                  <p className="text-sm text-muted-foreground">
                    Get a comprehensive summary using Himalaya AI
                  </p>
                </div>
                <Button
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  size="sm"
                >
                  {isSummarizing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Summarizing with Himalaya...
                    </>
                  ) : (
                    'Generate Summary'
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <Button
              onClick={() => window.open(newsItem.link, '_blank')}
              variant="outline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Read Full Article
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}

