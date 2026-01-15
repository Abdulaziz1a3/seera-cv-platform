// Professional CV Template Renderer
// Creates beautiful, visually stunning resumes with multiple template styles

import { jsPDF } from 'jspdf';
import type { ResumeData } from '@/components/providers/resume-provider';

export type TemplateLayout = 'modern' | 'executive' | 'creative' | 'minimalist' | 'professional' | 'startup';
export type ThemeColor = 'obsidian' | 'oceanic' | 'emerald' | 'amethyst' | 'slate';

interface ThemePalette {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    muted: string;
    bg: string;
}

// 2. Curated Color Themes (Vibe)
export const THEMES: Record<ThemeColor, ThemePalette> = {
    obsidian: { // Classic Luxury
        primary: '#1f2937',      // Charcoal
        secondary: '#000000',    // Black
        accent: '#d4af37',       // Gold
        text: '#111827',         // Near black
        muted: '#4b5563',        // Gray
        bg: '#ffffff',
    },
    oceanic: { // Trust & Tech
        primary: '#0f172a',      // Navy
        secondary: '#1e293b',    // Slate
        accent: '#0ea5e9',       // Sky Blue
        text: '#0f172a',
        muted: '#64748b',
        bg: '#f8fafc',           // Ice white
    },
    emerald: { // Growth & Nature
        primary: '#064e3b',      // Forest
        secondary: '#065f46',    // Jungle
        accent: '#10b981',       // Emerald
        text: '#022c22',
        muted: '#374151',
        bg: '#f0fdf4',           // Mint tint
    },
    amethyst: { // Creative & Bold
        primary: '#4c1d95',      // Deep Purple
        secondary: '#5b21b6',    // Violet
        accent: '#a78bfa',       // Lavender
        text: '#2e1065',
        muted: '#4b5563',
        bg: '#faf5ff',
    },
    slate: { // Modern & Clean
        primary: '#334155',      // Dark Slate
        secondary: '#475569',    // Slate
        accent: '#fb7185',       // Coral
        text: '#1e293b',
        muted: '#94a3b8',
        bg: '#ffffff',
    }
};

export const LAYOUTS: { id: TemplateLayout; name: { en: string; ar: string }; description: { en: string; ar: string }; premium: boolean }[] = [
    {
        id: 'executive',
        name: { en: 'Master Executive', ar: 'ماستر تنفيذي' },
        description: { en: 'Executive layout with bold name + clean sections.', ar: 'قالب تنفيذي مع اسم بارز وأقسام مرتبة.' },
        premium: false,
    },
    {
        // NOTE: we keep the underlying id as "modern" for backwards compatibility,
        // but present it to users as the "Master Split" template.
        id: 'modern',
        name: { en: 'Master Split', ar: 'ماستر مقسّم' },
        description: { en: 'Split layout with dark sidebar + strong hierarchy.', ar: 'قالب مقسّم مع شريط جانبي داكن وتسلسل واضح.' },
        premium: false,
    },
    {
        id: 'creative',
        name: { en: 'Master Creative', ar: 'ماستر إبداعي' },
        description: { en: 'Bold hero header + modern two-column content.', ar: 'رأس جريء مع تخطيط عمودين حديث.' },
        premium: false,
    },
];

