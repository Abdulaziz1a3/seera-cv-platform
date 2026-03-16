'use client';

import { useMemo } from 'react';
import QRCode from 'react-qr-code';
import type { ResumeData, TemplateId, ThemeId } from '@/lib/resume-types';
import { THEMES, formatDate, getPresentText, getSectionHeader } from '@/lib/templates';
import { cn } from '@/lib/utils';

interface LivePreviewProps {
  resume: ResumeData;
  scale?: number;
  showWatermark?: boolean;
  watermarkText?: string;
  compact?: boolean;
}

// A4 dimensions in pixels at 96 DPI (approx)
const A4_WIDTH = 210; // mm
const A4_HEIGHT = 297; // mm
const PREVIEW_SCALE = 0.55; // Scale for sidebar preview

function getPreviewFontFamily(
  fontFamily: ResumeData['settings']['fontFamily'] | undefined,
  locale: ResumeData['locale']
) {
  const base = (() => {
    switch (fontFamily) {
      case 'merriweather':
        return 'var(--font-merriweather), serif';
      case 'playfair':
        return 'var(--font-playfair), serif';
      case 'jakarta':
      default:
        return 'var(--font-jakarta), sans-serif';
    }
  })();

  if (locale === 'ar') {
    return `var(--font-noto-arabic), ${base}`;
  }
  return base;
}

