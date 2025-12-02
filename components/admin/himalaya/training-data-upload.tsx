'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function TrainingDataUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
    const [mode, setMode] = useState<'single' | 'batch'>('single');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    // Single upload state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('knowledge');

    // Batch upload state
    const [batchData, setBatchData] = useState('');

    const handleSingleUpload = async () => {
        if (!title || !content || !category) {
            setStatus('error');
            setMessage('Please fill in all fields');
            return;
        }

        setLoading(true);
        setStatus('idle');

        try {
            const response = await fetch('/api/admin/himalaya/training-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, category }),
            });

            if (!response.ok) throw new Error('Upload failed');

            setStatus('success');
            setMessage('Training data uploaded successfully!');
            setTitle('');
            setContent('');
            onUploadComplete?.();
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Failed to upload');
        } finally {
            setLoading(false);
        }
    };

    const handleBatchUpload = async () => {
        if (!batchData || !category) {
            setStatus('error');
            setMessage('Please provide data and select a category');
            return;
        }

        setLoading(true);
        setStatus('idle');

        try {
            const parsed = JSON.parse(batchData);
            const data = Array.isArray(parsed) ? parsed : [parsed];

            const response = await fetch('/api/admin/himalaya/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data, category }),
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Upload failed');

            setStatus('success');
            setMessage(result.message || `Uploaded ${result.count} examples`);
            setBatchData('');
            onUploadComplete?.();
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Failed to upload');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Training Data</CardTitle>
                <CardDescription>
                    Add knowledge and examples to make Himalaya smarter
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Mode selector */}
                <div className="flex gap-2">
                    <Button
                        variant={mode === 'single' ? 'default' : 'outline'}
                        onClick={() => setMode('single')}
                        className="flex-1"
                    >
                        Single Entry
                    </Button>
                    <Button
                        variant={mode === 'batch' ? 'default' : 'outline'}
                        onClick={() => setMode('batch')}
                        className="flex-1"
                    >
                        Batch Upload
                    </Button>
                </div>

                {/* Category selector */}
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="knowledge">Knowledge</SelectItem>
                            <SelectItem value="qa">Q&A</SelectItem>
                            <SelectItem value="dialogue">Dialogue</SelectItem>
                            <SelectItem value="document">Document</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Single upload form */}
                {mode === 'single' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title / Question</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What is Himalaya?"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Content / Answer</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Himalaya is an advanced AI model..."
                                rows={6}
                            />
                        </div>
                        <Button onClick={handleSingleUpload} disabled={loading} className="w-full">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Batch upload form */}
                {mode === 'batch' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="batchData">JSON Data</Label>
                            <Textarea
                                id="batchData"
                                value={batchData}
                                onChange={(e) => setBatchData(e.target.value)}
                                placeholder='[{"title": "Question 1", "content": "Answer 1"}, ...]'
                                rows={10}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Format: Array of objects with title and content fields
                            </p>
                        </div>
                        <Button onClick={handleBatchUpload} disabled={loading} className="w-full">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Batch Upload
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Status message */}
                {status !== 'idle' && (
                    <div
                        className={`flex items-center gap-2 p-3 rounded-md ${status === 'success'
                                ? 'bg-green-50 text-green-900 dark:bg-green-900/10 dark:text-green-400'
                                : 'bg-red-50 text-red-900 dark:bg-red-900/10 dark:text-red-400'
                            }`}
                    >
                        {status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <AlertCircle className="h-4 w-4" />
                        )}
                        <span className="text-sm">{message}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
