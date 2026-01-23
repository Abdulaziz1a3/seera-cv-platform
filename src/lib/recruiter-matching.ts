import { aiClient } from '@/lib/ai';
import { logger } from '@/lib/logger';
import {
    DegreeLevel,
    formatDegreeLevel,
    inferDegreeLevel,
    normalizeFieldOfStudy,
} from '@/lib/education-utils';

type AnalysisResult = {
    mustHaveSkills: string[];
    niceToHaveSkills: string[];
    roleKeywords: string[];
    yearsExpMin: number | null;
    yearsExpMax: number | null;
    languages: string[];
    responsibilities: string[];
    redFlags: string[];
    summary: string | null;
    requiredDegreeLevel: DegreeLevel | null;
    preferredDegreeLevels: DegreeLevel[];
    requiredFieldsOfStudy: string[];
    preferredFieldsOfStudy: string[];
    weights: Record<string, number>;
    modelInfo: Record<string, unknown>;
};

const STOP_WORDS = new Set([
    'and', 'or', 'with', 'for', 'to', 'of', 'in', 'on', 'at', 'by', 'from', 'the', 'a', 'an',
    'we', 'our', 'you', 'your', 'role', 'job', 'work', 'team', 'experience',
]);

function normalizeTokens(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s+#.-]/g, ' ')
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function uniqueList(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function uniqueDegrees(values: Array<DegreeLevel | null | undefined>): DegreeLevel[] {
    return Array.from(new Set(values.filter((value): value is DegreeLevel => Boolean(value))));
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function parseJsonObject(content: string): Record<string, unknown> | null {
    const trimmed = content.trim();
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
        return JSON.parse(match[0]);
    } catch {
        return null;
    }
}

function degreeRank(level: DegreeLevel): number {
    switch (level) {
        case 'DIPLOMA':
            return 1;
        case 'BACHELOR':
            return 2;
        case 'MASTER':
            return 3;
        case 'PHD':
            return 4;
        default:
            return 0;
    }
}

function fieldsMatch(candidateField: string, targetField: string): boolean {
    if (!candidateField || !targetField) return false;
    if (candidateField === targetField) return true;
    return candidateField.includes(targetField) || targetField.includes(candidateField);
}

function parseDegreeLevel(value: unknown): DegreeLevel | null {
    if (typeof value !== 'string') return null;
    return inferDegreeLevel(value);
}

function parseDegreeLevels(values: unknown): DegreeLevel[] {
    if (Array.isArray(values)) {
        return uniqueDegrees(values.map((entry) => parseDegreeLevel(entry)));
    }
    if (typeof values === 'string') {
        const parsed = parseDegreeLevel(values);
        return parsed ? [parsed] : [];
    }
    return [];
}

function parseFieldList(values: unknown): string[] {
    if (Array.isArray(values)) {
        return uniqueList(
            values
                .map((entry) => (typeof entry === 'string' ? normalizeFieldOfStudy(entry) : null))
                .filter((entry): entry is string => Boolean(entry))
        );
    }
    if (typeof values === 'string') {
        const normalized = normalizeFieldOfStudy(values);
        return normalized ? [normalized] : [];
    }
    return [];
}

function extractEducationSignals(text: string): {
    requiredDegreeLevel: DegreeLevel | null;
    preferredDegreeLevels: DegreeLevel[];
    requiredFieldsOfStudy: string[];
    preferredFieldsOfStudy: string[];
} {
    const lower = text.toLowerCase();
    const requiredSignal = /(required|must have|mandatory|minimum)/i.test(lower);
    const preferredSignal = /(preferred|nice to have|plus|desired)/i.test(lower);

    const degreeMatches: DegreeLevel[] = [];
    for (const keyword of ['phd', 'doctorate', 'master', 'mba', 'bachelor', 'b.sc', 'bs', 'ba', 'diploma', 'associate']) {
        if (lower.includes(keyword)) {
            const level = inferDegreeLevel(keyword);
            if (level) degreeMatches.push(level);
        }
    }

    const fieldPhrases = [
        'computer science',
        'software engineering',
        'information systems',
        'information technology',
        'business administration',
        'business',
        'economics',
        'engineering',
        'data science',
        'artificial intelligence',
        'machine learning',
        'cyber security',
        'cybersecurity',
    ];
    const fields = fieldPhrases
        .filter((phrase) => lower.includes(phrase))
        .map((phrase) => normalizeFieldOfStudy(phrase))
        .filter((phrase): phrase is string => Boolean(phrase));

    const highest = degreeMatches.sort((a, b) => degreeRank(b) - degreeRank(a))[0] || null;

    if (requiredSignal) {
        return {
            requiredDegreeLevel: highest,
            preferredDegreeLevels: [],
            requiredFieldsOfStudy: uniqueList(fields),
            preferredFieldsOfStudy: [],
        };
    }

    if (preferredSignal) {
        return {
            requiredDegreeLevel: null,
            preferredDegreeLevels: uniqueDegrees(degreeMatches),
            requiredFieldsOfStudy: [],
            preferredFieldsOfStudy: uniqueList(fields),
        };
    }

    return {
        requiredDegreeLevel: null,
        preferredDegreeLevels: [],
        requiredFieldsOfStudy: [],
        preferredFieldsOfStudy: uniqueList(fields),
    };
}

export async function analyzeRecruiterJob(params: {
    jdText: string;
    title: string;
    location?: string | null;
    remoteAllowed?: boolean;
}): Promise<AnalysisResult> {
    const systemPrompt = `You are an experienced recruiter analyst. Extract structured signals from the job description.

Return JSON with:
- mustHaveSkills: string[]
- niceToHaveSkills: string[]
- roleKeywords: string[]
- yearsExpMin: number | null
- yearsExpMax: number | null
- languages: string[]
- responsibilities: string[]
- redFlags: string[]
- summary: string
- requiredDegreeLevel: string | null (Diploma/Bachelor/Master/PhD)
- preferredDegreeLevels: string[]
- requiredFieldsOfStudy: string[]
- preferredFieldsOfStudy: string[]
- weights: object (skillWeight, experienceWeight, keywordWeight)

Keep arrays concise (max 12 items each).`;

    const userPrompt = `Job Title: ${params.title}
Location: ${params.location || 'Not specified'}
Remote Allowed: ${params.remoteAllowed ? 'Yes' : 'No'}
Job Description:
${params.jdText}`;

    try {
        const response = await aiClient.complete(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            { temperature: 0.2, maxTokens: 900 }
        );

        const parsed = parseJsonObject(response.content);
        if (parsed) {
            return {
                mustHaveSkills: uniqueList((parsed.mustHaveSkills as string[]) || []),
                niceToHaveSkills: uniqueList((parsed.niceToHaveSkills as string[]) || []),
                roleKeywords: uniqueList((parsed.roleKeywords as string[]) || []),
                yearsExpMin: typeof parsed.yearsExpMin === 'number' ? parsed.yearsExpMin : null,
                yearsExpMax: typeof parsed.yearsExpMax === 'number' ? parsed.yearsExpMax : null,
                languages: uniqueList((parsed.languages as string[]) || []),
                responsibilities: uniqueList((parsed.responsibilities as string[]) || []),
                redFlags: uniqueList((parsed.redFlags as string[]) || []),
                summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 600) : null,
                requiredDegreeLevel: parseDegreeLevel(parsed.requiredDegreeLevel),
                preferredDegreeLevels: parseDegreeLevels(parsed.preferredDegreeLevels),
                requiredFieldsOfStudy: parseFieldList(parsed.requiredFieldsOfStudy),
                preferredFieldsOfStudy: parseFieldList(parsed.preferredFieldsOfStudy),
                weights: (parsed.weights as Record<string, number>) || {
                    skillWeight: 3,
                    experienceWeight: 2,
                    keywordWeight: 1,
                    educationWeight: 1,
                },
                modelInfo: { provider: aiClient.getProvider() },
            };
        }
    } catch (error) {
        logger.warn('Recruiter JD analysis failed, falling back to heuristic', { error });
    }

    const tokens = normalizeTokens(params.jdText);
    const topKeywords = uniqueList(tokens).slice(0, 12);
    const educationSignals = extractEducationSignals(params.jdText);

    return {
        mustHaveSkills: topKeywords.slice(0, 6),
        niceToHaveSkills: topKeywords.slice(6, 10),
        roleKeywords: topKeywords.slice(0, 8),
        yearsExpMin: null,
        yearsExpMax: null,
        languages: [],
        responsibilities: [],
        redFlags: [],
        summary: params.jdText.slice(0, 300),
        requiredDegreeLevel: educationSignals.requiredDegreeLevel,
        preferredDegreeLevels: educationSignals.preferredDegreeLevels,
        requiredFieldsOfStudy: educationSignals.requiredFieldsOfStudy,
        preferredFieldsOfStudy: educationSignals.preferredFieldsOfStudy,
        weights: { skillWeight: 3, experienceWeight: 2, keywordWeight: 1, educationWeight: 1 },
        modelInfo: { provider: 'heuristic' },
    };
}

export function scoreCandidate(params: {
    candidate: {
        skills: string[];
        summary?: string | null;
        currentTitle?: string | null;
        desiredRoles?: string[];
        yearsExperience?: number | null;
        highestDegreeLevel?: DegreeLevel | null;
        normalizedFieldOfStudy?: string | null;
        primaryFieldOfStudy?: string | null;
    };
    analysis: AnalysisResult;
    job: { location?: string | null; remoteAllowed?: boolean };
}): { score: number; reasons: string[]; gaps: string[]; isPriority: boolean } {
    const { candidate, analysis } = params;
    const skillTokens = uniqueList(candidate.skills.map((skill) => skill.toLowerCase()));
    const roleTokens = normalizeTokens(`${candidate.summary || ''} ${candidate.currentTitle || ''} ${(candidate.desiredRoles || []).join(' ')}`);

    const mustHave = analysis.mustHaveSkills.map((skill) => skill.toLowerCase());
    const niceToHave = analysis.niceToHaveSkills.map((skill) => skill.toLowerCase());
    const keywords = analysis.roleKeywords.map((kw) => kw.toLowerCase());

    const matchedMust = mustHave.filter((skill) => skillTokens.includes(skill));
    const matchedNice = niceToHave.filter((skill) => skillTokens.includes(skill));
    const matchedKeywords = keywords.filter((kw) => roleTokens.includes(kw));

    const skillScore = matchedMust.length * 8 + matchedNice.length * 4;
    const keywordScore = matchedKeywords.length * 2;
    const experienceScore = candidate.yearsExperience ? Math.min(10, candidate.yearsExperience) : 0;
    const educationReasons: string[] = [];
    const educationGaps: string[] = [];
    let educationScore = 0;

    const candidateField = candidate.normalizedFieldOfStudy || normalizeFieldOfStudy(candidate.primaryFieldOfStudy || '');
    const hasEducationData = Boolean(candidate.highestDegreeLevel || candidateField);

    if (analysis.requiredDegreeLevel && candidate.highestDegreeLevel) {
        if (degreeRank(candidate.highestDegreeLevel) >= degreeRank(analysis.requiredDegreeLevel)) {
            educationScore += 6;
            educationReasons.push(`Meets ${formatDegreeLevel(analysis.requiredDegreeLevel)} degree requirement`);
        } else if (hasEducationData) {
            educationGaps.push(`${formatDegreeLevel(analysis.requiredDegreeLevel)} degree required`);
        }
    }

    if (analysis.requiredFieldsOfStudy.length > 0 && candidateField) {
        const matchedRequired = analysis.requiredFieldsOfStudy.some((field) => fieldsMatch(candidateField, field));
        if (matchedRequired) {
            educationScore += 4;
            educationReasons.push('Matches required field of study');
        } else if (hasEducationData) {
            educationGaps.push('Different field of study');
        }
    }

    if (analysis.preferredDegreeLevels.length > 0 && candidate.highestDegreeLevel) {
        const matchedPreferred = analysis.preferredDegreeLevels.some(
            (level) => degreeRank(candidate.highestDegreeLevel as DegreeLevel) >= degreeRank(level)
        );
        if (matchedPreferred) {
            educationScore += 3;
            educationReasons.push('Matches preferred degree level');
        }
    }

    if (analysis.preferredFieldsOfStudy.length > 0 && candidateField) {
        const matchedPreferredField = analysis.preferredFieldsOfStudy.some((field) => fieldsMatch(candidateField, field));
        if (matchedPreferredField) {
            educationScore += 3;
            educationReasons.push(`Relevant ${candidate.primaryFieldOfStudy || 'field'} background`);
        }
    }

    const base = 50 + skillScore + keywordScore + experienceScore + educationScore;
    const score = clamp(Math.round(base), 0, 100);

    const reasons = uniqueList([
        ...educationReasons,
        ...matchedMust.slice(0, 4),
        ...matchedNice.slice(0, 3),
        ...matchedKeywords.slice(0, 3),
    ]).slice(0, 5);

    const gaps = uniqueList([
        ...educationGaps,
        ...mustHave.filter((skill) => !skillTokens.includes(skill)),
    ]).slice(0, 4);

    const isPriority = score >= 85 || matchedMust.length >= Math.min(3, mustHave.length);

    return { score, reasons, gaps, isPriority };
}

export function buildAnonymizedName(name: string | null | undefined, fallbackId: string) {
    if (!name) return `Candidate ${fallbackId.slice(0, 6)}`;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return `${parts[0][0] || 'C'}***`;
    const first = parts[0];
    const lastInitial = parts[parts.length - 1]?.[0] || '';
    return `${first} ${lastInitial}.`;
}

export function passesEducationRequirements(params: {
    candidate: {
        highestDegreeLevel?: DegreeLevel | null;
        normalizedFieldOfStudy?: string | null;
        primaryFieldOfStudy?: string | null;
    };
    analysis: AnalysisResult;
}) {
    const { candidate, analysis } = params;
    const candidateField = candidate.normalizedFieldOfStudy || normalizeFieldOfStudy(candidate.primaryFieldOfStudy || '');

    if (analysis.requiredDegreeLevel) {
        if (!candidate.highestDegreeLevel) return false;
        if (degreeRank(candidate.highestDegreeLevel) < degreeRank(analysis.requiredDegreeLevel)) return false;
    }

    if (analysis.requiredFieldsOfStudy.length > 0) {
        if (!candidateField) return false;
        const matched = analysis.requiredFieldsOfStudy.some((field) => fieldsMatch(candidateField, field));
        if (!matched) return false;
    }

    return true;
}
