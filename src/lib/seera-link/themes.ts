/**
 * Seera Link Theme Colors
 * These match the resume themes and are used for profile customization
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  background: string;
  backgroundAlt: string;
  border: string;
}

export const themeColors: Record<string, ThemeColors> = {
  obsidian: {
    primary: 'hsl(0, 0%, 9%)',
    secondary: 'hsl(0, 0%, 96%)',
    accent: 'hsl(262, 83%, 58%)',
    text: 'hsl(0, 0%, 9%)',
    textMuted: 'hsl(0, 0%, 45%)',
    background: 'hsl(0, 0%, 100%)',
    backgroundAlt: 'hsl(0, 0%, 98%)',
    border: 'hsl(0, 0%, 90%)',
  },
  sapphire: {
    primary: 'hsl(217, 91%, 60%)',
    secondary: 'hsl(214, 32%, 91%)',
    accent: 'hsl(262, 83%, 58%)',
    text: 'hsl(217, 33%, 17%)',
    textMuted: 'hsl(217, 19%, 45%)',
    background: 'hsl(0, 0%, 100%)',
    backgroundAlt: 'hsl(214, 32%, 97%)',
    border: 'hsl(214, 32%, 91%)',
  },
  emerald: {
    primary: 'hsl(160, 84%, 39%)',
    secondary: 'hsl(152, 76%, 91%)',
    accent: 'hsl(160, 84%, 39%)',
    text: 'hsl(160, 50%, 15%)',
    textMuted: 'hsl(160, 19%, 45%)',
    background: 'hsl(0, 0%, 100%)',
    backgroundAlt: 'hsl(152, 76%, 97%)',
    border: 'hsl(152, 76%, 91%)',
  },
  ruby: {
    primary: 'hsl(0, 84%, 60%)',
    secondary: 'hsl(0, 86%, 97%)',
    accent: 'hsl(0, 84%, 60%)',
    text: 'hsl(0, 50%, 15%)',
    textMuted: 'hsl(0, 19%, 45%)',
    background: 'hsl(0, 0%, 100%)',
    backgroundAlt: 'hsl(0, 86%, 98%)',
    border: 'hsl(0, 86%, 92%)',
  },
  amber: {
    primary: 'hsl(38, 92%, 50%)',
    secondary: 'hsl(48, 96%, 89%)',
    accent: 'hsl(38, 92%, 50%)',
    text: 'hsl(38, 50%, 15%)',
    textMuted: 'hsl(38, 19%, 45%)',
    background: 'hsl(0, 0%, 100%)',
    backgroundAlt: 'hsl(48, 96%, 97%)',
    border: 'hsl(48, 96%, 85%)',
  },
  slate: {
    primary: 'hsl(215, 16%, 47%)',
    secondary: 'hsl(210, 40%, 96%)',
    accent: 'hsl(262, 83%, 58%)',
    text: 'hsl(215, 25%, 17%)',
    textMuted: 'hsl(215, 16%, 47%)',
    background: 'hsl(0, 0%, 100%)',
    backgroundAlt: 'hsl(210, 40%, 98%)',
    border: 'hsl(210, 40%, 90%)',
  },
};

/**
 * Get theme colors by name
 */
export function getThemeColors(themeName: string): ThemeColors {
  return themeColors[themeName] || themeColors.sapphire;
}

/**
 * Generate CSS variables for a theme
 */
export function getThemeCssVariables(themeName: string): Record<string, string> {
  const colors = getThemeColors(themeName);
  return {
    '--sl-primary': colors.primary,
    '--sl-secondary': colors.secondary,
    '--sl-accent': colors.accent,
    '--sl-text': colors.text,
    '--sl-text-muted': colors.textMuted,
    '--sl-background': colors.background,
    '--sl-background-alt': colors.backgroundAlt,
    '--sl-border': colors.border,
  };
}

/**
 * Theme display names for UI
 */
export const themeDisplayNames: Record<string, string> = {
  obsidian: 'Obsidian',
  sapphire: 'Sapphire',
  emerald: 'Emerald',
  ruby: 'Ruby',
  amber: 'Amber',
  slate: 'Slate',
};

/**
 * Template configurations
 */
export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  features: string[];
  previewImage: string;
}

