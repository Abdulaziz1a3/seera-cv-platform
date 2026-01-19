// Resume Export Generators
// Supports PDF, DOCX, and TXT formats with ATS-safe templates

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import type { Resume } from '@/lib/resume-schema';
import { DEFAULT_TEMPLATE, type TemplateId } from '@/lib/resume-types';
import { getAllTemplateIds, getTemplate, getTemplateConfig } from '@/lib/templates';

// ATS-Safe Template Configuration
export interface ExportTemplateConfig {
    id: string;
    name: string;
    fontFamily: string;
    fontSize: {
        name: number;
        sectionTitle: number;
        body: number;
        small: number;
    };
    margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    lineSpacing: number;
    sectionSpacing: number;
}

const DEFAULT_DOCX_FONT = 'Calibri';

const mmToInches = (mm: number) => Number((mm / 25.4).toFixed(3));

const isTemplateId = (value: string): value is TemplateId => {
    const templateIds = getAllTemplateIds();
    return templateIds.includes(value as TemplateId);
};

export function resolveDocxTemplateConfig(templateId: string): ExportTemplateConfig {
    const resolvedId = isTemplateId(templateId) ? (templateId as TemplateId) : DEFAULT_TEMPLATE;
    const templateConfig = getTemplateConfig(resolvedId);
    const templateMeta = getTemplate(resolvedId);

    return {
        id: resolvedId,
        name: templateMeta.name.en,
        fontFamily: DEFAULT_DOCX_FONT,
        fontSize: {
            name: templateConfig.typography.nameSize,
            sectionTitle: templateConfig.typography.sectionHeaderSize,
            body: templateConfig.typography.bodySize,
            small: templateConfig.typography.smallSize,
        },
        margins: {
            top: mmToInches(templateConfig.margins.top),
            right: mmToInches(templateConfig.margins.right),
            bottom: mmToInches(templateConfig.margins.bottom),
            left: mmToInches(templateConfig.margins.left),
        },
        lineSpacing: 1.15,
        sectionSpacing: Math.max(8, Math.round(templateConfig.spacing.section)),
    };
}

// Generate filename following ATS rules: Firstname_Lastname_Role_YYYY
export function generateFileName(
    firstName: string,
    lastName: string,
    role?: string,
    format: 'pdf' | 'docx' | 'txt' = 'pdf'
): string {
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '');
    const year = new Date().getFullYear();
    const parts = [sanitize(firstName), sanitize(lastName)];
    if (role) parts.push(sanitize(role));
    parts.push(year.toString());
    return `${parts.join('_')}.${format}`;
}

// ===========================================
// PLAIN TEXT EXPORT
// ===========================================

