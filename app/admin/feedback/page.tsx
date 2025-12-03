'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ThumbsUp, ThumbsDown, Download } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface FeedbackItem {
    id: string;
    rating: number;
    category: string | null;
    comment: string | null;
    createdAt: Date;
    message: {
        content: string;
        role: string;
        modelId: string;
        chat: {
            title: string;
        };
    };
    user: {
        name: string | null;
        email: string;
    };
}

export default function AdminFeedbackPage() {
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/feedback');
            if (response.ok) {
                const data = await response.json();
                setFeedback(data.feedback);
            }
        } catch (error) {
            console.error('Failed to fetch feedback:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['Date', 'User', 'Chat', 'Rating', 'Category', 'Comment', 'Message Preview'];
        const rows = filteredFeedback.map(f => [
            new Date(f.createdAt).toLocaleDateString(),
            f.user.email,
            f.message.chat.title,
            f.rating === 5 ? 'Positive' : 'Negative',
            f.category || '',
            f.comment || '',
            f.message.content.substring(0, 100),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feedback-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const filteredFeedback = feedback.filter(f => {
        if (filter === 'positive') return f.rating === 5;
        if (filter === 'negative') return f.rating === 1;
        return true;
    });

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">Loading feedback...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">User Feedback</h1>
                    <p className="text-muted-foreground mt-2">
                        Review and analyze user feedback on AI responses
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Feedback</SelectItem>
                            <SelectItem value="positive">Positive Only</SelectItem>
                            <SelectItem value="negative">Negative Only</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={exportToCSV} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{feedback.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Positive</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-600">
                            {feedback.filter(f => f.rating === 5).length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Negative</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-red-600">
                            {feedback.filter(f => f.rating === 1).length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Feedback Table */}
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rating</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Chat</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Comment</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredFeedback.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No feedback found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredFeedback.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            {item.rating === 5 ? (
                                                <ThumbsUp className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <ThumbsDown className="h-4 w-4 text-red-600" />
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {item.user.name || item.user.email}
                                        </TableCell>
                                        <TableCell>{item.message.chat.title}</TableCell>
                                        <TableCell>
                                            {item.category && (
                                                <Badge variant="outline">{item.category}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-md truncate">
                                            {item.comment || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
