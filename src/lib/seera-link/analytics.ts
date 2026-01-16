import crypto from 'crypto';

/**
 * Get daily rotating salt for privacy-preserving visitor hashing
 * Salt rotates daily to prevent long-term tracking while still
 * enabling same-day unique visitor detection
 */
function getDailySalt(): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const secret = process.env.NEXTAUTH_SECRET?.slice(0, 16) || 'seera-link-salt';
  return `${date}-${secret}`;
}

/**
 * Hash visitor for unique visitor tracking
 * Uses IP + User-Agent with daily rotating salt
 * Returns a 32-character hex string
 */
export function hashVisitor(ip: string, userAgent: string): string {
  const salt = getDailySalt();
  const data = `${ip}|${userAgent}|${salt}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

/**
 * Get device type from user agent
 */
export function getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const ua = userAgent.toLowerCase();

  // Check for tablets first (they often contain 'mobile' too)
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet';
  }

  // Check for mobile devices
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Get browser name from user agent
 */
export function getBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  if (ua.includes('msie') || ua.includes('trident')) return 'IE';

  return 'Other';
}

/**
 * Get country from IP (coarse geolocation)
 * In production, use a service like MaxMind GeoLite2 or IP-API
 * This is a simple fallback implementation
 */
export async function getCountryFromIP(ip: string): Promise<string | null> {
  // Skip for local/private IPs
  if (
    ip === 'unknown' ||
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')
  ) {
    return null;
  }

  try {
    // Free IP geolocation API (rate limited - use cached/paid service in production)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=countryCode`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.countryCode || null;
    }
  } catch {
    // Silently fail - geolocation is optional
  }

  return null;
}

/**
 * Parse UTM parameters from URL
 */
export function parseUtmParams(url: string): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
} {
  try {
    const urlObj = new URL(url);
    return {
      utmSource: urlObj.searchParams.get('utm_source') || undefined,
      utmMedium: urlObj.searchParams.get('utm_medium') || undefined,
      utmCampaign: urlObj.searchParams.get('utm_campaign') || undefined,
      utmContent: urlObj.searchParams.get('utm_content') || undefined,
      utmTerm: urlObj.searchParams.get('utm_term') || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Calculate analytics summary for a profile
 */
export interface AnalyticsSummary {
  totalViews: number;
  uniqueViews: number;
  ctaClicks: { type: string; count: number }[];
  topSources: { source: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  dailyViews: { date: string; views: number; uniqueViews: number }[];
}

/**
 * Get analytics retention period in days based on plan
 */
export function getAnalyticsRetentionDays(plan: string): number {
  const retention: Record<string, number> = {
    FREE: 7,
    PRO: 30,
    ENTERPRISE: 90,
  };
  return retention[plan] || 7;
}