export function generatePlainText(resume: Resume, language: 'en' | 'ar' = 'en'): string {
    const lines: string[] = [];
    const separator = '='.repeat(50);

    // Contact Information
    if (resume.contact) {
        lines.push(resume.contact.fullName.toUpperCase());
        const contactParts: string[] = [];
        if (resume.contact.email) contactParts.push(resume.contact.email);
        if (resume.contact.phone) contactParts.push(resume.contact.phone);
        if (resume.contact.location) contactParts.push(resume.contact.location);
        lines.push(contactParts.join(' | '));
        if (resume.contact.linkedin) lines.push(resume.contact.linkedin);
        if (resume.contact.website) lines.push(resume.contact.website);
        lines.push('');
    }

    // Summary
    if (resume.summary?.content) {
        lines.push(separator);
        lines.push(language === 'ar' ? 'الملخص المهني' : 'PROFESSIONAL SUMMARY');
        lines.push(separator);
        lines.push(resume.summary.content);
        lines.push('');
    }

    // Experience
    if (resume.experience?.items && resume.experience.items.length > 0) {
        lines.push(separator);
        lines.push(language === 'ar' ? 'الخبرة العملية' : 'EXPERIENCE');
        lines.push(separator);

        for (const exp of resume.experience.items) {
            lines.push(`${exp.position}`);
            lines.push(`${exp.company}${exp.location ? ` | ${exp.location}` : ''}`);
            const endDate = exp.isCurrent ? (language === 'ar' ? 'الحاضر' : 'Present') : exp.endDate;
            lines.push(`${exp.startDate} - ${endDate || 'Present'}`);

            if (exp.bullets && exp.bullets.length > 0) {
                for (const bullet of exp.bullets) {
                    const content = typeof bullet === 'string' ? bullet : bullet.content;
                    lines.push(`  - ${content}`);
                }
            }
            lines.push('');
        }
    }

    // Education
    if (resume.education?.items && resume.education.items.length > 0) {
        lines.push(separator);
        lines.push(language === 'ar' ? 'التعليم' : 'EDUCATION');
        lines.push(separator);

        for (const edu of resume.education.items) {
            lines.push(`${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`);
            lines.push(`${edu.institution}${edu.location ? ` | ${edu.location}` : ''}`);
            if (edu.startDate || edu.endDate) {
                lines.push(`${edu.startDate || ''} - ${edu.endDate || ''}`);
            }
            if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
            lines.push('');
        }
    }

    // Skills
    if (resume.skills) {
        lines.push(separator);
        lines.push(language === 'ar' ? 'المهارات' : 'SKILLS');
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

    // Certifications
    if (resume.certifications?.items && resume.certifications.items.length > 0) {
        lines.push(separator);
        lines.push(language === 'ar' ? 'الشهادات' : 'CERTIFICATIONS');
        lines.push(separator);

        for (const cert of resume.certifications.items) {
            let line = cert.name;
            if (cert.issuer) line += ` - ${cert.issuer}`;
            if (cert.issueDate) line += ` (${cert.issueDate})`;
            lines.push(`  - ${line}`);
        }
        lines.push('');
    }

    // Projects
    if (resume.projects?.items && resume.projects.items.length > 0) {
        lines.push(separator);
        lines.push(language === 'ar' ? 'المشاريع' : 'PROJECTS');
        lines.push(separator);

        for (const project of resume.projects.items) {
            lines.push(project.name);
            if (project.technologies && project.technologies.length > 0) {
                lines.push(`Technologies: ${project.technologies.join(', ')}`);
            }
            if (project.bullets && project.bullets.length > 0) {
                for (const bullet of project.bullets) {
                    const content = typeof bullet === 'string' ? bullet : bullet.content;
                    lines.push(`  - ${content}`);
                }
            }
            lines.push('');
        }
    }

    // Languages
    if (resume.languages?.items && resume.languages.items.length > 0) {
        lines.push(separator);
        lines.push(language === 'ar' ? 'اللغات' : 'LANGUAGES');
        lines.push(separator);

        for (const lang of resume.languages.items) {
            lines.push(`  - ${lang.language} - ${lang.proficiency}`);
        }
        lines.push('');
    }

    return lines.join('\n');
}

// ===========================================
// DOCX EXPORT
// ===========================================

export async function generateDocx(
    resume: Resume,
    templateId: string = DEFAULT_TEMPLATE,
    language: 'en' | 'ar' = 'en'
): Promise<Buffer> {
    const template = resolveDocxTemplateConfig(templateId);
    const sections: Paragraph[] = [];

    // Helper to create section heading
    const createHeading = (text: string) => {
        return new Paragraph({
            children: [
                new TextRun({
                    text: text.toUpperCase(),
                    bold: true,
                    font: template.fontFamily,
                    size: template.fontSize.sectionTitle * 2,
                }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: template.sectionSpacing * 20, after: 100 },
            border: {
                bottom: {
                    color: '000000',
                    space: 1,
                    size: 6,
                    style: BorderStyle.SINGLE,
                },
            },
        });
    };

    // Helper to create body text
    const createText = (text: string, options: { bold?: boolean; italic?: boolean } = {}) => {
        return new TextRun({
            text,
            font: template.fontFamily,
            size: template.fontSize.body * 2,
            bold: options.bold,
            italics: options.italic,
        });
    };

    // Contact Information
    if (resume.contact) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: resume.contact.fullName,
                        bold: true,
                        font: template.fontFamily,
                        size: template.fontSize.name * 2,
                    }),
                ],
                alignment: AlignmentType.CENTER,
            })
        );

        const contactParts: string[] = [];
        if (resume.contact.email) contactParts.push(resume.contact.email);
        if (resume.contact.phone) contactParts.push(resume.contact.phone);
        if (resume.contact.location) contactParts.push(resume.contact.location);

        if (contactParts.length > 0) {
            sections.push(
                new Paragraph({
                    children: [createText(contactParts.join(' | '))],
                    alignment: AlignmentType.CENTER,
                })
            );
        }

        if (resume.contact.linkedin || resume.contact.website) {
            const links: string[] = [];
            if (resume.contact.linkedin) links.push(resume.contact.linkedin);
            if (resume.contact.website) links.push(resume.contact.website);
            sections.push(
                new Paragraph({
                    children: [createText(links.join(' | '))],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                })
            );
        }
    }

    // Summary
    if (resume.summary?.content) {
        sections.push(createHeading(language === 'ar' ? 'الملخص المهني' : 'Professional Summary'));
        sections.push(
            new Paragraph({
                children: [createText(resume.summary.content)],
                spacing: { after: 100 },
            })
        );
    }

    // Experience
    if (resume.experience?.items && resume.experience.items.length > 0) {
        sections.push(createHeading(language === 'ar' ? 'الخبرة العملية' : 'Experience'));

        for (const exp of resume.experience.items) {
            // Position and Company
            sections.push(
                new Paragraph({
                    children: [
                        createText(exp.position, { bold: true }),
                        createText(` | ${exp.company}`),
                        exp.location ? createText(` | ${exp.location}`) : createText(''),
                    ],
                })
            );

            // Dates
            const endDate = exp.isCurrent ? (language === 'ar' ? 'الحاضر' : 'Present') : exp.endDate;
            sections.push(
                new Paragraph({
                    children: [createText(`${exp.startDate} - ${endDate || 'Present'}`, { italic: true })],
                })
            );

            // Bullets
            if (exp.bullets && exp.bullets.length > 0) {
                for (const bullet of exp.bullets) {
                    const content = typeof bullet === 'string' ? bullet : bullet.content;
                    sections.push(
                        new Paragraph({
                            children: [createText(`- ${content}`)],
                            indent: { left: 360 },
                        })
                    );
                }
            }

            sections.push(new Paragraph({ text: '' }));
        }
    }

    // Education
    if (resume.education?.items && resume.education.items.length > 0) {
        sections.push(createHeading(language === 'ar' ? 'التعليم' : 'Education'));

        for (const edu of resume.education.items) {
            sections.push(
                new Paragraph({
                    children: [
                        createText(`${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`, { bold: true }),
                    ],
                })
            );
            sections.push(
                new Paragraph({
                    children: [
                        createText(edu.institution),
                        edu.location ? createText(` | ${edu.location}`) : createText(''),
                    ],
                })
            );
            if (edu.startDate || edu.endDate) {
                sections.push(
                    new Paragraph({
                        children: [createText(`${edu.startDate || ''} - ${edu.endDate || ''}`, { italic: true })],
                    })
                );
            }
            sections.push(new Paragraph({ text: '' }));
        }
    }

    // Skills
    if (resume.skills) {
        sections.push(createHeading(language === 'ar' ? 'المهارات' : 'Skills'));

        if (resume.skills.categories && resume.skills.categories.length > 0) {
            for (const category of resume.skills.categories) {
                sections.push(
                    new Paragraph({
                        children: [
                            createText(`${category.name}: `, { bold: true }),
                            createText(category.skills.join(', ')),
                        ],
                    })
                );
            }
        } else if (resume.skills.simpleList && resume.skills.simpleList.length > 0) {
            sections.push(
                new Paragraph({
                    children: [createText(resume.skills.simpleList.join(', '))],
                })
            );
        }
    }

    // Create document
    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: template.margins.top * 1440,
                            right: template.margins.right * 1440,
                            bottom: template.margins.bottom * 1440,
                            left: template.margins.left * 1440,
                        },
                    },
                },
                children: sections,
            },
        ],
    });

    return await Packer.toBuffer(doc);
}

