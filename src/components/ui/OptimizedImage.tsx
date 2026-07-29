import { useState, useEffect, useRef, memo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';

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
  const { config } = useRestaurant();
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
  const logo = config?.logo || '/logo.png';

  return (
    <div ref={imgRef} className={`relative overflow-hidden bg-zinc-900/50 flex items-center justify-center ${className}`}>
      {showPlaceholder ? (
        <div className="w-full h-full flex items-center justify-center">
          <img src={logo} alt="Logo" className="w-16 h-16 object-contain opacity-40" referrerPolicy="no-referrer" />
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
            className="w-auto h-auto max-w-full max-h-full object-contain transition-opacity duration-300 m-auto"
            referrerPolicy="no-referrer"
          />
        </>
      )}
    </div>
  );
});
