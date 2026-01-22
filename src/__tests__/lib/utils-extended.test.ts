/**
 * Comprehensive tests for utility functions - Seera AI Production Readiness
 * Tests all functions in src/lib/utils.ts
 */

import {
    cn,
    formatDate,
    formatDateShort,
    formatDateRange,
    slugify,
    generateId,
    truncate,
    capitalize,
    formatFileSize,
    getInitials,
    isValidEmail,
    isValidUrl,
    isValidPhone,
    getContrastColor,
    absoluteUrl,
    generateResumeFileName,
    parseResumeDate,
    calculateDuration,
    getErrorMessage,
} from '@/lib/utils';

describe('formatDate', () => {
    it('formats date with default locale', () => {
        const date = new Date('2024-06-15');
        const result = formatDate(date);
        expect(result).toContain('2024');
        expect(result).toContain('June') || expect(result).toContain('15');
    });

    it('formats string date', () => {
        const result = formatDate('2024-01-01');
        expect(result).toContain('2024');
    });

    it('formats with Arabic locale', () => {
        const date = new Date('2024-06-15');
        const result = formatDate(date, 'ar');
        expect(result).toBeTruthy();
    });
});

describe('formatDateShort', () => {
    it('returns short month format', () => {
        const date = new Date('2024-06-15');
        const result = formatDateShort(date);
        expect(result).toContain('2024');
    });

    it('works with string input', () => {
        const result = formatDateShort('2024-12-25');
        expect(result).toContain('2024');
    });
});

describe('formatDateRange', () => {
    it('formats range with end date', () => {
        const result = formatDateRange('2020-01-01', '2024-06-01');
        expect(result).toContain(' - ');
        expect(result).toContain('2020');
        expect(result).toContain('2024');
    });

    it('shows Present for null end date', () => {
        const result = formatDateRange('2020-01-01', null, 'en');
        expect(result).toContain('Present');
    });

    it('shows Arabic present for ar locale', () => {
        const result = formatDateRange('2020-01-01', null, 'ar');
        expect(result).toContain('الحاضر');
    });
});