// ===========================================
// PDF EXPORT (HTML Template for Puppeteer)
// ===========================================

export function generatePdfHtml(
    resume: Resume,
    templateId: string = DEFAULT_TEMPLATE,
    language: 'en' | 'ar' = 'en'
): string {
    const template = resolveDocxTemplateConfig(templateId);
    const isRtl = language === 'ar';
    const dir = isRtl ? 'rtl' : 'ltr';

    const styles = `
    @page {
      size: letter;
      margin: ${template.margins.top}in ${template.margins.right}in ${template.margins.bottom}in ${template.margins.left}in;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: ${template.fontFamily}, sans-serif;
      font-size: ${template.fontSize.body}pt;
      line-height: ${template.lineSpacing};
      color: #000;
      direction: ${dir};
    }
    .container {
      max-width: 100%;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .name {
      font-size: ${template.fontSize.name}pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .contact-info {
      font-size: ${template.fontSize.small}pt;
      color: #333;
    }
    .section {
      margin-bottom: ${template.sectionSpacing}pt;
    }
    .section-title {
      font-size: ${template.fontSize.sectionTitle}pt;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 3px;
      margin-bottom: 10px;
    }
    .entry {
      margin-bottom: 12px;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .entry-title {
      font-weight: bold;
    }
    .entry-subtitle {
      color: #333;
    }
    .entry-date {
      font-style: italic;
      font-size: ${template.fontSize.small}pt;
    }
    .bullets {
      padding-${isRtl ? 'right' : 'left'}: 20px;
      margin-top: 5px;
    }
    .bullet {
      margin-bottom: 3px;
    }
    .skills-list {
      line-height: 1.6;
    }
  `;

    let html = `
<!DOCTYPE html>
<html lang="${language}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <style>${styles}</style>
</head>
<body>
  <div class="container">
`;

    // Contact Information
    if (resume.contact) {
        const contactParts: string[] = [];
        if (resume.contact.email) contactParts.push(resume.contact.email);
        if (resume.contact.phone) contactParts.push(resume.contact.phone);
        if (resume.contact.location) contactParts.push(resume.contact.location);

        html += `
    <div class="header">
      <div class="name">${escapeHtml(resume.contact.fullName)}</div>
      <div class="contact-info">${contactParts.map(escapeHtml).join(' | ')}</div>
      ${resume.contact.linkedin ? `<div class="contact-info">${escapeHtml(resume.contact.linkedin)}</div>` : ''}
    </div>
`;
    }

    // Summary
    if (resume.summary?.content) {
        html += `
    <div class="section">
      <div class="section-title">${isRtl ? 'الملخص المهني' : 'Professional Summary'}</div>
      <p>${escapeHtml(resume.summary.content)}</p>
    </div>
`;
    }

    // Experience
    if (resume.experience?.items && resume.experience.items.length > 0) {
        html += `
    <div class="section">
      <div class="section-title">${isRtl ? 'الخبرة العملية' : 'Experience'}</div>
`;
        for (const exp of resume.experience.items) {
            const endDate = exp.isCurrent ? (isRtl ? 'الحاضر' : 'Present') : exp.endDate;
            html += `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${escapeHtml(exp.position)}</span>
          <span class="entry-date">${escapeHtml(exp.startDate)} - ${escapeHtml(endDate || 'Present')}</span>
        </div>
        <div class="entry-subtitle">${escapeHtml(exp.company)}${exp.location ? ` | ${escapeHtml(exp.location)}` : ''}</div>
`;
            if (exp.bullets && exp.bullets.length > 0) {
                html += `<ul class="bullets">`;
                for (const bullet of exp.bullets) {
                    const content = typeof bullet === 'string' ? bullet : bullet.content;
                    html += `<li class="bullet">${escapeHtml(content)}</li>`;
                }
                html += `</ul>`;
            }
            html += `</div>`;
        }
        html += `</div>`;
    }

    // Education
    if (resume.education?.items && resume.education.items.length > 0) {
        html += `
    <div class="section">
      <div class="section-title">${isRtl ? 'التعليم' : 'Education'}</div>
`;
        for (const edu of resume.education.items) {
            html += `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${escapeHtml(edu.degree)}${edu.field ? ` in ${escapeHtml(edu.field)}` : ''}</span>
          <span class="entry-date">${edu.startDate || ''} - ${edu.endDate || ''}</span>
        </div>
        <div class="entry-subtitle">${escapeHtml(edu.institution)}${edu.location ? ` | ${escapeHtml(edu.location)}` : ''}</div>
      </div>
`;
        }
        html += `</div>`;
    }

    // Skills
    if (resume.skills) {
        html += `
    <div class="section">
      <div class="section-title">${isRtl ? 'المهارات' : 'Skills'}</div>
      <div class="skills-list">
`;
        if (resume.skills.categories && resume.skills.categories.length > 0) {
            for (const category of resume.skills.categories) {
                html += `<div><strong>${escapeHtml(category.name)}:</strong> ${category.skills.map(escapeHtml).join(', ')}</div>`;
            }
        } else if (resume.skills.simpleList && resume.skills.simpleList.length > 0) {
            html += resume.skills.simpleList.map(escapeHtml).join(', ');
        }
        html += `</div></div>`;
    }

    html += `
  </div>
</body>
</html>`;

    return html;
}

function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Export format type
export type ExportFormat = 'pdf' | 'docx' | 'txt';

// Main export function
export async function exportResume(
    resume: Resume,
    format: ExportFormat,
    templateId: string = 'classic'
): Promise<{ data: Buffer | string; contentType: string; fileName: string }> {
    const firstName = resume.contact?.fullName?.split(' ')[0] || 'Resume';
    const lastName = resume.contact?.fullName?.split(' ').slice(1).join(' ') || '';
    const fileName = generateFileName(firstName, lastName, resume.targetRole, format);
    const language = resume.language || 'en';

    switch (format) {
        case 'txt': {
            const text = generatePlainText(resume, language);
            return {
                data: Buffer.from(text, 'utf-8'),
                contentType: 'text/plain',
                fileName,
            };
        }
        case 'docx': {
            const buffer = await generateDocx(resume, templateId, language);
            return {
                data: buffer,
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                fileName,
            };
        }
        case 'pdf': {
            // For PDF, return the HTML that should be rendered by Puppeteer
            const html = generatePdfHtml(resume, templateId, language);
            return {
                data: html,
                contentType: 'text/html',
                fileName,
            };
        }
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}
