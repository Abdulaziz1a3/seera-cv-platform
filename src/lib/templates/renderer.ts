// PDF Renderer for Seera AI Resume Templates
// Renders all 5 premium templates with theme support

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { ResumeData, TemplateId, ThemeId, ThemePalette, TemplateConfig } from '../resume-types';
import { getTheme, hexToRgb, getContrastColor } from './themes';
import { getTemplateConfig, getSectionHeader, formatDate, getPresentText } from './index';
import { hasArabicContent, formatTextForPDF, containsArabic } from './fonts';
import { ensureArabicFonts } from './pdf-fonts';

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
  private fontFamily: string = 'helvetica';
  private isArabicMode: boolean = false;
  private rtlEnabled: boolean = false;
  private fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal';

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

  private async addSeeraLinkQr(resume: ResumeData): Promise<void> {
    const slug = resume.contact?.seeraLinkSlug?.trim();
    const shouldShow = Boolean(resume.contact?.showSeeraLinkQr && slug);
    if (!shouldShow) return;

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://seera-ai.com').replace(/\/$/, '');
    const url = `${baseUrl}/p/${slug}`;
    const size = 20;

    try {
      const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 256 });
      const x = this.pageWidth - this.config.margins.right - size;
      const y = this.pageHeight - this.config.margins.bottom - size;
      this.doc.addImage(dataUrl, 'PNG', x, y, size, size);
      this.setColor(this.theme.muted, 'text');
      this.doc.setFontSize(7);
      this.doc.text('Seera Link', x + size / 2, y + size + 3, { align: 'center' });
    } catch (error) {
      console.warn('Failed to render QR code:', error);
    }
  }

  public async prepareFonts(resume: ResumeData): Promise<void> {
    const hasArabic = this.locale === 'ar' || hasArabicContent(resume);
    if (!hasArabic) {
      this.isArabicMode = false;
      this.rtlEnabled = false;
      this.fontFamily = 'helvetica';
      const docAny = this.doc as any;
      if (typeof docAny.setR2L === 'function') {
        docAny.setR2L(false);
      }
      return;
    }

    try {
      await ensureArabicFonts(this.doc);
      this.isArabicMode = true;
      const docAny = this.doc as any;
      this.rtlEnabled = typeof docAny.setR2L === 'function';
      if (this.rtlEnabled) {
        docAny.setR2L(true);
      }
      this.fontFamily = 'NotoSansArabic';
    } catch (error) {
      console.warn('Arabic font load failed, falling back to default font.', error);
      this.isArabicMode = false;
      this.rtlEnabled = false;
      this.fontFamily = 'helvetica';
    }
  }

  private formatText(text: string): string {
    if (!this.isArabicMode || this.rtlEnabled) {
      return text;
    }
    return formatTextForPDF(text, this.isArabicMode);
  }

  private getFontFamilyForText(text: string): string {
    if (this.isArabicMode && containsArabic(text)) {
      return 'NotoSansArabic';
    }
    return 'helvetica';
  }

  private getFontStyleForFamily(family: string): 'normal' | 'bold' | 'italic' | 'bolditalic' {
    if (family === 'NotoSansArabic' && (this.fontStyle === 'italic' || this.fontStyle === 'bolditalic')) {
      return 'normal';
    }
    return this.fontStyle;
  }

  private text(text: string, x: number, y: number, options?: any) {
    const family = this.getFontFamilyForText(text);
    this.doc.setFont(family, this.getFontStyleForFamily(family));
    this.doc.text(this.formatText(text), x, y, options);
  }

  private splitText(text: string, maxWidth: number): string[] {
    const family = this.getFontFamilyForText(text);
    this.doc.setFont(family, this.getFontStyleForFamily(family));
    return this.doc.splitTextToSize(this.formatText(text), maxWidth);
  }

  private getTextWidth(text: string): number {
    const family = this.getFontFamilyForText(text);
    this.doc.setFont(family, this.getFontStyleForFamily(family));
    return this.doc.getTextWidth(this.formatText(text));
  }

  private setFont(style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal') {
    this.fontStyle = style;
    const safeStyle = this.getFontStyleForFamily(this.fontFamily);
    this.doc.setFont(this.fontFamily, safeStyle);
  }

  private getImageType(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' | null {
    const match = /^data:image\/(png|jpe?g|webp);base64,/i.exec(dataUrl);
    if (!match) return null;
    const type = match[1].toLowerCase();
    if (type === 'png') return 'PNG';
    if (type === 'webp') return 'WEBP';
    return 'JPEG';
  }

  private addCircularImage(dataUrl: string, x: number, y: number, size: number): boolean {
    const imageType = this.getImageType(dataUrl);
    if (!imageType) return false;

    const docAny = this.doc as any;
    if (typeof docAny.saveGraphicsState === 'function' && typeof docAny.clip === 'function') {
      docAny.saveGraphicsState();
      docAny.circle(x + size / 2, y + size / 2, size / 2, null);
      docAny.clip();
      docAny.addImage(dataUrl, imageType, x, y, size, size);
      docAny.restoreGraphicsState();
    } else {
      this.doc.addImage(dataUrl, imageType, x, y, size, size);
    }

    return true;
  }

  private addWrappedText(text: string, x: number, maxWidth: number, lineHeight: number = 5): number {
    const lines = this.splitText(text, maxWidth);
    lines.forEach((line: string) => {
      this.checkPageBreak();
      this.text(line, x, this.y);
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
    this.setFont('bold');
    const name = (resume.contact.fullName || 'Your Name').toUpperCase();
    this.text(name, margin, this.y);
    this.y += 10;

    if (resume.title) {
      this.setFont('normal');
      this.doc.setFontSize(11);
      this.setColor(this.theme.muted);
      this.text(resume.title, margin, this.y);
      this.y += 6;
    }

    // Gold accent line under name
    this.setColor(this.theme.accent, 'draw');
    this.doc.setLineWidth(1.5);
    this.doc.line(margin, this.y, margin + 50, this.y);
    this.y += 8;

    // Contact info row
    this.doc.setFontSize(this.config.typography.smallSize);
    this.setFont('normal');
    this.setColor(this.theme.muted);
    const contactParts = [
      resume.contact.email,
      resume.contact.phone,
      resume.contact.location,
    ].filter(Boolean);
    if (contactParts.length) {
      this.text(contactParts.join('  |  '), margin, this.y);
      this.y += 5;
    }
    if (resume.contact.linkedin) {
      this.setColor(this.theme.accent);
      this.text(resume.contact.linkedin, margin, this.y);
      this.y += 5;
    }
    this.y += 8;

    // Section helper for Prestige
    const addSection = (title: string, content: () => void) => {
      this.y += this.config.spacing.section / 2;
      this.checkPageBreak(20);

      // Section header with underline
      this.doc.setFontSize(this.config.typography.sectionHeaderSize);
      this.setFont('bold');
      this.setColor(this.theme.primary);
      this.text(getSectionHeader(title, this.locale), margin, this.y);
      this.y += 2;
      this.setColor(this.theme.accent, 'draw');
      this.doc.setLineWidth(0.5);
      this.doc.line(margin, this.y, margin + contentWidth, this.y);
      this.y += 6;

      // Reset for content
      this.setFont('normal');
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
          this.setFont('bold');
          this.doc.setFontSize(11);
          this.setColor(this.theme.text);
          this.text(exp.position || 'Position', margin, this.y);

          // Date range (right)
          this.setFont('normal');
          this.doc.setFontSize(this.config.typography.smallSize);
          this.setColor(this.theme.accent);
          const dateText = `${formatDate(exp.startDate, this.locale)} - ${exp.current ? getPresentText(this.locale) : formatDate(exp.endDate, this.locale)}`;
          const dateWidth = this.getTextWidth(dateText);
          this.text(dateText, this.pageWidth - this.config.margins.right - dateWidth, this.y);
          this.y += 4;

          // Company
          this.setFont('italic');
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.muted);
          let companyLine = exp.company || 'Company';
          if (exp.location) companyLine += `  |  ${exp.location}`;
          this.text(companyLine, margin, this.y);
          this.y += 5;

          // Bullets
          this.setFont('normal');
          this.setColor(this.theme.text);
          exp.bullets.filter(b => b?.trim()).forEach((bullet) => {
            this.checkPageBreak(8);
            this.setColor(this.theme.accent);
            this.text('-', margin + 2, this.y);
            this.setColor(this.theme.text);
            const bulletLines = this.splitText(bullet, contentWidth - 8);
            bulletLines.forEach((line: string) => {
              this.text(line, margin + 6, this.y);
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
          this.setFont('bold');
          this.doc.setFontSize(11);
          this.setColor(this.theme.text);
          const degreeText = `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`;
          this.text(degreeText, margin, this.y);

          // Date
          if (edu.graduationDate) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.accent);
            const gradDate = formatDate(edu.graduationDate, this.locale);
            const dateWidth = this.getTextWidth(gradDate);
            this.text(gradDate, this.pageWidth - this.config.margins.right - dateWidth, this.y);
          }
          this.y += 4;

          // Institution
          this.setFont('italic');
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.muted);
          let instLine = edu.institution || 'Institution';
          if (edu.gpa) instLine += `  |  GPA: ${edu.gpa}`;
          this.text(instLine, margin, this.y);
          this.y += 6;
        });
      });
    }

    // Skills
    if (resume.skills.length > 0) {
      addSection('skills', () => {
        const skillsText = resume.skills.join('  |  ');
        this.addWrappedText(skillsText, margin, contentWidth, 4.5);
      });
    }

    // Projects
    if (resume.projects.length > 0) {
      addSection('projects', () => {
        resume.projects.forEach((project, idx) => {
          if (idx > 0) this.y += 3;
          this.checkPageBreak(12);

          this.setFont('bold');
          this.doc.setFontSize(10);
          this.setColor(this.theme.text);
          this.text(project.name || 'Project', margin, this.y);
          this.y += 4;

          if (project.description) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.bodySize);
            this.setColor(this.theme.muted);
            this.addWrappedText(project.description, margin, contentWidth, 4.5);
          }

          if (project.technologies && project.technologies.length > 0) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.muted);
            this.text(`Tech: ${project.technologies.join(', ')}`, margin, this.y);
            this.y += 4;
          }

          if (project.url) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.accent);
            this.text(project.url, margin, this.y);
            this.y += 4;
          }

          this.y += 2;
        });
      });
    }

    // Certifications
    if (resume.certifications.length > 0) {
      addSection('certifications', () => {
        resume.certifications.forEach((cert) => {
          this.checkPageBreak(8);
          this.setFont('bold');
          this.doc.setFontSize(10);
          this.setColor(this.theme.text);
          let certLine = cert.name;
          this.setFont('normal');
          if (cert.issuer) certLine += ` - ${cert.issuer}`;
          this.text(certLine, margin, this.y);

          if (cert.date) {
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.accent);
            const certDate = formatDate(cert.date, this.locale);
            const dateWidth = this.getTextWidth(certDate);
            this.text(certDate, this.pageWidth - this.config.margins.right - dateWidth, this.y);
          }
          this.y += 5;
        });
      });
    }

    // Languages
    if (resume.languages.length > 0) {
      addSection('languages', () => {
        const langText = resume.languages.map(l => `${l.name} (${l.proficiency})`).join('  |  ');
        this.text(langText, margin, this.y);
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
    this.setFont('bold');
    this.setColor(this.theme.text);
    this.text(resume.contact.fullName || 'Your Name', margin, this.y);
    this.y += 12;

    if (resume.title) {
      this.setFont('normal');
      this.doc.setFontSize(11);
      this.setColor(this.theme.muted);
      this.text(resume.title, margin, this.y);
      this.y += 6;
    }

    // Single thin accent line
    this.setColor(this.theme.accent, 'draw');
    this.doc.setLineWidth(0.3);
    this.doc.line(margin, this.y, margin + 30, this.y);
    this.y += 8;

    // Contact - minimal
    this.doc.setFontSize(this.config.typography.smallSize);
    this.setFont('normal');
    this.setColor(this.theme.muted);
    const contactLine = [resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join('  /  ');
    this.text(contactLine, margin, this.y);
    this.y += 12;

    // Section helper for Nordic
    const addSection = (title: string, content: () => void) => {
      this.y += this.config.spacing.section;
      this.checkPageBreak(15);

      this.doc.setFontSize(this.config.typography.sectionHeaderSize);
      this.setFont('normal');
      this.setColor(this.theme.muted);
      this.text(getSectionHeader(title, this.locale), margin, this.y);
      this.y += 8;

      this.setFont('normal');
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
          this.setFont('bold');
          this.setColor(this.theme.text);
          this.text(exp.position, margin, this.y);

          this.setFont('normal');
          this.setColor(this.theme.muted);
          const meta = ` - ${exp.company}, ${formatDate(exp.startDate, this.locale)} - ${exp.current ? getPresentText(this.locale) : formatDate(exp.endDate, this.locale)}`;
          this.text(meta, margin + this.getTextWidth(exp.position), this.y);
          this.y += 6;

          // Bullets - minimal style with dash
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.text);
          exp.bullets.filter(b => b?.trim()).forEach((bullet) => {
            this.checkPageBreak(8);
            const bulletLines = this.splitText(`- ${bullet}`, contentWidth - 5);
            bulletLines.forEach((line: string) => {
              this.text(line, margin + 3, this.y);
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
          this.setFont('bold');
          this.setColor(this.theme.text);
          this.text(`${edu.degree}${edu.field ? ', ' + edu.field : ''}`, margin, this.y);
          this.y += 5;

          this.setFont('normal');
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.muted);
          this.text(`${edu.institution}${edu.graduationDate ? ', ' + formatDate(edu.graduationDate, this.locale) : ''}`, margin, this.y);
          this.y += 8;
        });
      });
    }

    // Skills
    if (resume.skills.length > 0) {
      addSection('skills', () => {
        this.doc.setFontSize(this.config.typography.bodySize);
        this.setColor(this.theme.text);
        this.text(resume.skills.join(', '), margin, this.y);
        this.y += 5;
      });
    }

    // Projects
    if (resume.projects.length > 0) {
      addSection('projects', () => {
        resume.projects.forEach((project, idx) => {
          if (idx > 0) this.y += 3;
          this.checkPageBreak(12);

          this.setFont('bold');
          this.doc.setFontSize(10);
          this.setColor(this.theme.text);
          this.text(project.name || 'Project', margin, this.y);
          this.y += 4;

          if (project.description) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.bodySize);
            this.setColor(this.theme.muted);
            this.addWrappedText(project.description, margin, contentWidth, 4.5);
          }

          if (project.technologies && project.technologies.length > 0) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.muted);
            this.text(`Tech: ${project.technologies.join(', ')}`, margin, this.y);
            this.y += 4;
          }

          if (project.url) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.accent);
            this.text(project.url, margin, this.y);
            this.y += 4;
          }

          this.y += 2;
        });
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
    const photoSize = 24;
    const photoX = sidebarWidth / 2 - photoSize / 2;
    const photoY = sideY + 8 - photoSize / 2;
    const photoData = resume.contact.photo?.trim();
    const renderedPhoto = photoData ? this.addCircularImage(photoData, photoX, photoY, photoSize) : false;
    if (!renderedPhoto) {
      // Create a lighter shade for the placeholder circle
      this.doc.setFillColor(
        Math.min(255, bgRgb.r + 40),
        Math.min(255, bgRgb.g + 40),
        Math.min(255, bgRgb.b + 40)
      );
      this.doc.circle(sidebarWidth / 2, sideY + 8, 12, 'F');
    }
    sideY += 30;

    // Contact in sidebar
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.setFont('bold');
    this.text(getSectionHeader('contact', this.locale), 8, sideY);
    sideY += 8;

    this.setFont('normal');
    this.doc.setFontSize(8.5);
    if (resume.contact.email) {
      const emailLines = this.splitText(resume.contact.email, sidebarWidth - 16);
      emailLines.forEach((line: string) => {
        this.text(line, 8, sideY);
        sideY += 4.5;
      });
    }
    if (resume.contact.phone) {
      this.text(resume.contact.phone, 8, sideY);
      sideY += 5;
    }
    if (resume.contact.location) {
      this.text(resume.contact.location, 8, sideY);
      sideY += 5;
    }
    if (resume.contact.linkedin) {
      sideY += 2;
      const linkedInLines = this.splitText(resume.contact.linkedin.replace('https://', ''), sidebarWidth - 16);
      linkedInLines.forEach((line: string) => {
        this.text(line, 8, sideY);
        sideY += 4.5;
      });
    }

    // Skills in sidebar
    if (resume.skills.length > 0) {
      sideY += 15;
      this.doc.setFontSize(10);
      this.setFont('bold');
      this.text(getSectionHeader('skills', this.locale), 8, sideY);
      sideY += 8;

      this.setFont('normal');
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
        this.text(skill, 9, sideY);
        sideY += 7;
      });
    }

    // Languages in sidebar
    if (resume.languages.length > 0) {
      sideY += 12;
      this.doc.setFontSize(10);
      this.setFont('bold');
      this.text(getSectionHeader('languages', this.locale), 8, sideY);
      sideY += 8;

      this.setFont('normal');
      this.doc.setFontSize(8.5);
      resume.languages.forEach((lang) => {
        this.text(`${lang.name}`, 8, sideY);
        this.doc.setFontSize(7.5);
        this.text(lang.proficiency, 8, sideY + 4);
        this.doc.setFontSize(8.5);
        sideY += 10;
      });
    }

    // Main content: Name
    this.setColor(this.theme.text);
    this.setFont('bold');
    this.doc.setFontSize(26);
    const fullName = (resume.contact.fullName || 'Your Name').toUpperCase();
    const nameLinesMain = this.splitText(fullName, mainWidth);
    nameLinesMain.forEach((line: string) => {
      this.text(line, mainX, mainY);
      mainY += 9;
    });

    // Title/role
    if (resume.title) {
      this.setFont('normal');
      this.doc.setFontSize(11);
      this.setColor(this.theme.muted);
      this.text(resume.title.toUpperCase(), mainX, mainY);
      mainY += 10;
    }

    // Section with accent border
    const addMainSection = (title: string, callback: (y: number) => number) => {
      mainY += 8;

      // Accent left border
      this.setColor(this.theme.accent, 'draw');
      this.doc.setLineWidth(2);
      this.doc.line(mainX, mainY - 3, mainX, mainY + 5);

      this.setFont('bold');
      this.doc.setFontSize(12);
      this.setColor(this.theme.text);
      this.text(getSectionHeader(title, this.locale), mainX + 4, mainY);
      mainY += 8;

      mainY = callback(mainY);
    };

    // Summary
    if (resume.summary) {
      addMainSection('summary', (y) => {
        this.setFont('normal');
        this.doc.setFontSize(10);
        this.setColor(this.theme.muted);
        const summaryLines = this.splitText(resume.summary, mainWidth);
        summaryLines.forEach((line: string) => {
          this.text(line, mainX, y);
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
          this.setFont('bold');
          this.setColor(this.theme.text);
          this.text(exp.position || 'Position', mainX, y);

          // Date (right)
          this.doc.setFontSize(9);
          this.setFont('normal');
          this.setColor(this.theme.accent);
          const dateText = `${formatDate(exp.startDate, this.locale)} - ${exp.current ? getPresentText(this.locale) : formatDate(exp.endDate, this.locale)}`;
          this.text(dateText, this.pageWidth - 15 - this.getTextWidth(dateText), y);
          y += 5;

          // Company
          this.doc.setFontSize(10);
          this.setColor(this.theme.muted);
          this.text(`${exp.company}${exp.location ? ' | ' + exp.location : ''}`, mainX, y);
          y += 5;

          // Bullets
          this.doc.setFontSize(9);
          exp.bullets.filter(b => b?.trim()).forEach((bullet) => {
            this.setColor(this.theme.accent);
            this.text('-', mainX, y);
            this.setColor(this.theme.text);
            const bulletLines = this.splitText(bullet, mainWidth - 8);
            bulletLines.forEach((line: string) => {
              this.text(line, mainX + 5, y);
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
          this.setFont('bold');
          this.setColor(this.theme.text);
          this.text(`${edu.degree}${edu.field ? ' in ' + edu.field : ''}`, mainX, y);

          if (edu.graduationDate) {
            this.doc.setFontSize(9);
            this.setFont('normal');
            this.setColor(this.theme.accent);
            const gradDate = formatDate(edu.graduationDate, this.locale);
            this.text(gradDate, this.pageWidth - 15 - this.getTextWidth(gradDate), y);
          }
          y += 5;

          this.doc.setFontSize(10);
          this.setFont('normal');
          this.setColor(this.theme.muted);
          this.text(edu.institution, mainX, y);
          y += 7;
        });
        return y;
      });
    }

    // Projects
    if (resume.projects.length > 0) {
      addMainSection('projects', (y) => {
        resume.projects.forEach((project, idx) => {
          if (idx > 0) y += 3;
          if (y > this.pageHeight - 30) {
            this.doc.addPage();
            this.setColor(this.theme.secondary, 'fill');
            this.doc.rect(0, 0, sidebarWidth, this.pageHeight, 'F');
            y = 20;
          }

          this.doc.setFontSize(10.5);
          this.setFont('bold');
          this.setColor(this.theme.text);
          this.text(project.name || 'Project', mainX, y);
          y += 4;

          if (project.description) {
            this.setFont('normal');
            this.doc.setFontSize(9);
            this.setColor(this.theme.muted);
            const descLines = this.splitText(project.description, mainWidth);
            descLines.forEach((line: string) => {
              this.text(line, mainX, y);
              y += 4;
            });
          }

          if (project.technologies && project.technologies.length > 0) {
            this.setFont('normal');
            this.doc.setFontSize(8.5);
            this.setColor(this.theme.muted);
            this.text(`Tech: ${project.technologies.join(', ')}`, mainX, y);
            y += 4.5;
          }

          if (project.url) {
            this.setFont('normal');
            this.doc.setFontSize(8.5);
            this.setColor(this.theme.accent);
            this.text(project.url, mainX, y);
            y += 4.5;
          }

          y += 2;
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
    this.setFont('bold');
    this.setColor(this.theme.text);
    const name = resume.contact.fullName || 'Your Name';
    this.text(name, centerX, this.y, { align: 'center' });
    this.y += 8;

    if (resume.title) {
      this.setFont('normal');
      this.doc.setFontSize(11);
      this.setColor(this.theme.muted);
      this.text(resume.title, centerX, this.y, { align: 'center' });
      this.y += 5;
    }

    // Contact line centered
    this.doc.setFontSize(this.config.typography.smallSize);
    this.setFont('normal');
    this.setColor(this.theme.muted);
    const contactParts = [resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean);
    if (contactParts.length) {
      this.text(contactParts.join('  |  '), centerX, this.y, { align: 'center' });
      this.y += 5;
    }
    if (resume.contact.linkedin) {
      this.text(resume.contact.linkedin, centerX, this.y, { align: 'center' });
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
      this.setFont('bold');
      const contrastColor = getContrastColor(this.theme.primary);
      this.doc.setTextColor(hexToRgb(contrastColor).r, hexToRgb(contrastColor).g, hexToRgb(contrastColor).b);
      this.text(getSectionHeader(title, this.locale), margin + 3, this.y + 1);
      this.y += 10;

      this.setFont('normal');
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
          this.setFont('bold');
          this.doc.setFontSize(11);
          this.setColor(this.theme.text);
          this.text(exp.position || 'Position', margin, this.y);

          // Date
          this.setFont('normal');
          this.doc.setFontSize(this.config.typography.smallSize);
          this.setColor(this.theme.muted);
          const dateText = `${formatDate(exp.startDate, this.locale)} - ${exp.current ? getPresentText(this.locale) : formatDate(exp.endDate, this.locale)}`;
          const dateWidth = this.getTextWidth(dateText);
          this.text(dateText, this.pageWidth - this.config.margins.right - dateWidth, this.y);
          this.y += 4;

          // Company
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.muted);
          this.text(exp.company, margin, this.y);
          this.y += 5;

          // Bullets
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.text);
          exp.bullets.filter(b => b?.trim()).forEach((bullet) => {
            this.checkPageBreak(8);
            const bulletLines = this.splitText(`- ${bullet}`, contentWidth - 5);
            bulletLines.forEach((line: string) => {
              this.text(line, margin + 2, this.y);
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
          this.setFont('bold');
          this.doc.setFontSize(11);
          this.setColor(this.theme.text);
          this.text(`${edu.degree}${edu.field ? ' in ' + edu.field : ''}`, margin, this.y);

          if (edu.graduationDate) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.muted);
            const gradDate = formatDate(edu.graduationDate, this.locale);
            const dateWidth = this.getTextWidth(gradDate);
            this.text(gradDate, this.pageWidth - this.config.margins.right - dateWidth, this.y);
          }
          this.y += 4;

          this.setFont('normal');
          this.doc.setFontSize(this.config.typography.bodySize);
          this.setColor(this.theme.muted);
          this.text(edu.institution, margin, this.y);
          this.y += 6;
        });
      });
    }

    // Projects
    if (resume.projects.length > 0) {
      addSection('projects', () => {
        resume.projects.forEach((project, idx) => {
          if (idx > 0) this.y += 3;
          this.checkPageBreak(12);

          this.setFont('bold');
          this.doc.setFontSize(10.5);
          this.setColor(this.theme.text);
          this.text(project.name || 'Project', margin, this.y);
          this.y += 4;

          if (project.description) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.bodySize);
            this.setColor(this.theme.muted);
            this.addWrappedText(project.description, margin, contentWidth, 4.5);
          }

          if (project.technologies && project.technologies.length > 0) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.muted);
            this.text(`Tech: ${project.technologies.join(', ')}`, margin, this.y);
            this.y += 4;
          }

          if (project.url) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.accent);
            this.text(project.url, margin, this.y);
            this.y += 4;
          }

          this.y += 2;
        });
      });
    }

    // Skills
    if (resume.skills.length > 0) {
      addSection('skills', () => {
        const skillsText = resume.skills.join('  |  ');
        this.text(skillsText, centerX, this.y, { align: 'center', maxWidth: contentWidth });
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
    this.setFont('bold');
    this.doc.setFontSize(this.config.typography.nameSize);
    const name = (resume.contact.fullName || 'Your Name').toUpperCase();
    const nameLines = this.splitText(name, this.pageWidth - 2 * margin - 8);
    let nameY = 28;
    nameLines.slice(0, 2).forEach((line: string) => {
      this.text(line, margin + 8, nameY);
      nameY += 12;
    });

    // Title in accent color
    if (resume.title) {
      this.setColor(this.theme.accent);
      this.setFont('normal');
      this.doc.setFontSize(11);
      this.text(resume.title.toUpperCase(), margin + 8, 48);
    }

    this.y = heroHeight + 8;

    // Contact bar
    this.setFont('normal');
    this.doc.setFontSize(9);
    this.setColor(this.theme.muted);
    const contactBar = [resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join('   |   ');
    if (contactBar) {
      this.text(contactBar, this.pageWidth - margin, this.y, { align: 'right' });
      this.y += 10;
    }

    // Skills as tags at top
    if (resume.skills.length > 0) {
      this.y += 5;
      let tagX = margin;
      const tagY = this.y;

      this.doc.setFontSize(8);
      this.setFont('bold');

      resume.skills.slice(0, 10).forEach((skill) => {
        const tagWidth = this.getTextWidth(skill) + 8;
        if (tagX + tagWidth > this.pageWidth - margin) return;

        // Tag background
        this.setColor(this.theme.surface, 'fill');
        this.doc.roundedRect(tagX, tagY - 4, tagWidth, 7, 3.5, 3.5, 'F');

        // Tag text
        this.setColor(this.theme.text);
        this.text(skill, tagX + 4, tagY);
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

      this.setFont('bold');
      this.doc.setFontSize(12);
      this.setColor(this.theme.text);
      this.text(getSectionHeader(title, this.locale), margin + 9, this.y);
      this.y += 8;

      this.setFont('normal');
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
          this.setFont('bold');
          this.doc.setFontSize(11);
          this.setColor(this.theme.text);
          this.text(exp.position || 'Position', margin + 10, this.y);
          this.y += 5;

          // Company + dates
          this.setFont('normal');
          this.doc.setFontSize(9.5);
          this.setColor(this.theme.muted);
          const meta = `${exp.company} | ${formatDate(exp.startDate, this.locale)} - ${exp.current ? getPresentText(this.locale) : formatDate(exp.endDate, this.locale)}`;
          this.text(meta, margin + 10, this.y);
          this.y += 5;

          // Bullets
          this.doc.setFontSize(9.5);
          this.setColor(this.theme.text);
          exp.bullets.filter(b => b?.trim()).forEach((bullet) => {
            this.checkPageBreak(8);
            const bulletLines = this.splitText(bullet, contentWidth - 15);
            bulletLines.forEach((line: string) => {
              this.text(line, margin + 10, this.y);
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
          this.setFont('bold');
          this.doc.setFontSize(11);
          this.setColor(this.theme.text);
          this.text(`${edu.degree}${edu.field ? ' in ' + edu.field : ''}`, margin, this.y);
          this.y += 5;

          this.setFont('normal');
          this.doc.setFontSize(10);
          this.setColor(this.theme.muted);
          this.text(`${edu.institution}${edu.graduationDate ? ' | ' + formatDate(edu.graduationDate, this.locale) : ''}`, margin, this.y);
          this.y += 8;
        });
      });
    }

    // Projects
    if (resume.projects.length > 0) {
      addSection('projects', () => {
        resume.projects.forEach((project, idx) => {
          if (idx > 0) this.y += 3;
          this.checkPageBreak(12);

          this.setFont('bold');
          this.doc.setFontSize(10.5);
          this.setColor(this.theme.text);
          this.text(project.name || 'Project', margin, this.y);
          this.y += 4;

          if (project.description) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.bodySize);
            this.setColor(this.theme.muted);
            this.addWrappedText(project.description, margin, contentWidth, 4.5);
          }

          if (project.technologies && project.technologies.length > 0) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.muted);
            this.text(`Tech: ${project.technologies.join(', ')}`, margin, this.y);
            this.y += 4;
          }

          if (project.url) {
            this.setFont('normal');
            this.doc.setFontSize(this.config.typography.smallSize);
            this.setColor(this.theme.accent);
            this.text(project.url, margin, this.y);
            this.y += 4;
          }

          this.y += 2;
        });
      });
    }
  }

  // ============================================
  // Main Render Method
  // ============================================

  public async render(resume: ResumeData, templateId: TemplateId): Promise<jsPDF> {
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
    await this.addSeeraLinkQr(resume);
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
  await renderer.prepareFonts(resume);
  await renderer.render(resume, template);
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
