import { useEffect, useState } from 'react';

/**
 * Smart image component with lazy loading, graceful fallback, and alt text.
 * Shows a placeholder while loading and a fallback icon if the image fails.
 */
export function SmartImage({
  path,
  alt,
  className = '',
  rounded = 'rounded-2xl',
}: {
  path: string | undefined;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [path]);

  if (!path || errored) {
    return (
      <div className={`grid place-items-center bg-secondary-100 ${rounded} ${className}`} aria-label={alt}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-secondary-300">
          <rect width="48" height="48" rx="8" fill="currentColor" opacity="0.3" />
          <circle cx="18" cy="18" r="4" fill="currentColor" opacity="0.5" />
          <path d="M10 32l8-8 6 6 6-10 8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-secondary-100" />}
      <img
        src={path.startsWith('http') || path.startsWith('/') ? path : `/content-assets/${path}`}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  );
}
