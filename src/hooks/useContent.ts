import { useMemo } from 'react';
import { loadAllContent, type LoadedContent, type ContentLoadError } from '@/engine/content-loader';

let cachedContent: LoadedContent | null = null;

/**
 * Load and validate all content once. Results are memoized for the app lifetime.
 * Returns loaded lessons, units, and any validation errors.
 */
export function useContent(): LoadedContent {
  return useMemo(() => {
    if (!cachedContent) {
      cachedContent = loadAllContent();
    }
    return cachedContent;
  }, []);
}

export function useContentErrors(): ContentLoadError[] {
  return useContent().errors;
}

export function resetContentCache(): void {
  cachedContent = null;
}
