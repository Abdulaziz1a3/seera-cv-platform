import type { ResumeRecord } from '@/lib/resume-data';
import type { ResumeData } from '@/lib/resume-types';
import {
    DEFAULT_TEMPLATE,
    DEFAULT_THEME,
    DEFAULT_LOCALE,
    DEFAULT_SETTINGS,
} from '@/lib/resume-types';

export interface ResumeAIProfile {
    contact: {
        fullName: string;
        email: string;
        photo?: string;
        phone?: string;
        location?: string;
        linkedin?: string;
        website?: string;
    };
    summary: string;
    experience: Array<{
        position: string;
        company: string;
        location?: string;
        bullets: string[];
    }>;
    skills: string[];
    education: Array<{
        institution?: string;
        degree?: string;
        field?: string;
    }>;
}

export interface ResumeCareerProfile {
    targetRole?: string;
    contact: ResumeAIProfile['contact'];
    summary: string;
    experience: Array<{
        position: string;
        company: string;
        startDate?: string;
        endDate?: string;
        current?: boolean;
        bullets: string[];
    }>;
    skills: string[];
    education: Array<{
        degree?: string;
        field?: string;
    }>;
    certifications: Array<{
        name?: string;
    }>;
    projects: Array<{
        name?: string;
    }>;
}

function normalizeSummary(summary: unknown): string {
    if (!summary) return '';
    if (typeof summary === 'string') return summary;
    if (typeof summary === 'object' && summary && 'content' in summary) {
        const content = (summary as { content?: string }).content;
        return typeof content === 'string' ? content : '';
    }
    return '';
}

function normalizeSkills(skills: unknown): string[] {
    if (!skills || typeof skills !== 'object') return [];

    const maybe = skills as { simpleList?: string[]; categories?: Array<{ skills: string[] }> };
    if (Array.isArray(maybe.simpleList) && maybe.simpleList.length > 0) {
        return maybe.simpleList.filter((item) => typeof item === 'string');
    }

    if (Array.isArray(maybe.categories)) {
        return maybe.categories.flatMap((category) => category.skills || []).filter((item) => typeof item === 'string');
    }

    return [];
}

function normalizeExperience(experience: unknown): ResumeAIProfile['experience'] {
    if (!experience || typeof experience !== 'object') return [];

    const items = (experience as { items?: Array<any> }).items || [];
    if (!Array.isArray(items)) return [];

    return items.map((item) => ({
        position: item.position || '',
        company: item.company || '',
        location: item.location || '',
        bullets: Array.isArray(item.bullets)
            ? item.bullets.map((bullet: any) => {
                if (typeof bullet === 'string') return bullet;
                if (bullet && typeof bullet.content === 'string') return bullet.content;
                return '';
            }).filter((bullet: string) => bullet.trim().length > 0)
            : [],
    }));
}

function normalizeEducation(education: unknown): ResumeAIProfile['education'] {
    if (!education || typeof education !== 'object') return [];

    const items = (education as { items?: Array<any> }).items || [];
    if (!Array.isArray(items)) return [];

    return items.map((item) => ({
        institution: item.institution || '',
        degree: item.degree || '',
        field: item.field || '',
    }));
}

export function normalizeResumeForAI(resume: ResumeRecord): ResumeAIProfile {
    return {
        contact: {
            fullName: resume.contact?.fullName || '',
            email: resume.contact?.email || '',
            photo: resume.contact?.photo || '',
            phone: resume.contact?.phone || '',
            location: resume.contact?.location || '',
            linkedin: resume.contact?.linkedin || '',
            website: resume.contact?.website || '',
        },
        summary: normalizeSummary(resume.summary),
        experience: normalizeExperience(resume.experience),
        skills: normalizeSkills(resume.skills),
        education: normalizeEducation(resume.education),
    };
}

