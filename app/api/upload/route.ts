import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { MultimodalProcessor } from '@/lib/multimodal/processor';
import { validateAndUploadFile } from '@/lib/file-validation';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        // Authentication
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse form data
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        // Validate file types
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
        ];

        const processor = new MultimodalProcessor();
        const results = [];

        for (const file of files) {
            try {
                // Determine file category for validation
                let category: 'image' | 'document' | 'audio' = 'document';
                if (file.type.startsWith('image/')) category = 'image';
                else if (file.type.startsWith('audio/')) category = 'audio';

                // Validate and upload securely
                const { url, filename, mimeType, size } = await validateAndUploadFile(file, userId, category);

                // Process file based on type (passing the secure URL to avoid re-upload)
                let result;

                if (file.type.startsWith('image/')) {
                    result = await processor.processImage(file, filename, url);
                } else if (file.type === 'application/pdf') {
                    result = await processor.processPDF(file, filename, url);
                } else if (file.type.startsWith('audio/')) {
                    result = await processor.processAudio(file, filename, url);
                } else {
                    // Handle other documents (Excel/CSV/Word)
                    // For these, we just return the uploaded file info as we might not have specific processing logic yet
                    result = {
                        mediaFile: {
                            id: `doc-${Date.now()}`,
                            type: 'document' as const,
                            url: url,
                            filename: filename,
                            mimeType: mimeType,
                            size: size,
                            metadata: {},
                        },
                        analysis: {
                            content: 'Document uploaded successfully',
                            summary: 'No analysis available for this file type',
                            metadata: {},
                        }
                    };
                }

                results.push({
                    filename: file.name, // Return original name to user context
                    success: true,
                    mediaFile: result.mediaFile,
                    analysis: result.analysis,
                });
            } catch (error) {
                console.error(`[Upload] Error processing ${file.name}:`, error);
                results.push({
                    filename: file.name,
                    error: error instanceof Error ? error.message : 'Processing failed',
                });
            }
        }

        return NextResponse.json({
            success: true,
            results,
        });
    } catch (error) {
        console.error('[Upload] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 }
        );
    }
}
