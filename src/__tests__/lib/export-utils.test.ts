import { generateFileName } from '@/lib/export/index';

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
