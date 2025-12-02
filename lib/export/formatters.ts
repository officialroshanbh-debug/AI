/**
 * Advanced Export Options
 * Export chat as PDF, Markdown/HTML, DOCX, with code syntax highlighting
 */

export interface ExportOptions {
  format: 'pdf' | 'markdown' | 'html' | 'json' | 'docx';
  includeCodeHighlighting?: boolean;
  includeTimestamps?: boolean;
  includeMetadata?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  modelId?: string;
  tokens?: number;
}

export class ChatExporter {
  /**
   * Export chat as Markdown
   */
  exportMarkdown(
    messages: ChatMessage[],
    options: ExportOptions = { format: 'markdown' }
  ): string {
    let markdown = '# Chat Export\n\n';

    if (options.includeMetadata) {
      markdown += `**Exported:** ${new Date().toISOString()}\n`;
      markdown += `**Total Messages:** ${messages.length}\n\n`;
    }

    markdown += '---\n\n';

    for (const message of messages) {
      const role = message.role === 'user' ? '**You**' : '**Assistant**';
      markdown += `${role}\n\n`;

      if (options.includeTimestamps && message.timestamp) {
        markdown += `*${new Date(message.timestamp).toLocaleString()}*\n\n`;
      }

      // Check if content contains code blocks
      if (options.includeCodeHighlighting && this.hasCodeBlocks(message.content)) {
        markdown += `${message.content}\n\n`;
      } else {
        markdown += `${message.content}\n\n`;
      }

      if (options.includeMetadata && message.modelId) {
        markdown += `*Model: ${message.modelId}*`;
        if (message.tokens) {
          markdown += ` | Tokens: ${message.tokens}`;
        }
        markdown += '\n\n';
      }

      markdown += '---\n\n';
    }

    return markdown;
  }

  /**
   * Export chat as HTML
   */
  exportHTML(
    messages: ChatMessage[],
    options: ExportOptions = { format: 'html' }
  ): string {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Chat Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .message { margin: 20px 0; padding: 15px; border-radius: 8px; }
    .user { background: #e3f2fd; }
    .assistant { background: #f5f5f5; }
    .timestamp { font-size: 0.85em; color: #666; margin-bottom: 8px; }
    .metadata { font-size: 0.85em; color: #666; margin-top: 8px; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Chat Export</h1>
`;

    if (options.includeMetadata) {
      html += `<p><strong>Exported:</strong> ${new Date().toISOString()}</p>`;
      html += `<p><strong>Total Messages:</strong> ${messages.length}</p>`;
    }

    for (const message of messages) {
      const roleClass = message.role === 'user' ? 'user' : 'assistant';
      html += `<div class="message ${roleClass}">`;
      html += `<div class="role"><strong>${message.role === 'user' ? 'You' : 'Assistant'}</strong></div>`;

      if (options.includeTimestamps && message.timestamp) {
        html += `<div class="timestamp">${new Date(message.timestamp).toLocaleString()}</div>`;
      }

      // Process content for code blocks
      if (options.includeCodeHighlighting) {
        html += `<div class="content">${this.processCodeBlocks(message.content)}</div>`;
      } else {
        html += `<div class="content">${this.escapeHtml(message.content)}</div>`;
      }

      if (options.includeMetadata) {
        html += '<div class="metadata">';
        if (message.modelId) {
          html += `Model: ${message.modelId}`;
        }
        if (message.tokens) {
          html += ` | Tokens: ${message.tokens}`;
        }
        html += '</div>';
      }

      html += '</div>';
    }

    html += `</body>
</html>`;

    return html;
  }

  /**
   * Export chat as JSON
   */
  exportJSON(
    messages: ChatMessage[],
    options: ExportOptions = { format: 'json' }
  ): string {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalMessages: messages.length,
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        ...(options.includeTimestamps && msg.timestamp ? { timestamp: msg.timestamp } : {}),
        ...(options.includeMetadata
          ? {
            modelId: msg.modelId,
            tokens: msg.tokens,
          }
          : {}),
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Check if content has code blocks
   */
  private hasCodeBlocks(content: string): boolean {
    return /```[\s\S]*?```/.test(content) || /`[^`]+`/.test(content);
  }

  /**
   * Process code blocks for HTML
   */
  private processCodeBlocks(content: string): string {
    // Simple code block processing
    // In production, use a proper markdown parser
    return content
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Export chat as PDF (returns HTML that can be converted to PDF)
   */
  async exportPDF(
    messages: ChatMessage[],
    options: ExportOptions = { format: 'pdf' }
  ): Promise<Buffer> {
    // Generate HTML first (can be converted to PDF with puppeteer or similar)
    const html = this.exportHTML(messages, { ...options, format: 'html' });

    // For now, return HTML as buffer (client-side can use browser print to PDF)
    // In production, use puppeteer or similar to generate actual PDF
    return Buffer.from(html, 'utf-8');
  }

  /**
   * Export chat as DOCX
   */
  async exportDOCX(
    messages: ChatMessage[],
    options: ExportOptions = { format: 'docx' }
  ): Promise<Buffer> {
    // DOCX export requires the 'docx' library which is not installed
    // Fallback to HTML export
    console.warn('[Export] DOCX library not available, falling back to HTML');
    const html = this.exportHTML(messages, { ...options, format: 'html' });
    return Buffer.from(html, 'utf-8');
  }
}
