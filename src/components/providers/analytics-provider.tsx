'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { createContext, useContext, useEffect, useCallback, Suspense } from 'react';

// Types for analytics events
type AnalyticsEvent = {
    action: string;
    category: string;
    label?: string;
    value?: number;
    [key: string]: string | number | undefined;
};

type AnalyticsContextType = {
    trackEvent: (event: AnalyticsEvent) => void;
    trackPageView: (url: string) => void;
};

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

// Google Analytics measurement ID - set in environment variable
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Declare gtag on window
declare global {
    interface Window {
        gtag: (...args: unknown[]) => void;
        dataLayer: unknown[];
    }
}

// Track page views
function trackPageView(url: string) {
    if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
        window.gtag('config', GA_MEASUREMENT_ID, {
            page_path: url,
        });
    }
}

// Track custom events
function trackEvent({ action, category, label, value, ...rest }: AnalyticsEvent) {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
            ...rest,
        });
    }
}

// Page view tracker component
function PageViewTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname) {
            const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
            trackPageView(url);
        }
    }, [pathname, searchParams]);

    return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const trackEventCallback = useCallback((event: AnalyticsEvent) => {
        trackEvent(event);
    }, []);

    const trackPageViewCallback = useCallback((url: string) => {
        trackPageView(url);
    }, []);

    // Don't render GA scripts if no measurement ID
    if (!GA_MEASUREMENT_ID) {
        return (
            <AnalyticsContext.Provider
                value={{
                    trackEvent: trackEventCallback,
                    trackPageView: trackPageViewCallback,
                }}
            >
                {children}
            </AnalyticsContext.Provider>
        );
    }

    return (
        <AnalyticsContext.Provider
            value={{
                trackEvent: trackEventCallback,
                trackPageView: trackPageViewCallback,
            }}
        >
            {/* Google Analytics Script */}
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}', {
                        page_path: window.location.pathname,
                        anonymize_ip: true,
                        cookie_flags: 'SameSite=None;Secure'
                    });
                `}
            </Script>
            <Suspense fallback={null}>
                <PageViewTracker />
            </Suspense>
            {children}
        </AnalyticsContext.Provider>
    );
}

// Hook to use analytics
export function useAnalytics() {
    const context = useContext(AnalyticsContext);
    if (!context) {
        // Return no-op functions if not in provider
        return {
            trackEvent: () => {},
            trackPageView: () => {},
        };
    }
    return context;
}

// Pre-defined event helpers for common actions
export const analyticsEvents = {
    // Resume events
    resumeCreated: (template: string) => ({
        action: 'resume_created',
        category: 'Resume',
        label: template,
    }),
    resumeDownloaded: (format: string) => ({
        action: 'resume_downloaded',
        category: 'Resume',
        label: format,
    }),
    resumeShared: () => ({
        action: 'resume_shared',
        category: 'Resume',
    }),
    templateSelected: (template: string) => ({
        action: 'template_selected',
        category: 'Resume',
        label: template,
    }),

    // AI events
    aiGenerationUsed: (feature: string) => ({
        action: 'ai_generation',
        category: 'AI',
        label: feature,
    }),

    // User events
    signUp: (method: string) => ({
        action: 'sign_up',
        category: 'User',
        label: method,
    }),
    login: (method: string) => ({
        action: 'login',
        category: 'User',
        label: method,
    }),
    subscriptionStarted: (plan: string) => ({
        action: 'subscription_started',
        category: 'Conversion',
        label: plan,
    }),

    // Engagement events
    featureUsed: (feature: string) => ({
        action: 'feature_used',
        category: 'Engagement',
        label: feature,
    }),
    helpArticleViewed: (article: string) => ({
        action: 'help_article_viewed',
        category: 'Support',
        label: article,
    }),
    onboardingCompleted: () => ({
        action: 'onboarding_completed',
        category: 'User',
    }),
    onboardingSkipped: () => ({
        action: 'onboarding_skipped',
        category: 'User',
    }),
};
