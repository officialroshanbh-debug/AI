'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INTERESTS = [
  { id: 'tech', label: 'Tech & Science', icon: '🔬' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'arts', label: 'Arts & Culture', icon: '🎨' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
];

export function InterestsWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  useEffect(() => {
    // Load saved interests from localStorage
    const saved = localStorage.getItem('userInterests');
    if (saved) {
      try {
        setSelectedInterests(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      localStorage.setItem('userInterests', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSave = () => {
    localStorage.setItem('userInterests', JSON.stringify(selectedInterests));
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Make it yours</h3>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Select topics and interests to customize your Discover experience
        </p>

        <div className="mb-6 flex flex-wrap gap-2">
          {INTERESTS.filter((i) => selectedInterests.includes(i.id)).map((interest) => (
            <span
              key={interest.id}
              className="rounded-md border bg-primary/10 border-primary/20 px-2 py-1 text-xs font-medium text-primary"
            >
              {interest.icon} {interest.label}
            </span>
          ))}
          {selectedInterests.length === 0 && (
            <span className="text-xs text-muted-foreground">No interests selected</span>
          )}
        </div>

        <Button
          onClick={() => setIsOpen(true)}
          className="w-full"
          variant="outline"
        >
          Customize Interests
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Select Your Interests</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Choose topics you're interested in to personalize your feed
      </p>

      <div className="mb-6 space-y-2">
        {INTERESTS.map((interest) => {
          const isSelected = selectedInterests.includes(interest.id);
          return (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              className={cn(
                'w-full flex items-center justify-between rounded-lg border p-3 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-secondary/50 hover:bg-secondary'
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{interest.icon}</span>
                <span className="font-medium">{interest.label}</span>
              </span>
              {isSelected && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>

      <Button onClick={handleSave} className="w-full">
        Save Interests
      </Button>
    </div>
  );
}