// Helper functions
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ==========================================
// 1. MASTER SPLIT (modern id) - Two column, dark sidebar
// ==========================================
function renderModernTemplate(doc: jsPDF, resume: ResumeData, colors: ThemePalette) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const sidebarWidth = 65;

    // Sidebar background (darker for "Master Split" feel)
    const sidebarColor = colors.secondary || colors.primary;
    doc.setFillColor(hexToRgb(sidebarColor).r, hexToRgb(sidebarColor).g, hexToRgb(sidebarColor).b);
    doc.rect(0, 0, sidebarWidth, pageHeight, 'F');

    // Sidebar content
    let sideY = 25;

    // Avatar circle placeholder (optional)
    doc.setFillColor(255, 255, 255, 0.12);
    doc.circle(sidebarWidth / 2, sideY + 8, 10, 'F');
    sideY += 26;

    // Contact section in sidebar (Master Split style)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTACT', 7, sideY);
    sideY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (resume.contact.email) {
        doc.text('✉', 7, sideY);
        const emailLines = doc.splitTextToSize(resume.contact.email, sidebarWidth - 15);
        emailLines.forEach((line: string) => {
            doc.text(line, 14, sideY);
            sideY += 5;
        });
    }
    if (resume.contact.phone) {
        doc.text('📱', 7, sideY);
        doc.text(resume.contact.phone, 14, sideY);
        sideY += 5;
    }
    if (resume.contact.location) {
        doc.text('📍', 7, sideY);
        doc.text(resume.contact.location, 14, sideY);
        sideY += 5;
    }
    if (resume.contact.linkedin) {
        sideY += 2;
        doc.text('🔗', 7, sideY);
        const linkedInLines = doc.splitTextToSize(resume.contact.linkedin.replace('https://', ''), sidebarWidth - 15);
        linkedInLines.forEach((line: string) => {
            doc.text(line, 14, sideY);
            sideY += 5;
        });
    }

    // Skills in sidebar
    if (resume.skills.length > 0) {
        sideY += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('SKILLS', 7, sideY);
        sideY += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        resume.skills.slice(0, 15).forEach((skill) => {
            // Skill pill
            doc.setFillColor(255, 255, 255, 0.2);
            doc.roundedRect(7, sideY - 3.5, sidebarWidth - 14, 5, 1, 1, 'F');
            doc.text(skill, 9, sideY);
            sideY += 7;
        });
    }

    // Languages in sidebar
    if (resume.languages && resume.languages.length > 0) {
        sideY += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('LANGUAGES', 5, sideY);
        sideY += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        resume.languages.forEach((lang) => {
            doc.text(`${lang.name} - ${lang.proficiency}`, 5, sideY);
            sideY += 5;
        });
    }

    // Main content area
    let mainY = 20;
    const mainX = sidebarWidth + 10;
    const mainWidth = pageWidth - sidebarWidth - 20;

    // Big name + role in main content (Master Split)
    doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    const fullName = (resume.contact.fullName || 'Your Name').toUpperCase();
    const nameLinesMain = doc.splitTextToSize(fullName, mainWidth);
    nameLinesMain.forEach((line: string) => {
        doc.text(line, mainX, mainY);
        mainY += 9;
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
    if (resume.title) {
        doc.text(resume.title.toUpperCase(), mainX, mainY);
        mainY += 10;
    } else {
        mainY += 6;
    }

    // Summary
    if (resume.summary) {
        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        // Blue-accent left border feel
        doc.setDrawColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
        doc.setLineWidth(2);
        doc.line(mainX, mainY - 3, mainX, mainY + 5);
        doc.text('PROFILE', mainX + 4, mainY);
        mainY += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
        const summaryLines = doc.splitTextToSize(resume.summary, mainWidth);
        summaryLines.forEach((line: string) => {
            doc.text(line, mainX, mainY);
            mainY += 5;
        });
        mainY += 8;
    }

    // Experience
    if (resume.experience.length > 0) {
        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setDrawColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
        doc.setLineWidth(2);
        doc.line(mainX, mainY - 3, mainX, mainY + 5);
        doc.text('EXPERIENCE', mainX + 4, mainY);
        mainY += 10;

        resume.experience.forEach((exp) => {
            if (mainY > pageHeight - 30) {
                doc.addPage();
                mainY = 20;
            }

            // Position & Company
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            doc.text(exp.position || 'Position', mainX, mainY);

            // Date range
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
            const dateText = `${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`;
            doc.text(dateText, pageWidth - 15 - doc.getTextWidth(dateText), mainY);
            mainY += 5;

            // Company
            doc.setFontSize(10);
            doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
            doc.text(`${exp.company}${exp.location ? ' | ' + exp.location : ''}`, mainX, mainY);
            mainY += 5;

            // Bullets
            doc.setFontSize(9);
            exp.bullets.filter(b => b.trim()).forEach((bullet) => {
                doc.setTextColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
                doc.text('▸', mainX, mainY);
                doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
                const bulletLines = doc.splitTextToSize(bullet, mainWidth - 8);
                bulletLines.forEach((line: string, i: number) => {
                    doc.text(line, mainX + 5, mainY);
                    mainY += 4.5;
                });
            });
            mainY += 5;
        });
        mainY += 5;
    }

    // Education
    if (resume.education.length > 0) {
        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('EDUCATION', mainX, mainY);
        mainY += 3;
        doc.setDrawColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
        doc.line(mainX, mainY, mainX + 28, mainY);
        mainY += 6;

        resume.education.forEach((edu) => {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            doc.text(`${edu.degree}${edu.field ? ' in ' + edu.field : ''}`, mainX, mainY);
            mainY += 5;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
            doc.text(edu.institution, mainX, mainY);
            if (edu.graduationDate) {
                doc.setTextColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
                doc.text(formatDate(edu.graduationDate), pageWidth - 15 - doc.getTextWidth(formatDate(edu.graduationDate)), mainY);
            }
            mainY += 7;
        });
    }
}

// ==========================================
// 2. MASTER EXECUTIVE - Clean header, section dividers (based on provided HTML)
// ==========================================
function renderExecutiveTemplate(doc: jsPDF, resume: ResumeData, colors: ThemePalette) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 25;

    // Header divider line (like HTML border-bottom)
    doc.setDrawColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
    doc.setLineWidth(0.8);

    // Name (uppercase, left)
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
    doc.text((resume.contact.fullName || 'Your Name').toUpperCase(), margin, y);
    y += 8;

    // Role / title (use resume.title if available)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
    if (resume.title) {
        doc.text(resume.title, margin, y);
        y += 6;
    }

    // Contact info row
    doc.setFontSize(9.5);
    const contactParts = [resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean);
    if (contactParts.length) {
        doc.text(contactParts.join('  •  '), margin, y);
        y += 6;
    }

    // Divider under header
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Summary
    if (resume.summary) {
        // Section title
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
        doc.text('PROFESSIONAL SUMMARY', margin, y);
        y += 4;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
        const summaryLines = doc.splitTextToSize(resume.summary, pageWidth - 2 * margin);
        summaryLines.forEach((line: string) => {
            doc.text(line, margin, y);
            y += 5;
        });
        y += 6;
    }

    // Section header helper
    const addSectionHeader = (title: string) => {
        y += 4;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
        doc.text(title, margin, y);
        y += 2;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
    };

    // Experience
    if (resume.experience.length > 0) {
        addSectionHeader('PROFESSIONAL EXPERIENCE');

        resume.experience.forEach((exp) => {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            doc.text(exp.position, margin, y);

            // Date
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
            const dateText = `${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`;
            doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), y);
            y += 5;

            doc.setFontSize(10);
            doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
            doc.text(exp.company, margin, y);
            y += 5;

            doc.setFontSize(9);
            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            exp.bullets.filter(b => b.trim()).forEach((bullet) => {
                const bulletLines = doc.splitTextToSize(`• ${bullet}`, pageWidth - 2 * margin);
                bulletLines.forEach((line: string) => {
                    doc.text(line, margin + 2, y);
                    y += 4.5;
                });
            });
            y += 5;
        });
    }

    // Education
    if (resume.education.length > 0) {
        addSectionHeader('EDUCATION');

        resume.education.forEach((edu) => {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            doc.text(`${edu.degree}${edu.field ? ' in ' + edu.field : ''}`, margin, y);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
            if (edu.graduationDate) {
                doc.text(formatDate(edu.graduationDate), pageWidth - margin - doc.getTextWidth(formatDate(edu.graduationDate)), y);
            }
            y += 5;

            doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
            doc.text(edu.institution, margin, y);
            y += 7;
        });
    }

    // Skills
    if (resume.skills.length > 0) {
        addSectionHeader('CORE COMPETENCIES');
        doc.setFontSize(10);
        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
        const skillsText = resume.skills.join('  ◆  ');
        const skillLines = doc.splitTextToSize(skillsText, pageWidth - 2 * margin);
        skillLines.forEach((line: string) => {
            doc.text(line, pageWidth / 2, y, { align: 'center' });
            y += 5;
        });
    }
}

