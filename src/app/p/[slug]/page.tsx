import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { ProfileMinimalTemplate } from '@/components/seera-link/templates/minimal';
import { ProfileBoldTemplate } from '@/components/seera-link/templates/bold';
import { AnalyticsBeacon } from '@/components/seera-link/analytics-beacon';
import { PasswordGate } from '@/components/seera-link/password-gate';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Get profile data
async function getProfile(slug: string) {
  const profile = await prisma.seeraProfile.findFirst({
    where: {
      slug: slug.toLowerCase(),
      status: 'PUBLISHED',
      deletedAt: null,
    },
    include: {
      highlights: { orderBy: { sortOrder: 'asc' } },
      experiences: { orderBy: { sortOrder: 'asc' } },
      projects: { orderBy: { sortOrder: 'asc' } },
      certificates: { orderBy: { sortOrder: 'asc' } },
    },
  });

  return profile;
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfile(slug);

  if (!profile) {
    return {
      title: 'Profile Not Found',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seera-ai.com';
  const profileUrl = `${baseUrl}/p/${profile.slug}`;

  // If noIndex is set, don't index
  if (profile.noIndex || profile.visibility !== 'PUBLIC') {
    return {
      title: profile.displayName,
      description: profile.bio || `${profile.displayName} - ${profile.title}`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${profile.displayName} | ${profile.title}`,
    description: profile.bio || `Connect with ${profile.displayName} - ${profile.title}`,
    openGraph: {
      title: profile.displayName,
      description: profile.bio || profile.title,
      url: profileUrl,
      siteName: 'Seera AI',
      type: 'profile',
      images: profile.avatarUrl
        ? [{ url: profile.avatarUrl, width: 400, height: 400, alt: profile.displayName }]
        : undefined,
    },
    twitter: {
      card: 'summary',
      title: profile.displayName,
      description: profile.bio || profile.title,
      images: profile.avatarUrl ? [profile.avatarUrl] : undefined,
    },
    alternates: {
      canonical: profileUrl,
    },
  };
}

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const profile = await getProfile(slug);

  if (!profile) {
    notFound();
  }

  // Check password protection
  if (profile.visibility === 'PASSWORD_PROTECTED') {
    const cookieStore = cookies();
    const accessCookie = cookieStore.get(`seera-link-access-${profile.slug}`);

    if (!accessCookie || accessCookie.value !== profile.id) {
      return (
        <PasswordGate
          slug={profile.slug}
          displayName={profile.displayName}
          language={profile.language as 'en' | 'ar'}
        />
      );
    }
  }

  // Extract UTM parameters
  const utmParams = {
    utmSource: typeof resolvedSearchParams.utm_source === 'string' ? resolvedSearchParams.utm_source : undefined,
    utmMedium: typeof resolvedSearchParams.utm_medium === 'string' ? resolvedSearchParams.utm_medium : undefined,
    utmCampaign: typeof resolvedSearchParams.utm_campaign === 'string' ? resolvedSearchParams.utm_campaign : undefined,
    utmContent: typeof resolvedSearchParams.utm_content === 'string' ? resolvedSearchParams.utm_content : undefined,
    utmTerm: typeof resolvedSearchParams.utm_term === 'string' ? resolvedSearchParams.utm_term : undefined,
  };

  // Transform profile data for templates
  const profileData = {
    id: profile.id,
    displayName: profile.displayName,
    title: profile.title,
    location: profile.location,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    statusBadges: profile.statusBadges,
    language: profile.language as 'en' | 'ar',
    themeColor: profile.themeColor,
    template: profile.template,
    hidePhoneNumber: profile.hidePhoneNumber,
    enableDownloadCv: profile.enableDownloadCv,
    cvFileUrl: profile.cvFileUrl,
    ctaWhatsappNumber: profile.ctaWhatsappNumber,
    ctaWhatsappMessage: profile.ctaWhatsappMessage,
    ctaPhoneNumber: profile.ctaPhoneNumber,
    ctaEmail: profile.ctaEmail,
    ctaEmailSubject: profile.ctaEmailSubject,
    ctaEmailBody: profile.ctaEmailBody,
    ctaLinkedinUrl: profile.ctaLinkedinUrl,
    enabledCtas: profile.enabledCtas,
    highlights: profile.highlights,
    experiences: profile.experiences,
    projects: profile.projects,
    certificates: profile.certificates,
  };

  // Select template
  const TemplateComponent = profile.template === 'BOLD' ? ProfileBoldTemplate : ProfileMinimalTemplate;

  return (
    <>
      <TemplateComponent profile={profileData} />
      <AnalyticsBeacon profileId={profile.id} utmParams={utmParams} />
    </>
  );
}
