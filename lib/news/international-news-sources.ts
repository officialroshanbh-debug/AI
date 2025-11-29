import type { NewsSource } from './nepal-news-sources';

export const INTERNATIONAL_NEWS_SOURCES: NewsSource[] = [
  {
    id: 'bbc',
    name: 'BBC News',
    url: 'https://www.bbc.com',
    rssUrl: 'https://feeds.bbci.co.uk/news/rss.xml',
    category: 'general',
  },
  {
    id: 'reuters',
    name: 'Reuters',
    url: 'https://www.reuters.com',
    rssUrl: 'https://www.reuters.com/tools/rss',
    category: 'general',
  },
  {
    id: 'cnn',
    name: 'CNN',
    url: 'https://www.cnn.com',
    rssUrl: 'http://rss.cnn.com/rss/edition.rss',
    category: 'general',
  },
  {
    id: 'theguardian',
    name: 'The Guardian',
    url: 'https://www.theguardian.com',
    rssUrl: 'https://www.theguardian.com/world/rss',
    category: 'general',
  },
  {
    id: 'nytimes',
    name: 'The New York Times',
    url: 'https://www.nytimes.com',
    rssUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    category: 'general',
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    rssUrl: 'https://techcrunch.com/feed/',
    category: 'tech',
  },
  {
    id: 'theverge',
    name: 'The Verge',
    url: 'https://www.theverge.com',
    rssUrl: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
  },
  {
    id: 'wired',
    name: 'Wired',
    url: 'https://www.wired.com',
    rssUrl: 'https://www.wired.com/feed/rss',
    category: 'tech',
  },
  {
    id: 'bloomberg',
    name: 'Bloomberg',
    url: 'https://www.bloomberg.com',
    rssUrl: 'https://feeds.bloomberg.com/markets/news.rss',
    category: 'finance',
  },
  {
    id: 'wsj',
    name: 'Wall Street Journal',
    url: 'https://www.wsj.com',
    rssUrl: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    category: 'finance',
    country: 'international',
  },
];

// Add country to all sources
INTERNATIONAL_NEWS_SOURCES.forEach((source) => {
  if (!source.country) source.country = 'international';
});

