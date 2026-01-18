import type { Resume } from '@/lib/resume-schema';

export type AtsPlainTextLabels = {
    summary: string;
    experience: string;
    education: string;
    skills: string;
    certifications: string;
    projects: string;
    languages: string;
    present: string;
};

const DEFAULT_LABELS: AtsPlainTextLabels = {
    summary: 'PROFESSIONAL SUMMARY',
    experience: 'EXPERIENCE',
    education: 'EDUCATION',
    skills: 'SKILLS',
    certifications: 'CERTIFICATIONS',
    projects: 'PROJECTS',
    languages: 'LANGUAGES',
    present: 'Present',
};

export function generateAtsPlainText(
    resume: Resume,
    labels: AtsPlainTextLabels = DEFAULT_LABELS
): string {
    const lines: string[] = [];
    const separator = '='.repeat(50);

    if (resume.contact) {
        lines.push((resume.contact.fullName || '').toUpperCase());
        const contactParts: string[] = [];
        if (resume.contact.email) contactParts.push(resume.contact.email);
        if (resume.contact.phone) contactParts.push(resume.contact.phone);
        if (resume.contact.location) contactParts.push(resume.contact.location);
        lines.push(contactParts.join(' | '));
        if (resume.contact.linkedin) lines.push(resume.contact.linkedin);
        if (resume.contact.website) lines.push(resume.contact.website);
        lines.push('');
    }

    if (resume.summary?.content) {
        lines.push(separator);
        lines.push(labels.summary);
        lines.push(separator);
        lines.push(resume.summary.content);
        lines.push('');
    }

    if (resume.experience?.items && resume.experience.items.length > 0) {
        lines.push(separator);
        lines.push(labels.experience);
        lines.push(separator);

        for (const exp of resume.experience.items) {
            lines.push(`${exp.position || ''}`.trim());
            const companyLine = [
                exp.company || '',
                exp.location ? ` | ${exp.location}` : '',
            ].join('').trim();
            if (companyLine) lines.push(companyLine);
            const endDate = exp.isCurrent ? labels.present : exp.endDate;
            if (exp.startDate || endDate) {
                lines.push(`${exp.startDate || ''} - ${endDate || ''}`.trim());
            }

            if (exp.bullets && exp.bullets.length > 0) {
                for (const bullet of exp.bullets) {
                    const content = typeof bullet === 'string' ? bullet : bullet.content;
                    if (content) lines.push(`  - ${content}`);
                }
            }
            lines.push('');
        }
    }

    if (resume.education?.items && resume.education.items.length > 0) {
        lines.push(separator);
        lines.push(labels.education);
        lines.push(separator);

        for (const edu of resume.education.items) {
            const degreeLine = [
                edu.degree || '',
                edu.field ? ` in ${edu.field}` : '',
            ].join('').trim();
            if (degreeLine) lines.push(degreeLine);
            const institutionLine = [
                edu.institution || '',
                edu.location ? ` | ${edu.location}` : '',
            ].join('').trim();
            if (institutionLine) lines.push(institutionLine);
            if (edu.startDate || edu.endDate) {
                lines.push(`${edu.startDate || ''} - ${edu.endDate || ''}`.trim());
            }
            if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
            lines.push('');
        }
    }

    if (resume.skills) {
        lines.push(separator);
        lines.push(labels.skills);
        lines.push(separator);

        if (resume.skills.categories && resume.skills.categories.length > 0) {
            for (const category of resume.skills.categories) {
                lines.push(`${category.name}: ${category.skills.join(', ')}`);
            }
        } else if (resume.skills.simpleList && resume.skills.simpleList.length > 0) {
            lines.push(resume.skills.simpleList.join(', '));
        }
        lines.push('');
    }

    if (resume.certifications?.items && resume.certifications.items.length > 0) {
        lines.push(separator);
        lines.push(labels.certifications);
        lines.push(separator);

        for (const cert of resume.certifications.items) {
            let line = cert.name;
            if (cert.issuer) line += ` - ${cert.issuer}`;
            if (cert.issueDate) line += ` (${cert.issueDate})`;
            lines.push(`  - ${line}`);
        }
        lines.push('');
    }

    if (resume.projects?.items && resume.projects.items.length > 0) {
        lines.push(separator);
        lines.push(labels.projects);
        lines.push(separator);

        for (const project of resume.projects.items) {
            if (project.name) lines.push(project.name);
            if (project.technologies && project.technologies.length > 0) {
                lines.push(`Technologies: ${project.technologies.join(', ')}`);
            }
            if (project.bullets && project.bullets.length > 0) {
                for (const bullet of project.bullets) {
                    const content = typeof bullet === 'string' ? bullet : bullet.content;
                    if (content) lines.push(`  - ${content}`);
                }
            }
            lines.push('');
        }
    }

    if (resume.languages?.items && resume.languages.items.length > 0) {
        lines.push(separator);
        lines.push(labels.languages);
        lines.push(separator);

        for (const lang of resume.languages.items) {
            lines.push(`  - ${lang.language} - ${lang.proficiency}`);
        }
        lines.push('');
    }

    return lines.join('\n').trim();
}
