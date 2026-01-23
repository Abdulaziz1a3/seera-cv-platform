import type {
    Resume,
    ExperienceItem,
    EducationItem,
    ProjectItem,
    CertificationItem,
    LanguageItem,
    SkillsSection,
    SkillCategory,
    SummarySection,
} from '@/lib/resume-schema';
import { createEmptyResume } from '@/lib/resume-schema';

type ResumeSectionSnapshot = {
    title?: string | null;
    language?: string | null;
    template?: string | null;
    theme?: string | null;
    fontFamily?: string | null;
    targetRole?: string | null;
    sections?: Array<{ type: string; content: any }>;
};

export function buildResumeSnapshotFromSections(resume?: ResumeSectionSnapshot) {
    if (!resume?.sections?.length) return null;
    const snapshot: Record<string, any> = {
        title: resume.title || undefined,
        language: resume.language || undefined,
        template: resume.template || undefined,
        theme: resume.theme || undefined,
        fontFamily: resume.fontFamily || undefined,
        targetRole: resume.targetRole || undefined,
    };
    resume.sections.forEach((section) => {
        snapshot[section.type.toLowerCase()] = section.content;
    });
    return snapshot;
}

function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeSummary(summary: unknown): SummarySection | null {
    if (!summary) return null;
    if (typeof summary === 'string') {
        const content = summary.trim();
        return content ? { content } : null;
    }
    if (typeof summary === 'object' && 'content' in summary) {
        const value = summary as { content?: string; targetRole?: string; yearsExperience?: number };
        const content = typeof value.content === 'string' ? value.content.trim() : '';
        if (!content) return null;
        return {
            content,
            targetRole: value.targetRole,
            yearsExperience: value.yearsExperience,
        };
    }
    return null;
}

function normalizeBullets(value: unknown): ExperienceItem['bullets'] {
    if (!Array.isArray(value)) return [];
    return value
        .map((bullet) => {
            if (typeof bullet === 'string') {
                const content = bullet.trim();
                if (!content) return null;
                return {
                    id: crypto.randomUUID(),
                    content,
                    isAIGenerated: false,
                };
            }
            if (bullet && typeof bullet === 'object') {
                const record = bullet as { id?: string; content?: string; text?: string; isAIGenerated?: boolean };
                const content = (record.content || record.text || '').trim();
                if (!content) return null;
                return {
                    id: record.id || crypto.randomUUID(),
                    content,
                    isAIGenerated: Boolean(record.isAIGenerated),
                };
            }
            return null;
        })
        .filter((bullet): bullet is ExperienceItem['bullets'][number] => Boolean(bullet));
}

function normalizeExperience(experience: unknown): ExperienceItem[] {
    const items = Array.isArray(experience)
        ? experience
        : Array.isArray((experience as { items?: unknown[] } | null)?.items)
            ? (experience as { items: unknown[] }).items
            : [];

    return items
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, any>;
            const bullets = normalizeBullets(record.bullets || record.highlights || record.achievements);
            return {
                id: record.id || crypto.randomUUID(),
                company: record.company || '',
                position: record.position || record.role || '',
                location: record.location || '',
                startDate: record.startDate || '',
                endDate: record.endDate || '',
                isCurrent: Boolean(record.isCurrent ?? record.current),
                description: record.description || '',
                bullets,
                skills: normalizeStringArray(record.skills),
            };
        })
        .filter((item): item is ExperienceItem => Boolean(item));
}

function normalizeEducation(education: unknown): EducationItem[] {
    const items = Array.isArray(education)
        ? education
        : Array.isArray((education as { items?: unknown[] } | null)?.items)
            ? (education as { items: unknown[] }).items
            : [];

    return items
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, any>;
            return {
                id: record.id || crypto.randomUUID(),
                institution: record.institution || record.school || '',
                degree: record.degree || '',
                field: record.field || record.major || '',
                location: record.location || '',
                startDate: record.startDate || '',
                endDate: record.endDate || record.graduationDate || record.graduationYear || '',
                gpa: record.gpa || '',
                honors: record.honors || '',
                coursework: normalizeStringArray(record.coursework),
                activities: normalizeStringArray(record.activities),
            };
        })
        .filter((item): item is EducationItem => Boolean(item));
}

function normalizeProjects(projects: unknown): ProjectItem[] {
    const items = Array.isArray(projects)
        ? projects
        : Array.isArray((projects as { items?: unknown[] } | null)?.items)
            ? (projects as { items: unknown[] }).items
            : [];

    return items
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, any>;
            return {
                id: record.id || crypto.randomUUID(),
                name: record.name || record.title || '',
                role: record.role || '',
                url: record.url || '',
                startDate: record.startDate || '',
                endDate: record.endDate || '',
                description: record.description || '',
                bullets: normalizeBullets(record.bullets || record.highlights),
                technologies: normalizeStringArray(record.technologies || record.techStack),
            };
        })
        .filter((item): item is ProjectItem => Boolean(item));
}

