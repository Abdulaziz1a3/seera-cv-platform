// ATS Linting Engine
// Analyzes resumes for ATS compatibility and provides improvement suggestions

export type LintSeverity = 'error' | 'warning' | 'info';

export interface LintIssue {
    id: string;
    severity: LintSeverity;
    category: string;
    title: string;
    description: string;
    suggestion?: string;
    section?: string;
    field?: string;
}

export interface LintResult {
    score: number;
    recruiterScore: number;
    issues: LintIssue[];
    summary: {
        errors: number;
        warnings: number;
        info: number;
    };
}

// Standard ATS-friendly section headers
const STANDARD_HEADERS = {
    en: {
        contact: ['contact', 'contact information', 'personal information'],
        summary: ['summary', 'professional summary', 'profile', 'about', 'objective', 'career objective'],
        experience: ['experience', 'work experience', 'professional experience', 'employment history', 'work history'],
        education: ['education', 'educational background', 'academic background'],
        skills: ['skills', 'technical skills', 'core competencies', 'competencies', 'areas of expertise'],
        projects: ['projects', 'personal projects', 'key projects'],
        certifications: ['certifications', 'certificates', 'licenses', 'credentials'],
        awards: ['awards', 'honors', 'achievements', 'recognition'],
        publications: ['publications', 'research', 'papers'],
        volunteering: ['volunteering', 'volunteer experience', 'community service'],
        languages: ['languages', 'language skills'],
        references: ['references'],
    },
    ar: {
        contact: ['معلومات الاتصال', 'بيانات الاتصال'],
        summary: ['الملخص المهني', 'نبذة عني', 'الهدف الوظيفي'],
        experience: ['الخبرة العملية', 'الخبرات'],
        education: ['التعليم', 'المؤهلات الأكاديمية'],
        skills: ['المهارات', 'المهارات التقنية'],
        projects: ['المشاريع'],
        certifications: ['الشهادات', 'التراخيص'],
        awards: ['الجوائز', 'التكريمات'],
        publications: ['المنشورات', 'الأبحاث'],
        volunteering: ['التطوع', 'العمل التطوعي'],
        languages: ['اللغات'],
        references: ['المراجع'],
    },
};

// Common action verbs for bullet points
const ACTION_VERBS = [
    'achieved', 'administered', 'analyzed', 'built', 'collaborated', 'coordinated',
    'created', 'delivered', 'designed', 'developed', 'directed', 'drove', 'enhanced',
    'established', 'executed', 'facilitated', 'generated', 'implemented', 'improved',
    'increased', 'initiated', 'launched', 'led', 'managed', 'mentored', 'negotiated',
    'optimized', 'orchestrated', 'organized', 'oversaw', 'pioneered', 'planned',
    'produced', 'reduced', 'reorganized', 'resolved', 'restructured', 'revamped',
    'saved', 'spearheaded', 'streamlined', 'strengthened', 'succeeded', 'supervised',
    'transformed', 'upgraded',
];

// Quantification patterns
const QUANTIFICATION_PATTERNS = [
    /\d+%/,           // Percentages
    /\$[\d,]+/,       // Dollar amounts
    /[\d,]+\+?/,      // Numbers
    /\d+x/,           // Multipliers
];

export function lintResume(resume: any, language: 'en' | 'ar' = 'en'): LintResult {
    const issues: LintIssue[] = [];
    let baseScore = 100;

    // 1. Check contact information
    const contactIssues = lintContactSection(resume.contact);
    issues.push(...contactIssues);
    baseScore -= contactIssues.filter(i => i.severity === 'error').length * 15;
    baseScore -= contactIssues.filter(i => i.severity === 'warning').length * 7;

    // 2. Check summary/objective
    if (resume.summary) {
        const summaryIssues = lintSummarySection(resume.summary);
        issues.push(...summaryIssues);
        baseScore -= summaryIssues.filter(i => i.severity === 'error').length * 12;
        baseScore -= summaryIssues.filter(i => i.severity === 'warning').length * 8;
    }

    // 3. Check experience section
    if (resume.experience?.items) {
        const expIssues = lintExperienceSection(resume.experience.items);
        issues.push(...expIssues);
        baseScore -= expIssues.filter(i => i.severity === 'error').length * 25;
        baseScore -= expIssues.filter(i => i.severity === 'warning').length * 10;
    }

    // 4. Check education section
    const eduIssues = lintEducationSection(resume.education?.items);
    issues.push(...eduIssues);
    baseScore -= eduIssues.filter(i => i.severity === 'error').length * 10;
    baseScore -= eduIssues.filter(i => i.severity === 'warning').length * 6;

    // 5. Check skills section
    if (resume.skills) {
        const skillIssues = lintSkillsSection(resume.skills);
        issues.push(...skillIssues);
        baseScore -= skillIssues.filter(i => i.severity === 'warning').length * 10;
    }

    // 6. General formatting checks
    const formatIssues = lintFormatting(resume, language);
    issues.push(...formatIssues);
    baseScore -= formatIssues.filter(i => i.severity === 'error').length * 5;

    // Calculate recruiter score (readability, impact, structure)
    const recruiterScore = calculateRecruiterScore(resume, issues);

    // Ensure scores are within bounds
    const finalScore = Math.max(0, Math.min(100, baseScore));

    return {
        score: finalScore,
        recruiterScore,
        issues,
        summary: {
            errors: issues.filter(i => i.severity === 'error').length,
            warnings: issues.filter(i => i.severity === 'warning').length,
            info: issues.filter(i => i.severity === 'info').length,
        },
    };
}

