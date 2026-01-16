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
  Sparkles,
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

interface BoldTemplateProps {
  profile: ProfileData;
}

const translations = {
  en: {
    highlights: 'Key Achievements',
    experience: 'Career Journey',
    projects: 'Featured Work',
    certificates: 'Credentials',
    present: 'Present',
    viewMore: 'Show More',
    viewLess: 'Show Less',
    poweredBy: 'Built with',
    whatsapp: 'WhatsApp Me',
    call: 'Call Now',
    email: 'Send Email',
    linkedin: 'Connect',
    downloadCv: 'Get My CV',
    viewCv: 'View CV',
    preparingCv: 'Preparing CV...',
    letsConnect: "Let's Connect",
  },
  ar: {
    highlights: 'الإنجازات الرئيسية',
    experience: 'المسيرة المهنية',
    projects: 'أعمال مميزة',
    certificates: 'الشهادات',
    present: 'حتى الآن',
    viewMore: 'عرض المزيد',
    viewLess: 'عرض أقل',
    poweredBy: 'صُنع بواسطة',
    whatsapp: 'راسلني واتساب',
    call: 'اتصل الآن',
    email: 'أرسل بريد',
    linkedin: 'تواصل',
    downloadCv: 'حمّل سيرتي',
    letsConnect: 'لنتواصل',
  },
};

