export interface NewsSource {
  id: string;
  name: string;
  url: string;
  rssUrl?: string;
  category?: string;
}

export const NEPAL_NEWS_SOURCES: NewsSource[] = [
  {
    id: 'onlinekhabar',
    name: 'Online Khabar',
    url: 'https://www.onlinekhabar.com',
    rssUrl: 'https://www.onlinekhabar.com/feed',
  },
  {
    id: 'setopati',
    name: 'Setopati',
    url: 'https://www.setopati.com',
    rssUrl: 'https://www.setopati.com/rss',
  },
  {
    id: 'ratopati',
    name: 'Ratopati',
    url: 'https://www.ratopati.com',
    rssUrl: 'https://www.ratopati.com/rss',
  },
  {
    id: 'nagarik',
    name: 'Nagarik News',
    url: 'https://nagariknews.nagariknetwork.com',
    rssUrl: 'https://nagariknews.nagariknetwork.com/rss',
  },
  {
    id: 'kantipur',
    name: 'Kantipur',
    url: 'https://ekantipur.com',
    rssUrl: 'https://ekantipur.com/rss',
  },
  {
    id: 'annapurna',
    name: 'Annapurna Post',
    url: 'https://www.annapurnapost.com',
    rssUrl: 'https://www.annapurnapost.com/rss',
  },
  {
    id: 'kathmandupost',
    name: 'The Kathmandu Post',
    url: 'https://kathmandupost.com',
    rssUrl: 'https://kathmandupost.com/rss',
  },
  {
    id: 'myrepublica',
    name: 'My Republica',
    url: 'https://myrepublica.nagariknetwork.com',
    rssUrl: 'https://myrepublica.nagariknetwork.com/rss',
  },
  {
    id: 'nepalnews',
    name: 'Nepal News',
    url: 'https://www.nepalnews.com',
    rssUrl: 'https://www.nepalnews.com/rss',
  },
  {
    id: 'news24',
    name: 'News 24 Nepal',
    url: 'https://www.news24nepal.tv',
    rssUrl: 'https://www.news24nepal.tv/rss',
  },
  {
    id: 'himalayatimes',
    name: 'Himalaya Times',
    url: 'https://thehimalayantimes.com',
    rssUrl: 'https://thehimalayantimes.com/rss',
  },
  {
    id: 'nepalsamacharpatra',
    name: 'Nepal Samacharpatra',
    url: 'https://www.samacharpatra.com',
    rssUrl: 'https://www.samacharpatra.com/rss',
  },
];

export interface NewsItem {
  id: string;
  title: string;
  description?: string;
  link: string;
  source: string;
  sourceUrl: string;
  publishedAt: Date;
  imageUrl?: string;
}

