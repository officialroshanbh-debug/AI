import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matches =
          event.key === shortcut.key &&
          (shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey) &&
          (shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey) &&
          (shortcut.altKey === undefined || event.altKey === shortcut.altKey) &&
          (shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey);

        if (matches) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