export function ProfileBoldTemplate({ profile }: BoldTemplateProps) {
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
    : profile.projects.slice(0, 4);

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
      className="min-h-screen"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        '--profile-primary': themeColors.primary,
        '--profile-accent': themeColors.accent,
      } as React.CSSProperties}
    >
      {/* Hero Section with Gradient */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`,
        }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 py-12 sm:py-16 text-center text-white">
          {/* Avatar */}
          {profile.avatarUrl && (
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6">
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName}
                fill
                className="rounded-full object-cover border-4 border-white/30 shadow-2xl"
                priority
              />
              <div className="absolute inset-0 rounded-full ring-4 ring-white/20 ring-offset-4 ring-offset-transparent" />
            </div>
          )}

          {/* Status Badges */}
          {profile.statusBadges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {profile.statusBadges.map((badge, i) => (
                <Badge
                  key={i}
                  className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {badge}
                </Badge>
              ))}
            </div>
          )}

          {/* Name & Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 drop-shadow-lg">
            {profile.displayName}
          </h1>
          <p className="text-xl sm:text-2xl opacity-90 mb-3">
            {profile.title}
          </p>

          {/* Location */}
          {profile.location && (
            <div className="flex items-center justify-center gap-1 opacity-80 mb-6">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-lg opacity-90 max-w-xl mx-auto mb-8 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            {hasCtaWhatsapp && (
              <Button
                asChild
                size="lg"
                className="bg-white text-green-600 hover:bg-white/90 font-semibold shadow-lg"
                onClick={() => trackCTA('WHATSAPP')}
              >
                <a href={whatsappUrl!} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {t.whatsapp}
                </a>
              </Button>
            )}

            {hasCtaEmail && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-white/50 text-white hover:bg-white/10"
                onClick={() => trackCTA('EMAIL')}
              >
                <a href={emailUrl!}>
                  <Mail className="w-5 h-5 mr-2" />
                  {t.email}
                </a>
              </Button>
            )}

            {hasCtaPhone && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-white/50 text-white hover:bg-white/10"
                onClick={() => trackCTA('PHONE')}
              >
                <a href={phoneUrl!}>
                  <Phone className="w-5 h-5 mr-2" />
                  {t.call}
                </a>
              </Button>
            )}

            {hasCtaLinkedin && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-white/50 text-white hover:bg-white/10"
                onClick={() => trackCTA('LINKEDIN')}
              >
                <a href={profile.ctaLinkedinUrl!} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-5 h-5 mr-2" />
                  {t.linkedin}
                </a>
              </Button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 justify-center">
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
              variant="inverse"
            />
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Highlights Section */}
        {profile.highlights.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${themeColors.primary}20` }}
              >
                <Trophy className="w-5 h-5" style={{ color: themeColors.primary }} />
              </div>
              {t.highlights}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.highlights.map((highlight, index) => (
                <Card
                  key={highlight.id}
                  className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow"
                  style={{
                    borderLeft: `4px solid ${themeColors.primary}`,
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="text-2xl font-bold opacity-20"
                        style={{ color: themeColors.primary }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p className="text-foreground font-medium">{highlight.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Experience Section */}
        {profile.experiences.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${themeColors.primary}20` }}
              >
                <Briefcase className="w-5 h-5" style={{ color: themeColors.primary }} />
              </div>
              {t.experience}
            </h2>
            <div className="relative">
              {/* Timeline line */}
              <div
                className={`absolute top-0 bottom-0 w-0.5 ${isRtl ? 'right-6' : 'left-6'}`}
                style={{ backgroundColor: `${themeColors.primary}30` }}
              />

              <div className="space-y-6">
                {visibleExperiences.map((exp) => (
                  <div
                    key={exp.id}
                    className={`relative ${isRtl ? 'pr-16' : 'pl-16'}`}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute top-1 w-3 h-3 rounded-full ${isRtl ? 'right-5' : 'left-5'}`}
                      style={{ backgroundColor: themeColors.primary }}
                    />

                    <Card className={`overflow-hidden ${exp.isFeatured ? 'ring-2 ring-primary/30' : ''}`}>
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {exp.role}
                            </h3>
                            <p className="text-muted-foreground">
                              {exp.company}
                              {exp.location && ` • ${exp.location}`}
                            </p>
                          </div>
                          {exp.startDate && (
                            <Badge variant="secondary" className="mt-2 sm:mt-0">
                              {exp.startDate} - {exp.endDate || t.present}
                            </Badge>
                          )}
                        </div>
                        {exp.description && (
                          <p className="text-foreground/80 mt-3">
                            {exp.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
            {profile.experiences.length > 3 && (
              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => setShowAllExperiences(!showAllExperiences)}
              >
                {showAllExperiences ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    {t.viewLess}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    {t.viewMore} ({profile.experiences.length - 3} more)
                  </>
                )}
              </Button>
            )}
          </section>
        )}

        {/* Projects Section */}
        {profile.projects.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${themeColors.primary}20` }}
              >
                <FolderKanban className="w-5 h-5" style={{ color: themeColors.primary }} />
              </div>
              {t.projects}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {visibleProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  {project.imageUrl && (
                    <div className="relative h-40 bg-secondary overflow-hidden">
                      <Image
                        src={project.imageUrl}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {project.title}
                      </h3>
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full hover:bg-secondary transition-colors"
                          style={{ color: themeColors.primary }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-muted-foreground text-sm mb-3">
                        {project.description}
                      </p>
                    )}
                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {project.tags.slice(0, 5).map((tag, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: `${themeColors.primary}50` }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {profile.projects.length > 4 && (
              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => setShowAllProjects(!showAllProjects)}
              >
                {showAllProjects ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    {t.viewLess}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    {t.viewMore} ({profile.projects.length - 4} more)
                  </>
                )}
              </Button>
            )}
          </section>
        )}

        {/* Certificates Section */}
        {profile.certificates.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${themeColors.primary}20` }}
              >
                <Award className="w-5 h-5" style={{ color: themeColors.primary }} />
              </div>
              {t.certificates}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.certificates.map((cert) => (
                <Card key={cert.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {cert.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {cert.issuer}
                        {cert.date && ` • ${cert.date}`}
                      </p>
                    </div>
                    {cert.url && (
                      <a
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-secondary transition-colors"
                        style={{ color: themeColors.primary }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            {t.poweredBy}{' '}
            <Link
              href="/"
              className="font-semibold hover:underline"
              style={{ color: themeColors.primary }}
            >
              Seera AI
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
