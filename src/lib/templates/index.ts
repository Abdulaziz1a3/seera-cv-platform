// Template Engine for Seera AI
// Main entry point for all template operations

import type { TemplateId, TemplateMetadata, TemplateConfig, ThemeId } from '../resume-types';

export * from './themes';

// ============================================
// Template Metadata
// ============================================

export const TEMPLATES: Record<TemplateId, TemplateMetadata> = {
  'prestige-executive': {
    id: 'prestige-executive',
    name: { en: 'Prestige Executive', ar: 'المدير التنفيذي' },
    description: {
      en: 'Luxury corporate design with bold name header and gold accents',
      ar: 'تصميم فاخر للشركات مع رأس اسم بارز ولمسات ذهبية',
    },
    thumbnail: '/templates/prestige-executive.png',
    isPremium: false,
    features: ['Clean sections', 'Gold accents', 'Professional hierarchy'],
    bestFor: ['Senior roles', 'Management', 'Corporate'],
  },
  'nordic-minimal': {
    id: 'nordic-minimal',
    name: { en: 'Nordic Minimal', ar: 'الشمالي المبسط' },
    description: {
      en: 'Ultra-clean Scandinavian design with generous white space',
      ar: 'تصميم اسكندنافي فائق النظافة مع مساحة بيضاء واسعة',
    },
    thumbnail: '/templates/nordic-minimal.png',
    isPremium: false,
    features: ['Minimalist', 'White space', 'Elegant typography'],
    bestFor: ['Design', 'Tech', 'Modern companies'],
  },
  'metropolitan-split': {
    id: 'metropolitan-split',
    name: { en: 'Metropolitan Split', ar: 'المتروبوليتان المقسم' },
    description: {
      en: 'Two-column layout with dark sidebar and photo support',
      ar: 'تخطيط عمودين مع شريط جانبي داكن ودعم للصور',
    },
    thumbnail: '/templates/metropolitan-split.png',
    isPremium: false,
    features: ['Photo support', 'Sidebar skills', 'Contact icons'],
    bestFor: ['Creative professionals', 'Consultants'],
  },
  'classic-professional': {
    id: 'classic-professional',
    name: { en: 'Classic Professional', ar: 'الكلاسيكي المحترف' },
    description: {
      en: 'Traditional single-column layout optimized for ATS systems',
      ar: 'تخطيط تقليدي عمود واحد محسن لأنظمة ATS',
    },
    thumbnail: '/templates/classic-professional.png',
    isPremium: false,
    features: ['ATS-optimized', 'Clear structure', 'Traditional'],
    bestFor: ['Traditional industries', 'ATS systems', 'Banks'],
  },
  'impact-modern': {
    id: 'impact-modern',
    name: { en: 'Impact Modern', ar: 'التأثير الحديث' },
    description: {
      en: 'Bold hero header with timeline experience and skill tags',
      ar: 'رأس بطولي جريء مع تجربة زمنية ووسوم المهارات',
    },
    thumbnail: '/templates/impact-modern.png',
    isPremium: false,
    features: ['Hero header', 'Timeline style', 'Skill tags'],
    bestFor: ['Tech', 'Startups', 'Dynamic roles'],
  },
};

// ============================================
// Template Configurations
// ============================================

export const TEMPLATE_CONFIGS: Record<TemplateId, TemplateConfig> = {
  'prestige-executive': {
    layout: 'single-column',
    headerStyle: 'left-aligned',
    sectionStyle: 'underline',
    spacing: { section: 12, item: 6, line: 4 },
    typography: { nameSize: 28, sectionHeaderSize: 12, bodySize: 10, smallSize: 9 },
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
  },
  'nordic-minimal': {
    layout: 'single-column',
    headerStyle: 'left-aligned',
    sectionStyle: 'simple',
    spacing: { section: 16, item: 8, line: 5 },
    typography: { nameSize: 32, sectionHeaderSize: 10, bodySize: 10, smallSize: 9 },
    margins: { top: 25, bottom: 25, left: 25, right: 25 },
  },
  'metropolitan-split': {
    layout: 'sidebar-left',
    headerStyle: 'split',
    sectionStyle: 'border-left',
    spacing: { section: 10, item: 5, line: 4 },
    typography: { nameSize: 24, sectionHeaderSize: 11, bodySize: 9.5, smallSize: 8.5 },
    margins: { top: 0, bottom: 0, left: 0, right: 15 },
  },
  'classic-professional': {
    layout: 'single-column',
    headerStyle: 'centered',
    sectionStyle: 'background',
    spacing: { section: 10, item: 5, line: 4 },
    typography: { nameSize: 24, sectionHeaderSize: 11, bodySize: 10, smallSize: 9 },
    margins: { top: 18, bottom: 18, left: 18, right: 18 },
  },
  'impact-modern': {
    layout: 'single-column',
    headerStyle: 'hero',
    sectionStyle: 'border-left',
    spacing: { section: 12, item: 6, line: 4 },
    typography: { nameSize: 36, sectionHeaderSize: 12, bodySize: 10, smallSize: 9 },
    margins: { top: 0, bottom: 20, left: 20, right: 20 },
  },
};

// ============================================
// Section Headers (Localized)
// ============================================

export const SECTION_HEADERS = {
  summary: { en: 'PROFESSIONAL SUMMARY', ar: 'الملخص المهني' },
  experience: { en: 'PROFESSIONAL EXPERIENCE', ar: 'الخبرة المهنية' },
  education: { en: 'EDUCATION', ar: 'التعليم' },
  skills: { en: 'SKILLS', ar: 'المهارات' },
  projects: { en: 'PROJECTS', ar: 'المشاريع' },
  certifications: { en: 'CERTIFICATIONS', ar: 'الشهادات' },
  languages: { en: 'LANGUAGES', ar: 'اللغات' },
  contact: { en: 'CONTACT', ar: 'التواصل' },
};

// ============================================
// Utility Functions
// ============================================

export function getTemplate(templateId: TemplateId): TemplateMetadata {
  return TEMPLATES[templateId] || TEMPLATES['prestige-executive'];
}

export function getTemplateConfig(templateId: TemplateId): TemplateConfig {
  return TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS['prestige-executive'];
}

export function getAllTemplateIds(): TemplateId[] {
  return Object.keys(TEMPLATES) as TemplateId[];
}

export function getAllTemplates(): TemplateMetadata[] {
  return Object.values(TEMPLATES);
}

export function getSectionHeader(section: string, locale: 'en' | 'ar'): string {
  const headers = SECTION_HEADERS as Record<string, { en: string; ar: string }>;
  return headers[section]?.[locale] || section.toUpperCase();
}

// Date formatting
export function formatDate(dateStr: string, locale: 'en' | 'ar' = 'en', format: string = 'MMM YYYY'): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    if (format === 'MMM YYYY') {
      return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        year: 'numeric',
      });
    } else if (format === 'MM/YYYY') {
      return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        month: '2-digit',
        year: 'numeric',
      });
    } else {
      return date.getFullYear().toString();
    }
  } catch {
    return dateStr;
  }
}

// Present text for current positions
export function getPresentText(locale: 'en' | 'ar'): string {
  return locale === 'ar' ? 'حتى الآن' : 'Present';
}
