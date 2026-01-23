import { passesEducationRequirements, scoreCandidate } from '@/lib/recruiter-matching';

const baseAnalysis = {
    mustHaveSkills: [],
    niceToHaveSkills: [],
    roleKeywords: [],
    yearsExpMin: null,
    yearsExpMax: null,
    languages: [],
    responsibilities: [],
    redFlags: [],
    summary: null,
    requiredDegreeLevel: null,
    preferredDegreeLevels: [],
    requiredFieldsOfStudy: [],
    preferredFieldsOfStudy: [],
    weights: {},
    modelInfo: {},
};

describe('recruiter matching education', () => {
    it('allows candidates when no education requirements are set', () => {
        const result = passesEducationRequirements({
            analysis: baseAnalysis,
            candidate: { highestDegreeLevel: null, normalizedFieldOfStudy: null },
        });
        expect(result).toBe(true);
    });

    it('filters candidates that do not meet required degree level', () => {
        const result = passesEducationRequirements({
            analysis: { ...baseAnalysis, requiredDegreeLevel: 'MASTER' },
            candidate: { highestDegreeLevel: 'BACHELOR', normalizedFieldOfStudy: 'computer_science' },
        });
        expect(result).toBe(false);
    });

    it('filters candidates that do not match required field of study', () => {
        const result = passesEducationRequirements({
            analysis: { ...baseAnalysis, requiredFieldsOfStudy: ['computer_science'] },
            candidate: { highestDegreeLevel: 'BACHELOR', normalizedFieldOfStudy: 'business' },
        });
        expect(result).toBe(false);
    });

    it('boosts candidates with related fields of study', () => {
        const result = scoreCandidate({
            analysis: { ...baseAnalysis, preferredFieldsOfStudy: ['engineering'] },
            candidate: {
                skills: [],
                summary: null,
                currentTitle: null,
                desiredRoles: [],
                yearsExperience: 2,
                normalizedFieldOfStudy: 'software_engineering',
                primaryFieldOfStudy: 'Software Engineering',
            },
            job: {},
        });
        expect(result.reasons.join(' ')).toMatch(/Software Engineering/);
    });

    it('does not break when candidate has no education data', () => {
        const result = scoreCandidate({
            analysis: baseAnalysis,
            candidate: {
                skills: ['JavaScript'],
                summary: null,
                currentTitle: null,
                desiredRoles: [],
                yearsExperience: 1,
            },
            job: {},
        });
        expect(result.score).toBeGreaterThan(0);
    });
});
