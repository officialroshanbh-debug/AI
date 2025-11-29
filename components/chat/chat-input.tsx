'use client';

import { useState, useRef, useEffect, forwardRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ onSend, disabled, placeholder }, ref) => {
    const [message, setMessage] = useState('');
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = ref || internalRef;

  useEffect(() => {
    const element = typeof textareaRef === 'function' ? null : textareaRef?.current;
    if (element) {
      element.style.height = 'auto';
      element.style.height = `${element.scrollHeight}px`;
    }
  }, [message, textareaRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      const element = typeof textareaRef === 'function' ? null : textareaRef?.current;
      if (element) {
        element.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t bg-background/80 backdrop-blur-sm p-4"
      aria-label="Chat input form"
    >
      <div className="flex gap-2 items-end">
        <Textarea
          ref={ref || internalRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type your message... (Press Enter to send, Shift+Enter for new line)'}
          disabled={disabled}
          className="min-h-[60px] max-h-[200px] resize-none"
          rows={1}
          aria-label="Message input"
          aria-describedby="input-help"
        />
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          size="icon"
          className="h-[60px] w-[60px] shrink-0"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
      <p id="input-help" className="sr-only">
        Press Enter to send message, Shift+Enter for new line
      </p>
    </form>
  );
  }
);

ChatInput.displayName = 'ChatInput';

