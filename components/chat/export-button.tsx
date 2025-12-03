'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileJson, FileCode } from 'lucide-react';

interface ExportButtonProps {
    chatId: string;
}

export function ExportButton({ chatId }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format: 'pdf' | 'markdown' | 'html' | 'json') => {
        setIsExporting(true);
        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, format }),
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            // Create download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition
                ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
                : `chat-${chatId}.${format}`;

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export chat');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting}>
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('markdown')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('html')}>
                    <FileCode className="h-4 w-4 mr-2" />
                    HTML (.html)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                    <FileJson className="h-4 w-4 mr-2" />
                    JSON (.json)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