// ==========================================
// 3. MINIMALIST TEMPLATE - Clean, lots of space
// ==========================================
function renderMinimalistTemplate(doc: jsPDF, resume: ResumeData, colors: ThemePalette) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 25;
    let y = 30;

    // Name - large and bold
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
    doc.text(resume.contact.fullName || 'Your Name', margin, y);
    y += 12;

    // Contact - simple line
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
    const contactLine = [resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join(' / ');
    doc.text(contactLine, margin, y);
    y += 15;

    // Thin line
    doc.setDrawColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;

    const addSection = (title: string) => {
        y += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
        doc.text(title.toUpperCase(), margin, y);
        y += 8;
        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
    };

    // Summary
    if (resume.summary) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(resume.summary, pageWidth - 2 * margin);
        summaryLines.forEach((line: string) => {
            doc.text(line, margin, y);
            y += 6;
        });
        y += 10;
    }

    // Experience
    if (resume.experience.length > 0) {
        addSection('Experience');

        resume.experience.forEach((exp) => {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(exp.position, margin, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
            const dateText = ` — ${exp.company}, ${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`;
            doc.text(dateText, margin + doc.getTextWidth(exp.position), y);
            y += 6;

            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            doc.setFontSize(10);
            exp.bullets.filter(b => b.trim()).forEach((bullet) => {
                const bulletLines = doc.splitTextToSize(`– ${bullet}`, pageWidth - 2 * margin - 5);
                bulletLines.forEach((line: string) => {
                    doc.text(line, margin + 3, y);
                    y += 5;
                });
            });
            y += 6;
        });
    }

    // Education
    if (resume.education.length > 0) {
        addSection('Education');

        resume.education.forEach((edu) => {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`${edu.degree}${edu.field ? ', ' + edu.field : ''}`, margin, y);
            y += 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
            doc.text(`${edu.institution}${edu.graduationDate ? ', ' + formatDate(edu.graduationDate) : ''}`, margin, y);
            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            y += 8;
        });
    }

    // Skills
    if (resume.skills.length > 0) {
        addSection('Skills');
        doc.setFontSize(10);
        doc.text(resume.skills.join(', '), margin, y);
    }
}

