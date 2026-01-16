import { z } from 'zod';

// Slug validation - alphanumeric with hyphens, no consecutive hyphens
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be at most 50 characters')
  .regex(
    slugRegex,
    'Slug can only contain lowercase letters, numbers, and hyphens (no consecutive hyphens, cannot start/end with hyphen)'
  )
  .transform((s) => s.toLowerCase());

// Profile visibility
export const visibilitySchema = z.enum(['PUBLIC', 'UNLISTED', 'PASSWORD_PROTECTED']);

// Profile persona
export const personaSchema = z.enum(['JOBS', 'FREELANCE', 'NETWORKING', 'CUSTOM']);

// Profile template
export const templateSchema = z.enum(['MINIMAL', 'BOLD']);

// Profile status
export const statusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

// CTA types
export const ctaTypeSchema = z.enum([
  'WHATSAPP',
  'PHONE',
  'EMAIL',
  'LINKEDIN',
  'DOWNLOAD_CV',
  'VIEW_CV',
  'CUSTOM',
]);

// Theme colors (matching resume themes)
export const themeColorSchema = z.enum([
  'obsidian',
  'sapphire',
  'emerald',
  'ruby',
  'amber',
  'slate',
]);

// Language
export const languageSchema = z.enum(['en', 'ar']);

// Status badge options
export const statusBadgeOptions = [
  'Open to work',
  'Freelance available',
  'Remote only',
  'Hybrid',
  'Onsite',
  'Actively looking',
  'Casually exploring',
  'Not looking',
] as const;

// Highlight schema
export const highlightSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(1, 'Highlight content is required').max(500, 'Highlight too long'),
  icon: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

// Experience schema
export const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, 'Company name is required').max(100),
  role: z.string().min(1, 'Role is required').max(100),
  location: z.string().max(100).optional().nullable(),
  startDate: z.string().max(20).optional().nullable(),
  endDate: z.string().max(20).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

// Project schema
export const projectSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Project title is required').max(100),
  description: z.string().max(500).optional().nullable(),
  url: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  imageUrl: z.string().url('Invalid image URL').optional().nullable().or(z.literal('')),
  tags: z.array(z.string().max(30)).max(10).default([]),
  sortOrder: z.number().int().min(0).default(0),
});

// Certificate schema
export const certificateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Certificate name is required').max(100),
  issuer: z.string().min(1, 'Issuer is required').max(100),
  date: z.string().max(20).optional().nullable(),
  url: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  sortOrder: z.number().int().min(0).default(0),
});

// Main profile create schema
export const createProfileSchema = z.object({
  slug: slugSchema,
  persona: personaSchema.default('JOBS'),
  template: templateSchema.default('MINIMAL'),
  visibility: visibilitySchema.default('PUBLIC'),
  accessCode: z
    .string()
    .min(4, 'Access code must be at least 4 characters')
    .max(8, 'Access code must be at most 8 characters')
    .optional()
    .nullable(),
  noIndex: z.boolean().default(false),
  hidePhoneNumber: z.boolean().default(false),

  // Hero
  displayName: z.string().min(1, 'Display name is required').max(100),
  title: z.string().min(1, 'Title is required').max(150),
  location: z.string().max(100).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable().or(z.literal('')),

  // Status badges
  statusBadges: z.array(z.string().max(30)).max(5).default([]),

  // Language & Theme
  language: languageSchema.default('en'),
  themeColor: themeColorSchema.default('sapphire'),

  // Resume integration
  sourceResumeId: z.string().optional().nullable(),

  // CV settings
  enableDownloadCv: z.boolean().default(false),
  cvFileUrl: z.string().url('Invalid CV URL').optional().nullable().or(z.literal('')),
  cvResumeId: z.string().optional().nullable(),

  // CTAs
  ctaWhatsappNumber: z.string().max(20).optional().nullable(),
  ctaWhatsappMessage: z
    .string()
    .max(200)
    .optional()
    .nullable()
    .default('Hi! I saw your Seera profile and would like to connect.'),
  ctaPhoneNumber: z.string().max(20).optional().nullable(),
  ctaEmail: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  ctaEmailSubject: z.string().max(100).optional().nullable().default("Let's Connect"),
  ctaEmailBody: z.string().max(500).optional().nullable(),
  ctaLinkedinUrl: z.string().url('Invalid LinkedIn URL').optional().nullable().or(z.literal('')),
  enabledCtas: z.array(ctaTypeSchema).default(['WHATSAPP', 'EMAIL', 'LINKEDIN']),

  // Nested content
  highlights: z.array(highlightSchema).max(8).default([]),
  experiences: z.array(experienceSchema).max(10).default([]),
  projects: z.array(projectSchema).max(10).default([]),
  certificates: z.array(certificateSchema).max(10).default([]),
});

// Update profile schema - all fields optional except id
export const updateProfileSchema = createProfileSchema.partial().extend({
  id: z.string(),
});

// Publish profile schema
export const publishProfileSchema = z.object({
  id: z.string(),
});

// Password verification schema
export const verifyPasswordSchema = z.object({
  slug: z.string().min(1),
  accessCode: z.string().min(4).max(8),
});

// Analytics event schema
export const analyticsEventSchema = z.object({
  profileId: z.string().min(1),
  eventType: z.enum(['PAGE_VIEW', 'CTA_CLICK', 'PDF_DOWNLOAD']),
  ctaType: ctaTypeSchema.optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
  referrer: z.string().max(500).optional(),
});

// Generate from resume schema
export const generateFromResumeSchema = z.object({
  resumeId: z.string().min(1),
  slug: slugSchema.optional(),
});

// Type exports
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
export type HighlightInput = z.infer<typeof highlightSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type CertificateInput = z.infer<typeof certificateSchema>;
export type ProfileVisibility = z.infer<typeof visibilitySchema>;
export type ProfilePersona = z.infer<typeof personaSchema>;
export type ProfileTemplate = z.infer<typeof templateSchema>;
export type ProfileStatus = z.infer<typeof statusSchema>;
export type CTAType = z.infer<typeof ctaTypeSchema>;
export type ThemeColor = z.infer<typeof themeColorSchema>;
export type Language = z.infer<typeof languageSchema>;
