/**
 * Font support for PDF generation
 *
 * For Arabic text support, we need to:
 * 1. Detect if text contains Arabic characters
 * 2. Use a font that supports Arabic (embedded as base64)
 * 3. Handle RTL text direction
 *
 * Note: jsPDF has limited RTL support. For complex Arabic layouts,
 * consider using html2pdf or a server-side PDF generator.
 */

// Regex to detect Arabic characters
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Check if a string contains Arabic characters
 */
export function containsArabic(text: string): boolean {
  return ARABIC_REGEX.test(text);
}

/**
 * Check if the resume has significant Arabic content
 */
export function hasArabicContent(resume: {
  contact: { fullName: string };
  summary?: string;
  experience: Array<{ company: string; position: string }>;
}): boolean {
  // Check key fields for Arabic text
  if (containsArabic(resume.contact.fullName)) return true;
  if (resume.summary && containsArabic(resume.summary)) return true;

  for (const exp of resume.experience) {
    if (containsArabic(exp.company) || containsArabic(exp.position)) {
      return true;
    }
  }

  return false;
}

/**
 * Reverse Arabic text for proper RTL display in jsPDF
 * jsPDF doesn't handle RTL natively, so we need to reverse the text
 */
export function prepareArabicText(text: string): string {
  if (!containsArabic(text)) return text;

  // For mixed Arabic/English text, we need more complex handling
  // For now, just reverse if it's primarily Arabic
  const arabicChars = (text.match(ARABIC_REGEX) || []).length;
  const totalChars = text.replace(/\s/g, '').length;

  // If more than 50% Arabic, reverse the string
  if (arabicChars / totalChars > 0.5) {
    return text.split('').reverse().join('');
  }

  return text;
}

/**
 * Get font family based on content
 * Returns 'helvetica' for Latin text, or the Arabic font name if needed
 */
export function getFontFamily(hasArabic: boolean): string {
  // For now, use helvetica for all text
  // Arabic font can be added later with base64 embedding
  return 'helvetica';
}

/**
 * Format text for PDF output
 * Handles Arabic text preparation if needed
 */
export function formatTextForPDF(text: string, isArabicMode: boolean): string {
  if (!isArabicMode || !containsArabic(text)) {
    return text;
  }

  // Prepare Arabic text for jsPDF
  return prepareArabicText(text);
}

// Section headers in Arabic
export const ARABIC_SECTION_HEADERS: Record<string, string> = {
  'SUMMARY': 'الملخص',
  'EXPERIENCE': 'الخبرات',
  'EDUCATION': 'التعليم',
  'SKILLS': 'المهارات',
  'PROJECTS': 'المشاريع',
  'CERTIFICATIONS': 'الشهادات',
  'LANGUAGES': 'اللغات',
  'CONTACT': 'التواصل',
};

/**
 * Get section header based on locale
 */
export function getSectionHeader(section: string, locale: 'en' | 'ar'): string {
  if (locale === 'ar' && ARABIC_SECTION_HEADERS[section]) {
    return ARABIC_SECTION_HEADERS[section];
  }
  return section;
}

/**
 * Format date for display
 */
export function formatDate(date: string, locale: 'en' | 'ar'): string {
  if (!date) return '';

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;

    return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
    });
  } catch {
    return date;
  }
}

/**
 * Format date range for display
 */
export function formatDateRange(
  startDate: string,
  endDate: string | null,
  current: boolean,
  locale: 'en' | 'ar'
): string {
  const start = formatDate(startDate, locale);

  if (current) {
    return locale === 'ar'
      ? `${start} - الحالي`
      : `${start} - Present`;
  }

  const end = endDate ? formatDate(endDate, locale) : '';
  return `${start} - ${end}`;
}
