import type { NewsSource } from './nepal-news-sources';

export const INDIA_NEWS_SOURCES: NewsSource[] = [
  {
    id: 'timesofindia',
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com',
    rssUrl: 'https://timesofindia.indiatimes.com/rssfeedmostrecent.cms',
    category: 'general',
  },
  {
    id: 'ndtv',
    name: 'NDTV',
    url: 'https://www.ndtv.com',
    rssUrl: 'https://feeds.feedburner.com/ndtvnews-top-stories',
    category: 'general',
  },
  {
    id: 'indianexpress',
    name: 'The Indian Express',
    url: 'https://indianexpress.com',
    rssUrl: 'https://indianexpress.com/section/india/feed/',
    category: 'general',
  },
  {
    id: 'thehindu',
    name: 'The Hindu',
    url: 'https://www.thehindu.com',
    rssUrl: 'https://www.thehindu.com/news/feeder/default.rss',
    category: 'general',
  },
  {
    id: 'economictimes',
    name: 'The Economic Times',
    url: 'https://economictimes.indiatimes.com',
    rssUrl: 'https://economictimes.indiatimes.com/rssfeedsdefault.cms',
    category: 'finance',
    country: 'india',
  },
];

// Add country to all sources
INDIA_NEWS_SOURCES.forEach((source) => {
  source.country = 'india';
});

