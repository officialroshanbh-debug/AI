'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface FeedbackModalProps {
    open: boolean;
    onClose: () => void;
    messageId: string;
    onSubmit: (success: boolean) => void;
}

export function FeedbackModal({ open, onClose, messageId, onSubmit }: FeedbackModalProps) {
    const [category, setCategory] = useState<string>('not_helpful');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId,
                    rating: 1, // Thumbs down
                    category,
                    comment: comment.trim() || undefined,
                }),
            });

            if (response.ok) {
                onSubmit(true);
                setComment('');
                setCategory('not_helpful');
            } else {
                onSubmit(false);
            }
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            onSubmit(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Provide Feedback</DialogTitle>
                    <DialogDescription>
                        Help us improve by telling us what went wrong with this response.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger id="category">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="incorrect">Incorrect Information</SelectItem>
                                <SelectItem value="harmful">Harmful Content</SelectItem>
                                <SelectItem value="not_helpful">Not Helpful</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment">Additional Comments (Optional)</Label>
                        <Textarea
                            id="comment"
                            placeholder="Tell us more about what went wrong..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            maxLength={1000}
                        />
                        <p className="text-xs text-muted-foreground">
                            {comment.length}/1000 characters
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
