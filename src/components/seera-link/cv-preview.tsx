'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [previewScale, setPreviewScale] = useState(0.8);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const mmToPx = 96 / 25.4;
  const a4WidthMm = 210;
  const maxScale = 0.85;
  const minScale = 0.45;

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const updateScale = () => {
      const width = container.clientWidth;
      if (!width) return;
      const nextScale = Math.min(
        maxScale,
        Math.max(minScale, (width / (a4WidthMm * mmToPx)) * 0.98)
      );
      setPreviewScale(nextScale);
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    updateScale();
    return () => observer.disconnect();
  }, []);

  if (!shouldShow) return null;

  return (
    <div id="cv-preview" className="mt-6 space-y-3">
      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading CV preview...</div>
      )}
      {!isLoading && resume && (
        <div ref={containerRef} className="rounded-xl border bg-white/80 p-3 overflow-hidden">
          <div className="flex justify-center">
            <LivePreview resume={resume} scale={previewScale} compact />
          </div>
        </div>
      )}
    </div>
  );
}
