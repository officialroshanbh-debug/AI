'use client';

import { X, FileText, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Attachment {
    id: string;
    type: string;
    url: string;
    filename: string;
    mimeType: string;
}

interface AttachmentPreviewProps {
    attachments: Attachment[];
    onRemove: (id: string) => void;
}

export function AttachmentPreview({ attachments, onRemove }: AttachmentPreviewProps) {
    if (attachments.length === 0) return null;

    const getIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
        if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />;
        if (mimeType.includes('sheet') || mimeType.includes('csv') || mimeType.includes('excel'))
            return <FileSpreadsheet className="h-4 w-4" />;
        return <FileText className="h-4 w-4" />;
    };

    return (
        <div className="flex gap-2 overflow-x-auto py-2 px-4">
            <AnimatePresence mode="popLayout">
                {attachments.map((attachment) => (
                    <motion.div
                        key={attachment.id}
                        initial={{ opacity: 0, scale: 0.8, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -10 }}
                        className="relative flex items-center gap-2 rounded-lg border bg-background/50 p-2 pr-8 text-sm shadow-sm"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                            {getIcon(attachment.mimeType)}
                        </div>
                        <div className="flex flex-col max-w-[120px]">
                            <span className="truncate font-medium text-xs">{attachment.filename}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">
                                {attachment.mimeType.split('/')[1].split('+')[0]}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => onRemove(attachment.id)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
