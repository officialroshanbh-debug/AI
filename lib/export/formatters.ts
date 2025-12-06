
import { Message } from '@prisma/client';

export type ExportFormat = 'markdown' | 'json' | 'html' | 'pdf' | 'docx';

export interface ExportOptions {
  format: ExportFormat;
  includeCodeHighlighting?: boolean;
  includeTimestamps?: boolean;
  includeMetadata?: boolean;
}

export interface ExportMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  modelId?: string;
  tokens?: number;
}

export class ChatExporter {
  exportMarkdown(messages: ExportMessage[], options: ExportOptions): string {
    const date = new Date().toLocaleDateString();
    let md = `# Exported Chat\n\n*Exported on ${date}*\n\n---\n\n`;

    messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      const timestamp = options.includeTimestamps ? ` (${msg.timestamp.toLocaleString()})` : '';
      md += `### ${role}${timestamp}\n\n${msg.content}\n\n`;
      if (msg.role !== 'user') {
        md += `\n---\n\n`;
      }
    });

    return md;
  }

  exportJSON(messages: ExportMessage[], options: ExportOptions): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      messages
    }, null, 2);
  }

  exportHTML(messages: ExportMessage[], options: ExportOptions): string {
    // Simple HTML export for now
    let html = `<!DOCTYPE html><html><head><title>Chat Export</title><style>
      body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
      .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
      .user { background-color: #f0f0f0; }
      .assistant { background-color: #e6f7ff; }
      .role { font-weight: bold; margin-bottom: 5px; }
      .timestamp { font-size: 0.8em; color: #666; }
    </style></head><body>`;

    messages.forEach(msg => {
      html += `<div class="message ${msg.role}">
        <div class="role">${msg.role.toUpperCase()} <span class="timestamp">${msg.timestamp.toLocaleString()}</span></div>
        <div class="content">${msg.content.replace(/\n/g, '<br>')}</div>
      </div>`;
    });

    html += '</body></html>';
    return html;
  }

  // Stub for PDF - requires external libs usually, keeping simple for build fix
  async exportPDF(messages: ExportMessage[], options: ExportOptions): Promise<Uint8Array> {
    // Return empty buffer for now to satisfy type, implementation would need pdfkit or similar
    // This resolves the build error without introducing heavy dependencies yet
    const text = this.exportMarkdown(messages, options);
    return new TextEncoder().encode(text);
  }

  // Stub for DOCX 
  async exportDOCX(messages: ExportMessage[], options: ExportOptions): Promise<Uint8Array> {
    const text = this.exportMarkdown(messages, options);
    return new TextEncoder().encode(text);
  }
}

// Backward compatibility legacy formatters
export function formatChatAsMarkdown(title: string, messages: Partial<Message>[]): string {
  const exporter = new ChatExporter();
  return exporter.exportMarkdown(messages.map(m => ({
    id: m.id || '',
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content || '',
    timestamp: m.createdAt || new Date(),
  })), { format: 'markdown' });
}

export function formatChatAsJSON(title: string, messages: Partial<Message>[]): string {
  const exporter = new ChatExporter();
  return exporter.exportJSON(messages.map(m => ({
    id: m.id || '',
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content || '',
    timestamp: m.createdAt || new Date(),
  })), { format: 'json' });
}
