// Unified Resume Types for Seera AI
// Single source of truth for all resume-related types

// ============================================
// Template & Theme Types
// ============================================

export type TemplateId =
  | 'prestige-executive'
  | 'nordic-minimal'
  | 'metropolitan-split'
  | 'classic-professional'
  | 'impact-modern';

export type ThemeId =
  | 'obsidian'
  | 'sapphire'
  | 'emerald'
  | 'graphite'
  | 'ivory';

export type LocaleId = 'en' | 'ar';

// ============================================
// Resume Data Types
// ============================================

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  photo?: string; // Base64 or URL
  seeraLinkSlug?: string;
  showSeeraLinkQr?: boolean;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  graduationDate: string;
  gpa: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  url: string;
  technologies: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialId: string;
  url?: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: 'Native' | 'Fluent' | 'Professional' | 'Intermediate' | 'Basic';
}

export interface ResumeSettings {
  showPhoto: boolean;
  showLinkedIn: boolean;
  showWebsite: boolean;
  dateFormat: 'MMM YYYY' | 'MM/YYYY' | 'YYYY';
  sectionOrder: string[];
  fontFamily: 'jakarta' | 'merriweather' | 'playfair';
}

// ============================================
// Main Resume Data Interface
// ============================================

export interface ResumeData {
  id: string;
  title: string;
  locale: LocaleId;
  template: TemplateId;
  theme: ThemeId;
  contact: ContactInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  languages: LanguageItem[];
  settings: ResumeSettings;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Template Configuration Types
// ============================================

export interface ThemePalette {
  primary: string;      // Main brand color
  secondary: string;    // Secondary/darker color
  accent: string;       // Highlight color
  text: string;         // Main text color
  muted: string;        // Secondary text color
  background: string;   // Background color
  surface: string;      // Card/surface color
  border: string;       // Border color
}

export interface TemplateMetadata {
  id: TemplateId;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  thumbnail: string;
  isPremium: boolean;
  features: string[];
  bestFor: string[];
}

export interface TemplateConfig {
  layout: 'single-column' | 'two-column' | 'sidebar-left' | 'sidebar-right';
  headerStyle: 'centered' | 'left-aligned' | 'split' | 'hero';
  sectionStyle: 'underline' | 'background' | 'border-left' | 'simple';
  spacing: {
    section: number;
    item: number;
    line: number;
  };
  typography: {
    nameSize: number;
    sectionHeaderSize: number;
    bodySize: number;
    smallSize: number;
  };
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// ============================================
// Default Values
// ============================================

export const DEFAULT_TEMPLATE: TemplateId = 'prestige-executive';
export const DEFAULT_THEME: ThemeId = 'obsidian';
export const DEFAULT_LOCALE: LocaleId = 'en';

export const DEFAULT_SETTINGS: ResumeSettings = {
  showPhoto: false,
  showLinkedIn: true,
  showWebsite: true,
  dateFormat: 'MMM YYYY',
  sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'],
  fontFamily: 'jakarta',
};

export const DEFAULT_CONTACT: ContactInfo = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  website: '',
  photo: '',
  seeraLinkSlug: '',
  showSeeraLinkQr: false,
};

// ============================================
// Factory Functions
// ============================================

export function createEmptyResume(title: string = 'Untitled Resume'): ResumeData {
  return {
    id: crypto.randomUUID(),
    title,
    locale: DEFAULT_LOCALE,
    template: DEFAULT_TEMPLATE,
    theme: DEFAULT_THEME,
    contact: { ...DEFAULT_CONTACT },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    settings: { ...DEFAULT_SETTINGS },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createExperienceItem(): ExperienceItem {
  return {
    id: crypto.randomUUID(),
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    bullets: [''],
  };
}

export function createEducationItem(): EducationItem {
  return {
    id: crypto.randomUUID(),
    institution: '',
    degree: '',
    field: '',
    location: '',
    graduationDate: '',
    gpa: '',
  };
}

export function createProjectItem(): ProjectItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    url: '',
    technologies: [],
  };
}

export function createCertificationItem(): CertificationItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    issuer: '',
    date: '',
    credentialId: '',
  };
}

export function createLanguageItem(): LanguageItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    proficiency: 'Professional',
  };
}

// ============================================
// ATS Score Calculator
// ============================================

export function calculateATSScore(resume: ResumeData): number {
  let score = 0;

  // Contact (15 points)
  if (resume.contact.fullName) score += 3;
  if (resume.contact.email) score += 3;
  if (resume.contact.phone) score += 3;
  if (resume.contact.location) score += 3;
  if (resume.contact.linkedin) score += 3;

  // Summary (15 points)
  if (resume.summary) {
    const words = resume.summary.split(/\s+/).length;
    if (words >= 30) score += 15;
    else if (words > 10) score += 10;
    else score += 5;
  }

  // Experience (30 points)
  if (resume.experience.length > 0) {
    score += Math.min(10, resume.experience.length * 4);
    const bullets = resume.experience.reduce((acc, exp) => acc + exp.bullets.filter(b => b.trim()).length, 0);
    score += Math.min(20, bullets * 2);
  }

  // Education (15 points)
  if (resume.education.length > 0) {
    score += 15;
  }

  // Skills (15 points)
  score += Math.min(15, resume.skills.length * 3);

  // Projects & Certs (10 points)
  if (resume.projects.length > 0) score += 5;
  if (resume.certifications.length > 0) score += 5;

  return Math.min(100, score);
}

// ============================================
// Utility Types
// ============================================

export type ResumeSection =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages';

export interface SectionConfig {
  id: ResumeSection;
  label: { en: string; ar: string };
  icon: string;
  required: boolean;
}

export const SECTION_CONFIGS: SectionConfig[] = [
  { id: 'contact', label: { en: 'Contact', ar: 'معلومات الاتصال' }, icon: 'User', required: true },
  { id: 'summary', label: { en: 'Summary', ar: 'الملخص' }, icon: 'FileText', required: false },
  { id: 'experience', label: { en: 'Experience', ar: 'الخبرة' }, icon: 'Briefcase', required: false },
  { id: 'education', label: { en: 'Education', ar: 'التعليم' }, icon: 'GraduationCap', required: false },
  { id: 'skills', label: { en: 'Skills', ar: 'المهارات' }, icon: 'Wrench', required: false },
  { id: 'projects', label: { en: 'Projects', ar: 'المشاريع' }, icon: 'FolderKanban', required: false },
  { id: 'certifications', label: { en: 'Certifications', ar: 'الشهادات' }, icon: 'Award', required: false },
  { id: 'languages', label: { en: 'Languages', ar: 'اللغات' }, icon: 'Languages', required: false },
];
