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
    
    if (!content || content.length < 500) {
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
  // Remove scripts, styles, and other non-content elements
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleanHtml = cleanHtml.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
  cleanHtml = cleanHtml.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  cleanHtml = cleanHtml.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  cleanHtml = cleanHtml.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  cleanHtml = cleanHtml.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

  // Try to find article content using multiple strategies
  const strategies = [
    // Strategy 1: Look for <article> tag
    () => {
      const articleMatch = cleanHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      if (articleMatch) {
        return extractTextFromHtml(articleMatch[1]);
      }
      return null;
    },
    // Strategy 2: Look for common article class names
    () => {
      const classPatterns = [
        /<div[^>]*class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
        /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
        /<div[^>]*class=["'][^"']*post[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
        /<div[^>]*class=["'][^"']*story[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
      ];
      
      for (const pattern of classPatterns) {
        const matches = [...cleanHtml.matchAll(pattern)];
        for (const match of matches) {
          const text = extractTextFromHtml(match[1]);
          if (text.length > 500) {
            return text;
          }
        }
      }
      return null;
    },
    // Strategy 3: Extract all paragraphs and find the longest continuous block
    () => {
      const paragraphs = cleanHtml.match(/<p[^>]*>(.*?)<\/p>/gis);
      if (paragraphs && paragraphs.length > 3) {
        const text = paragraphs
          .map(p => extractTextFromHtml(p))
          .filter(p => p.length > 50 && !p.match(/^(advertisement|subscribe|follow us|share this)/i))
          .join('\n\n')
          .trim();
        if (text.length > 500) {
          return text;
        }
      }
      return null;
    },
    // Strategy 4: Extract text from main content area
    () => {
      const mainMatch = cleanHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      if (mainMatch) {
        return extractTextFromHtml(mainMatch[1]);
      }
      return null;
    },
  ];

  for (const strategy of strategies) {
    const content = strategy();
    if (content && content.length > 500) {
      return content;
    }
  }

  return '';
}

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '--')
    .replace(/\s+/g, ' ')
    .trim();
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

