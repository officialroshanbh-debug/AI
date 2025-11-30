/**
 * Multimodal AI Support Types
 * Support for text, images, video, audio, and documents
 */

export type MediaType = 'image' | 'audio' | 'video' | 'pdf' | 'document' | 'screenshot';

export interface MediaFile {
  id: string;
  type: MediaType;
  url: string;
  filename: string;
  mimeType: string;
  size: number; // Size in bytes
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // For audio/video
    pages?: number; // For PDFs
    [key: string]: unknown;
  };
}

export interface VisionAnalysis {
  description: string;
  objects?: Array<{ label: string; confidence: number }>;
  text?: string; // OCR text if present
  metadata?: Record<string, unknown>;
}

export interface AudioTranscription {
  text: string;
  language?: string;
  segments?: Array<{ start: number; end: number; text: string }>;
  confidence?: number;
}

export interface DocumentAnalysis {
  title?: string;
  content: string;
  summary?: string;
  metadata?: {
    author?: string;
    pages?: number;
    wordCount?: number;
    [key: string]: unknown;
  };
}

export interface MultimodalMessage {
  role: 'user' | 'assistant';
  text?: string;
  media?: MediaFile[];
  analysis?: {
    vision?: VisionAnalysis;
    audio?: AudioTranscription;
    document?: DocumentAnalysis;
  };
}