function lintContactSection(contact: any): LintIssue[] {
    const issues: LintIssue[] = [];

    if (!contact?.fullName || contact.fullName.trim().length === 0) {
        issues.push({
            id: 'contact-name-missing',
            severity: 'error',
            category: 'Contact',
            title: 'Missing name',
            description: 'Your resume must include your full name.',
            section: 'contact',
            field: 'fullName',
        });
    }

    if (!contact?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        issues.push({
            id: 'contact-email-missing',
            severity: 'error',
            category: 'Contact',
            title: 'Missing or invalid email',
            description: 'A valid email address is required for employers to contact you.',
            section: 'contact',
            field: 'email',
        });
    }

    if (!contact?.phone) {
        issues.push({
            id: 'contact-phone-missing',
            severity: 'warning',
            category: 'Contact',
            title: 'Missing phone number',
            description: 'Including a phone number increases your chances of being contacted.',
            suggestion: 'Add a professional phone number.',
            section: 'contact',
            field: 'phone',
        });
    }

    if (!contact?.location) {
        issues.push({
            id: 'contact-location-missing',
            severity: 'info',
            category: 'Contact',
            title: 'Missing location',
            description: 'Adding your city/region helps with location-based job matching.',
            section: 'contact',
            field: 'location',
        });
    }

    return issues;
}

function lintSummarySection(summary: any): LintIssue[] {
    const issues: LintIssue[] = [];
    const content = summary?.content || '';

    if (!content || content.trim().length === 0) {
        issues.push({
            id: 'summary-missing',
            severity: 'warning',
            category: 'Summary',
            title: 'Missing professional summary',
            description: 'A professional summary helps recruiters quickly understand your value proposition.',
            suggestion: 'Add a 2-3 sentence summary highlighting your experience and key strengths.',
            section: 'summary',
        });
        return issues;
    }

    if (content.length < 100) {
        issues.push({
            id: 'summary-too-short',
            severity: 'warning',
            category: 'Summary',
            title: 'Summary is too short',
            description: 'Your summary should be 2-4 sentences highlighting your key qualifications.',
            suggestion: 'Expand your summary to include years of experience, key skills, and career achievements.',
            section: 'summary',
        });
    }

    if (content.length > 500) {
        issues.push({
            id: 'summary-too-long',
            severity: 'warning',
            category: 'Summary',
            title: 'Summary is too long',
            description: 'Long summaries may not be fully read by recruiters or parsed correctly by ATS.',
            suggestion: 'Keep your summary concise - aim for 50-150 words.',
            section: 'summary',
        });
    }

    // Check for first-person pronouns
    if (/\b(I|me|my|myself)\b/i.test(content)) {
        issues.push({
            id: 'summary-pronouns',
            severity: 'info',
            category: 'Summary',
            title: 'Consider removing first-person pronouns',
            description: 'Many resume experts recommend avoiding "I", "me", "my" in summaries.',
            suggestion: 'Rewrite using implied first person (e.g., "Experienced developer..." instead of "I am an experienced developer...").',
            section: 'summary',
        });
    }

    return issues;
}

