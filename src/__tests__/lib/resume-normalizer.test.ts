import { mapResumeRecordToResumeData } from '@/lib/resume-normalizer';

describe('mapResumeRecordToResumeData', () => {
    it('normalizes summary and bullets', () => {
        const resume = {
            id: 'resume-1',
            title: 'Sample',
            language: 'en' as const,
            contact: {
                fullName: 'Jane Doe',
                email: 'jane@example.com',
                phone: '123',
            },
            summary: { content: 'Hello summary' },
            experience: {
                items: [
                    {
                        id: 'exp-1',
                        position: 'Engineer',
                        company: 'Acme',
                        bullets: [
                            { id: 'b1', content: 'Did a thing' },
                            'Second bullet',
                        ],
                    },
                ],
            },
        };

        const normalized = mapResumeRecordToResumeData(resume);
        expect(normalized.summary).toBe('Hello summary');
        expect(normalized.experience[0].bullets).toEqual(['Did a thing', 'Second bullet']);
    });

    it('fills missing arrays with defaults', () => {
        const resume = {
            id: 'resume-2',
            title: 'Empty',
            contact: {
                fullName: 'John Doe',
                email: 'john@example.com',
            },
        };

        const normalized = mapResumeRecordToResumeData(resume);
        expect(normalized.experience).toEqual([]);
        expect(normalized.education).toEqual([]);
        expect(normalized.skills).toEqual([]);
    });
});
