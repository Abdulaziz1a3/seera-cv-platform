// PDF Renderer for Seera AI Resume Templates
// Renders all 5 premium templates with theme support

import { jsPDF } from 'jspdf';
import type { ResumeData, TemplateId, ThemeId, ThemePalette, TemplateConfig } from '../resume-types';
import { getTheme, hexToRgb, getContrastColor } from './themes';
import { getTemplateConfig, getSectionHeader, formatDate, getPresentText } from './index';
import { hasArabicContent, containsArabic, formatDateRange } from './fonts';

// ============================================
// PDF Generator Class
// ============================================

class PDFRenderer {
  private doc: jsPDF;
  private theme: ThemePalette;
  private config: TemplateConfig;
  private locale: 'en' | 'ar';
  private pageWidth: number;
  private pageHeight: number;
  private y: number = 0;

  constructor(templateId: TemplateId, themeId: ThemeId, locale: 'en' | 'ar' = 'en') {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    this.theme = getTheme(themeId);
    this.config = getTemplateConfig(templateId);
    this.locale = locale;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.y = this.config.margins.top;

    // Set document properties
    this.doc.setProperties({
      title: 'Resume - Seera AI',
      creator: 'Seera AI',
      author: 'Seera AI Resume Builder',
    });
  }

  // ============================================
  // Utility Methods
  // ============================================

  private setColor(color: string, type: 'text' | 'fill' | 'draw' = 'text') {
    const rgb = hexToRgb(color);
    switch (type) {
      case 'text':
        this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
        break;
      case 'fill':
        this.doc.setFillColor(rgb.r, rgb.g, rgb.b);
        break;
      case 'draw':
        this.doc.setDrawColor(rgb.r, rgb.g, rgb.b);
        break;
    }
  }

  private checkPageBreak(requiredSpace: number = 20) {
    if (this.y + requiredSpace > this.pageHeight - this.config.margins.bottom) {
      this.doc.addPage();
      this.y = this.config.margins.top;
    }
  }

  private getContentWidth(): number {
    return this.pageWidth - this.config.margins.left - this.config.margins.right;
  }