// ==========================================
// 4. MASTER CREATIVE - Hero header + two columns (based on provided HTML)
// ==========================================
function renderCreativeTemplate(doc: jsPDF, resume: ResumeData, colors: ThemePalette) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;

    // Hero header block
    const headerH = 55;
    doc.setFillColor(hexToRgb(colors.secondary).r, hexToRgb(colors.secondary).g, hexToRgb(colors.secondary).b);
    doc.rect(0, 0, pageWidth, headerH, 'F');

    // Accent stripe (left)
    doc.setFillColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
    doc.rect(margin, 18, 2, 26, 'F');

    // Name (uppercase) + role
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    const name = (resume.contact.fullName || 'Your Name').toUpperCase();
    const nameLines = doc.splitTextToSize(name, pageWidth - 2 * margin - 6);
    let nameY = 26;
    nameLines.slice(0, 2).forEach((line: string) => {
        doc.text(line, margin + 6, nameY);
        nameY += 10;
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
    if (resume.title) {
        doc.text(resume.title.toUpperCase(), margin + 6, 44);
    }

    // Contact bar (below header)
    let y = headerH + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
    const contactBar = [resume.contact.email, resume.contact.phone].filter(Boolean).join('   ');
    if (contactBar) {
        doc.text(contactBar, pageWidth - margin, y, { align: 'right' });
        y += 10;
    }

    // Two columns content
    const gap = 10;
    const leftW = 55; // ~30%
    const rightX = margin + leftW + gap;
    const rightW = pageWidth - rightX - margin;
    let leftY = y;
    let rightY = y;

    // Left: Skills
    const addCreativeSectionTitle = (title: string, x: number, yy: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
        // Dot indicator
        doc.setFillColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
        doc.circle(x + 2, yy - 2, 2, 'F');
        doc.text(title.toUpperCase(), x + 7, yy);
        return yy + 8;
    };

    if (resume.skills.length > 0) {
        leftY = addCreativeSectionTitle('Skills', margin, leftY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        resume.skills.slice(0, 18).forEach((skill) => {
            const pillW = Math.min(leftW, doc.getTextWidth(skill) + 10);
            doc.setFillColor(223, 230, 233); // dfe6e9
            doc.roundedRect(margin, leftY - 4, pillW, 7, 3.5, 3.5, 'F');
            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            doc.text(skill, margin + 4, leftY);
            leftY += 9;
        });
    }

    // Right: Summary + Experience
    if (resume.summary) {
        rightY = addCreativeSectionTitle('Profile', rightX, rightY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
        doc.splitTextToSize(resume.summary, rightW).forEach((line: string) => {
            doc.text(line, rightX, rightY);
            rightY += 5;
        });
        rightY += 6;
    }

    if (resume.experience.length > 0) {
        rightY = addCreativeSectionTitle('Experience', rightX, rightY);
        resume.experience.forEach((exp) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            doc.text(exp.position || 'Position', rightX, rightY);
            rightY += 5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
            const meta = `${exp.company}${exp.company ? ' • ' : ''}${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`;
            doc.text(meta, rightX, rightY);
            rightY += 5;

            doc.setFontSize(9.5);
            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            exp.bullets.filter(b => b.trim()).slice(0, 2).forEach((b) => {
                doc.splitTextToSize(b, rightW).forEach((line: string) => {
                    doc.text(line, rightX, rightY);
                    rightY += 4.5;
                });
            });
            rightY += 6;
        });
    }
}

// ==========================================
// 5. PROFESSIONAL TEMPLATE - Classic, balanced
// ==========================================
function renderProfessionalTemplate(doc: jsPDF, resume: ResumeData, colors: ThemePalette) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    let y = 20;

    // Header with name and thin accent line below
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
    doc.text(resume.contact.fullName || 'Your Name', margin, y);
    y += 8;

    // Contact row
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
    const contact = [resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean);
    doc.text(contact.join('  |  '), margin, y);
    y += 5;

    // Accent line
    doc.setDrawColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
    doc.setLineWidth(1.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    const addSection = (title: string) => {
        y += 4;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
        doc.text(title.toUpperCase(), margin, y);
        y += 6;
        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
    };

    // Summary
    if (resume.summary) {
        addSection('Summary');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(resume.summary, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
            doc.text(line, margin, y);
            y += 5;
        });
        y += 5;
    }

    // Experience
    if (resume.experience.length > 0) {
        addSection('Professional Experience');

        resume.experience.forEach((exp) => {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            doc.text(exp.position, margin, y);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
            const dateText = `${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`;
            doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), y);
            y += 5;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
            doc.text(exp.company, margin, y);
            y += 5;

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            doc.setFontSize(9);
            exp.bullets.filter(b => b.trim()).forEach((bullet) => {
                const bulletLines = doc.splitTextToSize(`• ${bullet}`, pageWidth - 2 * margin - 5);
                bulletLines.forEach((line: string) => {
                    doc.text(line, margin + 2, y);
                    y += 4.5;
                });
            });
            y += 4;
        });
    }

    // Education
    if (resume.education.length > 0) {
        addSection('Education');

        resume.education.forEach((edu) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`${edu.degree}${edu.field ? ' in ' + edu.field : ''}`, margin, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
            if (edu.graduationDate) {
                doc.text(formatDate(edu.graduationDate), pageWidth - margin - doc.getTextWidth(formatDate(edu.graduationDate)), y);
            }
            y += 5;
            doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
            doc.text(edu.institution, margin, y);
            y += 8;
        });
    }

    // Skills
    if (resume.skills.length > 0) {
        addSection('Skills');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
        const skillsText = resume.skills.join('  •  ');
        const skillLines = doc.splitTextToSize(skillsText, pageWidth - 2 * margin);
        skillLines.forEach((line: string) => {
            doc.text(line, margin, y);
            y += 5;
        });
    }
}

