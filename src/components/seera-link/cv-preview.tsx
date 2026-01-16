'use client';

import { useEffect, useState } from 'react';
import { ResumePreview } from '@/components/resume-editor/resume-preview';
import type { Resume } from '@/lib/resume-schema';

interface CvPreviewProps {
  slug: string;
  cvResumeId: string | null;
  enableDownloadCv: boolean;
  enabledCtas: string[];
  hidePhoneNumber: boolean;
  isPreview?: boolean;
}

export function CvPreview({
  slug,
  cvResumeId,
  enableDownloadCv,
  enabledCtas,
  hidePhoneNumber,
  isPreview = false,
}: CvPreviewProps) {
  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const shouldShow =
    enableDownloadCv && enabledCtas.includes('VIEW_CV') && !!cvResumeId;

  useEffect(() => {
    if (!shouldShow || !cvResumeId) return;

    const fetchResume = async () => {
      setIsLoading(true);
      try {
        const endpoint = isPreview
          ? `/api/resumes/${cvResumeId}`
          : `/api/seera-link/${slug}/cv`;
        const response = await fetch(endpoint);
        if (!response.ok) return;
        const payload = await response.json();
        const data = (payload?.data || payload) as Resume;
        if (hidePhoneNumber && data?.contact) {
          data.contact.phone = undefined;
        }
        setResume(data);
      } catch (error) {
        console.error('Failed to load CV preview:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResume();
  }, [shouldShow, cvResumeId, slug, isPreview, hidePhoneNumber]);

  if (!shouldShow) return null;

  return (
    <div id="cv-preview" className="mt-6">
      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading CV preview...</div>
      )}
      {!isLoading && resume && <ResumePreview resume={resume} />}
    </div>
  );
}
