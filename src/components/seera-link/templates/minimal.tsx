'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  MessageCircle,
  Phone,
  Mail,
  Linkedin,
  ExternalLink,
  Award,
  Briefcase,
  FolderKanban,
  Trophy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAnalyticsTracker } from '../analytics-beacon';
import { CvActions } from '../cv-actions';
import {
  buildWhatsAppUrl,
  buildMailtoUrl,
  buildTelUrl,
} from '@/lib/seera-link/utils';
import { getThemeColors } from '@/lib/seera-link/themes';
import type { ProfileData } from './types';

interface MinimalTemplateProps {
  profile: ProfileData;
}

const translations = {
  en: {
    highlights: 'Highlights',
    experience: 'Experience',
    projects: 'Projects',
    certificates: 'Certificates',
    present: 'Present',
    viewMore: 'View More',
    viewLess: 'View Less',
    poweredBy: 'Powered by',
    whatsapp: 'WhatsApp',
    call: 'Call',
    email: 'Email',
    linkedin: 'LinkedIn',
    downloadCv: 'Download CV',
    viewCv: 'View CV',
    preparingCv: 'Preparing CV...',
  },
  ar: {
    highlights: 'أبرز الإنجازات',
    experience: 'الخبرات',
    projects: 'المشاريع',
    certificates: 'الشهادات',
    present: 'حتى الآن',
    viewMore: 'عرض المزيد',
    viewLess: 'عرض أقل',
    poweredBy: 'مدعوم من',
    whatsapp: 'واتساب',
    call: 'اتصال',
    email: 'بريد',
    linkedin: 'لينكدإن',
    downloadCv: 'تحميل السيرة',
  },
};

