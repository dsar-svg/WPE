import { useState, useEffect, useRef, memo } from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const showPlaceholder = !src || hasError;

  return (
    <div ref={imgRef} className={`relative overflow-hidden bg-dark-card ${className}`}>
      {showPlaceholder ? (
        <div className="w-full h-full flex items-center justify-center bg-zinc-800/50">
          <UtensilsCrossed className="w-10 h-10 text-zinc-600" />
        </div>
      ) : (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
          )}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            referrerPolicy="no-referrer"
          />
        </>
      )}
    </div>
  );
});