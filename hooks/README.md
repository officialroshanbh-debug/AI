# Custom Hooks

This directory contains reusable React hooks for the application.

## Available Hooks

### `useKeyboardShortcuts`
Manages keyboard shortcuts throughout the application.

```tsx
useKeyboardShortcuts([
  {
    key: 'k',
    metaKey: true,
    handler: () => focusInput(),
    description: 'Focus input',
  },
]);
```

### `useFocusManagement`
Manages focus for accessibility purposes.

```tsx
const inputRef = useFocusManagement(shouldFocus);
```

### `useDebounce`
Debounces a value to reduce unnecessary re-renders or API calls.

```tsx
const debouncedSearch = useDebounce(searchTerm, 300);
```