export function ProfileMinimalTemplate({ profile }: MinimalTemplateProps) {
  const t = translations[profile.language];
  const isRtl = profile.language === 'ar';
  const themeColors = getThemeColors(profile.themeColor);
  const { trackCTA, trackDownload } = useAnalyticsTracker(profile.id);

  const [showAllExperiences, setShowAllExperiences] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);

  const visibleExperiences = showAllExperiences
    ? profile.experiences
    : profile.experiences.slice(0, 3);
  const visibleProjects = showAllProjects
    ? profile.projects
    : profile.projects.slice(0, 3);

  // Build CTA URLs
  const whatsappUrl = profile.ctaWhatsappNumber
    ? buildWhatsAppUrl(profile.ctaWhatsappNumber, profile.ctaWhatsappMessage || undefined)
    : null;
  const phoneUrl = profile.ctaPhoneNumber
    ? buildTelUrl(profile.ctaPhoneNumber)
    : null;
  const emailUrl = profile.ctaEmail
    ? buildMailtoUrl(
        profile.ctaEmail,
        profile.ctaEmailSubject || undefined,
        profile.ctaEmailBody || undefined
      )
    : null;

  const hasCtaWhatsapp = profile.enabledCtas.includes('WHATSAPP') && whatsappUrl;
  const hasCtaPhone = profile.enabledCtas.includes('PHONE') && phoneUrl && !profile.hidePhoneNumber;
  const hasCtaEmail = profile.enabledCtas.includes('EMAIL') && emailUrl;
  const hasCtaLinkedin = profile.enabledCtas.includes('LINKEDIN') && profile.ctaLinkedinUrl;

  return (
    <div
      className="min-h-screen bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        '--profile-primary': themeColors.primary,
        '--profile-accent': themeColors.accent,
      } as React.CSSProperties}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8">
          {/* Avatar */}
          {profile.avatarUrl && (
            <div className="relative w-28 h-28 mx-auto mb-4">
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName}
                fill
                className="rounded-full object-cover border-4 border-background shadow-lg"
                priority
              />
            </div>
          )}

          {/* Name & Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            {profile.displayName}
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            {profile.title}
          </p>

          {/* Location */}
          {profile.location && (
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-4">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </div>
          )}

          {/* Status Badges */}
          {profile.statusBadges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {profile.statusBadges.map((badge, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              ))}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-6">
              {profile.bio}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            {hasCtaWhatsapp && (
              <Button
                asChild
                className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                onClick={() => trackCTA('WHATSAPP')}
              >
                <a href={whatsappUrl!} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t.whatsapp}
                </a>
              </Button>
            )}

            {hasCtaPhone && (
              <Button
                asChild
                variant="outline"
                onClick={() => trackCTA('PHONE')}
              >
                <a href={phoneUrl!}>
                  <Phone className="w-4 h-4 mr-2" />
                  {t.call}
                </a>
              </Button>
            )}

            {hasCtaEmail && (
              <Button
                asChild
                variant="outline"
                onClick={() => trackCTA('EMAIL')}
              >
                <a href={emailUrl!}>
                  <Mail className="w-4 h-4 mr-2" />
                  {t.email}
                </a>
              </Button>
            )}

            {hasCtaLinkedin && (
              <Button
                asChild
                variant="outline"
                onClick={() => trackCTA('LINKEDIN')}
              >
                <a href={profile.ctaLinkedinUrl!} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4 mr-2" />
                  {t.linkedin}
                </a>
              </Button>
            )}

            <CvActions
              profileId={profile.id}
              slug={profile.slug}
              cvResumeId={profile.cvResumeId}
              cvFileUrl={profile.cvFileUrl}
              enableDownloadCv={profile.enableDownloadCv}
              enabledCtas={profile.enabledCtas}
              labels={{ download: t.downloadCv, view: t.viewCv, preparing: t.preparingCv }}
              isPreview={profile.isPreview}
              onDownload={() => trackDownload()}
            />
          </div>
        </div>

        {/* Highlights Section */}
        {profile.highlights.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              {t.highlights}
            </h2>
            <div className="grid gap-3">
              {profile.highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm text-foreground">{highlight.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience Section */}
        {profile.experiences.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              {t.experience}
            </h2>
            <div className="space-y-4">
              {visibleExperiences.map((exp) => (
                <Card key={exp.id} className={exp.isFeatured ? 'border-primary/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-foreground">{exp.role}</h3>
                      {exp.startDate && (
                        <span className="text-xs text-muted-foreground">
                          {exp.startDate} - {exp.endDate || t.present}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {exp.company}
                      {exp.location && ` • ${exp.location}`}
                    </p>
                    {exp.description && (
                      <p className="text-sm text-foreground/80 mt-2">
                        {exp.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {profile.experiences.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                onClick={() => setShowAllExperiences(!showAllExperiences)}
              >
                {showAllExperiences ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    {t.viewLess}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    {t.viewMore} ({profile.experiences.length - 3})
                  </>
                )}
              </Button>
            )}
          </section>
        )}

        {/* Projects Section */}
        {profile.projects.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              {t.projects}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  {project.imageUrl && (
                    <div className="relative h-32 bg-secondary">
                      <Image
                        src={project.imageUrl}
                        alt={project.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-foreground">{project.title}</h3>
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {project.description}
                      </p>
                    )}
                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 4).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {profile.projects.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                onClick={() => setShowAllProjects(!showAllProjects)}
              >
                {showAllProjects ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    {t.viewLess}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    {t.viewMore} ({profile.projects.length - 3})
                  </>
                )}
              </Button>
            )}
          </section>
        )}

        {/* Certificates Section */}
        {profile.certificates.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              {t.certificates}
            </h2>
            <div className="space-y-3">
              {profile.certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div>
                    <h3 className="font-medium text-foreground text-sm">
                      {cert.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {cert.issuer}
                      {cert.date && ` • ${cert.date}`}
                    </p>
                  </div>
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 border-t">
          <p className="text-xs text-muted-foreground">
            {t.poweredBy}{' '}
            <Link href="/" className="text-primary hover:underline">
              Seera AI
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
