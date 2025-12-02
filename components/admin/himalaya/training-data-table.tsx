'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Trash2, Eye, EyeOff } from 'lucide-react';

interface TrainingDataItem {
    id: string;
    title: string;
    content: string;
    category: string;
    isActive: boolean;
    uploadedAt: string;
    user: { name: string | null };
}

export function TrainingDataTable() {
    const [data, setData] = useState<TrainingDataItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(search && { search }),
            });

            const response = await fetch(`/api/admin/himalaya/training-data?${params}`);
            const result = await response.json();

            setData(result.data || []);
            setTotal(result.pagination?.total || 0);
        } catch (error) {
            console.error('Failed to fetch training data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this training data?')) return;

        try {
            await fetch(`/api/admin/himalaya/training-data?id=${id}`, {
                method: 'DELETE',
            });
            fetchData();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await fetch('/api/admin/himalaya/training-data', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !isActive }),
            });
            fetchData();
        } catch (error) {
            console.error('Failed to update:', error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Training Data Library</CardTitle>
                <CardDescription>
                    Manage all training examples for the Himalaya model ({total} total)
                </CardDescription>
                <div className="flex gap-2 mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search training data..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                            className="pl-8"
                        />
                    </div>
                    <Button onClick={fetchData}>Search</Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Uploaded By</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            No training data found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.title.slice(0, 50)}
                                                {item.title.length > 50 && '...'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant=" outline">{item.category}</Badge>
                                            </TableCell>
                                            <TableCell>{item.user.name || 'Unknown'}</TableCell>
                                            <TableCell>
                                                {new Date(item.uploadedAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={item.isActive ? 'default' : 'secondary'}>
                                                    {item.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleToggleActive(item.id, item.isActive)}
                                                        title={item.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {item.isActive ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(item.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Showing {data.length} of {total} results
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={data.length < 20}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
