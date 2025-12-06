
import { Message } from '@prisma/client';

export function formatChatAsMarkdown(title: string, messages: Partial<Message>[]): string {
  const date = new Date().toLocaleDateString();
  let md = `# ${title}\n\n`;
  md += `*Exported on ${date}*\n\n---\n\n`;

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    md += `### ${role}\n\n${msg.content}\n\n`;
    if (msg.role !== 'user') {
      md += `\n---\n\n`;
    }
  });

  return md;
}

export function formatChatAsJSON(title: string, messages: Partial<Message>[]): string {
  return JSON.stringify({ title, messages, exportedAt: new Date().toISOString() }, null, 2);
}
