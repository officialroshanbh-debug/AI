
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Prompt {
    id?: string;
    name: string;
    description?: string | null;
    category: string;
    template: string;
    variables?: string[] | null;
    isPublic: boolean;
}

interface PromptFormProps {
    prompt?: Prompt | null;
    onSave: (data: Partial<Prompt>) => void;
    onCancel: () => void;
}

export function PromptForm({ prompt, onSave, onCancel }: PromptFormProps) {
    const [name, setName] = useState(prompt?.name || '');
    const [description, setDescription] = useState(prompt?.description || '');
    const [category, setCategory] = useState(prompt?.category || 'general');
    const [template, setTemplate] = useState(prompt?.template || '');
    const [variables, setVariables] = useState(
        prompt?.variables ? Array.isArray(prompt.variables) ? prompt.variables.join(', ') : '' : ''
    );
    const [isPublic, setIsPublic] = useState(prompt?.isPublic || false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data: Partial<Prompt> = {
            name,
            description: description || null,
            category,
            template,
            variables: variables ? variables.split(',').map(v => v.trim()).filter(Boolean) : null,
            isPublic,
        };

        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Code Review Template"
                    required
                />
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this prompt..."
                    rows={2}
                />
            </div>

            <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="coding">Coding</SelectItem>
                        <SelectItem value="writing">Writing</SelectItem>
                        <SelectItem value="analysis">Analysis</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="template">Prompt Template *</Label>
                <Textarea
                    id="template"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    placeholder="Write your prompt here... Use {{variable}} for placeholders"
                    rows={6}
                    required
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Tip: Use {'{{variable}}'} syntax for dynamic variables
                </p>
            </div>

            <div>
                <Label htmlFor="variables">Variables (optional)</Label>
                <Input
                    id="variables"
                    value={variables}
                    onChange={(e) => setVariables(e.target.value)}
                    placeholder="e.g., name, date, topic (comma-separated)"
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Switch
                        id="isPublic"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="isPublic" className="cursor-pointer">
                        Make this prompt public
                    </Label>
                </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">
                    {prompt ? 'Update' : 'Create'}
                </Button>
            </div>
        </form>
    );
}
