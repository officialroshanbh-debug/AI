import { NEPAL_NEWS_SOURCES, type NewsItem, type NewsSource } from './nepal-news-sources';
import { INTERNATIONAL_NEWS_SOURCES } from './international-news-sources';
import { INDIA_NEWS_SOURCES } from './india-news-sources';

// Create a simple hash for IDs (works in Edge and Node.js)
function createHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).slice(0, 20);
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
      // Silently skip sources that return 404 or other errors
      // This prevents one broken feed from affecting others
      if (response.status === 404) {
        // Source may have removed RSS feed - skip silently
        return [];
      }
      // For other errors, only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Failed to fetch RSS from ${source.name}: ${response.status}`);
      }
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
            // Create a unique ID using hash function
            const linkHash = createHash(link);
            
            // Detect category from title and description if not set
            const detectedCategory = detectCategory(title, description, source.category);
            
            items.push({
              id: `${source.id}-${linkHash}`,
              title,
              description,
              link,
              source: source.name,
              sourceUrl: source.url,
              publishedAt: pubDate,
              imageUrl,
              category: detectedCategory,
              country: source.country,
            });
          }
        }
      } catch {
        // Skip invalid items
        continue;
      }
    }
  } catch (error) {
    console.error(`Error parsing RSS feed from ${source.name}:`, error);
  }

  return items;
}

// Category detection based on keywords
function detectCategory(
  title: string,
  description: string | undefined,
  sourceCategory?: string
): NewsItem['category'] {
  // If source has a category, use it
  if (sourceCategory && ['tech', 'finance', 'sports', 'entertainment', 'science', 'politics'].includes(sourceCategory)) {
    return sourceCategory as NewsItem['category'];
  }

  const text = `${title} ${description || ''}`.toLowerCase();

  // Tech keywords
  if (
    /\b(tech|technology|ai|artificial intelligence|software|app|digital|computer|internet|cyber|startup|innovation|gadget|iphone|android|google|apple|microsoft|meta|facebook|twitter|x|amazon|tesla|spacex|nvidia|chip|semiconductor|blockchain|crypto|bitcoin|web3|vr|ar|metaverse)\b/i.test(text)
  ) {
    return 'tech';
  }

  // Finance keywords
  if (
    /\b(finance|financial|economy|economic|stock|market|trading|investment|bank|currency|dollar|rupee|inflation|recession|gdp|bitcoin|crypto|bitcoin|ethereum|stock market|wall street|dow jones|nasdaq)\b/i.test(text)
  ) {
    return 'finance';
  }

  // Sports keywords
  if (
    /\b(sport|football|soccer|basketball|cricket|tennis|olympic|world cup|championship|match|game|player|team|league|premier league|nfl|nba|fifa)\b/i.test(text)
  ) {
    return 'sports';
  }

  // Entertainment keywords
  if (
    /\b(movie|film|actor|actress|celebrity|hollywood|bollywood|music|song|album|concert|award|oscar|grammy|entertainment|tv show|series|netflix|disney)\b/i.test(text)
  ) {
    return 'entertainment';
  }

  // Science keywords
  if (
    /\b(science|scientific|research|study|discovery|space|nasa|planet|earth|climate|environment|health|medical|disease|vaccine|research|experiment|lab|scientist)\b/i.test(text)
  ) {
    return 'science';
  }

  // Politics keywords
  if (
    /\b(politics|political|government|president|prime minister|minister|election|vote|parliament|congress|senate|democracy|republican|democrat|policy|law|bill)\b/i.test(text)
  ) {
    return 'politics';
  }

  return 'general';
}

// Fetch all news from all sources
export async function fetchAllNews(limit: number = 50): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  // Combine all sources
  const allSources = [
    ...NEPAL_NEWS_SOURCES,
    ...INTERNATIONAL_NEWS_SOURCES,
    ...INDIA_NEWS_SOURCES,
  ];

  // Fetch from all sources in parallel (with rate limiting consideration)
  const promises = allSources.map((source) => fetchNewsFromRSS(source));
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

// Fetch news by category
export async function fetchNewsByCategory(
  category: NewsItem['category'],
  limit: number = 20
): Promise<NewsItem[]> {
  const allNews = await fetchAllNews(100);
  return allNews.filter((item) => item.category === category).slice(0, limit);
}

// Legacy function for backward compatibility
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