function lintExperienceSection(items: any[]): LintIssue[] {
    const issues: LintIssue[] = [];

    if (!items || items.length === 0) {
        issues.push({
            id: 'experience-missing',
            severity: 'error',
            category: 'Experience',
            title: 'No work experience listed',
            description: 'Work experience is crucial for most job applications.',
            section: 'experience',
        });
        return issues;
    }

    items.forEach((exp, index) => {
        const prefix = `exp-${index}`;

        // Check required fields
        if (!exp.company) {
            issues.push({
                id: `${prefix}-company-missing`,
                severity: 'error',
                category: 'Experience',
                title: `Experience #${index + 1}: Missing company name`,
                description: 'Company name is required for each experience entry.',
                section: 'experience',
                field: 'company',
            });
        }

        if (!exp.position) {
            issues.push({
                id: `${prefix}-position-missing`,
                severity: 'error',
                category: 'Experience',
                title: `Experience #${index + 1}: Missing job title`,
                description: 'Job title is required for each experience entry.',
                section: 'experience',
                field: 'position',
            });
        }

        if (!exp.startDate) {
            issues.push({
                id: `${prefix}-dates-missing`,
                severity: 'error',
                category: 'Experience',
                title: `Experience #${index + 1}: Missing dates`,
                description: 'Start date is required for ATS parsing.',
                section: 'experience',
                field: 'startDate',
            });
        }

        // Check bullet points
        const bullets = exp.bullets || [];

        if (bullets.length === 0) {
            issues.push({
                id: `${prefix}-bullets-missing`,
                severity: 'warning',
                category: 'Experience',
                title: `${exp.company || `Experience #${index + 1}`}: No bullet points`,
                description: 'Add bullet points describing your responsibilities and achievements.',
                suggestion: 'Use 3-6 bullet points per role, starting with action verbs.',
                section: 'experience',
            });
        } else {
            bullets.forEach((bullet: any, bIndex: number) => {
                const bulletContent = typeof bullet === 'string' ? bullet : bullet.content;

                // Check for action verbs
                const firstWord = bulletContent?.trim().split(/\s+/)[0]?.toLowerCase();
                if (firstWord && !ACTION_VERBS.includes(firstWord)) {
                    issues.push({
                        id: `${prefix}-bullet-${bIndex}-action-verb`,
                        severity: 'info',
                        category: 'Experience',
                        title: `${exp.company || `Experience #${index + 1}`}: Bullet could start with stronger action verb`,
                        description: `Consider starting with an action verb like "Led", "Developed", "Increased", etc.`,
                        section: 'experience',
                    });
                }

                // Check for quantification
                const hasQuantification = QUANTIFICATION_PATTERNS.some(pattern => pattern.test(bulletContent || ''));
                if (!hasQuantification) {
                    issues.push({
                        id: `${prefix}-bullet-${bIndex}-quantify`,
                        severity: 'info',
                        category: 'Experience',
                        title: `${exp.company || `Experience #${index + 1}`}: Consider adding metrics`,
                        description: 'Quantified achievements are more impactful (e.g., "Increased sales by 25%").',
                        section: 'experience',
                    });
                }
            });
        }
    });

    return issues;
}

function lintEducationSection(items: any[] | undefined): LintIssue[] {
    const issues: LintIssue[] = [];

    if (!items || items.length === 0) {
        issues.push({
            id: 'education-missing',
            severity: 'warning',
            category: 'Education',
            title: 'No education listed',
            description: 'Education helps ATS and recruiters validate your background.',
            suggestion: 'Add your highest degree or most recent education.',
            section: 'education',
        });
        return issues;
    }

    items.forEach((edu, index) => {
        if (!edu.institution) {
            issues.push({
                id: `edu-${index}-institution-missing`,
                severity: 'error',
                category: 'Education',
                title: `Education #${index + 1}: Missing institution name`,
                description: 'School or university name is required.',
                section: 'education',
                field: 'institution',
            });
        }

        if (!edu.degree) {
            issues.push({
                id: `edu-${index}-degree-missing`,
                severity: 'warning',
                category: 'Education',
                title: `Education #${index + 1}: Missing degree`,
                description: 'Specify your degree or certification.',
                section: 'education',
                field: 'degree',
            });
        }
    });

    return issues;
}

function lintSkillsSection(skills: any): LintIssue[] {
    const issues: LintIssue[] = [];

    const allSkills = [
        ...(skills.simpleList || []),
        ...(skills.categories?.flatMap((c: any) => c.skills) || []),
    ];

    if (allSkills.length === 0) {
        issues.push({
            id: 'skills-missing',
            severity: 'warning',
            category: 'Skills',
            title: 'No skills listed',
            description: 'Skills help ATS match you with relevant job openings.',
            suggestion: 'Add your technical skills, tools, and technologies.',
            section: 'skills',
        });
    } else if (allSkills.length < 5) {
        issues.push({
            id: 'skills-too-few',
            severity: 'info',
            category: 'Skills',
            title: 'Consider adding more skills',
            description: 'Listing more relevant skills improves keyword matching.',
            section: 'skills',
        });
    }

    return issues;
}

function lintFormatting(resume: any, language: 'en' | 'ar'): LintIssue[] {
    const issues: LintIssue[] = [];

    // Check section headers match standard names
    // This would check the actual section titles vs STANDARD_HEADERS

    // Check for consistent date formats
    // This would analyze dates across all sections

    // Check overall length
    // A typical resume should be 1-2 pages

    return issues;
}

function calculateRecruiterScore(resume: any, issues: LintIssue[]): number {
    let score = 100;

    // Penalize for critical issues
    score -= issues.filter(i => i.severity === 'error').length * 15;
    score -= issues.filter(i => i.severity === 'warning').length * 5;

    // Bonus for quantified achievements
    const bullets = resume.experience?.items?.flatMap((e: any) => e.bullets || []) || [];
    const quantifiedBullets = bullets.filter((b: any) => {
        const content = typeof b === 'string' ? b : b.content;
        return QUANTIFICATION_PATTERNS.some(p => p.test(content || ''));
    });

    if (bullets.length > 0) {
        const quantifiedRatio = quantifiedBullets.length / bullets.length;
        score += quantifiedRatio * 10;
    }

    // Bonus for having a summary
    if (resume.summary?.content) {
        score += 5;
    }

    // Bonus for LinkedIn URL
    if (resume.contact?.linkedin) {
        score += 3;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
}

export function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
}

export function getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Needs Work';
    return 'Poor';
}
