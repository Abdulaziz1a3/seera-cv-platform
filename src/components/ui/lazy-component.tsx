'use client';

import { Suspense, lazy, ComponentType, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Generic lazy load wrapper with intersection observer
interface LazyLoadProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    rootMargin?: string;
    threshold?: number;
}

export function LazyLoad({
    children,
    fallback,
    rootMargin = '100px',
    threshold = 0,
}: LazyLoadProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [ref, setRef] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!ref) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin, threshold }
        );

        observer.observe(ref);

        return () => observer.disconnect();
    }, [ref, rootMargin, threshold]);

    return (
        <div ref={setRef}>
            {isVisible ? (
                <Suspense fallback={fallback || <Skeleton className="h-32 w-full" />}>
                    {children}
                </Suspense>
            ) : (
                fallback || <Skeleton className="h-32 w-full" />
            )}
        </div>
    );
}

// Higher-order component for lazy loading
export function withLazyLoad<P extends object>(
    Component: ComponentType<P>,
    fallback?: React.ReactNode
) {
    return function LazyLoadedComponent(props: P) {
        return (
            <LazyLoad fallback={fallback}>
                <Component {...props} />
            </LazyLoad>
        );
    };
}

// Lazy import helper with preload capability
export function createLazyComponent<P extends Record<string, unknown>>(
    importFn: () => Promise<{ default: ComponentType<P> }>,
    fallback?: React.ReactNode
) {
    const LazyComponent = lazy(importFn);

    const Component = (props: P) => (
        <Suspense fallback={fallback || <Skeleton className="h-32 w-full" />}>
            <LazyComponent {...props as P & JSX.IntrinsicAttributes} />
        </Suspense>
    );

    // Preload function for route prefetching
    Component.preload = importFn;

    return Component;
}
