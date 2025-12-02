/**
 * Multimodal Content Processor
 * Handles image, audio, video, PDF, and document processing
 */

import { put } from '@vercel/blob';
import OpenAI from 'openai';
import { MediaFile, MediaType, VisionAnalysis, AudioTranscription, DocumentAnalysis } from './types';

// Optional sharp import for image metadata extraction
let sharp: typeof import('sharp') | null = null;
try {
  sharp = require('sharp');
} catch {
  // Sharp not installed - will skip metadata extraction
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class MultimodalProcessor {
  /**
   * Upload file to Vercel Blob storage
   */
  private async uploadToBlob(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<string> {
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
    });
    return blob.url;
  }

  /**
   * Process an image file and extract information using GPT-4V
   */
  async processImage(file: File | Buffer, filename: string): Promise<{
    mediaFile: MediaFile;
    analysis: VisionAnalysis;
  }> {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    const size = buffer.byteLength;
    
    // Extract image metadata (dimensions)
    let width = 0;
    let height = 0;
    if (sharp) {
      try {
        const metadata = await sharp(buffer).metadata();
        width = metadata.width || 0;
        height = metadata.height || 0;
      } catch {
        // If sharp fails, dimensions remain 0
      }
    }

    // Upload to Vercel Blob
    const mimeType = file instanceof File ? file.type : 'image/jpeg';
    const blobUrl = await this.uploadToBlob(buffer, filename, mimeType);

    // Analyze with GPT-4V
    let analysis: VisionAnalysis = {
      description: '',
      objects: [],
      text: '',
    };

    try {
      const base64Image = buffer.toString('base64');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // GPT-4 with vision
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe this image in detail. Identify any objects, text, or notable features. Be concise but comprehensive.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      const description = response.choices[0]?.message?.content || '';
      
      // Extract objects and text from description (simple parsing)
      const objects: Array<{ label: string; confidence: number }> = [];
      const textMatch = description.match(/text[:\s]+([^\n]+)/i);
      const extractedText = textMatch ? textMatch[1] : '';

      analysis = {
        description,
        objects,
        text: extractedText,
        metadata: {
          model: 'gpt-4o',
          tokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('[Multimodal] GPT-4V analysis failed:', error);
      analysis = {
        description: 'Image analysis unavailable',
        objects: [],
        text: '',
      };
    }
    
    return {
      mediaFile: {
        id: `img-${Date.now()}`,
        type: 'image',
        url: blobUrl,
        filename,
        mimeType,
        size,
        metadata: {
          width,
          height,
        },
      },
      analysis,
    };
  }

  /**
   * Process an audio file and transcribe it using Whisper API
   */
  async processAudio(file: File | Buffer, filename: string): Promise<{
    mediaFile: MediaFile;
    transcription: AudioTranscription;
  }> {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    const size = buffer.byteLength;
    const mimeType = file instanceof File ? file.type : 'audio/mpeg';

    // Upload to Vercel Blob
    const blobUrl = await this.uploadToBlob(buffer, filename, mimeType);

    // Transcribe with Whisper API
    let transcription: AudioTranscription = {
      text: '',
      language: 'en',
    };

    try {
      // Create a File-like object for OpenAI Whisper
      const audioFile = file instanceof File 
        ? file 
        : new File([buffer], filename, { type: mimeType });

      const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en', // Auto-detect if not specified
        response_format: 'verbose_json',
      });

      transcription = {
        text: response.text,
        language: response.language || 'en',
        segments: response.segments?.map(seg => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
        })),
        confidence: 1.0, // Whisper doesn't provide confidence scores
      };
    } catch (error) {
      console.error('[Multimodal] Whisper transcription failed:', error);
      transcription = {
        text: 'Transcription unavailable',
        language: 'en',
      };
    }
    
    return {
      mediaFile: {
        id: `audio-${Date.now()}`,
        type: 'audio',
        url: blobUrl,
        filename,
        mimeType,
        size,
        metadata: {
          duration: 0, // Would need audio library to extract
        },
      },
      transcription,
    };
  }

  /**
   * Process a video file
   */
  async processVideo(file: File | Buffer, filename: string): Promise<{
    mediaFile: MediaFile;
    frames?: VisionAnalysis[];
    transcription?: AudioTranscription;
  }> {
    const buffer = file instanceof File ? await file.arrayBuffer() : file;
    const size = buffer.byteLength;
    
    return {
      mediaFile: {
        id: `video-${Date.now()}`,
        type: 'video',
        url: '',
        filename,
        mimeType: 'video/mp4',
        size,
        metadata: {
          duration: 0,
          width: 0,
          height: 0,
        },
      },
    };
  }

  /**
   * Process a PDF document
   */
  async processPDF(file: File | Buffer, filename: string): Promise<{
    mediaFile: MediaFile;
    analysis: DocumentAnalysis;
  }> {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    const size = buffer.byteLength;
    const mimeType = 'application/pdf';

    // Upload to Vercel Blob
    const blobUrl = await this.uploadToBlob(buffer, filename, mimeType);

    // Extract text from PDF (basic implementation)
    // In production, use pdf-parse or pdfjs-dist
    let content = '';
    let pages = 0;
    
    try {
      // Simple text extraction - for full PDF parsing, install pdf-parse
      // const pdfParse = require('pdf-parse');
      // const pdfData = await pdfParse(buffer);
      // content = pdfData.text;
      // pages = pdfData.numpages;
      
      // Placeholder for now - requires pdf-parse package
      content = 'PDF text extraction requires pdf-parse library. Install: npm install pdf-parse';
      pages = 0;
    } catch (error) {
      console.error('[Multimodal] PDF extraction failed:', error);
      content = 'Failed to extract PDF content';
    }

    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      mediaFile: {
        id: `pdf-${Date.now()}`,
        type: 'pdf',
        url: blobUrl,
        filename,
        mimeType,
        size,
        metadata: {
          pages,
        },
      },
      analysis: {
        content,
        summary: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
        metadata: {
          pages,
          wordCount,
        },
      },
    };
  }

  /**
   * Process a screenshot
   */
  async processScreenshot(file: File | Buffer, filename: string): Promise<{
    mediaFile: MediaFile;
    analysis: VisionAnalysis;
  }> {
    // Screenshots are processed like images but with additional context
    return this.processImage(file, filename);
  }

  /**
   * Auto-detect media type and process accordingly
   */
  async processMedia(
    file: File | Buffer,
    filename: string,
    type?: MediaType
  ): Promise<{
    mediaFile: MediaFile;
    analysis?: VisionAnalysis | AudioTranscription | DocumentAnalysis;
  }> {
    const detectedType = type || this.detectMediaType(filename);
    
    switch (detectedType) {
      case 'image':
      case 'screenshot':
        return this.processImage(file, filename);
      case 'audio':
        return this.processAudio(file, filename);
      case 'video':
        return this.processVideo(file, filename);
      case 'pdf':
        return this.processPDF(file, filename);
      default:
        throw new Error(`Unsupported media type: ${detectedType}`);
    }
  }

  /**
   * Detect media type from filename
   */
  private detectMediaType(filename: string): MediaType {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac'];
    const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
    const pdfExts = ['pdf'];
    
    if (imageExts.includes(ext)) return 'image';
    if (audioExts.includes(ext)) return 'audio';
    if (videoExts.includes(ext)) return 'video';
    if (pdfExts.includes(ext)) return 'pdf';
    
    return 'document';
  }
}



