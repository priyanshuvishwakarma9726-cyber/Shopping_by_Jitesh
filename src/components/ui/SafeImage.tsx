'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

const DEFAULT_CATEGORY_FALLBACKS: Record<string, string> = {
  'cat-1': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
  'cat-2': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
  'cat-3': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
  'cat-4': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
  'cat-5': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
  'electronics': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
  'apparel': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
  'home-living': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
  'watches-jewelry': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
  'wellness-gourmet': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
};

const GLOBAL_FALLBACK = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';

export interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  fallbackSrc?: string;
  categoryKey?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackSrc,
  categoryKey,
  alt,
  className,
  onError,
  ...rest
}) => {
  const resolvedFallback =
    fallbackSrc ||
    (categoryKey ? DEFAULT_CATEGORY_FALLBACKS[categoryKey] : null) ||
    GLOBAL_FALLBACK;

  const validSrc = (src && typeof src === 'string' && src.trim() !== '') ? src : resolvedFallback;
  const [currentSrc, setCurrentSrc] = useState<string>(validSrc);
  const [prevSrc, setPrevSrc] = useState<string>(validSrc);

  if (prevSrc !== validSrc) {
    setPrevSrc(validSrc);
    setCurrentSrc(validSrc);
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (currentSrc !== resolvedFallback) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[SafeImage Fallback Triggered] Image failed to load: "${currentSrc}" for "${alt || 'image'}". Switching to fallback: "${resolvedFallback}".`
        );
      }
      setCurrentSrc(resolvedFallback);
    }
    if (onError) {
      onError(e);
    }
  };

  return (
    <Image
      src={currentSrc}
      alt={alt || 'Product image'}
      className={className}
      onError={handleError}
      {...rest}
    />
  );
};

export default SafeImage;

