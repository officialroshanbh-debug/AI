'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Copy, Check, RefreshCw, ExternalLink, BookOpen } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Message as MessageType, Citation } from '@/types/ai-models';

interface ChatMessageProps {
  message: MessageType & { citations?: Citation[] };
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

export function ChatMessage({ message, isStreaming, onRegenerate }: ChatMessageProps) {
  const { theme } = useTheme();
  const [copiedText, setCopiedText] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const isUser = message.role === 'user';

  const copyToClipboard = async (text: string, isCode = false) => {
    await navigator.clipboard.writeText(text);
    if (isCode) {
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } else {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      className={cn(
        'group relative py-6',
        isUser ? 'bg-background' : 'bg-muted/20'
      )}
    >
      <div className="mx-auto flex max-w-4xl gap-2 md:gap-4 px-3 md:px-4">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-subtle',
            isUser
              ? 'bg-gradient-to-br from-primary to-primary-hover text-primary-foreground'
              : 'glass border border-border/50 text-accent'
          )}
        >
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </motion.div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {isUser ? 'You' : 'Roshan AI'}
              </span>
              {!isUser && (
                <span className="text-xs text-muted-foreground">
                  {isStreaming ? 'Thinking...' : 'Assistant'}
                </span>
              )}
            </div>

            {/* Message Actions */}
            {!isUser && !isStreaming && (
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(message.content)}
                  aria-label="Copy message"
                >
                  {copiedText ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                {onRegenerate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={onRegenerate}
                    aria-label="Regenerate response"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {message.status && isStreaming && !message.content && (
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full"
                />
                <span className="text-sm italic">{message.status}</span>
              </div>
            )}
            {isUser ? (
              <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                {message.content}
              </p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  code({ node: _node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    const inline = !match; // If no language match, it's inline code

                    return !inline && match ? (
                      <div className="group/code relative my-4">
                        {/* Code Block Header */}
                        <div className="glass flex items-center justify-between rounded-t-lg border border-b-0 border-border/50 px-4 py-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {match[1]}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs opacity-0 transition-opacity group-hover/code:opacity-100"
                            onClick={() => copyToClipboard(codeString, true)}
                          >
                            {copiedCode === codeString ? (
                              <>
                                <Check className="mr-1 h-3 w-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="mr-1 h-3 w-3" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Code Block */}
                        <SyntaxHighlighter
                          style={theme === 'dark' ? oneDark : oneLight}
                          language={match[1]}
                          PreTag="div"
                          className="!my-0 !rounded-t-none !rounded-b-lg !border !border-border/50"
                          showLineNumbers
                          {...props}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code
                        className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  a({ node: _node, children, ...props }: any) {
                    return (
                      <a
                        className="font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  table({ node: _node, children, ...props }: any) {
                    return (
                      <div className="my-4 overflow-x-auto rounded-lg border border-border">
                        <table className="w-full" {...props}>
                          {children}
                        </table>
                      </div>
                    );
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  blockquote({ node: _node, children, ...props }: any) {
                    return (
                      <blockquote
                        className="glass my-4 border-l-4 border-primary pl-4"
                        {...props}
                      >
                        {children}
                      </blockquote>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-flex h-4 w-1 bg-primary"
                aria-label="AI is typing"
              />
            )}
          </div>

          {/* Citations - Compact View */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                <BookOpen className="h-3.5 w-3.5" />
                Sources
              </div>
              <div className="flex flex-wrap gap-2">
                {message.citations.map((citation, idx) => {
                  const domain = new URL(citation.source).hostname.replace('www.', '');
                  return (
                    <motion.a
                      key={citation.id || idx}
                      href={citation.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background hover:bg-muted/50 transition-all text-xs max-w-[200px]"
                      title={citation.title || citation.source}
                    >
                      <div className="relative h-3.5 w-3.5 shrink-0 overflow-hidden rounded-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                          alt={domain}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="truncate font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {domain}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 font-mono ml-0.5">
                        {idx + 1}
                      </span>
                    </motion.a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}