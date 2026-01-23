import {
    deriveEducationProfile,
    getExperienceBand,
    inferDegreeLevel,
    normalizeFieldOfStudy,
} from '@/lib/education-utils';

describe('education utils', () => {
    it('normalizes field of study with synonyms', () => {
        expect(normalizeFieldOfStudy('Computer Science')).toBe('computer_science');
        expect(normalizeFieldOfStudy('CS')).toBe('computer_science');
        expect(normalizeFieldOfStudy('Software Engineering')).toBe('software_engineering');
    });

    it('infers degree levels', () => {
        expect(inferDegreeLevel('Bachelor of Science')).toBe('BACHELOR');
        expect(inferDegreeLevel('MSc Computer Science')).toBe('MASTER');
        expect(inferDegreeLevel('PhD')).toBe('PHD');
        expect(inferDegreeLevel('Diploma')).toBe('DIPLOMA');
    });

    it('derives education profile from items', () => {
        const result = deriveEducationProfile([
            { degree: 'Bachelor', field: 'Computer Science', endDate: '2022' },
        ]);
        expect(result.highestDegreeLevel).toBe('BACHELOR');
        expect(result.normalizedFieldOfStudy).toBe('computer_science');
        expect(result.graduationYear).toBe(2022);
    });

    it('calculates experience band', () => {
        expect(getExperienceBand(0, null)).toBe('STUDENT_FRESH');
        expect(getExperienceBand(2, null)).toBe('JUNIOR');
        expect(getExperienceBand(4, null)).toBe('MID');
        expect(getExperienceBand(8, null)).toBe('SENIOR');
    });
});
