'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';

// Visually hidden but accessible to screen readers
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
    return (
        <span className="sr-only">
            {children}
        </span>
    );
}

// Live region for dynamic announcements
interface LiveRegionContextType {
    announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const LiveRegionContext = createContext<LiveRegionContextType | null>(null);

export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
    const [politeMessage, setPoliteMessage] = useState('');
    const [assertiveMessage, setAssertiveMessage] = useState('');

    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (priority === 'assertive') {
            setAssertiveMessage(message);
            // Clear after announcement
            setTimeout(() => setAssertiveMessage(''), 1000);
        } else {
            setPoliteMessage(message);
            setTimeout(() => setPoliteMessage(''), 1000);
        }
    }, []);

    return (
        <LiveRegionContext.Provider value={{ announce }}>
            {children}
            {/* Polite live region - read after current speech */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {politeMessage}
            </div>
            {/* Assertive live region - interrupts current speech */}
            <div
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className="sr-only"
            >
                {assertiveMessage}
            </div>
        </LiveRegionContext.Provider>
    );
}

export function useLiveRegion() {
    const context = useContext(LiveRegionContext);
    if (!context) {
        return { announce: () => {} };
    }
    return context;
}

// Loading state announcer
export function LoadingAnnouncer({
    isLoading,
    loadingMessage = 'Loading...',
    loadedMessage = 'Content loaded'
}: {
    isLoading: boolean;
    loadingMessage?: string;
    loadedMessage?: string;
}) {
    const [announced, setAnnounced] = useState(false);

    useEffect(() => {
        if (isLoading) {
            setAnnounced(false);
        } else if (!announced) {
            setAnnounced(true);
        }
    }, [isLoading, announced]);

    return (
        <div role="status" aria-live="polite" className="sr-only">
            {isLoading ? loadingMessage : (announced ? loadedMessage : '')}
        </div>
    );
}

// Focus management hook
export function useFocusReturn() {
    const [previousElement, setPreviousElement] = useState<HTMLElement | null>(null);

    const saveFocus = useCallback(() => {
        setPreviousElement(document.activeElement as HTMLElement);
    }, []);

    const restoreFocus = useCallback(() => {
        if (previousElement && 'focus' in previousElement) {
            previousElement.focus();
        }
    }, [previousElement]);

    return { saveFocus, restoreFocus };
}

// Keyboard navigation hook for lists
export function useRovingTabIndex<T extends HTMLElement>(
    items: T[],
    options?: {
        orientation?: 'horizontal' | 'vertical' | 'both';
        loop?: boolean;
    }
) {
    const { orientation = 'vertical', loop = true } = options || {};
    const [activeIndex, setActiveIndex] = useState(0);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            const isHorizontal = orientation === 'horizontal' || orientation === 'both';
            const isVertical = orientation === 'vertical' || orientation === 'both';

            let nextIndex = activeIndex;

            switch (event.key) {
                case 'ArrowDown':
                    if (isVertical) {
                        event.preventDefault();
                        nextIndex = loop
                            ? (activeIndex + 1) % items.length
                            : Math.min(activeIndex + 1, items.length - 1);
                    }
                    break;
                case 'ArrowUp':
                    if (isVertical) {
                        event.preventDefault();
                        nextIndex = loop
                            ? (activeIndex - 1 + items.length) % items.length
                            : Math.max(activeIndex - 1, 0);
                    }
                    break;
                case 'ArrowRight':
                    if (isHorizontal) {
                        event.preventDefault();
                        nextIndex = loop
                            ? (activeIndex + 1) % items.length
                            : Math.min(activeIndex + 1, items.length - 1);
                    }
                    break;
                case 'ArrowLeft':
                    if (isHorizontal) {
                        event.preventDefault();
                        nextIndex = loop
                            ? (activeIndex - 1 + items.length) % items.length
                            : Math.max(activeIndex - 1, 0);
                    }
                    break;
                case 'Home':
                    event.preventDefault();
                    nextIndex = 0;
                    break;
                case 'End':
                    event.preventDefault();
                    nextIndex = items.length - 1;
                    break;
            }

            if (nextIndex !== activeIndex) {
                setActiveIndex(nextIndex);
                items[nextIndex]?.focus();
            }
        },
        [activeIndex, items, loop, orientation]
    );

    return {
        activeIndex,
        setActiveIndex,
        handleKeyDown,
        getTabIndex: (index: number) => (index === activeIndex ? 0 : -1),
    };
}