export function LivePreview({
  resume,
  scale = PREVIEW_SCALE,
  showWatermark = false,
  watermarkText,
  compact = false,
}: LivePreviewProps) {
  const theme = THEMES[resume.theme || 'obsidian'];
  const locale = resume.locale || 'en';
  const fontFamily = getPreviewFontFamily(resume.settings?.fontFamily, locale);
  const seeraLinkSlug = resume.contact?.seeraLinkSlug?.trim();
  const showSeeraLinkQr = Boolean(resume.contact?.showSeeraLinkQr && seeraLinkSlug);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://seera-ai.com').replace(/\/$/, '');
  const seeraLinkUrl = showSeeraLinkQr ? `${appUrl}/p/${seeraLinkSlug}` : '';
  const scaledWidth = `${A4_WIDTH * scale}mm`;
  const scaledHeight = `${A4_HEIGHT * scale}mm`;
  const contentMinHeight = compact ? undefined : `${A4_HEIGHT}mm`;
  const finalWatermarkText =
    watermarkText ||
    (locale === 'ar' ? 'Seera AI نسخة مجانية' : 'Seera AI Free Preview');

  // Render based on template
  const renderTemplate = useMemo(() => {
    switch (resume.template) {
      case 'prestige-executive':
        return <PrestigeExecutivePreview resume={resume} theme={theme} locale={locale} fontFamily={fontFamily} />;
      case 'nordic-minimal':
        return <NordicMinimalPreview resume={resume} theme={theme} locale={locale} fontFamily={fontFamily} />;
      case 'metropolitan-split':
        return <MetropolitanSplitPreview resume={resume} theme={theme} locale={locale} fontFamily={fontFamily} />;
      case 'classic-professional':
        return <ClassicProfessionalPreview resume={resume} theme={theme} locale={locale} fontFamily={fontFamily} />;
      case 'impact-modern':
        return <ImpactModernPreview resume={resume} theme={theme} locale={locale} fontFamily={fontFamily} />;
      case 'azure-sidebar':
        return <AzureSidebarPreview resume={resume} theme={theme} locale={locale} fontFamily={fontFamily} />;
      case 'crimson-bold':
        return <CrimsonBoldPreview resume={resume} theme={theme} locale={locale} fontFamily={fontFamily} />;
      case 'sage-academic':
        return <SageAcademicPreview resume={resume} theme={theme} locale={locale} fontFamily={fontFamily} />;
      case 'terra-tech':
        return <TerraTechPreview resume={resume} theme={theme} locale={locale} fontFamily={fontFamily} />;
      case 'pearl-executive':
        return <PearlExecutivePreview resume={resume} theme={theme} locale={locale} fontFamily={fontFamily} />;
      default:
        return <PrestigeExecutivePreview resume={resume} theme={theme} locale={locale} fontFamily={fontFamily} />;
    }
  }, [resume, theme, locale, fontFamily]);

  return (
    <div
      className="relative bg-white shadow-xl rounded-sm overflow-hidden"
      style={{
        width: scaledWidth,
        minHeight: compact ? undefined : scaledHeight,
      }}
    >
      <div
        className="origin-top-left"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        style={{
          width: `${A4_WIDTH}mm`,
          minHeight: contentMinHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {renderTemplate}
      </div>

      {showSeeraLinkQr && (
        <div className="absolute bottom-3 end-3 rounded-lg bg-white/95 p-1 shadow-md border">
          <QRCode value={seeraLinkUrl} size={64} />
        </div>
      )}

      {showWatermark && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
          {/* Tiled diagonal watermark grid */}
          <div className="absolute inset-0 flex flex-col" style={{ gap: '10%' }}>
            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="flex items-center" style={{ gap: '8%', paddingLeft: row % 2 === 0 ? '0%' : '12%' }}>
                {[0, 1, 2, 3].map((col) => (
                  <div
                    key={col}
                    className="shrink-0 font-bold uppercase tracking-[0.2em]"
                    style={{
                      fontSize: `${Math.max(7, 11 * scale)}px`,
                      color: 'rgba(100, 100, 120, 0.13)',
                      transform: 'rotate(-30deg)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Seera AI
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom banner */}
          <div
            className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'rgba(245, 245, 250, 0.92)',
              borderTop: '1px solid rgba(200, 200, 220, 0.6)',
              padding: `${Math.max(3, 5 * scale)}px ${Math.max(8, 12 * scale)}px`,
            }}
          >
            <span
              className="font-semibold text-slate-500"
              style={{ fontSize: `${Math.max(6, 9 * scale)}px`, letterSpacing: '0.05em' }}
            >
              {locale === 'ar'
                ? '✦ نسخة مجانية — قم بالترقية على seera-ai.com لإزالة العلامة المائية'
                : '✦ Free Preview — Upgrade at seera-ai.com to remove watermark'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Prestige Executive Preview
// ============================================

function PrestigeExecutivePreview({
  resume,
  theme,
  locale,
  fontFamily,
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
  fontFamily: string;
}) {
  return (
    <div className="p-8 font-sans text-sm" style={{ color: theme.text, fontFamily }}>
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold uppercase tracking-wide"
          style={{ color: theme.primary }}
        >
          {resume.contact.fullName || 'Your Name'}
        </h1>
        {resume.title && (
          <div className="text-xs uppercase tracking-wide mt-1" style={{ color: theme.muted }}>
            {resume.title}
          </div>
        )}
        <div className="w-16 h-1 mt-2 rounded" style={{ backgroundColor: theme.accent }} />
        <div className="flex flex-wrap gap-2 mt-3 text-xs" style={{ color: theme.muted }}>
          {resume.contact.email && <span>{resume.contact.email}</span>}
          {resume.contact.phone && <><span aria-hidden="true">|</span><span>{resume.contact.phone}</span></>}
          {resume.contact.location && <><span aria-hidden="true">|</span><span>{resume.contact.location}</span></>}
        </div>
        {resume.contact.linkedin && (
          <div className="text-xs mt-1" style={{ color: theme.accent }}>
            {resume.contact.linkedin}
          </div>
        )}
      </div>

      {/* Summary */}
      {resume.summary && (
        <Section title="summary" theme={theme} locale={locale} style="underline">
          <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
            {resume.summary}
          </p>
        </Section>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <Section title="experience" theme={theme} locale={locale} style="underline">
          {resume.experience.map((exp, idx) => (
            <div key={exp.id} className={cn(idx > 0 && 'mt-4')}>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-sm" style={{ color: theme.text }}>
                  {exp.position || 'Position'}
                </h3>
                <span className="text-xs" style={{ color: theme.accent }}>
                  {formatDate(exp.startDate, locale)} - {exp.current ? getPresentText(locale) : formatDate(exp.endDate, locale)}
                </span>
              </div>
              <p className="text-xs italic" style={{ color: theme.muted }}>
                {exp.company}{exp.location && ` | ${exp.location}`}
              </p>
              <ul className="mt-2 space-y-1">
                {exp.bullets.filter(b => b?.trim()).map((bullet, i) => (
                  <li key={i} className="flex text-xs">
                    <span className="mr-2" style={{ color: theme.accent }} aria-hidden="true">-</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <Section title="education" theme={theme} locale={locale} style="underline">
          {resume.education.map((edu) => (
            <div key={edu.id} className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-sm">{edu.degree}{edu.field && ` in ${edu.field}`}</h3>
                <p className="text-xs italic" style={{ color: theme.muted }}>
                  {edu.institution}{edu.gpa && ` | GPA: ${edu.gpa}`}
                </p>
              </div>
              {edu.graduationDate && (
                <span className="text-xs" style={{ color: theme.accent }}>
                  {formatDate(edu.graduationDate, locale)}
                </span>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Skills */}
      {resume.skills.length > 0 && (
        <Section title="skills" theme={theme} locale={locale} style="underline">
          <p className="text-xs">{resume.skills.join('  |  ')}</p>
        </Section>
      )}

      {/* Projects */}
      {resume.projects.length > 0 && (
        <Section title="projects" theme={theme} locale={locale} style="underline">
          {resume.projects.map((project) => (
            <div key={project.id} className="mb-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-xs">{project.name || 'Project'}</h3>
                {project.url && (
                  <span className="text-[10px]" style={{ color: theme.accent }}>
                    {project.url.replace(/^https?:\/\//, '')}
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-xs mt-1" style={{ color: theme.muted }}>
                  {project.description}
                </p>
              )}
              {project.technologies && project.technologies.length > 0 && (
                <p className="text-[10px]" style={{ color: theme.muted }}>
                  Tech: {project.technologies.join(', ')}
                </p>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Certifications */}
      {resume.certifications.length > 0 && (
        <Section title="certifications" theme={theme} locale={locale} style="underline">
          {resume.certifications.map((cert) => (
            <div key={cert.id} className="flex justify-between text-xs mb-1">
              <span>
                <span className="font-medium">{cert.name}</span>
                {cert.issuer && ` - ${cert.issuer}`}
              </span>
              {cert.date && <span style={{ color: theme.accent }}>{formatDate(cert.date, locale)}</span>}
            </div>
          ))}
        </Section>
      )}

      {/* Languages */}
      {resume.languages.length > 0 && (
        <Section title="languages" theme={theme} locale={locale} style="underline">
          <p className="text-xs">
            {resume.languages.map(l => `${l.name} (${l.proficiency})`).join('  |  ')}
          </p>
        </Section>
      )}
    </div>
  );
}

// ============================================
// Nordic Minimal Preview
// ============================================

function NordicMinimalPreview({
  resume,
  theme,
  locale,
  fontFamily,
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
  fontFamily: string;
}) {
  return (
    <div className="p-10 font-sans" style={{ color: theme.text, fontFamily }}>
      {/* Header */}
      <h1 className="text-4xl font-bold">{resume.contact.fullName || 'Your Name'}</h1>
      {resume.title && (
        <p className="text-sm mt-1" style={{ color: theme.muted }}>
          {resume.title}
        </p>
      )}
      <div className="w-8 h-0.5 my-4 rounded" style={{ backgroundColor: theme.accent }} />
      <p className="text-sm" style={{ color: theme.muted }}>
        {[resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join('  /  ')}
      </p>

      {/* Summary */}
      {resume.summary && (
        <p className="mt-8 text-sm leading-relaxed">{resume.summary}</p>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-normal uppercase tracking-widest mb-4" style={{ color: theme.muted }}>
            {getSectionHeader('experience', locale)}
          </h2>
          {resume.experience.map((exp, idx) => (
            <div key={exp.id} className={cn(idx > 0 && 'mt-5')}>
              <div className="flex items-baseline">
                <span className="font-bold text-sm">{exp.position}</span>
                <span className="text-sm ml-2" style={{ color: theme.muted }}>
                  - {exp.company}, {formatDate(exp.startDate, locale)} - {exp.current ? getPresentText(locale) : formatDate(exp.endDate, locale)}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {exp.bullets.filter(b => b?.trim()).map((bullet, i) => (
                  <li key={i} className="text-xs pl-3">- {bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-normal uppercase tracking-widest mb-4" style={{ color: theme.muted }}>
            {getSectionHeader('education', locale)}
          </h2>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-3">
              <span className="font-bold text-sm">{edu.degree}{edu.field && `, ${edu.field}`}</span>
              <p className="text-xs" style={{ color: theme.muted }}>
                {edu.institution}{edu.graduationDate && `, ${formatDate(edu.graduationDate, locale)}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {resume.skills.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-normal uppercase tracking-widest mb-4" style={{ color: theme.muted }}>
            {getSectionHeader('skills', locale)}
          </h2>
          <p className="text-xs">{resume.skills.join(', ')}</p>
        </div>
      )}

      {/* Projects */}
      {resume.projects.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-normal uppercase tracking-widest mb-4" style={{ color: theme.muted }}>
            {getSectionHeader('projects', locale)}
          </h2>
          {resume.projects.map((project) => (
            <div key={project.id} className="mb-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm">{project.name || 'Project'}</span>
                {project.url && (
                  <span className="text-[10px]" style={{ color: theme.accent }}>
                    {project.url.replace(/^https?:\/\//, '')}
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-xs mt-1" style={{ color: theme.muted }}>
                  {project.description}
                </p>
              )}
              {project.technologies && project.technologies.length > 0 && (
                <p className="text-[10px]" style={{ color: theme.muted }}>
                  Tech: {project.technologies.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Metropolitan Split Preview
// ============================================

function MetropolitanSplitPreview({
  resume,
  theme,
  locale,
  fontFamily,
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
  fontFamily: string;
}) {
  const photo = resume.contact.photo?.trim();

  return (
    <div className="flex min-h-full" style={{ fontFamily }}>
      {/* Sidebar */}
      <div className="w-24 p-4" style={{ backgroundColor: theme.secondary }}>
        {/* Photo placeholder */}
        {photo ? (
          <img
            src={photo}
            alt="Profile"
            className="w-12 h-12 mx-auto rounded-full mb-6 object-cover"
          />
        ) : (
          <div
            className="w-12 h-12 mx-auto rounded-full mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          />
        )}

        {/* Contact */}
        <div className="text-white text-[8px] mb-6">
          <h3 className="font-bold text-[9px] mb-2">
            {getSectionHeader('contact', locale)}
          </h3>
          {resume.contact.email && (
            <p className="break-all mb-1">{resume.contact.email}</p>
          )}
          {resume.contact.phone && <p className="mb-1">{resume.contact.phone}</p>}
          {resume.contact.location && <p className="mb-1">{resume.contact.location}</p>}
        </div>

        {/* Skills */}
        {resume.skills.length > 0 && (
          <div className="text-white text-[8px] mb-6">
            <h3 className="font-bold text-[9px] mb-2">
              {getSectionHeader('skills', locale)}
            </h3>
            <div className="space-y-1">
              {resume.skills.slice(0, 10).map((skill, i) => (
                <div
                  key={i}
                  className="px-1.5 py-0.5 rounded text-[7px]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {resume.languages.length > 0 && (
          <div className="text-white text-[8px]">
            <h3 className="font-bold text-[9px] mb-2">
              {getSectionHeader('languages', locale)}
            </h3>
            {resume.languages.map((lang, i) => (
              <p key={i} className="mb-1">
                {lang.name}
                <span className="block text-[7px] opacity-70">{lang.proficiency}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ color: theme.text }}>
          {resume.contact.fullName || 'Your Name'}
        </h1>
        {resume.title && (
          <p className="text-sm uppercase mt-1" style={{ color: theme.muted }}>
            {resume.title}
          </p>
        )}

        {/* Summary */}
        {resume.summary && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-0.5 h-4" style={{ backgroundColor: theme.accent }} />
              <h2 className="font-bold text-sm">{getSectionHeader('summary', locale)}</h2>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: theme.muted }}>
              {resume.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-0.5 h-4" style={{ backgroundColor: theme.accent }} />
              <h2 className="font-bold text-sm">{getSectionHeader('experience', locale)}</h2>
            </div>
            {resume.experience.map((exp, idx) => (
              <div key={exp.id} className={cn(idx > 0 && 'mt-3')}>
                <div className="flex justify-between">
                  <span className="font-bold text-[11px]">{exp.position}</span>
                  <span className="text-[9px]" style={{ color: theme.accent }}>
                    {formatDate(exp.startDate, locale)} - {exp.current ? getPresentText(locale) : formatDate(exp.endDate, locale)}
                  </span>
                </div>
                <p className="text-[10px]" style={{ color: theme.muted }}>
                  {exp.company}{exp.location && ` | ${exp.location}`}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {exp.bullets.filter(b => b?.trim()).map((bullet, i) => (
                    <li key={i} className="flex text-[9px]">
                      <span className="mr-1" style={{ color: theme.accent }}>-</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <div className="mt-6">
            <h2 className="font-bold text-sm mb-2">{getSectionHeader('education', locale)}</h2>
            {resume.education.map((edu) => (
              <div key={edu.id} className="flex justify-between text-[10px] mb-2">
                <div>
                  <span className="font-bold">{edu.degree}{edu.field && ` in ${edu.field}`}</span>
                  <p style={{ color: theme.muted }}>{edu.institution}</p>
                </div>
                {edu.graduationDate && (
                  <span style={{ color: theme.primary }}>{formatDate(edu.graduationDate, locale)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <div className="mt-6">
            <h2 className="font-bold text-sm mb-2">{getSectionHeader('projects', locale)}</h2>
            {resume.projects.map((project) => (
              <div key={project.id} className="mb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[11px]">{project.name || 'Project'}</span>
                  {project.url && (
                    <span className="text-[9px]" style={{ color: theme.accent }}>
                      {project.url.replace(/^https?:\/\//, '')}
                    </span>
                  )}
                </div>
                {project.description && (
                  <p className="text-[10px]" style={{ color: theme.muted }}>
                    {project.description}
                  </p>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <p className="text-[9px]" style={{ color: theme.muted }}>
                    Tech: {project.technologies.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Classic Professional Preview
// ============================================

function ClassicProfessionalPreview({
  resume,
  theme,
  locale,
  fontFamily,
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
  fontFamily: string;
}) {
  return (
    <div className="p-7 font-sans text-center" style={{ color: theme.text, fontFamily }}>
      {/* Header */}
      <h1 className="text-2xl font-bold">{resume.contact.fullName || 'Your Name'}</h1>
      <p className="text-xs mt-1" style={{ color: theme.muted }}>
        {[resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join('  |  ')}
      </p>
      {resume.contact.linkedin && (
        <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
          {resume.contact.linkedin}
        </p>
      )}

      {/* Content - left aligned */}
      <div className="text-left mt-6">
        {/* Summary */}
        {resume.summary && (
          <div className="mb-4">
            <div className="px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: theme.primary }}>
              {getSectionHeader('summary', locale)}
            </div>
            <p className="text-xs mt-2 leading-relaxed">{resume.summary}</p>
          </div>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <div className="mb-4">
            <div className="px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: theme.primary }}>
              {getSectionHeader('experience', locale)}
            </div>
            <div className="mt-2">
              {resume.experience.map((exp, idx) => (
                <div key={exp.id} className={cn(idx > 0 && 'mt-3')}>
                  <div className="flex justify-between">
                    <span className="font-bold text-xs">{exp.position}</span>
                    <span className="text-[10px]" style={{ color: theme.muted }}>
                      {formatDate(exp.startDate, locale)} - {exp.current ? getPresentText(locale) : formatDate(exp.endDate, locale)}
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: theme.muted }}>{exp.company}</p>
                  <ul className="mt-1">
                    {exp.bullets.filter(b => b?.trim()).map((bullet, i) => (
                      <li key={i} className="text-[10px] ml-2">- {bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <div className="mb-4">
            <div className="px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: theme.primary }}>
              {getSectionHeader('education', locale)}
            </div>
            <div className="mt-2">
              {resume.education.map((edu) => (
                <div key={edu.id} className="flex justify-between text-[10px] mb-1">
                  <div>
                    <span className="font-bold">{edu.degree}{edu.field && ` in ${edu.field}`}</span>
                    <span className="ml-2" style={{ color: theme.muted }}>{edu.institution}</span>
                  </div>
                  {edu.graduationDate && (
                    <span style={{ color: theme.muted }}>{formatDate(edu.graduationDate, locale)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <div className="mb-4">
            <div className="px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: theme.primary }}>
              {getSectionHeader('projects', locale)}
            </div>
            <div className="mt-2">
              {resume.projects.map((project) => (
                <div key={project.id} className="mb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs">{project.name || 'Project'}</span>
                    {project.url && (
                      <span className="text-[10px]" style={{ color: theme.muted }}>
                        {project.url.replace(/^https?:\/\//, '')}
                      </span>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-[10px] mt-1" style={{ color: theme.muted }}>
                      {project.description}
                    </p>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <p className="text-[10px]" style={{ color: theme.muted }}>
                      Tech: {project.technologies.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <div>
            <div className="px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: theme.primary }}>
              {getSectionHeader('skills', locale)}
            </div>
            <p className="text-[10px] mt-2 text-center">{resume.skills.join('  |  ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Impact Modern Preview
// ============================================

function ImpactModernPreview({
  resume,
  theme,
  locale,
  fontFamily,
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
  fontFamily: string;
}) {
  return (
    <div className="font-sans" style={{ color: theme.text, fontFamily }}>
      {/* Hero header */}
      <div className="p-6" style={{ backgroundColor: theme.secondary }}>
        <div className="flex items-start gap-2">
          <div className="w-0.5 h-10 rounded" style={{ backgroundColor: theme.accent }} />
          <div>
            <h1 className="text-2xl font-bold uppercase text-white">
              {resume.contact.fullName || 'Your Name'}
            </h1>
            {resume.title && (
              <p className="text-xs uppercase mt-1" style={{ color: theme.accent }}>
                {resume.title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contact bar */}
      <div className="px-6 py-2 text-right text-[9px]" style={{ color: theme.muted }}>
        {[resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join('   |   ')}
      </div>

      {/* Skills tags */}
      {resume.skills.length > 0 && (
        <div className="px-6 py-3 flex flex-wrap gap-1.5">
          {resume.skills.slice(0, 8).map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-[8px] font-medium"
              style={{ backgroundColor: theme.surface, color: theme.text }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="px-6 pb-6">
        {/* Summary */}
        {resume.summary && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }} />
              <h2 className="font-bold text-xs uppercase">{getSectionHeader('summary', locale)}</h2>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: theme.muted }}>
              {resume.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }} />
              <h2 className="font-bold text-xs uppercase">{getSectionHeader('experience', locale)}</h2>
            </div>
            {resume.experience.map((exp, idx) => (
              <div key={exp.id} className={cn('flex gap-3', idx > 0 && 'mt-3')}>
                <div className="flex flex-col items-center">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                  <div className="flex-1 w-px" style={{ backgroundColor: theme.border }} />
                </div>
                <div className="flex-1 pb-2">
                  <span className="font-bold text-[11px]">{exp.position}</span>
                  <p className="text-[9px]" style={{ color: theme.muted }}>
                    {exp.company} | {formatDate(exp.startDate, locale)} - {exp.current ? getPresentText(locale) : formatDate(exp.endDate, locale)}
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {exp.bullets.filter(b => b?.trim()).map((bullet, i) => (
                      <p key={i} className="text-[9px]">{bullet}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }} />
              <h2 className="font-bold text-xs uppercase">{getSectionHeader('education', locale)}</h2>
            </div>
            {resume.education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <span className="font-bold text-[11px]">{edu.degree}{edu.field && ` in ${edu.field}`}</span>
                <p className="text-[9px]" style={{ color: theme.muted }}>
                  {edu.institution}{edu.graduationDate && ` | ${formatDate(edu.graduationDate, locale)}`}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }} />
              <h2 className="font-bold text-xs uppercase">{getSectionHeader('projects', locale)}</h2>
            </div>
            {resume.projects.map((project) => (
              <div key={project.id} className="mb-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[11px]">{project.name || 'Project'}</span>
                  {project.url && (
                    <span className="text-[9px]" style={{ color: theme.accent }}>
                      {project.url.replace(/^https?:\/\//, '')}
                    </span>
                  )}
                </div>
                {project.description && (
                  <p className="text-[9px]" style={{ color: theme.muted }}>
                    {project.description}
                  </p>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <p className="text-[9px]" style={{ color: theme.muted }}>
                    Tech: {project.technologies.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Azure Sidebar Preview
// ============================================

function AzureSidebarPreview({
  resume,
  theme,
  locale,
  fontFamily,
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
  fontFamily: string;
}) {
  return (
    <div className="flex min-h-full" style={{ fontFamily, color: theme.text }}>
      {/* Main content — left 2/3 */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-6 pb-5" style={{ borderBottom: `2px solid ${theme.accent}` }}>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.primary }}>
            {resume.contact.fullName || 'Your Name'}
          </h1>
          {resume.title && (
            <p className="text-xs font-semibold uppercase tracking-wider mt-1.5" style={{ color: theme.accent }}>
              {resume.title}
            </p>
          )}
        </div>

        {/* Summary */}
        {resume.summary && (
          <div className="mb-5">
            <h2 className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: theme.primary }}>
              {getSectionHeader('summary', locale)}
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>{resume.summary}</p>
          </div>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: theme.primary }}>
              {getSectionHeader('experience', locale)}
            </h2>
            {resume.experience.map((exp, idx) => (
              <div key={exp.id} className={cn(idx > 0 && 'mt-4')}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="font-bold text-xs">{exp.position}</span>
                    <p className="text-[10px]" style={{ color: theme.muted }}>
                      {exp.company}{exp.location && `, ${exp.location}`}
                    </p>
                  </div>
                  <span className="text-[9px] whitespace-nowrap" style={{ color: theme.accent }}>
                    {formatDate(exp.startDate, locale)} – {exp.current ? getPresentText(locale) : formatDate(exp.endDate, locale)}
                  </span>
                </div>
                <ul className="mt-1.5 space-y-0.5">
                  {exp.bullets.filter(b => b?.trim()).map((bullet, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[10px]">
                      <span className="mt-[3px] h-1 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: theme.accent }} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: theme.primary }}>
              {getSectionHeader('education', locale)}
            </h2>
            {resume.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start text-xs mb-2">
                <div>
                  <span className="font-bold">{edu.degree}{edu.field && ` in ${edu.field}`}</span>
                  <p className="text-[10px]" style={{ color: theme.muted }}>
                    {edu.institution}{edu.gpa && ` · GPA ${edu.gpa}`}
                  </p>
                </div>
                {edu.graduationDate && (
                  <span className="text-[10px] whitespace-nowrap" style={{ color: theme.accent }}>
                    {formatDate(edu.graduationDate, locale)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <div>
            <h2 className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: theme.primary }}>
              {getSectionHeader('projects', locale)}
            </h2>
            {resume.projects.map((project) => (
              <div key={project.id} className="mb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs">{project.name || 'Project'}</span>
                  {project.url && (
                    <span className="text-[9px]" style={{ color: theme.accent }}>
                      {project.url.replace(/^https?:\/\//, '')}
                    </span>
                  )}
                </div>
                {project.description && (
                  <p className="text-[10px] mt-0.5" style={{ color: theme.muted }}>{project.description}</p>
                )}
                {project.technologies?.length > 0 && (
                  <p className="text-[9px] mt-0.5" style={{ color: theme.muted }}>
                    {project.technologies.join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar — right 1/3 */}
      <div className="w-40 p-5 flex-shrink-0" style={{ backgroundColor: theme.surface, borderLeft: `1px solid ${theme.border}` }}>
        {/* Contact */}
        <div className="mb-6">
          <h3 className="text-[8px] font-bold uppercase tracking-widest mb-3 pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.border}` }}>
            {getSectionHeader('contact', locale)}
          </h3>
          <div className="space-y-1.5 text-[8px]" style={{ color: theme.muted }}>
            {resume.contact.email && <p className="break-all leading-snug">{resume.contact.email}</p>}
            {resume.contact.phone && <p>{resume.contact.phone}</p>}
            {resume.contact.location && <p>{resume.contact.location}</p>}
            {resume.contact.linkedin && <p className="break-all leading-snug" style={{ color: theme.accent }}>{resume.contact.linkedin}</p>}
          </div>
        </div>

        {/* Skills */}
        {resume.skills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[8px] font-bold uppercase tracking-widest mb-3 pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.border}` }}>
              {getSectionHeader('skills', locale)}
            </h3>
            <div className="space-y-1">
              {resume.skills.slice(0, 14).map((skill, i) => (
                <p key={i} className="text-[8px] flex items-center gap-1" style={{ color: theme.text }}>
                  <span style={{ color: theme.accent }}>›</span>
                  {skill}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {resume.languages.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[8px] font-bold uppercase tracking-widest mb-3 pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.border}` }}>
              {getSectionHeader('languages', locale)}
            </h3>
            {resume.languages.map((lang, i) => (
              <div key={i} className="mb-1">
                <p className="text-[8px] font-medium" style={{ color: theme.text }}>{lang.name}</p>
                <p className="text-[7px]" style={{ color: theme.muted }}>{lang.proficiency}</p>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <div>
            <h3 className="text-[8px] font-bold uppercase tracking-widest mb-3 pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.border}` }}>
              {getSectionHeader('certifications', locale)}
            </h3>
            {resume.certifications.map((cert) => (
              <div key={cert.id} className="mb-1.5">
                <p className="text-[8px] font-semibold leading-snug" style={{ color: theme.text }}>{cert.name}</p>
                {cert.issuer && <p className="text-[7px]" style={{ color: theme.muted }}>{cert.issuer}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Crimson Bold Preview
// ============================================

function CrimsonBoldPreview({
  resume,
  theme,
  locale,
  fontFamily,
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
  fontFamily: string;
}) {
  return (
    <div className="font-sans" style={{ fontFamily, color: theme.text }}>
      {/* Full-bleed header */}
      <div className="py-9 px-8 text-center" style={{ backgroundColor: theme.primary }}>
        <h1 className="text-4xl font-black uppercase tracking-wide text-white leading-tight">
          {resume.contact.fullName || 'Your Name'}
        </h1>
        {resume.title && (
          <p className="text-xs font-semibold uppercase tracking-widest mt-2.5" style={{ color: theme.accent }}>
            {resume.title}
          </p>
        )}
        {/* Contact row */}
        <div className="flex justify-center flex-wrap gap-x-5 gap-y-1 mt-4 text-[9px] text-white/75">
          {resume.contact.email && <span>{resume.contact.email}</span>}
          {resume.contact.phone && <span>{resume.contact.phone}</span>}
          {resume.contact.location && <span>{resume.contact.location}</span>}
          {resume.contact.linkedin && <span style={{ color: theme.accent }}>{resume.contact.linkedin}</span>}
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex gap-0">
        {/* Left panel — skills, education, languages, certs */}
        <div className="w-44 p-6 flex-shrink-0" style={{ backgroundColor: theme.surface }}>
          {/* Skills */}
          {resume.skills.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[8px] font-bold uppercase tracking-widest mb-2.5" style={{ color: theme.primary }}>
                {getSectionHeader('skills', locale)}
              </h3>
              <div className="space-y-1">
                {resume.skills.slice(0, 14).map((skill, i) => (
                  <p key={i} className="text-[8px]" style={{ color: theme.text }}>· {skill}</p>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resume.education.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[8px] font-bold uppercase tracking-widest mb-2.5" style={{ color: theme.primary }}>
                {getSectionHeader('education', locale)}
              </h3>
              {resume.education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <p className="text-[8px] font-bold leading-snug">{edu.degree}{edu.field && ` in ${edu.field}`}</p>
                  <p className="text-[7px]" style={{ color: theme.muted }}>{edu.institution}</p>
                  {edu.graduationDate && (
                    <p className="text-[7px]" style={{ color: theme.accent }}>{formatDate(edu.graduationDate, locale)}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {resume.languages.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[8px] font-bold uppercase tracking-widest mb-2.5" style={{ color: theme.primary }}>
                {getSectionHeader('languages', locale)}
              </h3>
              {resume.languages.map((lang, i) => (
                <div key={i} className="mb-1">
                  <p className="text-[8px] font-medium">{lang.name}</p>
                  <p className="text-[7px]" style={{ color: theme.muted }}>{lang.proficiency}</p>
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {resume.certifications.length > 0 && (
            <div>
              <h3 className="text-[8px] font-bold uppercase tracking-widest mb-2.5" style={{ color: theme.primary }}>
                {getSectionHeader('certifications', locale)}
              </h3>
              {resume.certifications.map((cert) => (
                <div key={cert.id} className="mb-1.5">
                  <p className="text-[8px] font-semibold leading-snug">{cert.name}</p>
                  {cert.issuer && <p className="text-[7px]" style={{ color: theme.muted }}>{cert.issuer}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel — summary, experience, projects */}
        <div className="flex-1 p-6">
          {/* Summary */}
          {resume.summary && (
            <div className="mb-5">
              <h2 className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: theme.primary }}>
                {getSectionHeader('summary', locale)}
              </h2>
              <div className="h-px mb-2" style={{ backgroundColor: theme.accent }} />
              <p className="text-[10px] leading-relaxed" style={{ color: theme.muted }}>{resume.summary}</p>
            </div>
          )}

          {/* Experience */}
          {resume.experience.length > 0 && (
            <div className="mb-5">
              <h2 className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: theme.primary }}>
                {getSectionHeader('experience', locale)}
              </h2>
              <div className="h-px mb-3" style={{ backgroundColor: theme.accent }} />
              {resume.experience.map((exp, idx) => (
                <div key={exp.id} className={cn(idx > 0 && 'mt-4')}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-xs">{exp.position}</span>
                    <span className="text-[9px] whitespace-nowrap" style={{ color: theme.accent }}>
                      {formatDate(exp.startDate, locale)} – {exp.current ? getPresentText(locale) : formatDate(exp.endDate, locale)}
                    </span>
                  </div>
                  <p className="text-[10px] italic" style={{ color: theme.muted }}>
                    {exp.company}{exp.location && ` · ${exp.location}`}
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {exp.bullets.filter(b => b?.trim()).map((bullet, i) => (
                      <li key={i} className="text-[10px] flex gap-1.5">
                        <span style={{ color: theme.accent }}>—</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {resume.projects.length > 0 && (
            <div>
              <h2 className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: theme.primary }}>
                {getSectionHeader('projects', locale)}
              </h2>
              <div className="h-px mb-3" style={{ backgroundColor: theme.accent }} />
              {resume.projects.map((project) => (
                <div key={project.id} className="mb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs">{project.name || 'Project'}</span>
                    {project.url && (
                      <span className="text-[9px]" style={{ color: theme.accent }}>
                        {project.url.replace(/^https?:\/\//, '')}
                      </span>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-[10px] mt-0.5" style={{ color: theme.muted }}>{project.description}</p>
                  )}
                  {project.technologies?.length > 0 && (
                    <p className="text-[9px] mt-0.5" style={{ color: theme.muted }}>
                      {project.technologies.join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Sage Academic Preview
// ============================================

function SageAcademicPreview({
  resume,
  theme,
  locale,
  fontFamily,
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
  fontFamily: string;
}) {
  const AcademicSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mt-7">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-center mb-2" style={{ color: theme.primary }}>
        {getSectionHeader(title, locale)}
      </h2>
      {/* Double rule: thick + thin */}
      <div className="mb-4">
        <div className="h-px" style={{ backgroundColor: theme.primary }} />
        <div className="h-px mt-0.5 opacity-40" style={{ backgroundColor: theme.primary }} />
      </div>
      {children}
    </div>
  );

  return (
    <div className="p-10 font-sans" style={{ fontFamily, color: theme.text }}>
      {/* Centered header */}
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold" style={{ color: theme.primary }}>
          {resume.contact.fullName || 'Your Name'}
        </h1>
        {resume.title && (
          <p className="text-sm mt-1.5 italic" style={{ color: theme.muted }}>{resume.title}</p>
        )}
      </div>

      {/* Decorative rule */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
        <div className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
      </div>

      {/* Contact row */}
      <div className="flex justify-center flex-wrap gap-x-5 gap-y-1 text-[9px] mb-1" style={{ color: theme.muted }}>
        {resume.contact.email && <span>{resume.contact.email}</span>}
        {resume.contact.phone && <span>{resume.contact.phone}</span>}
        {resume.contact.location && <span>{resume.contact.location}</span>}
        {resume.contact.linkedin && <span style={{ color: theme.accent }}>{resume.contact.linkedin}</span>}
      </div>

      {/* Summary */}
      {resume.summary && (
        <AcademicSection title="summary">
          <p className="text-xs leading-relaxed text-center italic" style={{ color: theme.muted }}>
            {resume.summary}
          </p>
        </AcademicSection>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <AcademicSection title="experience">
          {resume.experience.map((exp, idx) => (
            <div key={exp.id} className={cn(idx > 0 && 'mt-5')}>
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm">{exp.position}</span>
                <span className="text-[10px]" style={{ color: theme.accent }}>
                  {formatDate(exp.startDate, locale)} – {exp.current ? getPresentText(locale) : formatDate(exp.endDate, locale)}
                </span>
              </div>
              <p className="text-xs italic mb-1.5" style={{ color: theme.muted }}>
                {exp.company}{exp.location && `, ${exp.location}`}
              </p>
              <ul className="space-y-0.5">
                {exp.bullets.filter(b => b?.trim()).map((bullet, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span style={{ color: theme.accent }}>◆</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </AcademicSection>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <AcademicSection title="education">
          {resume.education.map((edu) => (
            <div key={edu.id} className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-xs">{edu.degree}{edu.field && `, ${edu.field}`}</p>
                <p className="text-[10px] italic" style={{ color: theme.muted }}>
                  {edu.institution}{edu.location && `, ${edu.location}`}
                  {edu.gpa && ` · GPA: ${edu.gpa}`}
                </p>
              </div>
              {edu.graduationDate && (
                <span className="text-[10px] whitespace-nowrap" style={{ color: theme.accent }}>
                  {formatDate(edu.graduationDate, locale)}
                </span>
              )}
            </div>
          ))}
        </AcademicSection>
      )}

      {/* Skills */}
      {resume.skills.length > 0 && (
        <AcademicSection title="skills">
          <p className="text-xs text-center leading-relaxed">
            {resume.skills.join(' · ')}
          </p>
        </AcademicSection>
      )}

      {/* Projects */}
      {resume.projects.length > 0 && (
        <AcademicSection title="projects">
          {resume.projects.map((project) => (
            <div key={project.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-xs">{project.name || 'Project'}</span>
                {project.url && (
                  <span className="text-[9px]" style={{ color: theme.accent }}>
                    {project.url.replace(/^https?:\/\//, '')}
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-[10px] mt-0.5 italic" style={{ color: theme.muted }}>{project.description}</p>
              )}
              {project.technologies?.length > 0 && (
                <p className="text-[9px] mt-0.5" style={{ color: theme.muted }}>
                  {project.technologies.join(', ')}
                </p>
              )}
            </div>
          ))}
        </AcademicSection>
      )}

      {/* Certifications + Languages row */}
      {(resume.certifications.length > 0 || resume.languages.length > 0) && (
        <div className="flex gap-6 mt-7">
          {resume.certifications.length > 0 && (
            <div className="flex-1">
              <h2 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: theme.primary }}>
                {getSectionHeader('certifications', locale)}
              </h2>
              <div className="h-px mb-3" style={{ backgroundColor: theme.border }} />
              {resume.certifications.map((cert) => (
                <div key={cert.id} className="mb-1.5 text-xs">
                  <span className="font-medium">{cert.name}</span>
                  {cert.issuer && <span className="text-[10px]" style={{ color: theme.muted }}> · {cert.issuer}</span>}
                </div>
              ))}
            </div>
          )}
          {resume.languages.length > 0 && (
            <div className="flex-1">
              <h2 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: theme.primary }}>
                {getSectionHeader('languages', locale)}
              </h2>
              <div className="h-px mb-3" style={{ backgroundColor: theme.border }} />
              {resume.languages.map((lang, i) => (
                <p key={i} className="text-xs mb-1">
                  <span className="font-medium">{lang.name}</span>
                  <span style={{ color: theme.muted }}> · {lang.proficiency}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Terra Tech Preview
// ============================================

function TerraTechPreview({
  resume,
  theme,
  locale,
  fontFamily,
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
  fontFamily: string;
}) {
  return (
    <div className="p-7 font-sans" style={{ fontFamily, color: theme.text }}>
      {/* Split header */}
      <div className="flex items-end justify-between pb-4 mb-5" style={{ borderBottom: `2px solid ${theme.primary}` }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
            {resume.contact.fullName || 'Your Name'}
          </h1>
          {resume.title && (
            <p className="text-xs font-semibold mt-1 uppercase tracking-wide" style={{ color: theme.accent }}>
              {resume.title}
            </p>
          )}
        </div>
        <div className="text-right space-y-0.5">
          {resume.contact.email && <p className="text-[9px]" style={{ color: theme.muted }}>{resume.contact.email}</p>}
          {resume.contact.phone && <p className="text-[9px]" style={{ color: theme.muted }}>{resume.contact.phone}</p>}
          {resume.contact.location && <p className="text-[9px]" style={{ color: theme.muted }}>{resume.contact.location}</p>}
          {resume.contact.linkedin && <p className="text-[9px]" style={{ color: theme.accent }}>{resume.contact.linkedin}</p>}
        </div>
      </div>

      {/* Skill pills */}
      {resume.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {resume.skills.map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full text-[8px] font-medium border"
              style={{ borderColor: theme.accent, color: theme.accent, backgroundColor: `${theme.accent}18` }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Summary */}
      {resume.summary && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
            <h2 className="text-[9px] font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
              {getSectionHeader('summary', locale)}
            </h2>
            <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: theme.muted }}>{resume.summary}</p>
        </div>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
            <h2 className="text-[9px] font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
              {getSectionHeader('experience', locale)}
            </h2>
            <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
          </div>
          {resume.experience.map((exp, idx) => (
            <div key={exp.id} className={cn('flex gap-3', idx > 0 && 'mt-4')}>
              {/* Left border timeline */}
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full border-2 flex-shrink-0" style={{ borderColor: theme.accent, backgroundColor: theme.background }} />
                <div className="flex-1 w-px mt-1" style={{ backgroundColor: theme.border }} />
              </div>
              <div className="flex-1 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-bold text-xs">{exp.position}</span>
                  <span className="text-[9px] whitespace-nowrap" style={{ color: theme.accent }}>
                    {formatDate(exp.startDate, locale)} – {exp.current ? getPresentText(locale) : formatDate(exp.endDate, locale)}
                  </span>
                </div>
                <p className="text-[10px]" style={{ color: theme.muted }}>
                  {exp.company}{exp.location && ` · ${exp.location}`}
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {exp.bullets.filter(b => b?.trim()).map((bullet, i) => (
                    <li key={i} className="text-[10px] flex gap-1.5">
                      <span className="text-[9px]" style={{ color: theme.accent }}>›</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two-column: Education + (Certs & Languages) */}
      <div className="flex gap-6 mt-5">
        {/* Education */}
        {resume.education.length > 0 && (
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
              <h2 className="text-[9px] font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
                {getSectionHeader('education', locale)}
              </h2>
              <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
            </div>
            {resume.education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <p className="font-bold text-xs">{edu.degree}{edu.field && ` in ${edu.field}`}</p>
                <p className="text-[10px]" style={{ color: theme.muted }}>{edu.institution}</p>
                {edu.graduationDate && (
                  <p className="text-[9px]" style={{ color: theme.accent }}>{formatDate(edu.graduationDate, locale)}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Certs + Languages */}
        {(resume.certifications.length > 0 || resume.languages.length > 0) && (
          <div className="flex-1">
            {resume.certifications.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
                  <h2 className="text-[9px] font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
                    {getSectionHeader('certifications', locale)}
                  </h2>
                  <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
                </div>
                {resume.certifications.map((cert) => (
                  <div key={cert.id} className="mb-1.5">
                    <p className="text-xs font-semibold">{cert.name}</p>
                    {cert.issuer && <p className="text-[9px]" style={{ color: theme.muted }}>{cert.issuer}</p>}
                  </div>
                ))}
              </div>
            )}
            {resume.languages.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
                  <h2 className="text-[9px] font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
                    {getSectionHeader('languages', locale)}
                  </h2>
                  <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
                </div>
                {resume.languages.map((lang, i) => (
                  <p key={i} className="text-xs mb-1">
                    <span className="font-medium">{lang.name}</span>
                    <span className="text-[10px]" style={{ color: theme.muted }}> · {lang.proficiency}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Projects */}
      {resume.projects.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
            <h2 className="text-[9px] font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
              {getSectionHeader('projects', locale)}
            </h2>
            <div className="h-px flex-1" style={{ backgroundColor: theme.border }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {resume.projects.map((project) => (
              <div key={project.id} className="rounded p-2" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-[10px]">{project.name || 'Project'}</span>
                  {project.url && (
                    <span className="text-[8px]" style={{ color: theme.accent }}>
                      {project.url.replace(/^https?:\/\/www\./, '')}
                    </span>
                  )}
                </div>
                {project.description && (
                  <p className="text-[9px]" style={{ color: theme.muted }}>{project.description}</p>
                )}
                {project.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {project.technologies.map((tech, i) => (
                      <span key={i} className="text-[7px] px-1 rounded" style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}>
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Pearl Executive Preview
// ============================================

function PearlExecutivePreview({
  resume,
  theme,
  locale,
  fontFamily,
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
  fontFamily: string;
}) {
  return (
    <div className="p-9 font-sans" style={{ fontFamily, color: theme.text }}>
      {/* Header: Name | vertical divider | Contact */}
      <div className="flex items-start gap-6 mb-5">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight leading-tight" style={{ color: theme.primary }}>
            {resume.contact.fullName || 'Your Name'}
          </h1>
          {resume.title && (
            <p className="text-sm font-medium mt-1.5" style={{ color: theme.accent }}>
              {resume.title}
            </p>
          )}
        </div>
        {/* Vertical divider */}
        <div className="w-px self-stretch mx-1 flex-shrink-0" style={{ backgroundColor: theme.border }} />
        {/* Contact block */}
        <div className="text-right space-y-1 flex-shrink-0">
          {resume.contact.email && (
            <p className="text-[9px]" style={{ color: theme.muted }}>{resume.contact.email}</p>
          )}
          {resume.contact.phone && (
            <p className="text-[9px]" style={{ color: theme.muted }}>{resume.contact.phone}</p>
          )}
          {resume.contact.location && (
            <p className="text-[9px]" style={{ color: theme.muted }}>{resume.contact.location}</p>
          )}
          {resume.contact.linkedin && (
            <p className="text-[9px]" style={{ color: theme.accent }}>{resume.contact.linkedin}</p>
          )}
        </div>
      </div>

      {/* Elegant double accent rule */}
      <div className="mb-6 flex items-center gap-0">
        <div className="h-0.5 flex-1" style={{ backgroundColor: theme.primary }} />
        <div className="h-0.5 w-12 ms-1" style={{ backgroundColor: theme.accent }} />
      </div>

      {/* Summary */}
      {resume.summary && (
        <div className="mb-6">
          <p className="text-xs leading-relaxed italic" style={{ color: theme.muted }}>
            {resume.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
              {getSectionHeader('experience', locale)}
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
          </div>
          {resume.experience.map((exp, idx) => (
            <div key={exp.id} className={cn(idx > 0 && 'mt-5')}>
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-sm" style={{ color: theme.primary }}>{exp.position}</span>
                  <span className="text-xs ms-2" style={{ color: theme.accent }}>
                    {exp.company}
                  </span>
                </div>
                <span className="text-[10px] font-medium" style={{ color: theme.muted }}>
                  {formatDate(exp.startDate, locale)} — {exp.current ? getPresentText(locale) : formatDate(exp.endDate, locale)}
                </span>
              </div>
              {exp.location && (
                <p className="text-[10px]" style={{ color: theme.muted }}>{exp.location}</p>
              )}
              <ul className="mt-2 space-y-1">
                {exp.bullets.filter(b => b?.trim()).map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-[10px]">
                    <span className="mt-[2px] flex-shrink-0 font-bold" style={{ color: theme.accent }}>◆</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
              {getSectionHeader('education', locale)}
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
          </div>
          {resume.education.map((edu) => (
            <div key={edu.id} className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-xs">{edu.degree}{edu.field && ` in ${edu.field}`}</p>
                <p className="text-[10px] italic" style={{ color: theme.muted }}>
                  {edu.institution}{edu.location && `, ${edu.location}`}
                  {edu.gpa && ` · GPA ${edu.gpa}`}
                </p>
              </div>
              {edu.graduationDate && (
                <span className="text-[10px]" style={{ color: theme.muted }}>
                  {formatDate(edu.graduationDate, locale)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills — elegant single line */}
      {resume.skills.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
              {getSectionHeader('skills', locale)}
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
          </div>
          <p className="text-xs leading-relaxed">
            {resume.skills.map((skill, i) => (
              <span key={i}>
                {skill}
                {i < resume.skills.length - 1 && (
                  <span className="mx-2 font-bold" style={{ color: theme.accent }}>·</span>
                )}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Bottom row: Projects, Certs, Languages */}
      {(resume.projects.length > 0 || resume.certifications.length > 0 || resume.languages.length > 0) && (
        <div className="flex gap-6">
          {resume.projects.length > 0 && (
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
                  {getSectionHeader('projects', locale)}
                </h2>
                <div className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
              </div>
              {resume.projects.map((project) => (
                <div key={project.id} className="mb-2">
                  <span className="font-semibold text-xs">{project.name}</span>
                  {project.description && (
                    <p className="text-[9px]" style={{ color: theme.muted }}>{project.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {resume.certifications.length > 0 && (
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
                  {getSectionHeader('certifications', locale)}
                </h2>
                <div className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
              </div>
              {resume.certifications.map((cert) => (
                <div key={cert.id} className="mb-1.5 text-xs">
                  <span className="font-medium">{cert.name}</span>
                  {cert.issuer && <p className="text-[9px]" style={{ color: theme.muted }}>{cert.issuer}</p>}
                </div>
              ))}
            </div>
          )}
          {resume.languages.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
                  {getSectionHeader('languages', locale)}
                </h2>
                <div className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
              </div>
              {resume.languages.map((lang, i) => (
                <p key={i} className="text-xs mb-1">
                  <span className="font-medium">{lang.name}</span>
                  <span className="text-[10px] ms-1" style={{ color: theme.muted }}>{lang.proficiency}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Section Component
// ============================================

function Section({
  title,
  theme,
  locale,
  style = 'underline',
  children,
}: {
  title: string;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
  style?: 'underline' | 'background' | 'simple';
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <h2
        className="text-xs font-bold uppercase tracking-wide mb-2"
        style={{ color: theme.primary }}
      >
        {getSectionHeader(title, locale)}
      </h2>
      {style === 'underline' && (
        <div className="h-px mb-3" style={{ backgroundColor: theme.accent }} />
      )}
      {children}
    </div>
  );
}

export default LivePreview;
