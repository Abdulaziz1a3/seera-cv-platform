'use client';

import { useEffect, useState } from 'react';
import { LivePreview } from '@/components/resume-editor/live-preview';
import { mapResumeRecordToResumeData } from '@/lib/resume-normalizer';
import type { ResumeData } from '@/lib/resume-types';

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
  const [resume, setResume] = useState<ResumeData | null>(null);
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
        const data = payload?.data || payload;
        if (!data) return;
        const resumeData = mapResumeRecordToResumeData(data);
        if (hidePhoneNumber && resumeData?.contact) {
          resumeData.contact.phone = '';
        }
        setResume(resumeData);
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
    <div id="cv-preview" className="mt-6 space-y-3">
      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading CV preview...</div>
      )}
      {!isLoading && resume && (
        <div className="rounded-xl border bg-white/80 p-3 overflow-x-auto">
          <div className="min-w-[720px]">
            <LivePreview resume={resume} scale={0.8} />
          </div>
        </div>
      )}
    </div>
  );
}
