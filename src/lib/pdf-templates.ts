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
        name: { en: 'The Executive', ar: 'التنفيذي' },
        description: { en: 'Classic serif, gold-standard. Best for Management.', ar: 'كلاسيكي بخط مميز، المعيار الذهبي للإدارة.' },
        premium: true
    },
    {
        id: 'modern',
        name: { en: 'The Modern', ar: 'العصري' },
        description: { en: 'Clean, sidebar-based. Best for Tech.', ar: 'نظيف، شريط جانبي. مثالي للتقنية.' },
        premium: false
    },
    {
        id: 'professional',
        name: { en: 'The Professional', ar: 'الاحترافي' },
        description: { en: 'Balanced, dense info. Best for Business.', ar: 'متوازن، معلومات مكثفة. مثالي للأعمال.' },
        premium: false
    },
    {
        id: 'creative',
        name: { en: 'The Creative', ar: 'الإبداعي' },
        description: { en: 'Bold headers, unique shapes. Best for Design.', ar: 'ترويس عريض، أشكال فريدة. مثالي للتصميم.' },
        premium: true
    },
    {
        id: 'minimalist',
        name: { en: 'The Minimalist', ar: 'البسيط' },
        description: { en: 'Ultra-clean, whitespace-heavy. Best for Architecture.', ar: 'نظيف جداً، مساحات بيضاء. مثالي العمارة.' },
        premium: false
    },
    {
        id: 'startup',
        name: { en: 'The Startup', ar: 'الريادي' },
        description: { en: 'Skills-forward, high-impact. Best for Freelancers.', ar: 'التركيز على المهارات، تأثير عالي. مثالي للمستقلين.' },
        premium: true
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
// 1. MODERN TEMPLATE - Two column, sidebar accent
// ==========================================
function renderModernTemplate(doc: jsPDF, resume: ResumeData, colors: ThemePalette) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const sidebarWidth = 65;

    // Sidebar background
    doc.setFillColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
    doc.rect(0, 0, sidebarWidth, pageHeight, 'F');

    // Sidebar content
    let sideY = 25;

    // Name in sidebar
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const nameLines = doc.splitTextToSize(resume.contact.fullName || 'Your Name', sidebarWidth - 10);
    nameLines.forEach((line: string) => {
        doc.text(line, 5, sideY);
        sideY += 7;
    });

    // Contact section in sidebar
    sideY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTACT', 5, sideY);
    sideY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (resume.contact.email) {
        doc.text('✉', 5, sideY);
        const emailLines = doc.splitTextToSize(resume.contact.email, sidebarWidth - 15);
        emailLines.forEach((line: string) => {
            doc.text(line, 12, sideY);
            sideY += 5;
        });
    }
    if (resume.contact.phone) {
        doc.text('📱', 5, sideY);
        doc.text(resume.contact.phone, 12, sideY);
        sideY += 5;
    }
    if (resume.contact.location) {
        doc.text('📍', 5, sideY);
        doc.text(resume.contact.location, 12, sideY);
        sideY += 5;
    }
    if (resume.contact.linkedin) {
        sideY += 2;
        doc.text('🔗', 5, sideY);
        const linkedInLines = doc.splitTextToSize(resume.contact.linkedin.replace('https://', ''), sidebarWidth - 15);
        linkedInLines.forEach((line: string) => {
            doc.text(line, 12, sideY);
            sideY += 5;
        });
    }

    // Skills in sidebar
    if (resume.skills.length > 0) {
        sideY += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('SKILLS', 5, sideY);
        sideY += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        resume.skills.slice(0, 15).forEach((skill) => {
            // Skill pill
            doc.setFillColor(255, 255, 255, 0.2);
            doc.roundedRect(5, sideY - 3.5, sidebarWidth - 10, 5, 1, 1, 'F');
            doc.text(skill, 7, sideY);
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

    // Summary
    if (resume.summary) {
        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PROFESSIONAL SUMMARY', mainX, mainY);
        mainY += 3;
        doc.setDrawColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
        doc.setLineWidth(0.8);
        doc.line(mainX, mainY, mainX + 40, mainY);
        mainY += 6;

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
        doc.text('EXPERIENCE', mainX, mainY);
        mainY += 3;
        doc.setDrawColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
        doc.line(mainX, mainY, mainX + 30, mainY);
        mainY += 6;

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
            doc.setTextColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
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
                doc.setTextColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
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
// 2. EXECUTIVE TEMPLATE - Gold accents, elegant
// ==========================================
function renderExecutiveTemplate(doc: jsPDF, resume: ResumeData, colors: ThemePalette) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 25;

    // Top border with accent
    doc.setFillColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
    doc.rect(0, 0, pageWidth, 6, 'F');

    // Name centered
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
    doc.text(resume.contact.fullName || 'Your Name', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Contact info centered
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
    const contactParts = [
        resume.contact.email,
        resume.contact.phone,
        resume.contact.location,
    ].filter(Boolean);
    doc.text(contactParts.join('  ◆  '), pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Divider line
    doc.setDrawColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // Summary
    if (resume.summary) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
        const summaryLines = doc.splitTextToSize(resume.summary, pageWidth - 2 * margin);
        summaryLines.forEach((line: string) => {
            doc.text(line, pageWidth / 2, y, { align: 'center' });
            y += 5;
        });
        y += 8;
    }

    // Section header helper
    const addSectionHeader = (title: string) => {
        y += 4;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
        doc.text(title, margin, y);
        y += 2;
        doc.setDrawColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
        doc.setLineWidth(0.5);
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
// 4. CREATIVE TEMPLATE - Color blocks, modern
// ==========================================
function renderCreativeTemplate(doc: jsPDF, resume: ResumeData, colors: ThemePalette) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Large colorful header block
    doc.setFillColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Accent triangle
    doc.setFillColor(hexToRgb(colors.accent).r, hexToRgb(colors.accent).g, hexToRgb(colors.accent).b);
    doc.triangle(pageWidth - 40, 0, pageWidth, 0, pageWidth, 50, 'F');

    // Name in header
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(resume.contact.fullName || 'Your Name', margin, 25);

    // Title/role
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(resume.contact.email || '', margin, 38);

    let y = 65;

    // Contact box
    doc.setFillColor(hexToRgb(colors.bg).r, hexToRgb(colors.bg).g, hexToRgb(colors.bg).b);
    doc.roundedRect(margin, y - 8, pageWidth - 2 * margin, 18, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
    const contactInfo = [
        resume.contact.phone && `📱 ${resume.contact.phone}`,
        resume.contact.location && `📍 ${resume.contact.location}`,
        resume.contact.linkedin && `🔗 ${resume.contact.linkedin}`,
    ].filter(Boolean).join('     ');
    doc.text(contactInfo, margin + 5, y);
    y += 20;

    const addColorSection = (title: string, color: string) => {
        y += 5;
        doc.setFillColor(hexToRgb(color).r, hexToRgb(color).g, hexToRgb(color).b);
        doc.roundedRect(margin, y - 5, 4, 10, 1, 1, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
        doc.text(title, margin + 8, y + 2);
        y += 12;
    };

    // Summary
    if (resume.summary) {
        addColorSection('About Me', colors.primary);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(resume.summary, pageWidth - 2 * margin);
        summaryLines.forEach((line: string) => {
            doc.text(line, margin, y);
            y += 5;
        });
        y += 5;
    }

    // Experience
    if (resume.experience.length > 0) {
        addColorSection('Experience', colors.accent);

        resume.experience.forEach((exp) => {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(hexToRgb(colors.secondary).r, hexToRgb(colors.secondary).g, hexToRgb(colors.secondary).b);
            doc.text(exp.position, margin, y);
            y += 5;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
            doc.text(`${exp.company} | ${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`, margin, y);
            y += 5;

            doc.setFontSize(9);
            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            exp.bullets.filter(b => b.trim()).slice(0, 3).forEach((bullet) => {
                doc.text(`► ${bullet}`, margin + 2, y);
                y += 4.5;
            });
            y += 4;
        });
    }

    // Skills - as colored tags
    if (resume.skills.length > 0) {
        addColorSection('Skills', colors.primary);
        let skillX = margin;
        let skillY = y;

        doc.setFontSize(8);
        resume.skills.forEach((skill) => {
            const skillWidth = doc.getTextWidth(skill) + 8;
            if (skillX + skillWidth > pageWidth - margin) {
                skillX = margin;
                skillY += 8;
            }

            doc.setFillColor(hexToRgb(colors.primary).r, hexToRgb(colors.primary).g, hexToRgb(colors.primary).b);
            doc.roundedRect(skillX, skillY - 4, skillWidth, 7, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.text(skill, skillX + 4, skillY);
            skillX += skillWidth + 3;
        });
        y = skillY + 12;
    }

    // Education
    if (resume.education.length > 0) {
        addColorSection('Education', colors.accent);

        resume.education.forEach((edu) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
            doc.text(`${edu.degree}${edu.field ? ' in ' + edu.field : ''}`, margin, y);
            y += 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(hexToRgb(colors.muted).r, hexToRgb(colors.muted).g, hexToRgb(colors.muted).b);
            doc.text(`${edu.institution} | ${formatDate(edu.graduationDate)}`, margin, y);
            y += 7;
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
