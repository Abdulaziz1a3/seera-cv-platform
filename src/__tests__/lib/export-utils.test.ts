import { createEmptyResume } from '@/lib/resume-schema';
import { generateFileName, generatePdfHtml, resolveDocxTemplateConfig } from '@/lib/export/index';

describe('generateFileName', () => {
    it('sanitizes names and adds year', () => {
        const fileName = generateFileName('Jane!', 'Doe?', 'QA Lead', 'pdf');
        expect(fileName).toMatch(/^Jane_Doe_QALead_\d{4}\.pdf$/);
    });

    it('handles missing role', () => {
        const fileName = generateFileName('A', 'B', undefined, 'txt');
        expect(fileName).toMatch(/^A_B_\d{4}\.txt$/);
    });
});

describe('resolveDocxTemplateConfig', () => {
    it('falls back to the default template for unknown IDs', () => {
        const config = resolveDocxTemplateConfig('unknown-template');
        expect(config.id).toBe('prestige-executive');
    });

    it('returns usable font and margin values', () => {
        const config = resolveDocxTemplateConfig('classic-professional');
        expect(config.fontFamily).toBeTruthy();
        expect(config.fontSize.name).toBeGreaterThan(0);
        expect(config.margins.top).toBeGreaterThanOrEqual(0);
    });
});

describe('generatePdfHtml', () => {
    it('renders a template stylesheet with margins', () => {
        const resume = createEmptyResume('Test Resume');
        const html = generatePdfHtml(resume, 'classic-professional', 'en');
        expect(html).toContain('@page');
        expect(html).toMatch(/margin:\s*[\d.]+in/);
    });
});