function normalizeCertifications(certifications: unknown): CertificationItem[] {
    const items = Array.isArray(certifications)
        ? certifications
        : Array.isArray((certifications as { items?: unknown[] } | null)?.items)
            ? (certifications as { items: unknown[] }).items
            : [];

    return items
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, any>;
            return {
                id: record.id || crypto.randomUUID(),
                name: record.name || record.title || '',
                issuer: record.issuer || record.organization || '',
                issueDate: record.issueDate || record.date || '',
                expirationDate: record.expirationDate || '',
                credentialId: record.credentialId || '',
                credentialUrl: record.credentialUrl || record.url || '',
            };
        })
        .filter((item): item is CertificationItem => Boolean(item));
}

function normalizeLanguages(languages: unknown): LanguageItem[] {
    const items = Array.isArray(languages)
        ? languages
        : Array.isArray((languages as { items?: unknown[] } | null)?.items)
            ? (languages as { items: unknown[] }).items
            : [];

    return items
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, any>;
            const raw = (record.proficiency || '').toString().toLowerCase();
            const proficiency = (['native', 'fluent', 'professional', 'intermediate', 'basic'] as const)
                .includes(raw as any)
                ? raw
                : 'intermediate';
            return {
                id: record.id || crypto.randomUUID(),
                language: record.language || record.name || '',
                proficiency,
            };
        })
        .filter((item): item is LanguageItem => Boolean(item));
}

function normalizeSkills(skills: unknown): SkillsSection | null {
    if (!skills) return null;
    if (Array.isArray(skills)) {
        const simpleList = normalizeStringArray(skills);
        return simpleList.length ? { categories: [], simpleList } : null;
    }
    if (typeof skills !== 'object') return null;

    const record = skills as Record<string, any>;
    const simpleList = normalizeStringArray(record.simpleList);
    const categories = Array.isArray(record.categories)
        ? record.categories
            .map((category: any) => {
                if (!category || typeof category !== 'object') return null;
                const normalized: SkillCategory = {
                    id: category.id || crypto.randomUUID(),
                    name: category.name || '',
                    skills: normalizeStringArray(category.skills),
                };
                if (!normalized.name && normalized.skills.length === 0) return null;
                return normalized;
            })
            .filter((category): category is SkillCategory => Boolean(category))
        : [];

    if (!simpleList.length && categories.length === 0) return null;
    return {
        categories,
        simpleList: simpleList.length ? simpleList : undefined,
    };
}

function normalizeContact(contact: unknown) {
    if (!contact || typeof contact !== 'object') return null;
    const record = contact as Record<string, any>;
    return {
        fullName: record.fullName || record.name || '',
        email: record.email || '',
        phone: record.phone || '',
        location: record.location || '',
        website: record.website || record.websiteUrl || '',
        linkedin: record.linkedin || record.linkedinUrl || '',
        photo: record.photo || '',
        github: record.github || '',
        portfolio: record.portfolio || '',
        seeraLinkSlug: record.seeraLinkSlug || '',
        showSeeraLinkQr: typeof record.showSeeraLinkQr === 'boolean' ? record.showSeeraLinkQr : undefined,
    };
}

export function normalizeResumeSnapshot(snapshot: any, fallbackTitle?: string | null): Resume | null {
    if (!snapshot || typeof snapshot !== 'object') return null;

    const base = createEmptyResume(snapshot.title || fallbackTitle || 'Resume');
    const normalized: Resume = { ...base };

    if (snapshot.title) normalized.title = snapshot.title;
    if (snapshot.language) normalized.language = snapshot.language;
    if (snapshot.template) normalized.template = snapshot.template;
    if (snapshot.targetRole) normalized.targetRole = snapshot.targetRole;

    const contact = normalizeContact(snapshot.contact);
    if (contact) {
        normalized.contact = {
            ...normalized.contact,
            ...contact,
        };
    }

    const summary = normalizeSummary(snapshot.summary);
    if (summary) normalized.summary = summary;

    const experience = normalizeExperience(snapshot.experience);
    if (experience.length) normalized.experience = { items: experience };

    const education = normalizeEducation(snapshot.education);
    if (education.length) normalized.education = { items: education };

    const projects = normalizeProjects(snapshot.projects);
    if (projects.length) normalized.projects = { items: projects };

    const certifications = normalizeCertifications(snapshot.certifications);
    if (certifications.length) normalized.certifications = { items: certifications };

    const languages = normalizeLanguages(snapshot.languages);
    if (languages.length) normalized.languages = { items: languages };

    const skills = normalizeSkills(snapshot.skills);
    if (skills) normalized.skills = skills;

    return normalized;
}

export function hasResumeContent(resume?: Resume | null) {
    if (!resume) return false;
    const summary = resume.summary?.content?.trim();
    const experienceCount = resume.experience?.items?.length || 0;
    const educationCount = resume.education?.items?.length || 0;
    const projectCount = resume.projects?.items?.length || 0;
    const certificationsCount = resume.certifications?.items?.length || 0;
    const languagesCount = resume.languages?.items?.length || 0;
    const skillsCount = resume.skills?.simpleList?.length || 0;
    const skillsCategoriesCount = resume.skills?.categories?.length || 0;
    return Boolean(summary) ||
        experienceCount > 0 ||
        educationCount > 0 ||
        projectCount > 0 ||
        certificationsCount > 0 ||
        languagesCount > 0 ||
        skillsCount > 0 ||
        skillsCategoriesCount > 0;
}
