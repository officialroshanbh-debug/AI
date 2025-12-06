import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

import {
  validateHeadingHierarchy,
  validateBulletPoints,
  validateMarkdownLinks,
  validateDocumentCompleteness,
  checkDocumentationQuality,
  getDocumentMetrics,
} from './markdown-validators';
describe('CODERABBIT_REVIEW.md Documentation Tests', () => {
  let fileContent: string;
  let fileLines: string[];
  const filePath = join(process.cwd(), 'CODERABBIT_REVIEW.md');

  beforeAll(() => {
    // Read the file content before running tests
    if (existsSync(filePath)) {
      fileContent = readFileSync(filePath, 'utf-8');
      fileLines = fileContent.split('\n');
    }
  });

  describe('File Existence and Readability', () => {
    it('should exist in the repository root', () => {
      expect(existsSync(filePath)).toBe(true);
    });

    it('should be readable and contain content', () => {
      expect(fileContent).toBeDefined();
      expect(fileContent.length).toBeGreaterThan(0);
    });

    it('should not be empty or contain only whitespace', () => {
      expect(fileContent.trim().length).toBeGreaterThan(0);
    });

    it('should have multiple lines of content', () => {
      expect(fileLines.length).toBeGreaterThan(5);
    });
  });

  describe('Document Structure Validation', () => {
    it('should have a primary heading (H1)', () => {
      const h1Pattern = /^# .+/m;
      expect(h1Pattern.test(fileContent)).toBe(true);
    });

    it('should start with the correct title', () => {
      const firstLine = fileLines[0];
      expect(firstLine).toMatch(/^# CodeRabbit Code Review Integration$/);
    });

    it('should contain at least one secondary heading (H2)', () => {
      const h2Pattern = /^## .+/m;
      expect(h2Pattern.test(fileContent)).toBe(true);
    });

    it('should have proper heading hierarchy', () => {
      const headings = fileLines.filter(line => line.match(/^#{1,6} /));
      expect(headings.length).toBeGreaterThanOrEqual(3);
      
      // First heading should be H1
      expect(headings[0]).toMatch(/^# /);
    });

    it('should not have duplicate headings', () => {
      const headings = fileLines
        .filter(line => line.match(/^#{1,6} /))
        .map(h => h.toLowerCase().trim());
      
      const uniqueHeadings = new Set(headings);
      expect(uniqueHeadings.size).toBe(headings.length);
    });
  });

  describe('Required Content Sections', () => {
    it('should contain a Features section', () => {
      expect(fileContent).toMatch(/## Features/i);
    });

    it('should contain a Benefits section', () => {
      expect(fileContent).toMatch(/## Benefits/i);
    });

    it('should contain a Usage section', () => {
      expect(fileContent).toMatch(/## Usage/i);
    });

    it('should describe CodeRabbit integration', () => {
      expect(fileContent.toLowerCase()).toContain('coderabbit');
      expect(fileContent.toLowerCase()).toContain('integration');
    });

    it('should mention automated code review', () => {
      expect(fileContent.toLowerCase()).toContain('automated');
      expect(fileContent.toLowerCase()).toContain('code review');
    });
  });

  describe('Content Quality and Completeness', () => {
    it('should have descriptive content under each section', () => {
      const sections = fileContent.split(/^## /m).slice(1); // Skip everything before first H2
      
      sections.forEach(section => {
        const content = section.split('\n').slice(1).join('\n').trim();
        expect(content.length).toBeGreaterThan(10);
      });
    });

    it('should contain bullet points for Features section', () => {
      const featuresSection = fileContent.match(/## Features\s*([\s\S]*?)(?=\n## |\n#|$)/);
      expect(featuresSection).toBeDefined();
      expect(featuresSection![1]).toMatch(/^- /m);
    });

    it('should contain bullet points for Benefits section', () => {
      const benefitsSection = fileContent.match(/## Benefits\s*([\s\S]*?)(?=\n## |\n#|$)/);
      expect(benefitsSection).toBeDefined();
      expect(benefitsSection![1]).toMatch(/^- /m);
    });

    it('should list AI-powered features', () => {
      expect(fileContent.toLowerCase()).toContain('ai');
      expect(fileContent.toLowerCase()).toMatch(/ai[- ]powered|artificial intelligence/);
    });

    it('should mention pull requests or PR workflow', () => {
      expect(fileContent.toLowerCase()).toMatch(/pull request|pr|workflow/);
    });

    it('should reference GitHub integration', () => {
      expect(fileContent.toLowerCase()).toContain('github');
    });
  });

  describe('Markdown Syntax Validation', () => {
    it('should not have malformed headings (missing space after #)', () => {
      const malformedHeadings = fileLines.filter(line => 
        line.match(/^#{1,6}[^# \n]/)
      );
      expect(malformedHeadings).toHaveLength(0);
    });

    it('should have consistent bullet point style', () => {
      const bulletPoints = fileLines.filter(line => line.match(/^[-*+] /));
      if (bulletPoints.length > 0) {
        const firstBulletChar = bulletPoints[0][0];
        const allConsistent = bulletPoints.every(line => line[0] === firstBulletChar);
        expect(allConsistent).toBe(true);
      }
    });

    it('should not have trailing whitespace on lines', () => {
      const linesWithTrailingSpace = fileLines
        .filter((line, idx) => idx < fileLines.length - 1) // Ignore last line
        .filter(line => line.match(/\s+$/));
      
      expect(linesWithTrailingSpace.length).toBe(0);
    });

    it('should have proper line breaks between sections', () => {
      const headingLines = fileLines
        .map((line, idx) => ({ line, idx }))
        .filter(({ line }) => line.match(/^## /));
      
      headingLines.forEach(({ idx }) => {
        if (idx > 0) {
          // Should have blank line before section heading (or be first line after H1)
          const previousLine = fileLines[idx - 1];
          const isAfterH1 = fileLines[idx - 2]?.match(/^# /);
          expect(previousLine.trim() === '' || isAfterH1).toBe(true);
        }
      });
    });

    it('should not contain HTML tags (pure markdown)', () => {
      const htmlTags = fileContent.match(/<[^>]+>/g);
      expect(htmlTags).toBeNull();
    });

    it('should not have consecutive blank lines', () => {
      let consecutiveBlankCount = 0;
      let maxConsecutiveBlank = 0;

      fileLines.forEach(line => {
        if (line.trim() === '') {
          consecutiveBlankCount++;
          maxConsecutiveBlank = Math.max(maxConsecutiveBlank, consecutiveBlankCount);
        } else {
          consecutiveBlankCount = 0;
        }
      });

      expect(maxConsecutiveBlank).toBeLessThanOrEqual(2);
    });
  });

  describe('Documentation Standards Compliance', () => {
    it('should have informative and complete sentences', () => {
      const sentences = fileContent
        .split(/[.!?]\s+/)
        .filter(s => s.trim().length > 0 && !s.match(/^#{1,6} /));
      
      // Each sentence should be at least 15 characters (reasonable minimum)
      const shortSentences = sentences.filter(s => s.trim().length < 15);
      expect(shortSentences.length).toBeLessThan(sentences.length * 0.3);
    });

    it('should use professional language', () => {
      // Should not contain casual language markers
      const casualPhrases = /\b(gonna|wanna|gotta|kinda|sorta|yeah|nope)\b/i;
      expect(casualPhrases.test(fileContent)).toBe(false);
    });

    it('should maintain consistent capitalization in headings', () => {
      const headings = fileLines.filter(line => line.match(/^#{1,6} /));
      
      headings.forEach(heading => {
        const headingText = heading.replace(/^#{1,6}\s+/, '');
        // First word should be capitalized
        expect(headingText[0]).toMatch(/[A-Z]/);
      });
    });

    it('should end with a newline character', () => {
      expect(fileContent.endsWith('\n')).toBe(true);
    });
  });

  describe('Link Validation', () => {
    it('should not contain broken markdown link syntax', () => {
      // Check for common markdown link issues
      const brokenLinkPatterns = [
        /\]\([^\)]*$/m,  // Opening bracket without closing
        /\[[^\]]*$/m,    // Opening square bracket without closing
        /\([^\)]*\[/,    // Nested brackets issue
      ];

      brokenLinkPatterns.forEach(pattern => {
        expect(pattern.test(fileContent)).toBe(false);
      });
    });

    it('should have properly formatted links if any exist', () => {
      const links = fileContent.match(/\[([^\]]+)\]\(([^\)]+)\)/g);
      
      if (links) {
        links.forEach(link => {
          // Link text should not be empty
          expect(link).toMatch(/\[.+\]/);
          // URL should not be empty
          expect(link).toMatch(/\(.+\)/);
        });
      }
    });
  });

  describe('Feature-Specific Content Validation', () => {
    it('should mention instant feedback capability', () => {
      expect(fileContent.toLowerCase()).toMatch(/instant feedback|immediate feedback|real-time feedback/);
    });

    it('should describe code quality improvements', () => {
      expect(fileContent.toLowerCase()).toContain('code quality');
    });

    it('should mention time-saving benefits', () => {
      expect(fileContent.toLowerCase()).toMatch(/reduce.*time|time.*saving|faster|efficiency/);
    });

    it('should reference best practices', () => {
      expect(fileContent.toLowerCase()).toContain('best practice');
    });

    it('should describe the workflow integration', () => {
      const usageSection = fileContent.match(/## Usage\s*([\s\S]*?)(?=\n## |\n#|$)/);
      expect(usageSection).toBeDefined();
      expect(usageSection![1].toLowerCase()).toMatch(/workflow|integrate|process/);
    });
  });

  describe('Accessibility and Readability', () => {
    it('should have reasonable line lengths (< 120 characters)', () => {
      const longLines = fileLines.filter(line => 
        line.length > 120 && !line.match(/^https?:\/\//)
      );
      
      // Allow some long lines but not excessive
      expect(longLines.length).toBeLessThan(fileLines.length * 0.2);
    });

    it('should use clear and concise bullet points', () => {
      const bulletPoints = fileLines.filter(line => line.match(/^- /));
      
      bulletPoints.forEach(bullet => {
        const text = bullet.replace(/^- /, '').trim();
        // Bullet points should be meaningful (at least 10 chars)
        expect(text.length).toBeGreaterThan(10);
        // But not too long (should be concise)
        expect(text.length).toBeLessThan(200);
      });
    });

    it('should have a logical flow from introduction to details', () => {
      const sections = [];
      fileLines.forEach(line => {
        const match = line.match(/^## (.+)/);
        if (match) {
          sections.push(match[1]);
        }
      });

      // Should follow a logical order
      expect(sections.length).toBeGreaterThanOrEqual(3);
      
      // Features should come before or around the same place as Benefits
      const featuresIdx = sections.findIndex(s => s.toLowerCase().includes('feature'));
      const benefitsIdx = sections.findIndex(s => s.toLowerCase().includes('benefit'));
      const usageIdx = sections.findIndex(s => s.toLowerCase().includes('usage'));
      
      expect(featuresIdx).toBeGreaterThanOrEqual(0);
      expect(benefitsIdx).toBeGreaterThanOrEqual(0);
      expect(usageIdx).toBeGreaterThanOrEqual(0);
      
      // Usage typically comes after features and benefits
      expect(usageIdx).toBeGreaterThan(Math.min(featuresIdx, benefitsIdx));
    });
  });

  describe('Version Control and Maintenance', () => {
    it('should not contain TODO, FIXME, or placeholder text', () => {
      const placeholders = /\b(TODO|FIXME|XXX|PLACEHOLDER|TBD|COMING SOON)\b/i;
      expect(placeholders.test(fileContent)).toBe(false);
    });

    it('should not have merge conflict markers', () => {
      const conflictMarkers = /^(<{7}|={7}|>{7})/m;
      expect(conflictMarkers.test(fileContent)).toBe(false);
    });

    it('should be production-ready documentation', () => {
      // Should not contain draft or WIP markers
      const draftMarkers = /\b(draft|wip|work in progress|not final)\b/i;
      expect(draftMarkers.test(fileContent)).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle unicode characters properly if present', () => {
      // If unicode is present, it should be valid
      const unicodePattern = /[\u0080-\uFFFF]/;
      if (unicodePattern.test(fileContent)) {
        // Check it's properly encoded (no replacement characters)
        expect(fileContent).not.toContain('\uFFFD');
      }
    });

    it('should not have excessive punctuation', () => {
      const excessivePunctuation = /[!?]{3,}|\.\.\.\./;
      expect(excessivePunctuation.test(fileContent)).toBe(false);
    });

    it('should not have multiple spaces between words', () => {
      const multipleSpaces = /[a-zA-Z]\s{2,}[a-zA-Z]/;
      expect(multipleSpaces.test(fileContent)).toBe(false);
    });
  });
});

  describe('Advanced Validation using Markdown Utilities', () => {
    it('should pass heading hierarchy validation', () => {
      const result = validateHeadingHierarchy(fileContent);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should have consistent bullet point style', () => {
      const result = validateBulletPoints(fileContent);
      expect(result.valid).toBe(true);
      expect(result.inconsistencies).toHaveLength(0);
    });

    it('should not have broken markdown links', () => {
      const result = validateMarkdownLinks(fileContent);
      expect(result.valid).toBe(true);
      if (!result.valid) {
        console.log('Broken links found:', result.brokenLinks);
      }
    });

    it('should contain all required sections', () => {
      const requiredSections = ['Features', 'Benefits', 'Usage'];
      const result = validateDocumentCompleteness(fileContent, requiredSections);
      expect(result.valid).toBe(true);
      expect(result.missingSections).toHaveLength(0);
    });

    it('should pass documentation quality checks', () => {
      const result = checkDocumentationQuality(fileContent);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.issues).toHaveLength(0);
    });

    it('should have meaningful metrics', () => {
      const metrics = getDocumentMetrics(fileContent);
      
      // Document should have substantial content
      expect(metrics.totalLines).toBeGreaterThan(10);
      expect(metrics.headings.length).toBeGreaterThanOrEqual(4);
      expect(metrics.bulletPoints).toBeGreaterThanOrEqual(6);
      expect(metrics.sections).toBeGreaterThanOrEqual(3);
      expect(metrics.wordCount).toBeGreaterThan(50);
    });

    it('should provide useful metrics for documentation health', () => {
      const metrics = getDocumentMetrics(fileContent);
      
      // Log metrics for visibility (helpful during test runs)
      console.log('Documentation Metrics:', {
        lines: metrics.totalLines,
        headings: metrics.headings.length,
        sections: metrics.sections,
        bullets: metrics.bulletPoints,
        words: metrics.wordCount,
      });
      
      // Ensure reasonable content density
      const wordsPerLine = metrics.wordCount / metrics.totalLines;
      expect(wordsPerLine).toBeGreaterThan(3); // At least 3 words per line average
    });
  });
});