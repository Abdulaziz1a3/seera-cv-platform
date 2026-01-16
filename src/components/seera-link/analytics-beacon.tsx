'use client';

import { useEffect, useRef, useCallback } from 'react';

interface AnalyticsBeaconProps {
  profileId: string;
  utmParams?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
}

type EventType = 'PAGE_VIEW' | 'CTA_CLICK' | 'PDF_DOWNLOAD';
type CTAType = 'WHATSAPP' | 'PHONE' | 'EMAIL' | 'LINKEDIN' | 'DOWNLOAD_CV' | 'VIEW_CV';

// Track event via beacon API
async function trackEvent(
  profileId: string,
  eventType: EventType,
  ctaType?: CTAType,
  utmParams?: AnalyticsBeaconProps['utmParams']
) {
  try {
    const payload = {
      profileId,
      eventType,
      ctaType,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      ...utmParams,
    };

    // Use sendBeacon for reliability, fallback to fetch
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/seera-link/analytics',
        JSON.stringify(payload)
      );
    } else {
      await fetch('/api/seera-link/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch (error) {
    // Silently fail - analytics should not affect user experience
    console.debug('Analytics tracking failed:', error);
  }
}

export function AnalyticsBeacon({ profileId, utmParams }: AnalyticsBeaconProps) {
  const hasTrackedPageView = useRef(false);

  // Track page view on mount
  useEffect(() => {
    if (!hasTrackedPageView.current) {
      hasTrackedPageView.current = true;
      trackEvent(profileId, 'PAGE_VIEW', undefined, utmParams);
    }
  }, [profileId, utmParams]);

  return null;
}

// Hook for tracking CTA clicks
export function useAnalyticsTracker(profileId: string) {
  const trackCTA = useCallback(
    (ctaType: CTAType) => {
      trackEvent(profileId, 'CTA_CLICK', ctaType);
    },
    [profileId]
  );

  const trackDownload = useCallback(() => {
    trackEvent(profileId, 'PDF_DOWNLOAD', 'DOWNLOAD_CV');
  }, [profileId]);

  return { trackCTA, trackDownload };
}

// Export the trackEvent function for use in other components
export { trackEvent };
