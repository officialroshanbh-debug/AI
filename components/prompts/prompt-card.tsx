
'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit, Trash2, FileText, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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

interface PromptCardProps {
    prompt: Prompt;
    onInsert: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const categoryColors: Record<string, string> = {
    general: 'bg-gray-500/10 text-gray-500',
    coding: 'bg-blue-500/10 text-blue-500',
    writing: 'bg-purple-500/10 text-purple-500',
    analysis: 'bg-green-500/10 text-green-500',
    research: 'bg-orange-500/10 text-orange-500',
    custom: 'bg-pink-500/10 text-pink-500',
};

export function PromptCard({ prompt, onInsert, onEdit, onDelete }: PromptCardProps) {
    const handleCopy = async () => {
        await navigator.clipboard.writeText(prompt.template);
        toast.success('Copied to clipboard');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border bg-card hover:shadow-md transition-all group"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <h3 className="font-semibold truncate">{prompt.name}</h3>
                        <Badge variant="secondary" className={categoryColors[prompt.category]}>
                            {prompt.category}
                        </Badge>
                        {prompt.isPublic && (
                            <Badge variant="outline" className="text-xs">Public</Badge>
                        )}
                    </div>

                    {prompt.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {prompt.description}
                        </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{prompt.usageCount} uses</span>
                        </div>
                        {prompt.variables && prompt.variables.length > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Variables:</span>
                                <code className="px-1 py-0.5 rounded bg-muted text-xs">
                                    {prompt.variables.join(', ')}
                                </code>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={onInsert}
                        title="Insert into chat"
                    >
                        <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={handleCopy}
                        title="Copy to clipboard"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={onEdit}
                        title="Edit"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={onDelete}
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
