import { parseResumeDate } from '@/lib/utils';

export type DegreeLevel = 'DIPLOMA' | 'BACHELOR' | 'MASTER' | 'PHD';
export type ExperienceBand = 'STUDENT_FRESH' | 'JUNIOR' | 'MID' | 'SENIOR';

type EducationItem = {
    degree?: string | null;
    field?: string | null;
    endDate?: string | null;
    graduationDate?: string | null;
    graduationYear?: string | null;
};

type ExperienceItem = {
    position?: string | null;
    company?: string | null;
};

type CertificationItem = {
    name?: string | null;
    issuer?: string | null;
};

const DEGREE_RANK: Record<DegreeLevel, number> = {
    DIPLOMA: 1,
    BACHELOR: 2,
    MASTER: 3,
    PHD: 4,
};

const DEGREE_PATTERNS: Array<{ level: DegreeLevel; patterns: RegExp[] }> = [
    { level: 'PHD', patterns: [/ph\.?d/i, /doctorate/i, /\bdoctoral\b/i] },
    { level: 'MASTER', patterns: [/master/i, /\bm\.sc\b/i, /\bmsc\b/i, /\bmba\b/i] },
    { level: 'BACHELOR', patterns: [/bachelor/i, /\bb\.sc\b/i, /\bbs\b/i, /\bba\b/i] },
    { level: 'DIPLOMA', patterns: [/diploma/i, /associate/i, /foundation/i] },
];

const FIELD_SYNONYMS: Record<string, string> = {
    'cs': 'computer_science',
    'comp sci': 'computer_science',
    'computer science': 'computer_science',
    'software engineering': 'software_engineering',
    'software engineer': 'software_engineering',
    'information systems': 'information_systems',
    'information system': 'information_systems',
    'information technology': 'information_technology',
    'it': 'information_technology',
    'business administration': 'business_administration',
    'business admin': 'business_administration',
    'business': 'business',
    'economics': 'economics',
    'engineering': 'engineering',
    'electrical engineering': 'electrical_engineering',
    'mechanical engineering': 'mechanical_engineering',
    'civil engineering': 'civil_engineering',
    'industrial engineering': 'industrial_engineering',
    'computer engineering': 'computer_engineering',
    'data science': 'data_science',
    'artificial intelligence': 'artificial_intelligence',
    'ai': 'artificial_intelligence',
    'machine learning': 'machine_learning',
    'information security': 'information_security',
    'cyber security': 'cyber_security',
    'cybersecurity': 'cyber_security',
    'accounting': 'accounting',
    'finance': 'finance',
    'marketing': 'marketing',
    'human resources': 'human_resources',
};

function slugifyField(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\s/g, '_');
}

export function normalizeFieldOfStudy(value?: string | null): string | null {
    if (!value) return null;
    const cleaned = value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) return null;
    return FIELD_SYNONYMS[cleaned] || slugifyField(cleaned);
}

export function inferDegreeLevel(value?: string | null): DegreeLevel | null {
    if (!value) return null;
    for (const entry of DEGREE_PATTERNS) {
        if (entry.patterns.some((pattern) => pattern.test(value))) {
            return entry.level;
        }
    }
    return null;
}

export function formatDegreeLevel(level: DegreeLevel): string {
    switch (level) {
        case 'DIPLOMA':
            return 'Diploma';
        case 'BACHELOR':
            return 'Bachelor';
        case 'MASTER':
            return 'Master';
        case 'PHD':
            return 'PhD';
        default:
            return level;
    }
}

export function formatExperienceBand(level: ExperienceBand): string {
    switch (level) {
        case 'STUDENT_FRESH':
            return 'Student / Fresh Graduate';
        case 'JUNIOR':
            return 'Junior';
        case 'MID':
            return 'Mid-Level';
        case 'SENIOR':
            return 'Senior';
        default:
            return level;
    }
}

export function deriveEducationProfile(educationItems: EducationItem[]) {
    let highestDegreeLevel: DegreeLevel | null = null;
    let primaryFieldOfStudy: string | null = null;
    let graduationDate: Date | null = null;

    for (const item of educationItems) {
        const level = inferDegreeLevel(item.degree || '');
        if (level && (!highestDegreeLevel || DEGREE_RANK[level] > DEGREE_RANK[highestDegreeLevel])) {
            highestDegreeLevel = level;
            primaryFieldOfStudy = item.field || primaryFieldOfStudy;
        }

        const parsed = parseResumeDate(
            item.endDate || item.graduationDate || item.graduationYear || ''
        );
        if (parsed && (!graduationDate || parsed.getTime() > graduationDate.getTime())) {
            graduationDate = parsed;
        }

        if (!primaryFieldOfStudy && item.field) {
            primaryFieldOfStudy = item.field;
        }
    }

    const normalizedFieldOfStudy = normalizeFieldOfStudy(primaryFieldOfStudy);
    const graduationYear = graduationDate ? graduationDate.getFullYear() : extractYearFromItems(educationItems);

    return {
        highestDegreeLevel,
        primaryFieldOfStudy: primaryFieldOfStudy || null,
        normalizedFieldOfStudy,
        graduationDate,
        graduationYear,
    };
}

export function deriveExperienceIndicators(params: {
    experienceItems: ExperienceItem[];
    projectItems: unknown[];
    educationItems: EducationItem[];
    certificationItems: CertificationItem[];
    yearsExperience: number | null;
    graduationDate: Date | null;
}) {
    const internshipRegex = /\b(intern|internship|trainee|co-?op)\b/i;
    const freelanceRegex = /\b(freelance|contract|contractor|part[-\s]?time|consultant)\b/i;
    const trainingRegex = /\b(bootcamp|nanodegree|training|course|academy|program)\b/i;

    const internshipCount = params.experienceItems.filter((item) =>
        internshipRegex.test(`${item.position || ''} ${item.company || ''}`)
    ).length;

    const freelanceCount = params.experienceItems.filter((item) =>
        freelanceRegex.test(`${item.position || ''} ${item.company || ''}`)
    ).length;

    const projectCount = params.projectItems.length;

    const hasTraining = [...params.educationItems, ...params.certificationItems].some((item) =>
        trainingRegex.test(`${(item as any).degree || ''} ${(item as any).field || ''} ${(item as any).name || ''} ${(item as any).issuer || ''}`)
    );

    const experienceBand = getExperienceBand(params.yearsExperience, params.graduationDate);

    return {
        internshipCount,
        projectCount,
        freelanceCount,
        trainingFlag: hasTraining,
        experienceBand,
    };
}

export function getExperienceBand(
    yearsExperience: number | null,
    graduationDate: Date | null
): ExperienceBand | null {
    if (yearsExperience === null || Number.isNaN(yearsExperience)) {
        if (graduationDate) {
            const months = (Date.now() - graduationDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4);
            if (months <= 12) return 'STUDENT_FRESH';
        }
        return null;
    }

    if (yearsExperience <= 1) return 'STUDENT_FRESH';
    if (yearsExperience <= 3) return 'JUNIOR';
    if (yearsExperience <= 6) return 'MID';
    return 'SENIOR';
}

function extractYearFromItems(items: EducationItem[]): number | null {
    for (const item of items) {
        const values = [item.endDate, item.graduationDate, item.graduationYear];
        for (const value of values) {
            const year = extractYear(value || '');
            if (year) return year;
        }
    }
    return null;
}

function extractYear(value: string): number | null {
    const match = value.match(/(19|20)\d{2}/);
    if (!match) return null;
    return Number(match[0]);
}
