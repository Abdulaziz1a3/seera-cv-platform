import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { profanityList } from './profanity';

/**
 * Reserved slugs that cannot be used
 */
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'login',
  'register',
  'signup',
  'signin',
  'dashboard',
  'settings',
  'help',
  'support',
  'about',
  'privacy',
  'terms',
  'blog',
  'pricing',
  'contact',
  'null',
  'undefined',
  'favicon',
  'robots',
  'sitemap',
  'manifest',
  'sw',
  'service-worker',
  'p',
  'u',
  'profile',
  'profiles',
  'seera',
  'seera-ai',
  'seeraai',
  'app',
  'www',
  'mail',
  'email',
  'ftp',
  'cdn',
  'static',
  'assets',
  'img',
  'images',
  'css',
  'js',
  'fonts',
  'public',
  'private',
  'auth',
  'oauth',
  'callback',
  'webhooks',
  'health',
  'status',
  'test',
  'demo',
  'example',
  'sample',
  'root',
  'system',
  'user',
  'users',
  'account',
  'accounts',
  'new',
  'edit',
  'delete',
  'create',
  'update',
  'remove',
];

interface SlugValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate slug availability and format
 */
export async function validateSlug(
  slug: string,
  excludeProfileId?: string
): Promise<SlugValidationResult> {
  const normalizedSlug = slug.toLowerCase().trim();

  // Check basic format
  if (normalizedSlug.length < 3) {
    return { valid: false, error: 'Slug must be at least 3 characters' };
  }

  if (normalizedSlug.length > 50) {
    return { valid: false, error: 'Slug must be at most 50 characters' };
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(normalizedSlug)) {
    return {
      valid: false,
      error: 'Slug can only contain lowercase letters, numbers, and hyphens',
    };
  }

  // Check reserved slugs in memory
  if (RESERVED_SLUGS.includes(normalizedSlug)) {
    return { valid: false, error: 'This slug is reserved' };
  }

  // Check profanity in memory
  const containsProfanity = profanityList.some((word) => normalizedSlug.includes(word.toLowerCase()));
  if (containsProfanity) {
    return { valid: false, error: 'This slug contains inappropriate content' };
  }

  // Check reserved slugs in database
  const reserved = await prisma.reservedSlug.findUnique({
    where: { slug: normalizedSlug },
  });

  if (reserved) {
    return {
      valid: false,
      error:
        reserved.reason === 'profanity'
          ? 'This slug contains inappropriate content'
          : 'This slug is reserved',
    };
  }

  // Check existing profiles
  const existing = await prisma.seeraProfile.findFirst({
    where: {
      slug: normalizedSlug,
      ...(excludeProfileId && { id: { not: excludeProfileId } }),
      deletedAt: null,
    },
  });

  if (existing) {
    return { valid: false, error: 'This slug is already taken' };
  }

  return { valid: true };
}

/**
 * Hash access code for password-protected profiles
 */
export async function hashAccessCode(code: string): Promise<string> {
  return bcrypt.hash(code, 12);
}

/**
 * Verify access code
 */
export async function verifyAccessCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/**
 * Generate slug suggestions from name
 */
export function generateSlugSuggestions(name: string): string[] {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);

  if (!base || base.length < 3) {
    return [];
  }

  const suggestions = [
    base,
    `${base}-pro`,
    `${base}-cv`,
    `${base}-${Math.floor(Math.random() * 1000)}`,
    `hire-${base}`,
  ];

  return suggestions.filter((s) => s.length >= 3 && s.length <= 50);
}

/**
 * Generate profile URL
 */
export function getProfileUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seera-ai.com';
  return `${baseUrl}/p/${slug}`;
}

/**
 * Build WhatsApp URL with prefilled message
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

/**
 * Build mailto URL with subject and body
 */
export function buildMailtoUrl(
  email: string,
  subject?: string,
  body?: string
): string {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const queryString = params.toString();
  return `mailto:${email}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Build tel URL
 */
export function buildTelUrl(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return `tel:+${cleanPhone}`;
}

/**
 * Format phone number for display
 */
export function formatPhoneDisplay(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  // Basic formatting - can be enhanced with libphonenumber-js if needed
  if (clean.length === 10) {
    return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  if (clean.length === 11) {
    return `+${clean.slice(0, 1)} (${clean.slice(1, 4)}) ${clean.slice(4, 7)}-${clean.slice(7)}`;
  }
  if (clean.length >= 12) {
    return `+${clean.slice(0, clean.length - 10)} ${clean.slice(-10, -7)} ${clean.slice(-7, -4)} ${clean.slice(-4)}`;
  }
  return phone;
}

/**
 * Normalize Saudi phone numbers to +966 format
 */
export function normalizeSaudiPhone(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('+966')) {
    return trimmed;
  }
  if (trimmed.startsWith('00966')) {
    return `+${trimmed.slice(2)}`;
  }
  if (trimmed.startsWith('966')) {
    return `+${trimmed}`;
  }
  if (trimmed.startsWith('05') && trimmed.length >= 10) {
    return `+966${trimmed.slice(1)}`;
  }
  if (trimmed.startsWith('5') && trimmed.length >= 9 && trimmed.length <= 12) {
    return `+966${trimmed}`;
  }

  return trimmed;
}

/**
 * Check if user can create more profiles based on their plan
 */
export async function canCreateProfile(userId: string): Promise<{
  allowed: boolean;
  current: number;
  max: number;
  plan: string;
}> {
  const [subscription, profileCount] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: { plan: true },
    }),
    prisma.seeraProfile.count({
      where: { userId, deletedAt: null },
    }),
  ]);

  const plan = subscription?.plan || 'FREE';
  const limits: Record<string, number> = {
    FREE: 1,
    PRO: 5,
    ENTERPRISE: 100,
  };

  const max = limits[plan] || 1;

  return {
    allowed: profileCount < max,
    current: profileCount,
    max,
    plan,
  };
}

/**
 * Check if feature is available for user's plan
 */
export async function isFeatureAvailable(
  userId: string,
  feature: 'password_protection' | 'download_cv' | 'custom_cta' | 'all_templates' | 'remove_branding'
): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: 'ACTIVE' },
    select: { plan: true },
  });

  const plan = subscription?.plan || 'FREE';

  const featureAccess: Record<string, string[]> = {
    password_protection: ['PRO', 'ENTERPRISE'],
    download_cv: ['PRO', 'ENTERPRISE'],
    custom_cta: ['PRO', 'ENTERPRISE'],
    all_templates: ['PRO', 'ENTERPRISE'],
    remove_branding: ['ENTERPRISE'],
  };

  return featureAccess[feature]?.includes(plan) || false;
}
