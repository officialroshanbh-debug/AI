'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, RefreshCw, XCircle } from 'lucide-react';

interface FineTuneJob {
    id: string;
    openaiJobId: string | null;
    modelId: string | null;
    status: string;
    createdAt: string;
    completedAt: string | null;
    trainedTokens: number | null;
    user: { name: string | null };
}

export function FineTuneManager() {
    const [jobs, setJobs] = useState<FineTuneJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [dataCount, setDataCount] = useState(100);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/himalaya/fine-tune');
            const result = await response.json();
            setJobs(result.jobs || []);
        } catch (error) {
            console.error('Failed to fetch fine-tune jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleCreateJob = async () => {
        setCreating(true);
        try {
            // Fetch training data IDs
            const dataResponse = await fetch(`/api/admin/himalaya/training-data?limit=${dataCount}&isActive=true`);
            const dataResult = await dataResponse.json();
            const trainingDataIds = dataResult.data.map((item: { id: string }) => item.id);

            if (trainingDataIds.length === 0) {
                alert('No active training data available');
                return;
            }

            const response = await fetch('/api/admin/himalaya/fine-tune', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trainingDataIds,
                    hyperparameters: {
                        n_epochs: 3,
                    },
                }),
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error);

            alert(result.message || 'Fine-tune job created successfully');
            fetchJobs();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to create fine-tune job');
        } finally {
            setCreating(false);
        }
    };

    const handleRefreshStatus = async (jobId: string) => {
        try {
            await fetch('/api/admin/himalaya/fine-tune', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId }),
            });
            fetchJobs();
        } catch (error) {
            console.error('Failed to refresh status:', error);
        }
    };

    const handleCancelJob = async (jobId: string) => {
        if (!confirm('Are you sure you want to cancel this job?')) return;

        try {
            await fetch('/api/admin/himalaya/fine-tune', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, action: 'cancel' }),
            });
            fetchJobs();
        } catch (error) {
            console.error('Failed to cancel job:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'succeeded':
                return 'default';
            case 'running':
                return 'secondary';
            case 'failed':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <div className="space-y-6">
            {/* Create new job */}
            <Card>
                <CardHeader>
                    <CardTitle>Create Fine-Tune Job</CardTitle>
                    <CardDescription>
                        Train a custom Himalaya model using your training data
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="dataCount">Number of Training Examples</Label>
                        <Input
                            id="dataCount"
                            type="number"
                            value={dataCount}
                            onChange={(e) => setDataCount(parseInt(e.target.value) || 100)}
                            min={10}
                            max={1000}
                        />
                        <p className="text-xs text-muted-foreground">
                            Minimum 10 examples required. More data = better results.
                        </p>
                    </div>
                    <Button onClick={handleCreateJob} disabled={creating} className="w-full">
                        {creating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Job...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-4 w-4" />
                                Create Fine-Tune Job
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Jobs list */}
            <Card>
                <CardHeader>
                    <CardTitle>Fine-Tune Jobs</CardTitle>
                    <CardDescription>Monitor and manage training jobs</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : jobs.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No fine-tune jobs yet. Create one to get started!
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="border rounded-lg p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">
                                                Job {job.openaiJobId?.slice(-8)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Created {new Date(job.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge variant={getStatusColor(job.status)}>
                                            {job.status}
                                        </Badge>
                                    </div>

                                    {job.modelId && (
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Model ID: </span>
                                            <code className="bg-muted px-2 py-1 rounded">
                                                {job.modelId}
                                            </code>
                                        </div>
                                    )}

                                    {job.trainedTokens && (
                                        <p className="text-sm text-muted-foreground">
                                            Trained: {job.trainedTokens.toLocaleString()} tokens
                                        </p>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRefreshStatus(job.openaiJobId!)}
                                            disabled={!job.openaiJobId}
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Refresh
                                        </Button>
                                        {job.status === 'running' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCancelJob(job.openaiJobId!)}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
