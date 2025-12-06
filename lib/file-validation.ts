import { put } from '@vercel/blob';

const ALLOWED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/webm'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function validateAndUploadFile(
    file: File,
    userId: string,
    type: 'image' | 'document' | 'audio'
) {
    // 1. Validate file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // 2. Validate MIME type
    if (!ALLOWED_TYPES[type].includes(file.type)) {
        throw new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES[type].join(', ')}`);
    }

    // 3. Generate secure filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const secureFilename = `${userId}/${type}/${timestamp}-${randomString}.${extension}`;

    // 4. Upload to Vercel Blob with access control
    const blob = await put(secureFilename, file, {
        access: 'public',
        addRandomSuffix: false,
    });

    return {
        url: blob.url,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
    };
}
