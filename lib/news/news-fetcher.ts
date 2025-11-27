import { NEPAL_NEWS_SOURCES, type NewsItem, type NewsSource } from './nepal-news-sources';

interface RSSItem {
  title: string;
  description?: string;
  link: string;
  pubDate?: string;
  'content:encoded'?: string;
  enclosure?: {
    '@_url'?: string;
  };
}

interface RSSFeed {
  rss?: {
    channel?: {
      item?: RSSItem[];
    };
  };
}

export async function fetchNewsFromRSS(source: NewsSource): Promise<NewsItem[]> {
  if (!source.rssUrl) {
    return [];
  }

  try {
    const response = await fetch(source.rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI Platform News Fetcher)',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.warn(`Failed to fetch RSS from ${source.name}: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    const items = parseRSSFeed(xmlText, source);

    return items.slice(0, 5); // Limit to 5 items per source
  } catch (error) {
    console.error(`Error fetching news from ${source.name}:`, error);
    return [];
  }
}

function parseRSSFeed(xmlText: string, source: NewsSource): NewsItem[] {
  const items: NewsItem[] = [];
  
  try {
    // Clean up XML text
    const cleanXml = xmlText.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Match all item blocks
    const itemMatches = cleanXml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];

    for (const itemXml of itemMatches) {
      try {
        // Extract title (handle both CDATA and regular)
        const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/is);
        // Extract link (handle both <link> and <guid>)
        const linkMatch = itemXml.match(/<link>(.*?)<\/link>/i) || itemXml.match(/<guid[^>]*>(.*?)<\/guid>/i);
        // Extract description
        const descriptionMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/is);
        // Extract pubDate
        const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i) || itemXml.match(/<dc:date>(.*?)<\/dc:date>/i);
        // Extract image from description or enclosure
        const imageMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i) || 
                          itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);

        if (titleMatch && linkMatch) {
          const title = (titleMatch[1] || '').trim()
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
          
          const link = (linkMatch[1] || '').trim();
          
          let description: string | undefined;
          if (descriptionMatch) {
            description = (descriptionMatch[1] || '').trim()
              .replace(/<[^>]*>/g, '')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/\s+/g, ' ')
              .slice(0, 200);
            if (description.length === 0) description = undefined;
          }

          let pubDate = new Date();
          if (pubDateMatch) {
            const parsedDate = new Date(pubDateMatch[1]);
            if (!isNaN(parsedDate.getTime())) {
              pubDate = parsedDate;
            }
          }

          const imageUrl = imageMatch ? imageMatch[1] : undefined;

          if (title && link && link.startsWith('http')) {
            items.push({
              id: `${source.id}-${Buffer.from(link).toString('base64').slice(0, 50)}`,
              title,
              description,
              link,
              source: source.name,
              sourceUrl: source.url,
              publishedAt: pubDate,
              imageUrl,
            });
          }
        }
      } catch (itemError) {
        // Skip invalid items
        continue;
      }
    }
  } catch (error) {
    console.error(`Error parsing RSS feed from ${source.name}:`, error);
  }

  return items;
}

export async function fetchAllNepalNews(limit: number = 20): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  // Fetch from all sources in parallel
  const promises = NEPAL_NEWS_SOURCES.map((source) => fetchNewsFromRSS(source));
  const results = await Promise.allSettled(promises);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allNews.push(...result.value);
    }
  }

  // Sort by published date (newest first)
  allNews.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  // Remove duplicates based on title similarity
  const uniqueNews = removeDuplicates(allNews);

  return uniqueNews.slice(0, limit);
}

function removeDuplicates(news: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const unique: NewsItem[] = [];

  for (const item of news) {
    const normalizedTitle = item.title.toLowerCase().trim();
    if (!seen.has(normalizedTitle)) {
      seen.add(normalizedTitle);
      unique.push(item);
    }
  }

  return unique;
}

