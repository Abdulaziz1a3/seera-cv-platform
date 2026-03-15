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

  // Crimson - Deep red corporate theme
  crimson: {
    primary: '#7f1d1d',      // Dark crimson
    secondary: '#450a0a',    // Deeper red
    accent: '#ef4444',       // Bright red
    text: '#1c1917',         // Warm dark
    muted: '#78716c',        // Stone
    background: '#ffffff',   // White
    surface: '#fff5f5',      // Very light rose
    border: '#fecaca',       // Light red
  },

  // Midnight - Deep indigo sophisticated theme
  midnight: {
    primary: '#1e1b4b',      // Deep indigo
    secondary: '#0f0a3c',    // Darker indigo
    accent: '#818cf8',       // Indigo-400
    text: '#1e1b4b',         // Indigo text
    muted: '#6b7280',        // Gray
    background: '#ffffff',   // White
    surface: '#f5f3ff',      // Light violet
    border: '#ddd6fe',       // Violet-200
  },

  // Sage - Natural sage green theme
  sage: {
    primary: '#2d4a22',      // Deep sage green
    secondary: '#1a2e13',    // Darker green
    accent: '#65a30d',       // Lime-600
    text: '#1a2e13',         // Dark green
    muted: '#6b7280',        // Gray
    background: '#ffffff',   // White
    surface: '#f0fdf4',      // Mint tint
    border: '#bbf7d0',       // Green-200
  },

  // Terra - Warm terracotta earth theme
  terra: {
    primary: '#7c2d12',      // Terracotta
    secondary: '#431407',    // Deeper terracotta
    accent: '#fb923c',       // Orange-400
    text: '#292524',         // Warm dark
    muted: '#78716c',        // Stone
    background: '#fffbf5',   // Warm white
    surface: '#fff7ed',      // Warm cream
    border: '#fed7aa',       // Orange-200
  },

  // Pearl - Sophisticated violet-pearl theme
  pearl: {
    primary: '#312e81',      // Indigo-900
    secondary: '#1e1b4b',    // Indigo-950
    accent: '#a78bfa',       // Violet-400
    text: '#1e293b',         // Slate-800
    muted: '#64748b',        // Slate-500
    background: '#ffffff',   // White
    surface: '#f8f7ff',      // Lavender tint
    border: '#e9d5ff',       // Violet-200
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
  crimson: {
    name: { en: 'Crimson', ar: 'قرمزي' },
    description: 'Bold & striking',
  },
  midnight: {
    name: { en: 'Midnight', ar: 'منتصف الليل' },
    description: 'Deep & sophisticated',
  },
  sage: {
    name: { en: 'Sage', ar: 'أخضر حكيم' },
    description: 'Natural & fresh',
  },
  terra: {
    name: { en: 'Terra', ar: 'تيرا' },
    description: 'Warm & earthy',
  },
  pearl: {
    name: { en: 'Pearl', ar: 'لؤلؤي' },
    description: 'Premium & refined',
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
