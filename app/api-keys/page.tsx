'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Plus, Trash2, TrendingUp } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ApiKey {
    id: string;
    name: string;
    keyHash: string;
    keyPreview: string;
    usageCount: number;
    lastUsed: Date | null;
    createdAt: Date;
}

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
    const [showNewKey, setShowNewKey] = useState(false);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            const response = await fetch('/api/api-keys');
            if (response.ok) {
                const data = await response.json();
                setKeys(data.keys || []);
            }
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
        }
    };

    const createKey = async () => {
        if (!newKeyName.trim()) {
            alert('Please enter a name for the API key');
            return;
        }

        setIsCreating(true);
        try {
            const response = await fetch('/api/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName }),
            });

            if (response.ok) {
                const data = await response.json();
                setNewKeyValue(data.key);
                setShowNewKey(true);
                setNewKeyName('');
                await fetchKeys();
            } else {
                alert('Failed to create API key');
            }
        } catch (error) {
            console.error('Failed to create API key:', error);
            alert('Failed to create API key');
        } finally {
            setIsCreating(false);
        }
    };

    const deleteKey = async (id: string) => {
        try {
            const response = await fetch(`/api/api-keys/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchKeys();
            } else {
                alert('Failed to delete API key');
            }
        } catch (error) {
            console.error('Failed to delete API key:', error);
            alert('Failed to delete API key');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">API Keys</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your API keys for programmatic access
                </p>
            </div>

            {/* Create New Key */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Create New API Key</CardTitle>
                    <CardDescription>
                        Generate a new API key for your application
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="keyName">Key Name</Label>
                            <Input
                                id="keyName"
                                placeholder="e.g., Production App"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={createKey} disabled={isCreating}>
                                <Plus className="mr-2 h-4 w-4" />
                                {isCreating ? 'Creating...' : 'Create Key'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* New Key Display */}
            {showNewKey && newKeyValue && (
                <Card className="mb-8 border-green-500">
                    <CardHeader>
                        <CardTitle className="text-green-600">New API Key Created</CardTitle>
                        <CardDescription>
                            ⚠️ Copy this key now. You won't be able to see it again!
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input value={newKeyValue} readOnly className="font-mono" />
                            <Button
                                onClick={() => {
                                    copyToClipboard(newKeyValue);
                                    setTimeout(() => setShowNewKey(false), 2000);
                                }}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* API Keys List */}
            <div className="space-y-4">
                {keys.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No API keys yet. Create one to get started.
                        </CardContent>
                    </Card>
                ) : (
                    keys.map((key) => (
                        <Card key={key.id}>
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold">{key.name}</h3>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {key.keyPreview}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                {key.usageCount} uses
                                            </span>
                                            <span>
                                                Created {new Date(key.createdAt).toLocaleDateString()}
                                            </span>
                                            {key.lastUsed && (
                                                <span>
                                                    Last used {new Date(key.lastUsed).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete "{key.name}"? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteKey(key.id)}>
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
