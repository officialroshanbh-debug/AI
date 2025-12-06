
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, StopCircle } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
    disabled?: boolean;
}

export function VoiceRecorder({ onTranscription, disabled }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await transcribeAudio(audioBlob);

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast.error('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const transcribeAudio = async (audioBlob: Blob) => {
        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');

            const response = await fetch('/api/voice/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Transcription failed');

            const data = await response.json();
            if (data.text) {
                onTranscription(data.text);
            }
        } catch (error) {
            console.error('Transcription error:', error);
            toast.error('Failed to transcribe audio');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={`transition-all ${isRecording ? 'text-red-500 animate-pulse' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isProcessing}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
        >
            {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : isRecording ? (
                <StopCircle className="h-5 w-5" />
            ) : (
                <Mic className="h-5 w-5" />
            )}
        </Button>
    );
}