// ==========================================
// 6. STARTUP TEMPLATE - Impactful, skills-first
// ==========================================
function renderStartupTemplate(doc: jsPDF, resume: ResumeData, colors: ThemePalette) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Massive name
    doc.setFontSize(40);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
    doc.text(resume.contact.fullName || 'Your Name', margin, y + 10);
    y += 20;

    // Role Accent
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
    doc.text((resume.contact.email || '').toUpperCase(), margin, y);
    y += 10;

    // Top Skills Grid
    if (resume.skills.length > 0) {
        // Background strip for skills
        doc.setFillColor(hexToRgb(colors.bg).r, hexToRgb(colors.bg).g, hexToRgb(colors.bg).b);
        doc.rect(0, y, pageWidth, 25, 'F');

        y += 6;
        let skillX = margin;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(hexToRgb(colors.secondary).r, hexToRgb(colors.secondary).g, hexToRgb(colors.secondary).b);

        resume.skills.slice(0, 8).forEach(skill => {
            if (skillX + doc.getTextWidth(skill) > pageWidth - margin) {
                return; // Stop if overflow
            }
            doc.text(`⚡ ${skill}`, skillX, y + 10);
            skillX += doc.getTextWidth(skill) + 20;
        });
        y += 25;
    }

    y += 10;

    // 2-Column Layout for the rest
    const leftColWidth = (pageWidth - 3 * margin) * 0.65;
    const rightColX = margin + leftColWidth + margin;

    // LEFT COLUMN: Experience
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
    doc.text('BUILT & SCALED', margin, y);
    y += 5;
    // Thick line
    doc.setLineWidth(2);
    doc.setDrawColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
    doc.line(margin, y, margin + 20, y);
    y += 10;

    resume.experience.forEach((exp) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
        doc.text(exp.position, margin, y);
        y += 5;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
        doc.text(exp.company, margin, y);
        y += 5;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
        doc.text(`${formatDate(exp.startDate)} -> ${exp.current ? 'NOW' : formatDate(exp.endDate)}`, margin, y);
        y += 5;

        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
        exp.bullets.filter(b => b.trim()).forEach((bullet) => {
            const lines = doc.splitTextToSize(`> ${bullet}`, leftColWidth);
            lines.forEach((line: string) => {
                doc.text(line, margin, y);
                y += 5;
            });
        });
        y += 8;
    });

    // RIGHT COLUMN: Contact & Education
    let rightY = y - (resume.experience.length * 30); // Approximate back to top
    if (rightY < 70) rightY = 70; // Reset to top

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CONNECT', rightColX, rightY);
    rightY += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    [resume.contact.phone, resume.contact.location, resume.contact.linkedin].filter(Boolean).forEach(item => {
        if (item) {
            doc.text(item, rightColX, rightY);
            rightY += 7;
        }
    });

    rightY += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LEARNING', rightColX, rightY);
    rightY += 10;

    resume.education.forEach(edu => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(edu.degree, rightColX, rightY);
        rightY += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(edu.institution, rightColX, rightY);
        rightY += 10;
    });
}


// ==========================================
// MAIN EXPORT FUNCTIONS
// ==========================================

export async function downloadStyledPDF(
    resume: ResumeData,
    layout: TemplateLayout = 'modern',
    theme: ThemeColor = 'obsidian'
) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const selectedTheme = THEMES[theme];

    // Add font support for different languages if needed
    // Defaulting to Helvetica for now

    switch (layout) {
        case 'modern':
            renderModernTemplate(doc, resume, selectedTheme);
            break;
        case 'executive':
            renderExecutiveTemplate(doc, resume, selectedTheme);
            break;
        case 'creative':
            renderCreativeTemplate(doc, resume, selectedTheme);
            break;
        case 'minimalist':
            renderMinimalistTemplate(doc, resume, selectedTheme);
            break;
        case 'professional':
            renderProfessionalTemplate(doc, resume, selectedTheme);
            break;
        case 'startup':
            renderStartupTemplate(doc, resume, selectedTheme);
            break;
        default:
            renderModernTemplate(doc, resume, selectedTheme);
    }

    doc.save(`Seera_${resume.contact.fullName?.split(' ')[0] || 'CV'}_${layout}.pdf`);
}
