// Premium Color Themes for Seera AI Resume Templates
// 5 carefully curated color palettes

import type { ThemeId, ThemePalette } from '../resume-types';

export const THEMES: Record<ThemeId, ThemePalette> = {
  // Obsidian - Dark navy + gold luxury theme
  obsidian: {
    primary: '#1a1a2e',      // Deep navy
    secondary: '#16213e',    // Darker navy
    accent: '#d4af37',       // Gold
    text: '#1a1a2e',         // Dark text
    muted: '#64748b',        // Slate gray
    background: '#ffffff',   // White
    surface: '#f8fafc',      // Light gray
    border: '#e2e8f0',       // Border gray
  },

  // Sapphire - Navy + blue corporate theme
  sapphire: {
    primary: '#1e3a5f',      // Navy blue
    secondary: '#0f2847',    // Darker blue
    accent: '#60a5fa',       // Sky blue
    text: '#1e293b',         // Slate
    muted: '#64748b',        // Gray
    background: '#ffffff',   // White
    surface: '#f1f5f9',      // Light blue-gray
    border: '#cbd5e1',       // Border
  },

  // Emerald - Forest + mint growth theme
  emerald: {
    primary: '#064e3b',      // Forest green
    secondary: '#022c22',    // Dark green
    accent: '#34d399',       // Mint green
    text: '#1e293b',         // Dark slate
    muted: '#475569',        // Slate
    background: '#ffffff',   // White
    surface: '#f0fdf4',      // Mint tint
    border: '#d1fae5',       // Light green
  },

  // Graphite - Slate + coral modern theme
  graphite: {
    primary: '#374151',      // Graphite
    secondary: '#1f2937',    // Dark gray
    accent: '#f87171',       // Coral red
    text: '#111827',         // Near black
    muted: '#6b7280',        // Gray
    background: '#ffffff',   // White
    surface: '#f9fafb',      // Light gray
    border: '#e5e7eb',       // Border
  },

  // Ivory - Warm gray elegant theme
  ivory: {
    primary: '#44403c',      // Warm gray
    secondary: '#292524',    // Dark warm
    accent: '#a3a3a3',       // Medium gray
    text: '#1c1917',         // Stone dark
    muted: '#78716c',        // Stone
    background: '#fffbf5',   // Warm white
    surface: '#faf5f0',      // Cream
    border: '#e7e5e4',       // Stone border
  },
};

// Theme metadata for UI display
export const THEME_METADATA: Record<ThemeId, { name: { en: string; ar: string }; description: string }> = {
  obsidian: {
    name: { en: 'Obsidian', ar: 'أوبسيديان' },
    description: 'Luxury navy & gold',
  },
  sapphire: {
    name: { en: 'Sapphire', ar: 'ياقوت أزرق' },
    description: 'Corporate blue',
  },
  emerald: {
    name: { en: 'Emerald', ar: 'زمرد' },
    description: 'Fresh & growth',
  },
  graphite: {
    name: { en: 'Graphite', ar: 'جرافيت' },
    description: 'Modern & bold',
  },
  ivory: {
    name: { en: 'Ivory', ar: 'عاجي' },
    description: 'Warm & elegant',
  },
};

// Utility to get theme by ID
export function getTheme(themeId: ThemeId): ThemePalette {
  return THEMES[themeId] || THEMES.obsidian;
}

// Convert hex to RGB for jsPDF
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Get contrasting text color (white or black)
export function getContrastColor(hexColor: string): string {
  const { r, g, b } = hexToRgb(hexColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Get all theme IDs
export function getAllThemeIds(): ThemeId[] {
  return Object.keys(THEMES) as ThemeId[];
}
