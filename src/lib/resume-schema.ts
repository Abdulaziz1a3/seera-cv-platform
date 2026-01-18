import { z } from 'zod';

// ===========================================
// CONTACT SECTION
// ===========================================

export const contactSchema = z.object({
    fullName: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    photo: z.string().optional().or(z.literal('')),
    phone: z.string().optional(),
    location: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    github: z.string().url().optional().or(z.literal('')),
    portfolio: z.string().url().optional().or(z.literal('')),
});

export type ContactSection = z.infer<typeof contactSchema>;
// Backwards compatibility alias
export type Contact = ContactSection;

// ===========================================
// SUMMARY SECTION
// ===========================================

export const summarySchema = z.object({
    content: z.string().max(2000, 'Summary should be under 2000 characters'),
    targetRole: z.string().optional(),
    yearsExperience: z.number().min(0).optional(),
});

export type SummarySection = z.infer<typeof summarySchema>;

// ===========================================
// EXPERIENCE SECTION
// ===========================================

export const experienceItemSchema = z.object({
    id: z.string(),
    company: z.string().min(1, 'Company name is required'),
    position: z.string().min(1, 'Position is required'),
    location: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    isCurrent: z.boolean().default(false),
    description: z.string().optional(),
    bullets: z.array(z.object({
        id: z.string(),
        content: z.string(),
        isAIGenerated: z.boolean().default(false),
    })),
    skills: z.array(z.string()).default([]),
});

export const experienceSchema = z.object({
    items: z.array(experienceItemSchema),
});

export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type ExperienceSection = z.infer<typeof experienceSchema>;

// ===========================================
// EDUCATION SECTION
// ===========================================

export const educationItemSchema = z.object({
    id: z.string(),
    institution: z.string().min(1, 'Institution is required'),
    degree: z.string().min(1, 'Degree is required'),
    field: z.string().optional(),
    location: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    gpa: z.string().optional(),
    honors: z.string().optional(),
    coursework: z.array(z.string()).default([]),
    activities: z.array(z.string()).default([]),
});

export const educationSchema = z.object({
    items: z.array(educationItemSchema),
});

export type EducationItem = z.infer<typeof educationItemSchema>;
export type EducationSection = z.infer<typeof educationSchema>;
// Backwards compatibility alias
export type Education = EducationItem;

// ===========================================
// SKILLS SECTION
// ===========================================

export const skillCategorySchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Category name is required'),
    skills: z.array(z.string()),
});

export const skillsSchema = z.object({
    categories: z.array(skillCategorySchema),
    // For simple skill list without categories
    simpleList: z.array(z.string()).optional(),
});

export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type SkillsSection = z.infer<typeof skillsSchema>;
// Backwards compatibility alias
export type Skills = SkillsSection;

// ===========================================
// PROJECTS SECTION
// ===========================================

export const projectItemSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Project name is required'),
    role: z.string().optional(),
    url: z.string().url().optional().or(z.literal('')),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional(),
    bullets: z.array(z.object({
        id: z.string(),
        content: z.string(),
        isAIGenerated: z.boolean().default(false),
    })),
    technologies: z.array(z.string()).default([]),
});

export const projectsSchema = z.object({
    items: z.array(projectItemSchema),
});

export type ProjectItem = z.infer<typeof projectItemSchema>;
export type ProjectsSection = z.infer<typeof projectsSchema>;

// ===========================================
// CERTIFICATIONS SECTION
// ===========================================

export const certificationItemSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Certification name is required'),
    issuer: z.string().min(1, 'Issuer is required'),
    issueDate: z.string().optional(),
    expirationDate: z.string().optional(),
    credentialId: z.string().optional(),
    credentialUrl: z.string().url().optional().or(z.literal('')),
});

export const certificationsSchema = z.object({
    items: z.array(certificationItemSchema),
});

export type CertificationItem = z.infer<typeof certificationItemSchema>;
export type CertificationsSection = z.infer<typeof certificationsSchema>;

// ===========================================
// AWARDS SECTION
// ===========================================

export const awardItemSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Award title is required'),
    issuer: z.string().optional(),
    date: z.string().optional(),
    description: z.string().optional(),
});

export const awardsSchema = z.object({
    items: z.array(awardItemSchema),
});

export type AwardItem = z.infer<typeof awardItemSchema>;
export type AwardsSection = z.infer<typeof awardsSchema>;

// ===========================================
// PUBLICATIONS SECTION
// ===========================================

export const publicationItemSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Publication title is required'),
    publisher: z.string().optional(),
    date: z.string().optional(),
    url: z.string().url().optional().or(z.literal('')),
    authors: z.array(z.string()).default([]),
    description: z.string().optional(),
});

export const publicationsSchema = z.object({
    items: z.array(publicationItemSchema),
});

export type PublicationItem = z.infer<typeof publicationItemSchema>;
export type PublicationsSection = z.infer<typeof publicationsSchema>;

// ===========================================
// VOLUNTEERING SECTION
// ===========================================

export const volunteeringItemSchema = z.object({
    id: z.string(),
    organization: z.string().min(1, 'Organization is required'),
    role: z.string().min(1, 'Role is required'),
    location: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isCurrent: z.boolean().default(false),
    description: z.string().optional(),
    bullets: z.array(z.object({
        id: z.string(),
        content: z.string(),
        isAIGenerated: z.boolean().default(false),
    })),
});

export const volunteeringSchema = z.object({
    items: z.array(volunteeringItemSchema),
});

export type VolunteeringItem = z.infer<typeof volunteeringItemSchema>;
export type VolunteeringSection = z.infer<typeof volunteeringSchema>;

