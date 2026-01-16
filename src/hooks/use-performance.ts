'use client';

import { useEffect, useCallback, useRef } from 'react';

// Web Vitals tracking
export function useWebVitals(onReport?: (metric: PerformanceMetric) => void) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Report function
        const report = (metric: PerformanceMetric) => {
            // Log to console in development
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Web Vitals] ${metric.name}:`, metric.value);
            }

            // Call custom reporter
            onReport?.(metric);

            // Send to analytics
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', metric.name, {
                    event_category: 'Web Vitals',
                    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
                    event_label: metric.id,
                    non_interaction: true,
                });
            }
        };

        // Dynamic import for web-vitals (tree-shaking)
        import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
            onCLS(report);
            onFID(report);
            onFCP(report);
            onLCP(report);
            onTTFB(report);
            onINP(report);
        }).catch(() => {
            // web-vitals not installed, skip
        });
    }, [onReport]);
}

interface PerformanceMetric {
    name: string;
    value: number;
    id: string;
    delta: number;
    entries: PerformanceEntry[];
}

// Debounce hook for performance
export function useDebounce<T extends (...args: Parameters<T>) => void>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(callback);

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const debouncedCallback = useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        },
        [delay]
    ) as T;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedCallback;
}

// Throttle hook for performance
export function useThrottle<T extends (...args: Parameters<T>) => void>(
    callback: T,
    delay: number
): T {
    const lastRunRef = useRef<number>(0);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const throttledCallback = useCallback(
        (...args: Parameters<T>) => {
            const now = Date.now();
            if (now - lastRunRef.current >= delay) {
                lastRunRef.current = now;
                callbackRef.current(...args);
            }
        },
        [delay]
    ) as T;

    return throttledCallback;
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
    options?: IntersectionObserverInit
): [
    (element: HTMLElement | null) => void,
    boolean,
    IntersectionObserverEntry | null
] {
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const setRef = useCallback(
        (element: HTMLElement | null) => {
            // Cleanup previous observer
            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            if (!element) return;

            observerRef.current = new IntersectionObserver(
                ([entry]) => {
                    setEntry(entry);
                    setIsIntersecting(entry.isIntersecting);
                },
                options
            );

            observerRef.current.observe(element);
        },
        [options]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    return [setRef, isIntersecting, entry];
}

// Import useState at the top level
import { useState } from 'react';

// Prefetch resources
export function usePrefetch() {
    const prefetchedUrls = useRef<Set<string>>(new Set());

    const prefetch = useCallback((url: string) => {
        if (prefetchedUrls.current.has(url)) return;

        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
        prefetchedUrls.current.add(url);
    }, []);

    const preconnect = useCallback((url: string) => {
        if (prefetchedUrls.current.has(url)) return;

        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        document.head.appendChild(link);
        prefetchedUrls.current.add(url);
    }, []);

    return { prefetch, preconnect };
}

// Measure component render time
export function useRenderTime(componentName: string) {
    const renderStartRef = useRef<number>(0);

    useEffect(() => {
        renderStartRef.current = performance.now();
    });

    useEffect(() => {
        const renderTime = performance.now() - renderStartRef.current;
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Render Time] ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
    });
}
