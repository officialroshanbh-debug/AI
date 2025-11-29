import { useEffect, useRef } from 'react';

export function useFocusManagement(shouldFocus: boolean) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldFocus && ref.current) {
      ref.current.focus();
    }
  }, [shouldFocus]);

  return ref;
}