export const templateConfigs: Record<string, TemplateConfig> = {
  MINIMAL: {
    id: 'MINIMAL',
    name: 'Minimal',
    description: 'Clean and simple design with focus on content',
    features: ['Clean typography', 'Subtle animations', 'Content-focused', 'Fast loading'],
    previewImage: '/images/templates/minimal-preview.png',
  },
  BOLD: {
    id: 'BOLD',
    name: 'Bold',
    description: 'Eye-catching design with prominent CTAs',
    features: ['Gradient accents', 'Large hero section', 'Animated elements', 'High contrast'],
    previewImage: '/images/templates/bold-preview.png',
  },
};

/**
 * Persona configurations with default settings
 */
export interface PersonaConfig {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  defaultCtas: string[];
  defaultBadges: string[];
  suggestedHighlights: string[];
}

export const personaConfigs: Record<string, PersonaConfig> = {
  JOBS: {
    id: 'JOBS',
    name: 'Job Seeker',
    nameAr: 'باحث عن عمل',
    description: 'Optimized for job applications and recruiter outreach',
    defaultCtas: ['EMAIL', 'LINKEDIN', 'DOWNLOAD_CV'],
    defaultBadges: ['Open to work'],
    suggestedHighlights: [
      'Years of experience in [industry]',
      'Led teams of [number] people',
      'Increased [metric] by [percentage]',
    ],
  },
  FREELANCE: {
    id: 'FREELANCE',
    name: 'Freelancer',
    nameAr: 'مستقل',
    description: 'Perfect for attracting freelance clients and projects',
    defaultCtas: ['WHATSAPP', 'EMAIL', 'LINKEDIN'],
    defaultBadges: ['Freelance available'],
    suggestedHighlights: [
      'Completed [number]+ projects',
      '[number]+ satisfied clients',
      'Specializing in [skill]',
    ],
  },
  NETWORKING: {
    id: 'NETWORKING',
    name: 'Networking',
    nameAr: 'التواصل المهني',
    description: 'Ideal for professional networking and connections',
    defaultCtas: ['LINKEDIN', 'EMAIL', 'WHATSAPP'],
    defaultBadges: ['Open to connect'],
    suggestedHighlights: [
      'Passionate about [topic]',
      'Speaker at [event/topic]',
      'Building [project/community]',
    ],
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom',
    nameAr: 'مخصص',
    description: 'Fully customizable profile for any purpose',
    defaultCtas: ['EMAIL', 'LINKEDIN'],
    defaultBadges: [],
    suggestedHighlights: [],
  },
};

/**
 * Get persona config by ID
 */
export function getPersonaConfig(personaId: string): PersonaConfig {
  return personaConfigs[personaId] || personaConfigs.CUSTOM;
}

/**
 * Available status badges
 */
export const statusBadgeOptions = [
  { id: 'open-to-work', label: 'Open to work', labelAr: 'متاح للعمل' },
  { id: 'freelance', label: 'Freelance available', labelAr: 'متاح للعمل الحر' },
  { id: 'remote', label: 'Remote only', labelAr: 'عن بُعد فقط' },
  { id: 'hybrid', label: 'Hybrid', labelAr: 'هجين' },
  { id: 'onsite', label: 'Onsite', labelAr: 'في الموقع' },
  { id: 'actively-looking', label: 'Actively looking', labelAr: 'أبحث بنشاط' },
  { id: 'casually-exploring', label: 'Casually exploring', labelAr: 'أستكشف' },
  { id: 'not-looking', label: 'Not looking', labelAr: 'غير متاح' },
  { id: 'consulting', label: 'Open to consulting', labelAr: 'متاح للاستشارات' },
  { id: 'speaking', label: 'Available for speaking', labelAr: 'متاح للتحدث' },
];

/**
 * Highlight icons
 */
export const highlightIcons = [
  { id: 'trophy', name: 'Trophy', icon: 'trophy' },
  { id: 'chart', name: 'Chart', icon: 'trending-up' },
  { id: 'users', name: 'Team', icon: 'users' },
  { id: 'briefcase', name: 'Briefcase', icon: 'briefcase' },
  { id: 'award', name: 'Award', icon: 'award' },
  { id: 'star', name: 'Star', icon: 'star' },
  { id: 'target', name: 'Target', icon: 'target' },
  { id: 'zap', name: 'Lightning', icon: 'zap' },
  { id: 'globe', name: 'Global', icon: 'globe' },
  { id: 'code', name: 'Code', icon: 'code' },
  { id: 'heart', name: 'Heart', icon: 'heart' },
  { id: 'check', name: 'Check', icon: 'check-circle' },
];
