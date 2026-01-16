// Resume Export Utilities
// Server-side PDF generation with puppeteer or client-side with html2pdf

import { jsPDF } from 'jspdf';
import type { ResumeData } from '@/lib/resume-types';

// ATS-safe fonts
const FONTS = {
    heading: 'Helvetica',
    body: 'Helvetica',
};

// Colors
const COLORS = {
    primary: '#2563eb',
    text: '#1f2937',
    muted: '#6b7280',
    border: '#e5e7eb',
};

// Export resume to PDF (client-side)
export async function exportToPDF(resume: ResumeData, template: string = 'professional'): Promise<Blob> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Helper functions
    const addText = (text: string, x: number, y: number, options: {
        fontSize?: number;
        fontStyle?: 'normal' | 'bold';
        color?: string;
        maxWidth?: number;
    } = {}) => {
        const { fontSize = 10, fontStyle = 'normal', color = COLORS.text, maxWidth } = options;
        doc.setFontSize(fontSize);
        doc.setFont(FONTS.body, fontStyle);
        doc.setTextColor(color);

        if (maxWidth) {
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y);
            return lines.length * (fontSize * 0.35);
        }
        doc.text(text, x, y);
        return fontSize * 0.35;
    };

    const addSection = (title: string) => {
        yPos += 8;
        // Section line
        doc.setDrawColor(COLORS.primary);
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        // Section title
        addText(title.toUpperCase(), margin, yPos, { fontSize: 11, fontStyle: 'bold', color: COLORS.primary });
        yPos += 6;
    };

    // Header - Name and Contact
    const contact = resume.contact;

    // Name
    addText(contact.fullName, pageWidth / 2, yPos, { fontSize: 24, fontStyle: 'bold' });
    yPos += 10;

    // Contact line
    const contactItems = [
        contact.email,
        contact.phone,
        contact.location,
        contact.linkedin,
        contact.website,
    ].filter(Boolean);

    const contactText = contactItems.join('  |  ');
    addText(contactText, pageWidth / 2, yPos, { fontSize: 9, color: COLORS.muted });
    yPos += 10;

    // Summary
    if (resume.summary) {
        addSection('Professional Summary');
        const summaryHeight = addText(resume.summary, margin, yPos, {
            maxWidth: pageWidth - 2 * margin,
            color: COLORS.text,
        });
        yPos += summaryHeight + 5;
    }

    // Experience
    if (resume.experience && resume.experience.length > 0) {
        addSection('Experience');

        for (const exp of resume.experience) {
            // Position and company
            addText(exp.position, margin, yPos, { fontSize: 11, fontStyle: 'bold' });
            addText(`${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`, pageWidth - margin, yPos, {
                fontSize: 9,
                color: COLORS.muted
            });
            yPos += 5;

            addText(`${exp.company} | ${exp.location}`, margin, yPos, { fontSize: 10, color: COLORS.muted });
            yPos += 6;

            // Bullets
            if (exp.bullets) {
                for (const bullet of exp.bullets) {
                    addText(`- ${bullet}`, margin + 3, yPos, {
                        maxWidth: pageWidth - 2 * margin - 3,
                        fontSize: 10,
                    });
                    yPos += 5;
                }
            }
            yPos += 3;
        }
    }

    // Education
    if (resume.education && resume.education.length > 0) {
        addSection('Education');

        for (const edu of resume.education) {
            addText(`${edu.degree} in ${edu.field}`, margin, yPos, { fontSize: 11, fontStyle: 'bold' });
            addText(edu.graduationDate, pageWidth - margin, yPos, { fontSize: 9, color: COLORS.muted });
            yPos += 5;

            addText(`${edu.institution} | ${edu.location}`, margin, yPos, { fontSize: 10, color: COLORS.muted });
            if (edu.gpa) {
                yPos += 4;
                addText(`GPA: ${edu.gpa}`, margin, yPos, { fontSize: 9 });
            }
            yPos += 6;
        }
    }

    // Skills
    if (resume.skills && resume.skills.length > 0) {
        addSection('Skills');
        const skillsText = resume.skills.join('  |  ');
        addText(skillsText, margin, yPos, { maxWidth: pageWidth - 2 * margin });
        yPos += 8;
    }

    // Projects
    if (resume.projects && resume.projects.length > 0) {
        addSection('Projects');

        for (const project of resume.projects) {
            addText(project.name, margin, yPos, { fontSize: 11, fontStyle: 'bold' });
            yPos += 5;

            if (project.description) {
                const descHeight = addText(project.description, margin, yPos, {
                    maxWidth: pageWidth - 2 * margin,
                    fontSize: 10,
                });
                yPos += descHeight + 3;
            }

            if (project.technologies && project.technologies.length > 0) {
                addText(`Technologies: ${project.technologies.join(', ')}`, margin, yPos, {
                    fontSize: 9,
                    color: COLORS.muted
                });
                yPos += 6;
            }
        }
    }

    // Certifications
    if (resume.certifications && resume.certifications.length > 0) {
        addSection('Certifications');

        for (const cert of resume.certifications) {
            addText(`${cert.name} - ${cert.issuer}`, margin, yPos, { fontSize: 10 });
            addText(cert.date, pageWidth - margin, yPos, { fontSize: 9, color: COLORS.muted });
            yPos += 5;
        }
    }

    // Languages
    if (resume.languages && resume.languages.length > 0) {
        addSection('Languages');
        const langText = resume.languages.map(l => `${l.name} (${l.proficiency})`).join('  |  ');
        addText(langText, margin, yPos);
    }

    return doc.output('blob');
}

// Export to plain text (ATS-safe)
export function exportToText(resume: ResumeData): string {
    let text = '';
    const divider = '\n' + '='.repeat(50) + '\n\n';

    // Contact
    text += resume.contact.fullName.toUpperCase() + '\n';
    text += [
        resume.contact.email,
        resume.contact.phone,
        resume.contact.location,
        resume.contact.linkedin,
        resume.contact.website,
    ].filter(Boolean).join(' | ') + '\n';

    // Summary
    if (resume.summary) {
        text += divider;
        text += 'PROFESSIONAL SUMMARY\n\n';
        text += resume.summary + '\n';
    }

    // Experience
    if (resume.experience?.length) {
        text += divider;
        text += 'EXPERIENCE\n\n';
        for (const exp of resume.experience) {
            text += `${exp.position}\n`;
            text += `${exp.company} | ${exp.location} | ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`;
            if (exp.bullets) {
                for (const bullet of exp.bullets) {
                    text += `- ${bullet}\n`;
                }
            }
            text += '\n';
        }
    }

    // Education
    if (resume.education?.length) {
        text += divider;
        text += 'EDUCATION\n\n';
        for (const edu of resume.education) {
            text += `${edu.degree} in ${edu.field}\n`;
            text += `${edu.institution} | ${edu.location} | ${edu.graduationDate}\n`;
            if (edu.gpa) text += `GPA: ${edu.gpa}\n`;
            text += '\n';
        }
    }

    // Skills
    if (resume.skills?.length) {
        text += divider;
        text += 'SKILLS\n\n';
        text += resume.skills.join(' | ') + '\n';
    }

    return text;
}

// Generate filename
export function getExportFilename(resume: ResumeData, format: 'pdf' | 'docx' | 'txt'): string {
    const sanitizedName = resume.contact.fullName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_');
    return `${sanitizedName}_resume.${format}`;
}
