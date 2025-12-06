/**
 * Reusable Markdown Validation Utilities
 * 
 * These utilities can be used across multiple documentation test files
 * to ensure consistent validation of markdown documents.
 */

/**
 * Validate markdown heading hierarchy
 */
export function validateHeadingHierarchy(content: string): {
  valid: boolean;
  issues: string[];
} {
  const lines = content.split('\n');
  const headings = lines.filter(line => line.match(/^#{1,6} /));
  const issues: string[] = [];

  if (headings.length === 0) {
    issues.push('No headings found in document');
    return { valid: false, issues };
  }

  // First heading should be H1
  if (!headings[0].match(/^# /)) {
    issues.push('Document should start with H1 heading');
  }

  // Check for proper nesting (no skipping levels)
  for (let i = 1; i < headings.length; i++) {
    const prevLevel = headings[i - 1].match(/^#+/)?.[0].length || 0;
    const currLevel = headings[i].match(/^#+/)?.[0].length || 0;

    if (currLevel > prevLevel + 1) {
      issues.push(
        `Heading level skip detected: H${prevLevel} to H${currLevel} at "${headings[i]}"`
      );
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Extract all sections from markdown content
 */
export function extractSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = content.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];

  lines.forEach(line => {
    const headingMatch = line.match(/^## (.+)$/);
    if (headingMatch) {
      if (currentSection) {
        sections.set(currentSection, currentContent.join('\n').trim());
      }
      currentSection = headingMatch[1];
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  });

  // Add last section
  if (currentSection) {
    sections.set(currentSection, currentContent.join('\n').trim());
  }

  return sections;
}

/**
 * Validate bullet point consistency
 */
export function validateBulletPoints(content: string): {
  valid: boolean;
  char: string;
  inconsistencies: string[];
} {
  const lines = content.split('\n');
  const bulletLines = lines.filter(line => line.match(/^[-*+] /));

  if (bulletLines.length === 0) {
    return { valid: true, char: '', inconsistencies: [] };
  }

  const firstChar = bulletLines[0][0];
  const inconsistencies = bulletLines
    .filter(line => line[0] !== firstChar)
    .map(line => line.trim());

  return {
    valid: inconsistencies.length === 0,
    char: firstChar,
    inconsistencies,
  };
}

/**
 * Check for broken markdown links
 */
export function validateMarkdownLinks(content: string): {
  valid: boolean;
  brokenLinks: string[];
} {
  const brokenLinks: string[] = [];

  // Check for incomplete link syntax
  const patterns = [
    { regex: /\]\([^\)]*$/gm, name: 'Unclosed parenthesis in link' },
    { regex: /\[[^\]]*$/gm, name: 'Unclosed square bracket' },
    { regex: /\([^\)]*\[/g, name: 'Nested brackets issue' },
  ];

  patterns.forEach(({ regex, name }) => {
    const matches = content.match(regex);
    if (matches) {
      brokenLinks.push(`${name}: ${matches.length} instance(s)`);
    }
  });

  // Extract and validate link format
  const links = content.match(/\[([^\]]*)\]\(([^\)]*)\)/g) || [];
  links.forEach(link => {
    const match = link.match(/\[([^\]]*)\]\(([^\)]*)\)/);
    if (match) {
      const [, text, url] = match;
      if (!text || text.trim() === '') {
        brokenLinks.push(`Empty link text: ${link}`);
      }
      if (!url || url.trim() === '') {
        brokenLinks.push(`Empty URL: ${link}`);
      }
    }
  });

  return {
    valid: brokenLinks.length === 0,
    brokenLinks,
  };
}

/**
 * Validate document completeness
 */
export function validateDocumentCompleteness(
  content: string,
  requiredSections: string[]
): {
  valid: boolean;
  missingSections: string[];
} {
  const contentLower = content.toLowerCase();
  const missingSections = requiredSections.filter(
    section => !contentLower.includes(`## ${section.toLowerCase()}`)
  );

  return {
    valid: missingSections.length === 0,
    missingSections,
  };
}

/**
 * Check for common documentation issues
 */
export function checkDocumentationQuality(content: string): {
  score: number;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Check for TODOs or placeholders
  if (/\b(TODO|FIXME|XXX|TBD)\b/i.test(content)) {
    issues.push('Contains TODO or placeholder markers');
    score -= 20;
  }

  // Check for merge conflict markers
  if (/^(<{7}|={7}|>{7})/m.test(content)) {
    issues.push('Contains merge conflict markers');
    score -= 30;
  }

  // Check line lengths
  const lines = content.split('\n');
  const longLines = lines.filter(line => line.length > 120 && !line.match(/^https?:\/\//));
  if (longLines.length > lines.length * 0.2) {
    warnings.push('More than 20% of lines exceed 120 characters');
    score -= 5;
  }

  // Check for trailing whitespace
  const trailingWhitespace = lines.filter(line => line.match(/\s+$/));
  if (trailingWhitespace.length > 0) {
    warnings.push(`${trailingWhitespace.length} lines have trailing whitespace`);
    score -= 5;
  }

  // Check for empty sections
  const sections = extractSections(content);
  const emptySections = Array.from(sections.entries())
    .filter(([, sectionContent]) => sectionContent.trim().length < 10)
    .map(([name]) => name);

  if (emptySections.length > 0) {
    warnings.push(`Empty or very short sections: ${emptySections.join(', ')}`);
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    issues,
    warnings,
  };
}

/**
 * Validate markdown syntax
 */
export function validateMarkdownSyntax(content: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for malformed headings (missing space after #)
  const malformedHeadings = content.match(/^#{1,6}[^# \n]/gm);
  if (malformedHeadings) {
    errors.push(
      `Malformed headings (missing space after #): ${malformedHeadings.length} found`
    );
  }

  // Check for unmatched code blocks
  const codeBlocks = content.match(/```/g);
  if (codeBlocks && codeBlocks.length % 2 !== 0) {
    errors.push('Unmatched code block delimiters (```)');
  }

  // Check for HTML tags (should use pure markdown)
  const htmlTags = content.match(/<[^>]+>/g);
  if (htmlTags && htmlTags.length > 0) {
    errors.push(`Contains HTML tags: ${htmlTags.length} found (should use pure markdown)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Count documentation metrics
 */
export function getDocumentMetrics(content: string): {
  totalLines: number;
  headings: { level: number; text: string }[];
  bulletPoints: number;
  links: number;
  codeBlocks: number;
  sections: number;
  wordCount: number;
} {
  const lines = content.split('\n');
  const headings = lines
    .filter(line => line.match(/^#{1,6} /))
    .map(line => {
      const match = line.match(/^(#{1,6}) (.+)$/);
      return match
        ? { level: match[1].length, text: match[2] }
        : { level: 0, text: '' };
    });

  const bulletPoints = lines.filter(line => line.match(/^[-*+] /)).length;
  const links = (content.match(/\[([^\]]+)\]\(([^\)]+)\)/g) || []).length;
  const codeBlocks = Math.floor((content.match(/```/g) || []).length / 2);
  const sections = extractSections(content).size;
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

  return {
    totalLines: lines.length,
    headings,
    bulletPoints,
    links,
    codeBlocks,
    sections,
    wordCount,
  };
}