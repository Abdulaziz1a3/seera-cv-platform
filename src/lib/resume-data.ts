import type {
    ContactSection,
    SummarySection,
    ExperienceSection,
    EducationSection,
    SkillsSection,
    ProjectsSection,
    CertificationsSection,
    LanguagesSection,
} from '@/lib/resume-schema';

export interface ResumeRecord {
    id: string;
    title: string;
    targetRole?: string | null;
    language?: 'en' | 'ar';
    atsScore?: number | null;
    template?: string | null;
    theme?: string | null;
    fontFamily?: string | null;
    contact?: ContactSection;
    summary?: SummarySection;
    experience?: ExperienceSection;
    education?: EducationSection;
    skills?: SkillsSection;
    projects?: ProjectsSection;
    certifications?: CertificationsSection;
    languages?: LanguagesSection;
}