// ===========================================
// LANGUAGES SECTION
// ===========================================

export const languageItemSchema = z.object({
    id: z.string(),
    language: z.string().min(1, 'Language is required'),
    proficiency: z.enum(['native', 'fluent', 'professional', 'intermediate', 'basic']),
});

export const languagesSchema = z.object({
    items: z.array(languageItemSchema),
});

export type LanguageItem = z.infer<typeof languageItemSchema>;
export type LanguagesSection = z.infer<typeof languagesSchema>;

// ===========================================
// REFERENCES SECTION
// ===========================================

export const referenceItemSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Name is required'),
    title: z.string().optional(),
    company: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    relationship: z.string().optional(),
});

export const referencesSchema = z.object({
    items: z.array(referenceItemSchema),
    showReferences: z.boolean().default(false),
    availableOnRequest: z.boolean().default(true),
});

export type ReferenceItem = z.infer<typeof referenceItemSchema>;
export type ReferencesSection = z.infer<typeof referencesSchema>;

// ===========================================
// CUSTOM SECTION
// ===========================================

export const customSectionSchema = z.object({
    title: z.string().min(1, 'Section title is required'),
    content: z.string(),
    items: z.array(z.object({
        id: z.string(),
        title: z.string(),
        subtitle: z.string().optional(),
        date: z.string().optional(),
        description: z.string().optional(),
    })).optional(),
});

export type CustomSection = z.infer<typeof customSectionSchema>;

// ===========================================
// FULL RESUME SCHEMA
// ===========================================

export const resumeSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Resume title is required'),
    targetRole: z.string().optional(),
    language: z.enum(['en', 'ar']).default('en'),

    // Sections
    contact: contactSchema,
    summary: summarySchema.optional(),
    experience: experienceSchema.optional(),
    education: educationSchema.optional(),
    skills: skillsSchema.optional(),
    projects: projectsSchema.optional(),
    certifications: certificationsSchema.optional(),
    awards: awardsSchema.optional(),
    publications: publicationsSchema.optional(),
    volunteering: volunteeringSchema.optional(),
    languages: languagesSchema.optional(),
    references: referencesSchema.optional(),
    customSections: z.array(customSectionSchema).optional(),

    // Section ordering
    sectionOrder: z.array(z.string()).default([
        'contact',
        'summary',
        'experience',
        'education',
        'skills',
        'projects',
        'certifications',
        'awards',
        'publications',
        'volunteering',
        'languages',
        'references',
    ]),

    // Section visibility
    visibleSections: z.record(z.boolean()).default({}),

    // Metadata
    template: z.string().default('classic'),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type Resume = z.infer<typeof resumeSchema>;

// ===========================================
// HELPER FUNCTIONS
// ===========================================

export function createEmptyResume(title: string = 'Untitled Resume'): Resume {
    return {
        id: crypto.randomUUID(),
        title,
        language: 'en',
        contact: {
            fullName: '',
            email: '',
            photo: '',
        },
        sectionOrder: [
            'contact',
            'summary',
            'experience',
            'education',
            'skills',
            'projects',
            'certifications',
        ],
        visibleSections: {
            contact: true,
            summary: true,
            experience: true,
            education: true,
            skills: true,
            projects: false,
            certifications: false,
            awards: false,
            publications: false,
            volunteering: false,
            languages: false,
            references: false,
        },
        template: 'classic',
    };
}

export function createEmptyExperienceItem(): ExperienceItem {
    return {
        id: crypto.randomUUID(),
        company: '',
        position: '',
        startDate: '',
        isCurrent: false,
        bullets: [],
        skills: [],
    };
}

export function createEmptyEducationItem(): EducationItem {
    return {
        id: crypto.randomUUID(),
        institution: '',
        degree: '',
        coursework: [],
        activities: [],
    };
}

export function createEmptyProjectItem(): ProjectItem {
    return {
        id: crypto.randomUUID(),
        name: '',
        bullets: [],
        technologies: [],
    };
}

export function createEmptyCertificationItem(): CertificationItem {
    return {
        id: crypto.randomUUID(),
        name: '',
        issuer: '',
    };
}

export function createEmptySkillCategory(): SkillCategory {
    return {
        id: crypto.randomUUID(),
        name: '',
        skills: [],
    };
}

// Section type to label mapping
export const sectionLabels: Record<string, { en: string; ar: string }> = {
    contact: { en: 'Contact Information', ar: 'معلومات الاتصال' },
    summary: { en: 'Professional Summary', ar: 'الملخص المهني' },
    experience: { en: 'Experience', ar: 'الخبرة العملية' },
    education: { en: 'Education', ar: 'التعليم' },
    skills: { en: 'Skills', ar: 'المهارات' },
    projects: { en: 'Projects', ar: 'المشاريع' },
    certifications: { en: 'Certifications', ar: 'الشهادات' },
    awards: { en: 'Awards', ar: 'الجوائز' },
    publications: { en: 'Publications', ar: 'المنشورات' },
    volunteering: { en: 'Volunteering', ar: 'التطوع' },
    languages: { en: 'Languages', ar: 'اللغات' },
    references: { en: 'References', ar: 'المراجع' },
};

// Language proficiency labels
export const proficiencyLabels: Record<string, { en: string; ar: string }> = {
    native: { en: 'Native', ar: 'اللغة الأم' },
    fluent: { en: 'Fluent', ar: 'طلاقة' },
    professional: { en: 'Professional', ar: 'مهني' },
    intermediate: { en: 'Intermediate', ar: 'متوسط' },
    basic: { en: 'Basic', ar: 'أساسي' },
};
