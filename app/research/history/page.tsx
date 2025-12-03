import { getResearchHistory } from '@/app/actions/research';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, Calendar, BookOpen, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default async function ResearchHistoryPage() {
    const history = await getResearchHistory();

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Research History</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage your past deep research reports.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/research">New Research</Link>
                </Button>
            </div>

            {history.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No research history</h3>
                        <p className="text-muted-foreground mt-2 mb-4 max-w-sm">
                            You haven&apos;t generated any research reports yet. Start a new research session to get started.
                        </p>
                        <Button asChild>
                            <Link href="/research">Start Researching</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {history.map((item) => (
                        <Link key={item.id} href={`/research/${item.id}`}>
                            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                                <CardHeader>
                                    <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-2">
                                        <Calendar className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                        {item.summary}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" />
                                            <span>{item.totalWordCount} words</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{item.totalSources} sources</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
