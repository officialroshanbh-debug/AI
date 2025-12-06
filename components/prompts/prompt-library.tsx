
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Library, Plus, Search } from 'lucide-react';
import { PromptCard } from './prompt-card';
import { PromptForm } from './prompt-form';
import { toast } from 'sonner';

interface Prompt {
    id: string;
    name: string;
    description?: string | null;
    category: string;
    template: string;
    variables?: string[] | null;
    isPublic: boolean;
    usageCount: number;
    userId?: string | null;
}

interface PromptLibraryProps {
    onInsert: (template: string) => void;
}

export function PromptLibrary({ onInsert }: PromptLibraryProps) {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

    const fetchPrompts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (category !== 'all') params.set('category', category);
            if (search) params.set('search', search);

            const response = await fetch(`/api/prompts?${params}`);
            if (!response.ok) throw new Error('Failed to fetch prompts');

            const data = await response.json();
            setPrompts(data);
            setFilteredPrompts(data);
        } catch (error) {
            console.error('Error fetching prompts:', error);
            toast.error('Failed to load prompts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchPrompts();
        }
    }, [isOpen, category]);

    useEffect(() => {
        const filtered = prompts.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredPrompts(filtered);
    }, [search, prompts]);

    const handleInsert = async (prompt: Prompt) => {
        onInsert(prompt.template);

        // Track usage
        await fetch(`/api/prompts/use?id=${prompt.id}`, { method: 'PATCH' });
        setIsOpen(false);
        toast.success('Prompt inserted');
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/prompts?id=${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete');

            setPrompts(prompts.filter(p => p.id !== id));
            toast.success('Prompt deleted');
        } catch (error) {
            toast.error('Failed to delete prompt');
        }
    };

    const handleEdit = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        setIsFormOpen(true);
    };

    const handleSave = async (data: Partial<Prompt>) => {
        try {
            const url = '/api/prompts';
            const method = editingPrompt ? 'PUT' : 'POST';
            const body = editingPrompt ? { ...data, id: editingPrompt.id } : data;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error('Failed to save');

            toast.success(editingPrompt ? 'Prompt updated' : 'Prompt created');
            setIsFormOpen(false);
            setEditingPrompt(null);
            fetchPrompts();
        } catch (error) {
            toast.error('Failed to save prompt');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Prompt Library">
                    <Library className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] p-0">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Prompt Library</span>
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" onClick={() => setEditingPrompt(null)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Prompt
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingPrompt ? 'Edit Prompt' : 'Create Prompt'}</DialogTitle>
                                </DialogHeader>
                                <PromptForm
                                    prompt={editingPrompt}
                                    onSave={handleSave}
                                    onCancel={() => {
                                        setIsFormOpen(false);
                                        setEditingPrompt(null);
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 pb-4 space-y-4">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search prompts..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="coding">Coding</SelectItem>
                                <SelectItem value="writing">Writing</SelectItem>
                                <SelectItem value="analysis">Analysis</SelectItem>
                                <SelectItem value="research">Research</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="overflow-y-auto max-h-[50vh] space-y-3">
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading...</div>
                        ) : filteredPrompts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No prompts found. Create one to get started!
                            </div>
                        ) : (
                            filteredPrompts.map((prompt) => (
                                <PromptCard
                                    key={prompt.id}
                                    prompt={prompt}
                                    onInsert={() => handleInsert(prompt)}
                                    onEdit={() => handleEdit(prompt)}
                                    onDelete={() => handleDelete(prompt.id)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
