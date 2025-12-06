
'use client';

import * as React from 'react';
import { Download, FileText, FileJson, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatChatAsMarkdown, formatChatAsJSON } from '@/lib/export/formatters';
import { toast } from 'sonner';

interface ChatExportProps {
    chatId: string;
    title: string;
    messages: any[]; // Using any to avoid complex type matching for now, ideal would be Message[]
}

export function ChatExport({ chatId, title, messages }: ChatExportProps) {
    const [isExporting, setIsExporting] = React.useState(false);

    const handleExport = async (format: 'markdown' | 'json') => {
        setIsExporting(true);
        try {
            let content = '';
            let mimeType = '';
            let extension = '';

            if (format === 'markdown') {
                content = formatChatAsMarkdown(title, messages);
                mimeType = 'text/markdown';
                extension = 'md';
            } else {
                content = formatChatAsJSON(title, messages);
                mimeType = 'application/json';
                extension = 'json';
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Chat exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export chat');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isExporting}>
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    <span className="sr-only">Export chat</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('markdown')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Export as Markdown</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                    <FileJson className="mr-2 h-4 w-4" />
                    <span>Export as JSON</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
