
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2, StopCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MessageSpeechProps {
    messageContent: string;
}

export function MessageSpeech({ messageContent }: MessageSpeechProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handlePlay = async () => {
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/voice/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: messageContent }),
            });

            if (!response.ok) throw new Error('TTS failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            if (audioRef.current) {
                audioRef.current.pause();
            }

            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(url);
            };

            await audio.play();
            setIsPlaying(true);
        } catch (error) {
            console.error('Speech error:', error);
            toast.error('Failed to play audio');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handlePlay}
            disabled={isLoading}
            title="Read aloud"
        >
            {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : isPlaying ? (
                <StopCircle className="h-3 w-3" />
            ) : (
                <Volume2 className="h-3 w-3" />
            )}
        </Button>
    );
}
