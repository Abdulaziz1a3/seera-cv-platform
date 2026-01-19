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

export function LivePreview({
  resume,
  scale = PREVIEW_SCALE,
  showWatermark = false,
  watermarkText,
  compact = false,
}: LivePreviewProps) {
  const theme = THEMES[resume.theme || 'obsidian'];
  const locale = resume.locale || 'en';
  const seeraLinkSlug = resume.contact?.seeraLinkSlug?.trim();
  const showSeeraLinkQr = Boolean(resume.contact?.showSeeraLinkQr && seeraLinkSlug);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://seera-ai.com').replace(/\/$/, '');
  const seeraLinkUrl = showSeeraLinkQr ? `${appUrl}/p/${seeraLinkSlug}` : '';
  const scaledWidth = `${A4_WIDTH * scale}mm`;
  const scaledHeight = compact ? 'auto' : `${A4_HEIGHT * scale}mm`;
  const contentMinHeight = compact ? 'auto' : `${A4_HEIGHT}mm`;
  const finalWatermarkText =
    watermarkText ||
    (locale === 'ar' ? 'Seera AI نسخة مجانية' : 'Seera AI Free Preview');

  // Render based on template
  const renderTemplate = useMemo(() => {
    switch (resume.template) {
      case 'prestige-executive':
        return <PrestigeExecutivePreview resume={resume} theme={theme} locale={locale} />;
      case 'nordic-minimal':
        return <NordicMinimalPreview resume={resume} theme={theme} locale={locale} />;
      case 'metropolitan-split':
        return <MetropolitanSplitPreview resume={resume} theme={theme} locale={locale} />;
      case 'classic-professional':
        return <ClassicProfessionalPreview resume={resume} theme={theme} locale={locale} />;
      case 'impact-modern':
        return <ImpactModernPreview resume={resume} theme={theme} locale={locale} />;
      default:
        return <PrestigeExecutivePreview resume={resume} theme={theme} locale={locale} />;
    }
  }, [resume, theme, locale]);

  return (
    <div
      className="relative bg-white shadow-xl rounded-sm overflow-hidden"
      style={{
        width: scaledWidth,
        minHeight: scaledHeight,
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
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-2xl font-semibold uppercase tracking-widest text-slate-300/70 rotate-[-20deg]">
            {finalWatermarkText}
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
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
}) {
  return (
    <div className="p-8 font-sans text-sm" style={{ color: theme.text }}>
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
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
}) {
  return (
    <div className="p-10 font-sans" style={{ color: theme.text }}>
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
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
}) {
  const photo = resume.contact.photo?.trim();

  return (
    <div className="flex min-h-full">
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
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
}) {
  return (
    <div className="p-7 font-sans text-center" style={{ color: theme.text }}>
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
}: {
  resume: ResumeData;
  theme: typeof THEMES.obsidian;
  locale: 'en' | 'ar';
}) {
  return (
    <div className="font-sans" style={{ color: theme.text }}>
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