  private addWrappedText(text: string, x: number, maxWidth: number, lineHeight: number = 5): number {
    const lines = this.doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      this.checkPageBreak();
      this.doc.text(line, x, this.y);
      this.y += lineHeight;
    });
    return lines.length * lineHeight;
  }

  // ============================================
  // Template: Prestige Executive
  // ============================================

  private renderPrestigeExecutive(resume: ResumeData) {
    const margin = this.config.margins.left;
    const contentWidth = this.getContentWidth();

    // Header: Name with accent underline
    this.setColor(this.theme.primary);
    this.doc.setFontSize(this.config.typography.nameSize);
    this.doc.setFont('helvetica', 'bold');
    const name = (resume.contact.fullName || 'Your Name').toUpperCase();
    this.doc.text(name, margin, this.y);
    this.y += 10;

    // Gold accent line under name
    this.setColor(this.theme.accent, 'draw');
    this.doc.setLineWidth(1.5);
    this.doc.line(margin, this.y, margin + 50, this.y);
    this.y += 8;

    // Contact info row
    this.doc.setFontSize(this.config.typography.smallSize);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(this.theme.muted);
    const contactParts = [
      resume.contact.email,
      resume.contact.phone,
      resume.contact.location,
    ].filter(Boolean);
    if (contactParts.length) {
      this.doc.text(contactParts.join('  •  '), margin, this.y);
      this.y += 5;
    }
    if (resume.contact.linkedin) {
      this.setColor(this.theme.accent);
      this.doc.text(resume.contact.linkedin, margin, this.y);
      this.y += 5;
    }
    this.y += 8;

    // Section helper for Prestige
    const addSection = (title: string, content: () => void) => {
      this.y += this.config.spacing.section / 2;
      this.checkPageBreak(20);

      // Section header with underline
      this.doc.setFontSize(this.config.typography.sectionHeaderSize);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(this.theme.primary);
      this.doc.text(getSectionHeader(title, this.locale), margin, this.y);
      this.y += 2;
      this.setColor(this.theme.accent, 'draw');
      this.doc.setLineWidth(0.5);
      this.doc.line(margin, this.y, margin + contentWidth, this.y);
      this.y += 6;

      // Reset for content
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(this.config.typography.bodySize);
      this.setColor(this.theme.text);

      content();
    };

    // Summary
    if (resume.summary) {
      addSection('summary', () => {
        this.addWrappedText(resume.summary, margin, contentWidth, 4.5);
      });
    }

    // Experience
    if (resume.experience.length > 0) {
      addSection('experience', () => {
        resume.experience.forEach((exp, idx) => {
          if (idx > 0) this.y += this.config.spacing.item;
          this.checkPageBreak(25);

          // Position
          this.doc.setFont('helvetica', 'bold');
          this.doc.setFontSize(11);
          this.setColor(this.theme.text);
          this.doc.text(exp.position || 'Position', margin, this.y);

          // Date range (right)
          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(this.config.typography.smallSize);
          this.setColor(this.theme.accent);
          const dateText = `${formatDate(exp.startDate, this.locale)} - ${exp.current ? getPresentText(this.locale) : formatDate(exp.endDate, this.locale)}`;
          const dateWidth = this.doc.getTextWidth(dateText);
          this.doc.text(dateText, this.pageWidth - this.config.margins.right - dateWidth, this.y);
          this.y += 4;

          // Company
          this.doc.setFont('helvetica', 'italic');
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.muted);
          let companyLine = exp.company || 'Company';
          if (exp.location) companyLine += `  |  ${exp.location}`;
          this.doc.text(companyLine, margin, this.y);
          this.y += 5;

          // Bullets
          this.doc.setFont('helvetica', 'normal');
          this.setColor(this.theme.text);
          exp.bullets.filter(b => b?.trim()).forEach((bullet) => {
            this.checkPageBreak(8);
            this.setColor(this.theme.accent);
            this.doc.text('•', margin + 2, this.y);
            this.setColor(this.theme.text);
            const bulletLines = this.doc.splitTextToSize(bullet, contentWidth - 8);
            bulletLines.forEach((line: string) => {
              this.doc.text(line, margin + 6, this.y);
              this.y += 4;
            });
          });
        });
      });
    }

    // Education
    if (resume.education.length > 0) {
      addSection('education', () => {
        resume.education.forEach((edu, idx) => {
          if (idx > 0) this.y += 3;
          this.checkPageBreak(15);

          // Degree
          this.doc.setFont('helvetica', 'bold');
          this.doc.setFontSize(11);
          this.setColor(this.theme.text);
          const degreeText = `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`;
          this.doc.text(degreeText, margin, this.y);

          // Date
          if (edu.graduationDate) {
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.accent);
            const gradDate = formatDate(edu.graduationDate, this.locale);
            const dateWidth = this.doc.getTextWidth(gradDate);
            this.doc.text(gradDate, this.pageWidth - this.config.margins.right - dateWidth, this.y);
          }
          this.y += 4;

          // Institution
          this.doc.setFont('helvetica', 'italic');
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.muted);
          let instLine = edu.institution || 'Institution';
          if (edu.gpa) instLine += `  |  GPA: ${edu.gpa}`;
          this.doc.text(instLine, margin, this.y);
          this.y += 6;
        });
      });
    }

    // Skills
    if (resume.skills.length > 0) {
      addSection('skills', () => {
        const skillsText = resume.skills.join('  •  ');
        this.addWrappedText(skillsText, margin, contentWidth, 4.5);
      });
    }

    // Certifications
    if (resume.certifications.length > 0) {
      addSection('certifications', () => {
        resume.certifications.forEach((cert) => {
          this.checkPageBreak(8);
          this.doc.setFont('helvetica', 'bold');
          this.doc.setFontSize(10);
          this.setColor(this.theme.text);
          let certLine = cert.name;
          this.doc.setFont('helvetica', 'normal');
          if (cert.issuer) certLine += ` - ${cert.issuer}`;
          this.doc.text(certLine, margin, this.y);

          if (cert.date) {
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.accent);
            const certDate = formatDate(cert.date, this.locale);
            const dateWidth = this.doc.getTextWidth(certDate);
            this.doc.text(certDate, this.pageWidth - this.config.margins.right - dateWidth, this.y);
          }
          this.y += 5;
        });
      });
    }

    // Languages
    if (resume.languages.length > 0) {
      addSection('languages', () => {
        const langText = resume.languages.map(l => `${l.name} (${l.proficiency})`).join('  •  ');
        this.doc.text(langText, margin, this.y);
        this.y += 5;
      });
    }
  }

  // ============================================
  // Template: Nordic Minimal
  // ============================================

  private renderNordicMinimal(resume: ResumeData) {
    const margin = this.config.margins.left;
    const contentWidth = this.getContentWidth();

    // Name - large and simple
    this.doc.setFontSize(this.config.typography.nameSize);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(this.theme.text);
    this.doc.text(resume.contact.fullName || 'Your Name', margin, this.y);
    this.y += 12;

    // Single thin accent line
    this.setColor(this.theme.accent, 'draw');
    this.doc.setLineWidth(0.3);
    this.doc.line(margin, this.y, margin + 30, this.y);
    this.y += 8;

    // Contact - minimal
    this.doc.setFontSize(this.config.typography.smallSize);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(this.theme.muted);
    const contactLine = [resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join('  /  ');
    this.doc.text(contactLine, margin, this.y);
    this.y += 12;

    // Section helper for Nordic
    const addSection = (title: string, content: () => void) => {
      this.y += this.config.spacing.section;
      this.checkPageBreak(15);

      this.doc.setFontSize(this.config.typography.sectionHeaderSize);
      this.doc.setFont('helvetica', 'normal');
      this.setColor(this.theme.muted);
      this.doc.text(getSectionHeader(title, this.locale), margin, this.y);
      this.y += 8;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(this.config.typography.bodySize);
      this.setColor(this.theme.text);

      content();
    };

    // Summary (as intro paragraph)
    if (resume.summary) {
      this.doc.setFontSize(11);
      this.setColor(this.theme.text);
      this.addWrappedText(resume.summary, margin, contentWidth, 6);
      this.y += 10;
    }

    // Experience
    if (resume.experience.length > 0) {
      addSection('experience', () => {
        resume.experience.forEach((exp, idx) => {
          if (idx > 0) this.y += this.config.spacing.item;
          this.checkPageBreak(20);

          // Position + Company inline
          this.doc.setFontSize(11);
          this.doc.setFont('helvetica', 'bold');
          this.setColor(this.theme.text);
          this.doc.text(exp.position, margin, this.y);

          this.doc.setFont('helvetica', 'normal');
          this.setColor(this.theme.muted);
          const meta = ` — ${exp.company}, ${formatDate(exp.startDate, this.locale)} - ${exp.current ? getPresentText(this.locale) : formatDate(exp.endDate, this.locale)}`;
          this.doc.text(meta, margin + this.doc.getTextWidth(exp.position), this.y);
          this.y += 6;

          // Bullets - minimal style with dash
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.text);
          exp.bullets.filter(b => b?.trim()).forEach((bullet) => {
            this.checkPageBreak(8);
            const bulletLines = this.doc.splitTextToSize(`– ${bullet}`, contentWidth - 5);
            bulletLines.forEach((line: string) => {
              this.doc.text(line, margin + 3, this.y);
              this.y += 5;
            });
          });
        });
      });
    }

    // Education
    if (resume.education.length > 0) {
      addSection('education', () => {
        resume.education.forEach((edu) => {
          this.checkPageBreak(12);
          this.doc.setFontSize(11);
          this.doc.setFont('helvetica', 'bold');
          this.setColor(this.theme.text);
          this.doc.text(`${edu.degree}${edu.field ? ', ' + edu.field : ''}`, margin, this.y);
          this.y += 5;

          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.muted);
          this.doc.text(`${edu.institution}${edu.graduationDate ? ', ' + formatDate(edu.graduationDate, this.locale) : ''}`, margin, this.y);
          this.y += 8;
        });
      });
    }

    // Skills
    if (resume.skills.length > 0) {
      addSection('skills', () => {
        this.doc.setFontSize(this.config.typography.bodySize);
        this.setColor(this.theme.text);
        this.doc.text(resume.skills.join(', '), margin, this.y);
        this.y += 5;
      });
    }
  }

  // ============================================
  // Template: Metropolitan Split
  // ============================================

  private renderMetropolitanSplit(resume: ResumeData) {
    const sidebarWidth = 65;
    const mainX = sidebarWidth + 10;
    const mainWidth = this.pageWidth - mainX - this.config.margins.right;

    // Sidebar background
    this.setColor(this.theme.secondary, 'fill');
    this.doc.rect(0, 0, sidebarWidth, this.pageHeight, 'F');

    let sideY = 25;
    let mainY = 20;

    // Photo placeholder circle (semi-transparent effect using lighter color)
    const bgRgb = hexToRgb(this.theme.secondary);
    // Create a lighter shade for the placeholder circle
    this.doc.setFillColor(
      Math.min(255, bgRgb.r + 40),
      Math.min(255, bgRgb.g + 40),
      Math.min(255, bgRgb.b + 40)
    );
    this.doc.circle(sidebarWidth / 2, sideY + 8, 12, 'F');
    sideY += 30;

    // Contact in sidebar
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('CONTACT', 8, sideY);
    sideY += 8;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.5);
    if (resume.contact.email) {
      const emailLines = this.doc.splitTextToSize(resume.contact.email, sidebarWidth - 16);
      emailLines.forEach((line: string) => {
        this.doc.text(line, 8, sideY);
        sideY += 4.5;
      });
    }
    if (resume.contact.phone) {
      this.doc.text(resume.contact.phone, 8, sideY);
      sideY += 5;
    }
    if (resume.contact.location) {
      this.doc.text(resume.contact.location, 8, sideY);
      sideY += 5;
    }
    if (resume.contact.linkedin) {
      sideY += 2;
      const linkedInLines = this.doc.splitTextToSize(resume.contact.linkedin.replace('https://', ''), sidebarWidth - 16);
      linkedInLines.forEach((line: string) => {
        this.doc.text(line, 8, sideY);
        sideY += 4.5;
      });
    }

    // Skills in sidebar
    if (resume.skills.length > 0) {
      sideY += 15;
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('SKILLS', 8, sideY);
      sideY += 8;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      // Create a lighter shade for skill pill background
      const pillRgb = hexToRgb(this.theme.secondary);
      resume.skills.slice(0, 15).forEach((skill) => {
        // Skill pill background (lighter shade of sidebar)
        this.doc.setFillColor(
          Math.min(255, pillRgb.r + 30),
          Math.min(255, pillRgb.g + 30),
          Math.min(255, pillRgb.b + 30)
        );
        this.doc.roundedRect(6, sideY - 3.5, sidebarWidth - 12, 5.5, 1, 1, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.text(skill, 9, sideY);
        sideY += 7;
      });
    }

    // Languages in sidebar
    if (resume.languages.length > 0) {
      sideY += 12;
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('LANGUAGES', 8, sideY);
      sideY += 8;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8.5);
      resume.languages.forEach((lang) => {
        this.doc.text(`${lang.name}`, 8, sideY);
        this.doc.setFontSize(7.5);
        this.doc.text(lang.proficiency, 8, sideY + 4);
        this.doc.setFontSize(8.5);
        sideY += 10;
      });
    }

    // Main content: Name
    this.setColor(this.theme.text);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(26);
    const fullName = (resume.contact.fullName || 'Your Name').toUpperCase();
    const nameLinesMain = this.doc.splitTextToSize(fullName, mainWidth);
    nameLinesMain.forEach((line: string) => {
      this.doc.text(line, mainX, mainY);
      mainY += 9;
    });

    // Title/role
    if (resume.title) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(11);
      this.setColor(this.theme.muted);
      this.doc.text(resume.title.toUpperCase(), mainX, mainY);
      mainY += 10;
    }

    // Section with accent border
    const addMainSection = (title: string, callback: (y: number) => number) => {
      mainY += 8;

      // Accent left border
      this.setColor(this.theme.accent, 'draw');
      this.doc.setLineWidth(2);
      this.doc.line(mainX, mainY - 3, mainX, mainY + 5);

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(12);
      this.setColor(this.theme.text);
      this.doc.text(getSectionHeader(title, this.locale), mainX + 4, mainY);
      mainY += 8;

      mainY = callback(mainY);
    };

    // Summary
    if (resume.summary) {
      addMainSection('summary', (y) => {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        this.setColor(this.theme.muted);
        const summaryLines = this.doc.splitTextToSize(resume.summary, mainWidth);
        summaryLines.forEach((line: string) => {
          this.doc.text(line, mainX, y);
          y += 5;
        });
        return y + 5;
      });
    }

    // Experience
    if (resume.experience.length > 0) {
      addMainSection('experience', (y) => {
        resume.experience.forEach((exp) => {
          if (y > this.pageHeight - 30) {
            this.doc.addPage();
            // Redraw sidebar on new page
            this.setColor(this.theme.secondary, 'fill');
            this.doc.rect(0, 0, sidebarWidth, this.pageHeight, 'F');
            y = 20;
          }

          // Position
          this.doc.setFontSize(11);
          this.doc.setFont('helvetica', 'bold');
          this.setColor(this.theme.text);
          this.doc.text(exp.position || 'Position', mainX, y);

          // Date (right)
          this.doc.setFontSize(9);
          this.doc.setFont('helvetica', 'normal');
          this.setColor(this.theme.accent);
          const dateText = `${formatDate(exp.startDate, this.locale)} - ${exp.current ? getPresentText(this.locale) : formatDate(exp.endDate, this.locale)}`;
          this.doc.text(dateText, this.pageWidth - 15 - this.doc.getTextWidth(dateText), y);
          y += 5;

          // Company
          this.doc.setFontSize(10);
          this.setColor(this.theme.muted);
          this.doc.text(`${exp.company}${exp.location ? ' | ' + exp.location : ''}`, mainX, y);
          y += 5;

          // Bullets
          this.doc.setFontSize(9);
          exp.bullets.filter(b => b?.trim()).forEach((bullet) => {
            this.setColor(this.theme.accent);
            this.doc.text('▸', mainX, y);
            this.setColor(this.theme.text);
            const bulletLines = this.doc.splitTextToSize(bullet, mainWidth - 8);
            bulletLines.forEach((line: string) => {
              this.doc.text(line, mainX + 5, y);
              y += 4.5;
            });
          });
          y += 5;
        });
        return y;
      });
    }

    // Education
    if (resume.education.length > 0) {
      addMainSection('education', (y) => {
        resume.education.forEach((edu) => {
          this.doc.setFontSize(11);
          this.doc.setFont('helvetica', 'bold');
          this.setColor(this.theme.text);
          this.doc.text(`${edu.degree}${edu.field ? ' in ' + edu.field : ''}`, mainX, y);

          if (edu.graduationDate) {
            this.doc.setFontSize(9);
            this.doc.setFont('helvetica', 'normal');
            this.setColor(this.theme.accent);
            const gradDate = formatDate(edu.graduationDate, this.locale);
            this.doc.text(gradDate, this.pageWidth - 15 - this.doc.getTextWidth(gradDate), y);
          }
          y += 5;

          this.doc.setFontSize(10);
          this.doc.setFont('helvetica', 'normal');
          this.setColor(this.theme.muted);
          this.doc.text(edu.institution, mainX, y);
          y += 7;
        });
        return y;
      });
    }
  }

  // ============================================
  // Template: Classic Professional
  // ============================================

  private renderClassicProfessional(resume: ResumeData) {
    const margin = this.config.margins.left;
    const contentWidth = this.getContentWidth();
    const centerX = this.pageWidth / 2;

    // Centered header
    this.doc.setFontSize(this.config.typography.nameSize);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(this.theme.text);
    const name = resume.contact.fullName || 'Your Name';
    this.doc.text(name, centerX, this.y, { align: 'center' });
    this.y += 8;

    // Contact line centered
    this.doc.setFontSize(this.config.typography.smallSize);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(this.theme.muted);
    const contactParts = [resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean);
    if (contactParts.length) {
      this.doc.text(contactParts.join('  |  '), centerX, this.y, { align: 'center' });
      this.y += 5;
    }
    if (resume.contact.linkedin) {
      this.doc.text(resume.contact.linkedin, centerX, this.y, { align: 'center' });
      this.y += 5;
    }
    this.y += 8;

    // Section helper with background header
    const addSection = (title: string, content: () => void) => {
      this.y += 5;
      this.checkPageBreak(20);

      // Background header
      this.setColor(this.theme.primary, 'fill');
      this.doc.rect(margin, this.y - 4, contentWidth, 7, 'F');
      this.doc.setFontSize(this.config.typography.sectionHeaderSize);
      this.doc.setFont('helvetica', 'bold');
      const contrastColor = getContrastColor(this.theme.primary);
      this.doc.setTextColor(hexToRgb(contrastColor).r, hexToRgb(contrastColor).g, hexToRgb(contrastColor).b);
      this.doc.text(getSectionHeader(title, this.locale), margin + 3, this.y + 1);
      this.y += 10;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(this.config.typography.bodySize);
      this.setColor(this.theme.text);

      content();
    };

    // Summary
    if (resume.summary) {
      addSection('summary', () => {
        this.addWrappedText(resume.summary, margin, contentWidth, 4.5);
      });
    }

    // Experience
    if (resume.experience.length > 0) {
      addSection('experience', () => {
        resume.experience.forEach((exp, idx) => {
          if (idx > 0) this.y += 4;
          this.checkPageBreak(25);

          // Position
          this.doc.setFont('helvetica', 'bold');
          this.doc.setFontSize(11);
          this.setColor(this.theme.text);
          this.doc.text(exp.position || 'Position', margin, this.y);

          // Date
          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(this.config.typography.smallSize);
          this.setColor(this.theme.muted);
          const dateText = `${formatDate(exp.startDate, this.locale)} - ${exp.current ? getPresentText(this.locale) : formatDate(exp.endDate, this.locale)}`;
          const dateWidth = this.doc.getTextWidth(dateText);
          this.doc.text(dateText, this.pageWidth - this.config.margins.right - dateWidth, this.y);
          this.y += 4;

          // Company
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.muted);
          this.doc.text(exp.company, margin, this.y);
          this.y += 5;

          // Bullets
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.text);
          exp.bullets.filter(b => b?.trim()).forEach((bullet) => {
            this.checkPageBreak(8);
            const bulletLines = this.doc.splitTextToSize(`• ${bullet}`, contentWidth - 5);
            bulletLines.forEach((line: string) => {
              this.doc.text(line, margin + 2, this.y);
              this.y += 4.5;
            });
          });
        });
      });
    }

    // Education
    if (resume.education.length > 0) {
      addSection('education', () => {
        resume.education.forEach((edu) => {
          this.checkPageBreak(12);
          this.doc.setFont('helvetica', 'bold');
          this.doc.setFontSize(11);
          this.setColor(this.theme.text);
          this.doc.text(`${edu.degree}${edu.field ? ' in ' + edu.field : ''}`, margin, this.y);

          if (edu.graduationDate) {
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.muted);
            const gradDate = formatDate(edu.graduationDate, this.locale);
            const dateWidth = this.doc.getTextWidth(gradDate);
            this.doc.text(gradDate, this.pageWidth - this.config.margins.right - dateWidth, this.y);
          }
          this.y += 4;

          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.muted);
          this.doc.text(edu.institution, margin, this.y);
          this.y += 6;
        });
      });
    }

    // Skills
    if (resume.skills.length > 0) {
      addSection('skills', () => {
        const skillsText = resume.skills.join('  •  ');
        this.doc.text(skillsText, centerX, this.y, { align: 'center', maxWidth: contentWidth });
        this.y += 5;
      });
    }
  }

  // ============================================
  // Template: Impact Modern
  // ============================================

  private renderImpactModern(resume: ResumeData) {
    const margin = this.config.margins.left;
    const contentWidth = this.getContentWidth();

    // Hero header with dark background
    const heroHeight = 55;
    this.setColor(this.theme.secondary, 'fill');
    this.doc.rect(0, 0, this.pageWidth, heroHeight, 'F');

    // Accent stripe
    this.setColor(this.theme.accent, 'fill');
    this.doc.rect(margin, 18, 3, 26, 'F');

    // Name in hero
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(this.config.typography.nameSize);
    const name = (resume.contact.fullName || 'Your Name').toUpperCase();
    const nameLines = this.doc.splitTextToSize(name, this.pageWidth - 2 * margin - 8);
    let nameY = 28;
    nameLines.slice(0, 2).forEach((line: string) => {
      this.doc.text(line, margin + 8, nameY);
      nameY += 12;
    });

    // Title in accent color
    if (resume.title) {
      this.setColor(this.theme.accent);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(11);
      this.doc.text(resume.title.toUpperCase(), margin + 8, 48);
    }

    this.y = heroHeight + 8;

    // Contact bar
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.setColor(this.theme.muted);
    const contactBar = [resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join('   •   ');
    if (contactBar) {
      this.doc.text(contactBar, this.pageWidth - margin, this.y, { align: 'right' });
      this.y += 10;
    }

    // Skills as tags at top
    if (resume.skills.length > 0) {
      this.y += 5;
      let tagX = margin;
      const tagY = this.y;

      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');

      resume.skills.slice(0, 10).forEach((skill) => {
        const tagWidth = this.doc.getTextWidth(skill) + 8;
        if (tagX + tagWidth > this.pageWidth - margin) return;

        // Tag background
        this.setColor(this.theme.surface, 'fill');
        this.doc.roundedRect(tagX, tagY - 4, tagWidth, 7, 3.5, 3.5, 'F');

        // Tag text
        this.setColor(this.theme.text);
        this.doc.text(skill, tagX + 4, tagY);
        tagX += tagWidth + 5;
      });
      this.y += 15;
    }

    // Section helper with accent border
    const addSection = (title: string, content: () => void) => {
      this.y += this.config.spacing.section;
      this.checkPageBreak(20);

      // Accent dot + title
      this.setColor(this.theme.accent, 'fill');
      this.doc.circle(margin + 3, this.y - 2, 2, 'F');

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(12);
      this.setColor(this.theme.text);
      this.doc.text(getSectionHeader(title, this.locale), margin + 9, this.y);
      this.y += 8;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(this.config.typography.bodySize);

      content();
    };

    // Summary
    if (resume.summary) {
      addSection('summary', () => {
        this.setColor(this.theme.muted);
        this.addWrappedText(resume.summary, margin, contentWidth, 5);
      });
    }

    // Experience with timeline style
    if (resume.experience.length > 0) {
      addSection('experience', () => {
        resume.experience.forEach((exp, idx) => {
          if (idx > 0) this.y += 6;
          this.checkPageBreak(25);

          // Timeline dot
          this.setColor(this.theme.accent, 'fill');
          this.doc.circle(margin + 3, this.y - 1, 1.5, 'F');

          // Position
          this.doc.setFont('helvetica', 'bold');
          this.doc.setFontSize(11);
          this.setColor(this.theme.text);
          this.doc.text(exp.position || 'Position', margin + 10, this.y);
          this.y += 5;

          // Company + dates
          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(9.5);
          this.setColor(this.theme.muted);
          const meta = `${exp.company} • ${formatDate(exp.startDate, this.locale)} - ${exp.current ? getPresentText(this.locale) : formatDate(exp.endDate, this.locale)}`;
          this.doc.text(meta, margin + 10, this.y);
          this.y += 5;

          // Bullets
          this.doc.setFontSize(9.5);
          this.setColor(this.theme.text);
          exp.bullets.filter(b => b?.trim()).forEach((bullet) => {
            this.checkPageBreak(8);
            const bulletLines = this.doc.splitTextToSize(bullet, contentWidth - 15);
            bulletLines.forEach((line: string) => {
              this.doc.text(line, margin + 10, this.y);
              this.y += 4.5;
            });
          });
        });
      });
    }

    // Education
    if (resume.education.length > 0) {
      addSection('education', () => {
        resume.education.forEach((edu) => {
          this.checkPageBreak(12);
          this.doc.setFont('helvetica', 'bold');
          this.doc.setFontSize(11);
          this.setColor(this.theme.text);
          this.doc.text(`${edu.degree}${edu.field ? ' in ' + edu.field : ''}`, margin, this.y);
          this.y += 5;

          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(10);
          this.setColor(this.theme.muted);
          this.doc.text(`${edu.institution}${edu.graduationDate ? ' • ' + formatDate(edu.graduationDate, this.locale) : ''}`, margin, this.y);
          this.y += 8;
        });
      });
    }
  }

  // ============================================
  // Main Render Method
  // ============================================

  public render(resume: ResumeData, templateId: TemplateId): jsPDF {
    switch (templateId) {
      case 'prestige-executive':
        this.renderPrestigeExecutive(resume);
        break;
      case 'nordic-minimal':
        this.renderNordicMinimal(resume);
        break;
      case 'metropolitan-split':
        this.renderMetropolitanSplit(resume);
        break;
      case 'classic-professional':
        this.renderClassicProfessional(resume);
        break;
      case 'impact-modern':
        this.renderImpactModern(resume);
        break;
      default:
        this.renderPrestigeExecutive(resume);
    }
    return this.doc;
  }

  public toBlob(): Blob {
    return this.doc.output('blob');
  }
}

// ============================================
// Export Functions
// ============================================

export async function generatePDF(
  resume: ResumeData,
  templateId?: TemplateId,
  themeId?: ThemeId
): Promise<Blob> {
  const template = templateId || resume.template || 'prestige-executive';
  const theme = themeId || resume.theme || 'obsidian';
  const locale = resume.locale || 'en';

  const renderer = new PDFRenderer(template, theme, locale);
  renderer.render(resume, template);
  return renderer.toBlob();
}

export async function downloadPDF(
  resume: ResumeData,
  templateId?: TemplateId,
  themeId?: ThemeId
): Promise<void> {
  const blob = await generatePDF(resume, templateId, themeId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (resume.contact.fullName || 'resume').replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `${safeName}_CV.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
