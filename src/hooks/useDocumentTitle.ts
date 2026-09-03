import { useEffect } from 'react';

/**
 * Sets the browser tab title.
 * Usage: useDocumentTitle('Learners');
 * Result: "Learners | ArtsFlow OS"
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const suffix = 'ArtsFlow OS';
    document.title = title ? `${title} | ${suffix}` : suffix;

    return () => {
      document.title = suffix;
    };
  }, [title]);
}
