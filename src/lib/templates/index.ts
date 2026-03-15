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
    name: { en: 'Prestige Executive', ar: 'هيبة تنفيذية' },
    description: {
      en: 'Luxury corporate design with bold name header and gold accents',
      ar: 'تصميم مؤسسي فاخر مع عنوان اسم بارز ولمسات ذهبية',
    },
    thumbnail: '/templates/prestige-executive.png',
    isPremium: false,
    features: ['Clean sections', 'Gold accents', 'Professional hierarchy'],
    bestFor: ['Senior roles', 'Management', 'Corporate'],
  },
  'nordic-minimal': {
    id: 'nordic-minimal',
    name: { en: 'Nordic Minimal', ar: 'الشمالي البسيط' },
    description: {
      en: 'Ultra-clean Scandinavian design with generous white space',
      ar: 'تصميم اسكندنافي شديد النظافة مع مساحات بيضاء واسعة',
    },
    thumbnail: '/templates/nordic-minimal.png',
    isPremium: false,
    features: ['Minimalist', 'White space', 'Elegant typography'],
    bestFor: ['Design', 'Tech', 'Modern companies'],
  },
  'metropolitan-split': {
    id: 'metropolitan-split',
    name: { en: 'Metropolitan Split', ar: 'المتروبوليتان المقسّم' },
    description: {
      en: 'Two-column layout with dark sidebar and photo support',
      ar: 'تنسيق بعمودين مع شريط جانبي داكن ودعم للصورة',
    },
    thumbnail: '/templates/metropolitan-split.png',
    isPremium: false,
    features: ['Photo support', 'Sidebar skills', 'Contact icons'],
    bestFor: ['Creative professionals', 'Consultants'],
  },
  'classic-professional': {
    id: 'classic-professional',
    name: { en: 'Classic Professional', ar: 'الكلاسيكي الاحترافي' },
    description: {
      en: 'Traditional single-column layout optimized for ATS systems',
      ar: 'تنسيق تقليدي بعمود واحد محسّن لأنظمة ATS',
    },
    thumbnail: '/templates/classic-professional.png',
    isPremium: false,
    features: ['ATS-optimized', 'Clear structure', 'Traditional'],
    bestFor: ['Traditional industries', 'ATS systems', 'Banks'],
  },
  'impact-modern': {
    id: 'impact-modern',
    name: { en: 'Impact Modern', ar: 'التأثير العصري' },
    description: {
      en: 'Bold hero header with timeline experience and skill tags',
      ar: 'عنوان جريء مع تسلسل خبرة وعلامات مهارات',
    },
    thumbnail: '/templates/impact-modern.png',
    isPremium: false,
    features: ['Hero header', 'Timeline style', 'Skill tags'],
    bestFor: ['Tech', 'Startups', 'Dynamic roles'],
  },

  'azure-sidebar': {
    id: 'azure-sidebar',
    name: { en: 'Azure Sidebar', ar: 'الشريط الجانبي الأزرق' },
    description: {
      en: 'Clean right-sidebar layout with dedicated contact and skills panel',
      ar: 'تخطيط نظيف بشريط جانبي للمهارات ومعلومات التواصل',
    },
    thumbnail: '/templates/azure-sidebar.png',
    isPremium: true,
    features: ['Right sidebar', 'Skills panel', 'Clean typography'],
    bestFor: ['Tech', 'Finance', 'Consulting'],
  },

  'crimson-bold': {
    id: 'crimson-bold',
    name: { en: 'Crimson Bold', ar: 'الأحمر الجريء' },
    description: {
      en: 'Full-bleed header with bold name and creative two-column body',
      ar: 'رأسية كاملة الاتساع مع اسم بارز وهيكل إبداعي بعمودين',
    },
    thumbnail: '/templates/crimson-bold.png',
    isPremium: true,
    features: ['Full-bleed header', 'Bold typography', 'Two-column body'],
    bestFor: ['Creative', 'Marketing', 'Agencies'],
  },

  'sage-academic': {
    id: 'sage-academic',
    name: { en: 'Sage Academic', ar: 'الأكاديمي الحكيم' },
    description: {
      en: 'Scholarly single-column layout with elegant centered header and refined dividers',
      ar: 'تخطيط أكاديمي بعمود واحد مع رأسية مركزية أنيقة وفواصل راقية',
    },
    thumbnail: '/templates/sage-academic.png',
    isPremium: true,
    features: ['Scholarly style', 'Centered header', 'Elegant dividers'],
    bestFor: ['Academia', 'Research', 'Education'],
  },

  'terra-tech': {
    id: 'terra-tech',
    name: { en: 'Terra Tech', ar: 'تيرا تك' },
    description: {
      en: 'Tech-focused split header with skill pill chips and compact experience timeline',
      ar: 'رأسية مقسمة تقنية مع رقاقات مهارات وجدول خبرة مضغوط',
    },
    thumbnail: '/templates/terra-tech.png',
    isPremium: true,
    features: ['Split header', 'Pill skill chips', 'Compact layout'],
    bestFor: ['Software Engineers', 'Data Scientists', 'DevOps'],
  },

  'pearl-executive': {
    id: 'pearl-executive',
    name: { en: 'Pearl Executive', ar: 'اللؤلؤي التنفيذي' },
    description: {
      en: 'Ultra-premium layout with name-divider-contact header and sophisticated section styling',
      ar: 'تخطيط فاخر مع رأسية من الاسم والفاصل ومعلومات التواصل',
    },
    thumbnail: '/templates/pearl-executive.png',
    isPremium: true,
    features: ['Premium feel', 'Vertical divider header', 'Executive hierarchy'],
    bestFor: ['C-Suite', 'Directors', 'Senior Executives'],
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
  'azure-sidebar': {
    layout: 'sidebar-right',
    headerStyle: 'left-aligned',
    sectionStyle: 'simple',
    spacing: { section: 10, item: 5, line: 4 },
    typography: { nameSize: 26, sectionHeaderSize: 9, bodySize: 9.5, smallSize: 8.5 },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  'crimson-bold': {
    layout: 'two-column',
    headerStyle: 'hero',
    sectionStyle: 'simple',
    spacing: { section: 10, item: 5, line: 4 },
    typography: { nameSize: 30, sectionHeaderSize: 10, bodySize: 9.5, smallSize: 8.5 },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  'sage-academic': {
    layout: 'single-column',
    headerStyle: 'centered',
    sectionStyle: 'underline',
    spacing: { section: 14, item: 7, line: 5 },
    typography: { nameSize: 28, sectionHeaderSize: 10, bodySize: 10, smallSize: 9 },
    margins: { top: 22, bottom: 22, left: 22, right: 22 },
  },
  'terra-tech': {
    layout: 'single-column',
    headerStyle: 'split',
    sectionStyle: 'border-left',
    spacing: { section: 11, item: 5, line: 4 },
    typography: { nameSize: 24, sectionHeaderSize: 10, bodySize: 9.5, smallSize: 8.5 },
    margins: { top: 18, bottom: 18, left: 18, right: 18 },
  },
  'pearl-executive': {
    layout: 'single-column',
    headerStyle: 'split',
    sectionStyle: 'underline',
    spacing: { section: 12, item: 6, line: 4 },
    typography: { nameSize: 30, sectionHeaderSize: 11, bodySize: 10, smallSize: 9 },
    margins: { top: 20, bottom: 20, left: 22, right: 22 },
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
  contact: { en: 'CONTACT', ar: 'معلومات التواصل' },
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
