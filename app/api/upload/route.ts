import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { MultimodalProcessor } from '@/lib/multimodal/processor';

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
            // Validate file type
            if (!allowedTypes.includes(file.type)) {
                results.push({
                    filename: file.name,
                    error: `Unsupported file type: ${file.type}`,
                });
                continue;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                results.push({
                    filename: file.name,
                    error: 'File size exceeds 10MB limit',
                });
                continue;
            }

            try {
                // Process file based on type
                let result;

                if (file.type.startsWith('image/')) {
                    result = await processor.processImage(file, file.name);
                } else if (file.type === 'application/pdf') {
                    result = await processor.processPDF(file, file.name);
                } else {
                    // Handle Excel/CSV as documents
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const { put } = await import('@vercel/blob');
                    const blob = await put(file.name, buffer, {
                        access: 'public',
                        contentType: file.type,
                    });

                    result = {
                        mediaFile: {
                            id: `doc-${Date.now()}`,
                            type: 'document' as const,
                            url: blob.url,
                            filename: file.name,
                            mimeType: file.type,
                            size: file.size,
                            metadata: {},
                        },
                    };
                }

                results.push({
                    filename: file.name,
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
