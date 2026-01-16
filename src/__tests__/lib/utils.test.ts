import { cn } from '@/lib/utils';

describe('cn utility function', () => {
    it('merges class names correctly', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
        expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
    });

    it('handles undefined and null values', () => {
        expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });

    it('handles empty strings', () => {
        expect(cn('foo', '', 'bar')).toBe('foo bar');
    });

    it('handles arrays of class names', () => {
        expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
    });

    it('handles objects with boolean values', () => {
        expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('merges Tailwind classes correctly (last wins)', () => {
        // tailwind-merge should keep the last conflicting class
        expect(cn('p-4', 'p-2')).toBe('p-2');
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('handles complex class combinations', () => {
        expect(cn(
            'base-class',
            true && 'conditional-class',
            false && 'hidden-class',
            { 'object-true': true, 'object-false': false },
            ['array-class-1', 'array-class-2']
        )).toBe('base-class conditional-class object-true array-class-1 array-class-2');
    });

    it('handles responsive Tailwind classes', () => {
        expect(cn('text-sm', 'md:text-base', 'lg:text-lg')).toBe('text-sm md:text-base lg:text-lg');
    });

    it('handles state variants', () => {
        expect(cn('bg-white', 'hover:bg-gray-100', 'focus:ring-2')).toBe('bg-white hover:bg-gray-100 focus:ring-2');
    });
});
