'use client';

import { useState, useRef, useEffect, forwardRef } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VoiceRecorder } from './voice-recorder';
import { PromptLibrary } from '../prompts/prompt-library';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFileSelect?: (files: FileList) => void;
  isUploading?: boolean;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ onSend, disabled, placeholder, value, onChange, onFileSelect, isUploading }, ref) => {
    const [internalMessage, setInternalMessage] = useState('');
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = ref || internalRef;

    const message = value !== undefined ? value : internalMessage;

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
        if (value === undefined) {
          setInternalMessage('');
        }
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

    const handleFileClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0 && onFileSelect) {
        onFileSelect(files);
      }
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    return (
      <form
        onSubmit={handleSubmit}
        className="p-3 md:p-4 pb-safe"
        aria-label="Chat input form"
      >
        <div className="flex gap-2 md:gap-3 items-end max-w-4xl mx-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={handleFileClick}
                  disabled={disabled || isUploading}
                  size="icon"
                  variant="outline"
                  className="h-[52px] w-[52px] md:h-[60px] md:w-[60px] shrink-0"
                  aria-label="Attach files"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Attach files (images, PDF, Excel, CSV)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <VoiceRecorder
            onTranscription={(text) => {
              const element = typeof textareaRef === 'function' ? null : textareaRef?.current;
              if (element) {
                const start = element.selectionStart;
                const end = element.selectionEnd;
                const newValue = message.substring(0, start) + text + ' ' + message.substring(end);

                // Trigger change
                if (onChange) {
                  const event = {
                    target: { value: newValue }
                  } as React.ChangeEvent<HTMLTextAreaElement>;
                  onChange(event);
                } else {
                  setInternalMessage(newValue);
                }

                // Focus back
                setTimeout(() => {
                  element.focus();
                  element.selectionStart = element.selectionEnd = start + text.length + 1;
                }, 0);
              }
            }}
            disabled={disabled}
          />

          <PromptLibrary
            onInsert={(template) => {
              const element = typeof textareaRef === 'function' ? null : textareaRef?.current;
              if (element) {
                const start = element.selectionStart;
                const end = element.selectionEnd;
                const newValue = message.substring(0, start) + template + message.substring(end);

                // Trigger change
                if (onChange) {
                  const event = {
                    target: { value: newValue }
                  } as React.ChangeEvent<HTMLTextAreaElement>;
                  onChange(event);
                } else {
                  setInternalMessage(newValue);
                }

                // Focus back
                setTimeout(() => {
                  element.focus();
                  element.selectionStart = element.selectionEnd = start + template.length;
                }, 0);
              }
            }}
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.xls,.xlsx,.csv"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="File upload input"
          />

          <Textarea
            ref={ref || internalRef}
            value={message}
            onChange={(e) => {
              if (onChange) {
                onChange(e);
              } else {
                setInternalMessage(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Type your message... (Press Enter to send, Shift+Enter for new line)'}
            disabled={disabled}
            className="min-h-[52px] md:min-h-[60px] max-h-[200px] resize-none text-sm md:text-base"
            rows={1}
            aria-label="Message input"
            aria-describedby="input-help"
          />
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            size="icon"
            className="h-[52px] w-[52px] md:h-[60px] md:w-[60px] shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
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