describe('slugify', () => {
    it('converts text to lowercase slug', () => {
        expect(slugify('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
        expect(slugify('Hello! World?')).toBe('hello-world');
    });

    it('trims leading/trailing hyphens', () => {
        expect(slugify('  --Hello World--  ')).toBe('hello-world');
    });

    it('handles multiple spaces', () => {
        expect(slugify('Hello    World')).toBe('hello-world');
    });

    it('handles empty string', () => {
        expect(slugify('')).toBe('');
    });
});

describe('generateId', () => {
    it('generates unique IDs', () => {
        const id1 = generateId();
        const id2 = generateId();
        expect(id1).not.toBe(id2);
    });

    it('generates non-empty string', () => {
        const id = generateId();
        expect(id.length).toBeGreaterThan(0);
    });
});

describe('truncate', () => {
    it('truncates long strings with ellipsis', () => {
        expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    it('returns original if within limit', () => {
        expect(truncate('Hi', 10)).toBe('Hi');
    });

    it('handles exact length', () => {
        expect(truncate('Hello', 5)).toBe('Hello');
    });
});

describe('capitalize', () => {
    it('capitalizes first letter', () => {
        expect(capitalize('hello')).toBe('Hello');
    });

    it('handles single character', () => {
        expect(capitalize('a')).toBe('A');
    });

    it('handles empty string', () => {
        expect(capitalize('')).toBe('');
    });
});

describe('formatFileSize', () => {
    it('formats bytes', () => {
        expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('formats kilobytes', () => {
        expect(formatFileSize(1024)).toBe('1 KB');
    });

    it('formats megabytes', () => {
        expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    it('formats with decimals', () => {
        expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('handles zero', () => {
        expect(formatFileSize(0)).toBe('0 Bytes');
    });
});

describe('getInitials', () => {
    it('gets initials from full name', () => {
        expect(getInitials('John Doe')).toBe('JD');
    });

    it('handles single name', () => {
        expect(getInitials('John')).toBe('J');
    });

    it('limits to two characters', () => {
        expect(getInitials('John Michael Doe')).toBe('JM');
    });
});

describe('isValidEmail', () => {
    it('validates correct emails', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('test@')).toBe(false);
        expect(isValidEmail('@domain.com')).toBe(false);
        expect(isValidEmail('test @example.com')).toBe(false);
    });
});

describe('isValidUrl', () => {
    it('validates correct URLs', () => {
        expect(isValidUrl('https://example.com')).toBe(true);
        expect(isValidUrl('http://localhost:3000')).toBe(true);
        expect(isValidUrl('https://sub.domain.com/path?query=1')).toBe(true);
    });

    it('rejects invalid URLs', () => {
        expect(isValidUrl('not-a-url')).toBe(false);
        expect(isValidUrl('example.com')).toBe(false);
    });
});

describe('isValidPhone', () => {
    it('validates correct phone numbers', () => {
        expect(isValidPhone('+1234567890')).toBe(true);
        expect(isValidPhone('(555) 123-4567')).toBe(true);
        expect(isValidPhone('+966 50 123 4567')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
        expect(isValidPhone('123')).toBe(false);
        expect(isValidPhone('abc')).toBe(false);
    });
});

describe('getContrastColor', () => {
    it('returns black for light backgrounds', () => {
        expect(getContrastColor('#FFFFFF')).toBe('#000000');
        expect(getContrastColor('#F0F0F0')).toBe('#000000');
    });

    it('returns white for dark backgrounds', () => {
        expect(getContrastColor('#000000')).toBe('#ffffff');
        expect(getContrastColor('#333333')).toBe('#ffffff');
    });
});

describe('absoluteUrl', () => {
    it('creates absolute URL with path', () => {
        const result = absoluteUrl('/dashboard');
        expect(result).toContain('/dashboard');
    });
});

describe('generateResumeFileName', () => {
    it('generates filename with name and year', () => {
        const result = generateResumeFileName('John', 'Doe');
        expect(result).toContain('John');
        expect(result).toContain('Doe');
        expect(result).toMatch(/\d{4}$/);
    });

    it('includes role when provided', () => {
        const result = generateResumeFileName('John', 'Doe', 'Engineer');
        expect(result).toContain('Engineer');
    });

    it('sanitizes special characters', () => {
        const result = generateResumeFileName('John!', 'Doe@', 'Sr. Dev');
        expect(result).not.toContain('!');
        expect(result).not.toContain('@');
        expect(result).not.toContain('.');
    });
});

describe('parseResumeDate', () => {
    it('parses year only', () => {
        const result = parseResumeDate('2024');
        expect(result).toBeInstanceOf(Date);
    });

    it('parses month/year format', () => {
        const result = parseResumeDate('01/2024');
        expect(result).toBeInstanceOf(Date);
    });

    it('returns null for empty string', () => {
        expect(parseResumeDate('')).toBeNull();
    });

    it('returns null for invalid format', () => {
        expect(parseResumeDate('invalid')).toBeNull();
    });
});

describe('calculateDuration', () => {
    it('calculates months only', () => {
        const result = calculateDuration('2024-01-01', '2024-06-01');
        expect(result).toContain('mo');
    });

    it('calculates years', () => {
        const result = calculateDuration('2020-01-01', '2024-01-01');
        expect(result).toContain('yr');
    });

    it('calculates years and months', () => {
        const result = calculateDuration('2020-01-01', '2024-06-01');
        expect(result).toContain('yr');
        expect(result).toContain('mo');
    });

    it('uses current date when end is null', () => {
        const result = calculateDuration('2020-01-01');
        expect(result.length).toBeGreaterThan(0);
    });
});

describe('getErrorMessage', () => {
    it('extracts message from Error', () => {
        expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
    });

    it('returns string errors as-is', () => {
        expect(getErrorMessage('String error')).toBe('String error');
    });

    it('returns default for unknown types', () => {
        expect(getErrorMessage({ foo: 'bar' })).toBe('An unexpected error occurred');
        expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    });
});
