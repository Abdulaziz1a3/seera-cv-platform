'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
    fallback?: string;
    aspectRatio?: string;
    showLoadingState?: boolean;
}

export function OptimizedImage({
    src,
    alt,
    className,
    fallback = '/images/placeholder.png',
    aspectRatio,
    showLoadingState = true,
    ...props
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <div
            className={cn(
                'relative overflow-hidden',
                aspectRatio && `aspect-[${aspectRatio}]`,
                className
            )}
        >
            {showLoadingState && isLoading && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            <Image
                src={error ? fallback : src}
                alt={alt}
                className={cn(
                    'transition-opacity duration-300',
                    isLoading ? 'opacity-0' : 'opacity-100'
                )}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setError(true);
                    setIsLoading(false);
                }}
                {...props}
            />
        </div>
    );
}

// Hero image component with blur-up effect
interface HeroImageProps extends Omit<ImageProps, 'placeholder'> {
    blurDataURL?: string;
}

export function HeroImage({
    src,
    alt,
    className,
    blurDataURL,
    ...props
}: HeroImageProps) {
    return (
        <div className={cn('relative overflow-hidden', className)}>
            <Image
                src={src}
                alt={alt}
                placeholder={blurDataURL ? 'blur' : 'empty'}
                blurDataURL={blurDataURL}
                className="object-cover"
                {...props}
            />
        </div>
    );
}

// Avatar with fallback
interface OptimizedAvatarProps {
    src?: string | null;
    alt: string;
    size?: number;
    fallbackInitials?: string;
    className?: string;
}

export function OptimizedAvatar({
    src,
    alt,
    size = 40,
    fallbackInitials = 'U',
    className,
}: OptimizedAvatarProps) {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium',
                    className
                )}
                style={{ width: size, height: size }}
                aria-label={alt}
            >
                {fallbackInitials}
            </div>
        );
    }

    return (
        <div
            className={cn('relative rounded-full overflow-hidden', className)}
            style={{ width: size, height: size }}
        >
            <Image
                src={src}
                alt={alt}
                width={size}
                height={size}
                className="object-cover"
                onError={() => setError(true)}
            />
        </div>
    );
}

// Responsive image with srcset generation
interface ResponsiveImageProps {
    src: string;
    alt: string;
    sizes?: string;
    className?: string;
    priority?: boolean;
}

export function ResponsiveImage({
    src,
    alt,
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    className,
    priority = false,
}: ResponsiveImageProps) {
    return (
        <div className={cn('relative w-full h-full', className)}>
            <Image
                src={src}
                alt={alt}
                fill
                sizes={sizes}
                priority={priority}
                className="object-cover"
            />
        </div>
    );
}
