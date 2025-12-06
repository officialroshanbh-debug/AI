import { getResearchById } from '@/app/actions/research';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Calendar, FileText, Share2, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Markdown } from '@/components/ui/markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface ResearchPageProps {
    params: Promise<{ id: string }>;
}

export default async function ResearchPage({ params }: ResearchPageProps) {
    const { id } = await params;
    const research = await getResearchById(id);

    if (!research) {
        notFound();
    }

    return (
        <div className="container py-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild className="-ml-4">
                    <Link href="/research/history">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to History
                    </Link>
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">{research.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(research.createdAt), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{research.totalWordCount} words</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span>{research.totalSources} sources</span>
                    </div>
                </div>
            </div>

            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-lg">Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="leading-relaxed">{research.summary}</p>
                </CardContent>
            </Card>

            <div className="space-y-8">
                <div className="border-b pb-4">
                    <h2 className="text-2xl font-semibold mb-4">Table of Contents</h2>
                    <nav className="space-y-2">
                        {research.sections.map((section, index) => (
                            <a
                                key={section.id}
                                href={`#section-${index}`}
                                className="block text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {index + 1}. {section.title}
                            </a>
                        ))}
                    </nav>
                </div>

                {research.sections.map((section, index) => (
                    <section key={section.id} id={`section-${index}`} className="scroll-mt-20 space-y-4">
                        <h2 className="text-2xl font-bold">
                            {index + 1}. {section.title}
                        </h2>

                        <Markdown
                            className="prose dark:prose-invert max-w-none text-zinc-300"
                            components={{
                                code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                        <SyntaxHighlighter
                                            {...props}
                                            style={vscDarkPlus}
                                            language={match[1]}
                                            PreTag="div"
                                            className="rounded-md !my-4 !bg-zinc-950 border border-zinc-800"
                                        >
                                            {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                    ) : (
                                        <code {...props} className="bg-zinc-800/50 rounded px-1 py-0.5 text-xs font-mono">
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {section.content}
                        </Markdown>

                        {section.sources.length > 0 && (
                            <div className="mt-6 pt-4 border-t">
                                <h4 className="text-sm font-semibold mb-3">Sources</h4>
                                <div className="grid gap-2">
                                    {section.sources.map((source, idx) => (
                                        <a
                                            key={source.id}
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-muted-foreground hover:text-primary hover:underline truncate block"
                                        >
                                            [{idx + 1}] {source.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                ))}
            </div>
        </div>
    );
}
