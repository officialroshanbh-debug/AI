import type { Message } from '@/types/ai-models';

/**
 * Long-form answer optimization pipeline
 * Expands short answers into comprehensive, well-structured responses
 */
export async function longFormPipeline(
  initialAnswer: string,
  conversationHistory: Message[]
): Promise<string> {
  // If answer is already long enough, return as-is
  if (initialAnswer.length > 2000) {
    return initialAnswer;
  }

  // Step 1: Structure the answer
  const structured = await structureAnswer(initialAnswer);

  // Step 2: Expand with reasoning
  const expanded = await expandWithReasoning(structured, conversationHistory);

  // Step 3: Refine and polish
  const refined = await refineAnswer(expanded);

  return refined;
}

async function structureAnswer(answer: string): Promise<string> {
  // Identify key points and structure them
  const sentences = answer.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  
  if (sentences.length <= 3) {
    return answer;
  }

  // Group related sentences into sections
  const sections: string[] = [];
  let currentSection: string[] = [];

  for (const sentence of sentences) {
    currentSection.push(sentence.trim());
    
    // Start new section after every 3-4 sentences
    if (currentSection.length >= 3) {
      sections.push(currentSection.join('. ') + '.');
      currentSection = [];
    }
  }

  if (currentSection.length > 0) {
    sections.push(currentSection.join('. ') + '.');
  }

  return sections.join('\n\n');
}

async function expandWithReasoning(
  structured: string,
  history: Message[]
): Promise<string> {
  // Extract context from conversation history
  const context = history
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ');

  // Add reasoning and context where appropriate
  const lines = structured.split('\n\n');
  const expanded = lines.map((section, index) => {
    // Add introductory context for first section
    if (index === 0 && context) {
      const relevantContext = extractRelevantContext(context, section);
      if (relevantContext) {
        return `Considering ${relevantContext}, ${section}`;
      }
    }

    // Add transitional phrases between sections
    if (index > 0) {
      return `Furthermore, ${section}`;
    }

    return section;
  });

  return expanded.join('\n\n');
}

function extractRelevantContext(context: string, section: string): string | null {
  // Simple keyword matching to find relevant context
  const sectionWords = new Set(section.toLowerCase().split(/\s+/));
  const contextWords = context.toLowerCase().split(/\s+/);
  
  const matches = contextWords.filter((word) => 
    word.length > 4 && sectionWords.has(word)
  );

  if (matches.length > 0) {
    return `the context of ${matches[0]}`;
  }

  return null;
}

async function refineAnswer(expanded: string): Promise<string> {
  // Clean up formatting and ensure coherence
  let refined = expanded;

  // Remove excessive whitespace
  refined = refined.replace(/\n{3,}/g, '\n\n');

  // Ensure proper sentence endings
  refined = refined.replace(/\.{2,}/g, '.');

  // Add smooth transitions
  refined = refined.replace(/\n\n([A-Z])/g, '\n\n$1');

  return refined.trim();
}

