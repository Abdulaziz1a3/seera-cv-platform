'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ProfileEditor } from '@/components/seera-link/profile-editor';
import type { CreateProfileInput } from '@/lib/seera-link/schemas';

export default function EditSeeraLinkPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<Partial<CreateProfileInput> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`/api/seera-link/${profileId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to load profile');
        }

        // Transform the API response to match CreateProfileInput
        const profileData: Partial<CreateProfileInput> = {
          slug: data.data.slug,
          persona: data.data.persona,
          template: data.data.template,
          visibility: data.data.visibility,
          noIndex: data.data.noIndex,
          hidePhoneNumber: data.data.hidePhoneNumber,
          displayName: data.data.displayName,
          title: data.data.title,
          location: data.data.location,
          bio: data.data.bio,
          avatarUrl: data.data.avatarUrl,
          statusBadges: data.data.statusBadges,
          language: data.data.language,
          themeColor: data.data.themeColor,
          sourceResumeId: data.data.sourceResumeId,
          enableDownloadCv: data.data.enableDownloadCv,
          cvFileUrl: data.data.cvFileUrl,
          cvResumeId: data.data.cvResumeId,
          ctaWhatsappNumber: data.data.ctaWhatsappNumber,
          ctaWhatsappMessage: data.data.ctaWhatsappMessage,
          ctaPhoneNumber: data.data.ctaPhoneNumber,
          ctaEmail: data.data.ctaEmail,
          ctaEmailSubject: data.data.ctaEmailSubject,
          ctaEmailBody: data.data.ctaEmailBody,
          ctaLinkedinUrl: data.data.ctaLinkedinUrl,
          enabledCtas: data.data.enabledCtas,
          highlights: data.data.highlights.map((h: any) => ({
            id: h.id,
            content: h.content,
            icon: h.icon,
            sortOrder: h.sortOrder,
          })),
          experiences: data.data.experiences.map((e: any) => ({
            id: e.id,
            company: e.company,
            role: e.role,
            location: e.location,
            startDate: e.startDate,
            endDate: e.endDate,
            description: e.description,
            isFeatured: e.isFeatured,
            sortOrder: e.sortOrder,
          })),
          projects: data.data.projects.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            url: p.url,
            imageUrl: p.imageUrl,
            tags: p.tags,
            sortOrder: p.sortOrder,
          })),
          certificates: data.data.certificates.map((c: any) => ({
            id: c.id,
            name: c.name,
            issuer: c.issuer,
            date: c.date,
            url: c.url,
            sortOrder: c.sortOrder,
          })),
        };

        setProfile(profileData);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [profileId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-destructive mb-4">{error || 'Profile not found'}</p>
        <button
          onClick={() => router.push('/dashboard/seera-link')}
          className="text-primary hover:underline"
        >
          Back to Seera Link
        </button>
      </div>
    );
  }

  return (
    <ProfileEditor
      mode="edit"
      initialData={profile}
      profileId={profileId}
      onCancel={() => router.push('/dashboard/seera-link')}
    />
  );
}