export function normalizeResumeForCareer(resume: ResumeRecord): ResumeCareerProfile {
    const experienceItems = Array.isArray((resume.experience as any)?.items)
        ? (resume.experience as any).items
        : [];

    const experience = experienceItems.map((item: any) => ({
        position: item.position || '',
        company: item.company || '',
        startDate: item.startDate || '',
        endDate: item.endDate || '',
        current: item.isCurrent || false,
        bullets: Array.isArray(item.bullets)
            ? item.bullets.map((bullet: any) => {
                if (typeof bullet === 'string') return bullet;
                if (bullet && typeof bullet.content === 'string') return bullet.content;
                return '';
            }).filter((bullet: string) => bullet.trim().length > 0)
            : [],
    }));

    const education = normalizeEducation(resume.education).map((item) => ({
        degree: item.degree || '',
        field: item.field || '',
    }));

    const certifications = Array.isArray((resume.certifications as any)?.items)
        ? (resume.certifications as any).items.map((item: any) => ({ name: item.name || '' }))
        : [];

    const projects = Array.isArray((resume.projects as any)?.items)
        ? (resume.projects as any).items.map((item: any) => ({ name: item.name || '' }))
        : [];

    return {
        targetRole: resume.targetRole || '',
        contact: {
            fullName: resume.contact?.fullName || '',
            email: resume.contact?.email || '',
            photo: resume.contact?.photo || '',
            phone: resume.contact?.phone || '',
            location: resume.contact?.location || '',
            linkedin: resume.contact?.linkedin || '',
            website: resume.contact?.website || '',
        },
        summary: normalizeSummary(resume.summary),
        experience,
        skills: normalizeSkills(resume.skills),
        education,
        certifications,
        projects,
    };
}

export function mapResumeRecordToResumeData(resume: ResumeRecord): ResumeData {
    const summaryText = normalizeSummary(resume.summary);
    const experienceItems = Array.isArray((resume.experience as any)?.items)
        ? (resume.experience as any).items.map((item: any) => ({
            id: item.id || crypto.randomUUID(),
            company: item.company || '',
            position: item.position || '',
            location: item.location || '',
            startDate: item.startDate || '',
            endDate: item.endDate || '',
            current: item.isCurrent || false,
            bullets: Array.isArray(item.bullets)
                ? item.bullets.map((bullet: any) => {
                    if (typeof bullet === 'string') return bullet;
                    if (bullet && typeof bullet.content === 'string') return bullet.content;
                    return '';
                }).filter((bullet: string) => bullet.trim().length > 0)
                : [],
        }))
        : [];

    const educationItems = Array.isArray((resume.education as any)?.items)
        ? (resume.education as any).items.map((item: any) => ({
            id: item.id || crypto.randomUUID(),
            institution: item.institution || '',
            degree: item.degree || '',
            field: item.field || '',
            location: item.location || '',
            graduationDate: item.endDate || item.graduationDate || item.graduationYear || '',
            gpa: item.gpa || '',
        }))
        : [];

    const skills = normalizeSkills(resume.skills);

    const projects = Array.isArray((resume.projects as any)?.items)
        ? (resume.projects as any).items.map((item: any) => ({
            id: crypto.randomUUID(),
            name: item.name || '',
            description: item.description || '',
            url: item.url || '',
            technologies: item.technologies || [],
        }))
        : [];

    const certifications = Array.isArray((resume.certifications as any)?.items)
        ? (resume.certifications as any).items.map((item: any) => ({
            id: crypto.randomUUID(),
            name: item.name || '',
            issuer: item.issuer || '',
            date: item.issueDate || '',
            credentialId: item.credentialId || '',
            url: item.credentialUrl || '',
        }))
        : [];

    const languages = Array.isArray((resume.languages as any)?.items)
        ? (resume.languages as any).items.map((item: any) => ({
            id: crypto.randomUUID(),
            name: item.name || item.language || '',
            proficiency: item.proficiency || 'Intermediate',
        }))
        : [];

    return {
        id: resume.id,
        title: resume.title,
        locale: resume.language || DEFAULT_LOCALE,
        template: (resume.template as ResumeData['template']) || DEFAULT_TEMPLATE,
        theme: (resume.theme as ResumeData['theme']) || DEFAULT_THEME,
        contact: {
            fullName: resume.contact?.fullName || '',
            email: resume.contact?.email || '',
            phone: resume.contact?.phone || '',
            location: resume.contact?.location || '',
            linkedin: resume.contact?.linkedin || '',
            website: resume.contact?.website || '',
            photo: resume.contact?.photo || '',
            seeraLinkSlug: (resume.contact as any)?.seeraLinkSlug || '',
            showSeeraLinkQr: Boolean((resume.contact as any)?.showSeeraLinkQr),
        },
        summary: summaryText,
        experience: experienceItems,
        education: educationItems,
        skills,
        projects,
        certifications,
        languages,
        settings: {
            ...DEFAULT_SETTINGS,
            fontFamily: (resume.fontFamily as ResumeData['settings']['fontFamily']) || DEFAULT_SETTINGS.fontFamily,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
