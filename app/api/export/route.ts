import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const exportSchema = z.object({
  chatId: z.string(),
  format: z.enum(['pdf', 'markdown', 'html', 'json']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = exportSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid export request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { chatId, format } = validationResult.data;

    // Fetch chat with messages
    const chat = await prisma.chat.findUnique({
      where: { id: chatId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Generate export based on format
    let content: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'json':
        content = JSON.stringify({
          title: chat.title,
          model: chat.modelId,
          createdAt: chat.createdAt,
          messages: chat.messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.createdAt,
          }))
        }, null, 2);
        contentType = 'application/json';
        filename = `chat-${chatId}.json`;
        break;

      case 'markdown':
        content = generateMarkdown(chat);
        contentType = 'text/markdown';
        filename = `chat-${chatId}.md`;
        break;

      case 'html':
        content = generateHTML(chat);
        contentType = 'text/html';
        filename = `chat-${chatId}.html`;
        break;

      case 'pdf':
        // For PDF, return the HTML content
        // Frontend will use jsPDF to convert it
        content = generateHTML(chat);
        contentType = 'text/html';
        filename = `chat-${chatId}.html`;
        break;

      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Export API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export chat' },
      { status: 500 }
    );
  }
}

interface ChatWithMessages {
  title: string;
  modelId: string;
  createdAt: Date;
  messages: Array<{ role: string; content: string; createdAt: Date }>;
}

function generateMarkdown(chat: ChatWithMessages): string {
  let md = `# ${chat.title}\n\n`;
  md += `**Model:** ${chat.modelId}\n`;
  md += `**Created:** ${new Date(chat.createdAt).toLocaleString()}\n\n`;
  md += `---\n\n`;

  for (const message of chat.messages) {
    const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
    md += `### ${role}\n\n`;
    md += `${message.content}\n\n`;
  }

  return md;
}

function generateHTML(chat: ChatWithMessages): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(chat.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
      line-height: 1.6;
    }
    .header {
      border-bottom: 2px solid #eee;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      margin: 0 0 10px 0;
      color: #111;
    }
    .meta {
      color: #666;
      font-size: 14px;
    }
    .message {
      margin: 20px 0;
      padding: 15px;
      border-radius: 8px;
    }
    .user {
      background: #f0f4ff;
      border-left: 4px solid #4f46e5;
    }
    .assistant {
      background: #f9fafb;
      border-left: 4px solid #10b981;
    }
    .role {
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content {
      white-space: pre-wrap;
    }
    code {
      background: #f4f4f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(chat.title)}</h1>
    <div class="meta">
      <strong>Model:</strong> ${escapeHtml(chat.modelId)}<br>
      <strong>Created:</strong> ${new Date(chat.createdAt).toLocaleString()}
    </div>
  </div>
`;

  for (const message of chat.messages) {
    const className = message.role === 'user' ? 'user' : 'assistant';
    const roleIcon = message.role === 'user' ? '👤' : '🤖';
    html += `
  <div class="message ${className}">
    <div class="role">${roleIcon} ${message.role}</div>
    <div class="content">${escapeHtml(message.content)}</div>
  </div>
`;
  }

  html += `
</body>
</html>`;

  return html;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
