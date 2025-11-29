/**
 * Scrapes article content from news URLs
 * Uses a simple approach to extract main content
 */

export interface ScrapedContent {
  title: string;
  content: string;
  author?: string;
  publishedDate?: Date;
  imageUrl?: string;
}

export async function scrapeArticleContent(url: string): Promise<ScrapedContent | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    
    // Extract content using common article selectors
    const content = extractArticleContent(html, url);
    
    if (!content || content.length < 100) {
      return null; // Too short, probably not the main content
    }

    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch 
      ? titleMatch[1].replace(/<[^>]*>/g, '').trim()
      : '';

    // Extract published date
    const dateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i) ||
                     html.match(/<time[^>]*datetime=["']([^"']+)["']/i) ||
                     html.match(/<meta[^>]*name=["']publish-date["'][^>]*content=["']([^"']+)["']/i);
    const publishedDate = dateMatch ? new Date(dateMatch[1]) : undefined;

    // Extract author
    const authorMatch = html.match(/<meta[^>]*property=["']article:author["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    const author = authorMatch ? authorMatch[1].trim() : undefined;

    // Extract main image
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*property=["']article:image["'][^>]*content=["']([^"']+)["']/i);
    const imageUrl = imageMatch ? imageMatch[1] : undefined;

    return {
      title: title || '',
      content: cleanContent(content),
      author,
      publishedDate,
      imageUrl,
    };
  } catch (error) {
    console.error(`Error scraping content from ${url}:`, error);
    return null;
  }
}

function extractArticleContent(html: string, url: string): string {
  // Remove scripts and styles
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleanHtml = cleanHtml.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // Try common article selectors
  const selectors = [
    'article',
    '[role="article"]',
    '.article-content',
    '.article-body',
    '.post-content',
    '.entry-content',
    '.content',
    '.story-body',
    '.article-text',
    'main article',
    '#article-content',
    '#article-body',
  ];

  for (const selector of selectors) {
    // Simple regex-based extraction (for server-side, we'd use a proper HTML parser in production)
    const pattern = new RegExp(`<${selector.replace(/[.#\[\]]/g, (m) => {
      if (m === '.') return '[^>]*class=["\'][^"\']*';
      if (m === '#') return '[^>]*id=["\']';
      return m;
    })}(?:[^>]*>)([\\s\\S]*?)<\\/${selector.split(/[.#\[\]]/)[0]}>`, 'i');
    
    const match = html.match(pattern);
    if (match && match[1]) {
      const text = match[1]
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length > 200) {
        return text;
      }
    }
  }

  // Fallback: extract all paragraph text
  const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gis);
  if (paragraphs) {
    const text = paragraphs
      .map(p => p.replace(/<[^>]*>/g, ' ').trim())
      .filter(p => p.length > 50)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length > 200) {
      return text;
    }
  }

  return '';
}

function cleanContent(content: string): string {
  return content
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
    .slice(0, 10000); // Limit to 10k characters
}

