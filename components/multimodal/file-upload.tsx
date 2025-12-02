'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image, FileAudio, FileVideo, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MediaFile } from '@/lib/multimodal/types';

interface FileUploadProps {
  onUpload: (file: File) => Promise<{ mediaFile: MediaFile; analysis?: unknown }>;
  chatId?: string;
  messageId?: string;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
}

export function FileUpload({
  onUpload,
  chatId: _chatId,
  messageId: _messageId,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['image/*', 'audio/*', 'video/*', 'application/pdf'],
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; preview?: string; result?: { mediaFile: MediaFile; analysis?: unknown } }>>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`;
    }
    return null;
  }, [maxSize]);

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    // Create preview for images
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    const newFile = { file, preview };
    setUploadedFiles((prev) => [...prev, newFile]);

    try {
      const result = await onUpload(file);
      setUploadedFiles((prev) =>
        prev.map((f) => (f.file === file ? { ...f, result } : f))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadedFiles((prev) => prev.filter((f) => f.file !== file));
    } finally {
      setIsUploading(false);
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    }
  }, [onUpload, validateFile]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        await processFile(file);
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        await processFile(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFile]
  );

  const removeFile = useCallback((file: File) => {
    setUploadedFiles((prev) => {
      const removed = prev.find((f) => f.file === file);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((f) => f.file !== file);
    });
  }, []);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('audio/')) return FileAudio;
    if (type.startsWith('video/')) return FileVideo;
    return FileText;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border bg-muted/30 hover:border-primary/50',
          isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <motion.div
          animate={{ scale: isDragging ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            or click to browse • Max {maxSize / 1024 / 1024}MB
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Select Files'
            )}
          </Button>
        </motion.div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {uploadedFiles.map((item, index) => {
              const Icon = getFileIcon(item.file.type);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group rounded-lg border bg-card p-3"
                >
                  {item.preview ? (
                    <NextImage
                      src={item.preview}
                      alt={item.file.name}
                      width={96}
                      height={96}
                      className="w-full h-24 object-cover rounded mb-2"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-24 flex items-center justify-center bg-muted rounded mb-2">
                      <Icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-xs font-medium truncate mb-1">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / 1024).toFixed(1)} KB
                  </p>
                  {item.result && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      ✓ Processed
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(item.file)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

