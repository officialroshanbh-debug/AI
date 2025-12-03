'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackModal } from './feedback-modal';
import { cn } from '@/lib/utils';

interface MessageFeedbackProps {
    messageId: string;
    initialRating?: number;
}

export function MessageFeedback({ messageId, initialRating }: MessageFeedbackProps) {
    const [rating, setRating] = useState<number | null>(initialRating || null);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleThumbsUp = async () => {
        if (rating === 5) return; // Already rated

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId,
                    rating: 5,
                    category: 'positive',
                }),
            });

            if (response.ok) {
                setRating(5);
            }
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleThumbsDown = () => {
        if (rating === 1) return; // Already rated
        setShowModal(true);
    };

    const handleFeedbackSubmit = (success: boolean) => {
        if (success) {
            setRating(1);
        }
        setShowModal(false);
    };

    return (
        <>
            <div className="flex items-center gap-1 mt-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleThumbsUp}
                    disabled={isSubmitting || rating !== null}
                    className={cn(
                        'h-8 w-8 p-0',
                        rating === 5 && 'text-green-600 bg-green-50'
                    )}
                >
                    <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleThumbsDown}
                    disabled={isSubmitting || rating !== null}
                    className={cn(
                        'h-8 w-8 p-0',
                        rating === 1 && 'text-red-600 bg-red-50'
                    )}
                >
                    <ThumbsDown className="h-4 w-4" />
                </Button>
            </div>

            <FeedbackModal
                open={showModal}
                onClose={() => setShowModal(false)}
                messageId={messageId}
                onSubmit={handleFeedbackSubmit}
            />
        </>
    );
}
