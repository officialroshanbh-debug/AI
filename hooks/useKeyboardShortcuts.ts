'use client';

import { useEffect } from 'react';

type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const { key, ctrl, meta, shift, alt, handler, preventDefault = true } = shortcut;

        const ctrlMatch = ctrl === undefined || ctrl === e.ctrlKey;
        const metaMatch = meta === undefined || meta === e.metaKey;
        const shiftMatch = shift === undefined || shift === e.shiftKey;
        const altMatch = alt === undefined || alt === e.altKey;
        const keyMatch = key.toLowerCase() === e.key.toLowerCase();

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          if (preventDefault) {
            e.preventDefault();
          }
          handler(e);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Common shortcuts
export const SHORTCUTS = {
  FOCUS_INPUT: { key: 'k', meta: true },
  NEW_CHAT: { key: 'n', meta: true },
  TOGGLE_SIDEBAR: { key: 'b', meta: true },
  ESCAPE: { key: 'Escape' },
} as const;