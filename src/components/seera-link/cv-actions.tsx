'use client';

import { useState } from 'react';
import { FileDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadPDF, generatePDF } from '@/lib/templates/renderer';
import { mapResumeRecordToResumeData } from '@/lib/resume-normalizer';
import { useAnalyticsTracker } from './analytics-beacon';

interface CvActionsProps {
  profileId: string;
  slug: string;
  cvResumeId: string | null;
  cvFileUrl: string | null;
  enableDownloadCv: boolean;
  enabledCtas: string[];
  labels: {
    download: string;
    view: string;
    preparing: string;
  };
  onDownload?: () => void;
  isPreview?: boolean;
  variant?: 'default' | 'inverse';
}

export function CvActions({
  profileId,
  slug,
  cvResumeId,
  cvFileUrl,
  enableDownloadCv,
  enabledCtas,
  labels,
  onDownload,
  isPreview = false,
  variant = 'default',
}: CvActionsProps) {
  const { trackCTA } = useAnalyticsTracker(profileId);
  const [loading, setLoading] = useState<'view' | 'download' | null>(null);

  const hasView = enabledCtas.includes('VIEW_CV') && enableDownloadCv && (cvFileUrl || cvResumeId);
  const hasDownload = enabledCtas.includes('DOWNLOAD_CV') && enableDownloadCv && (cvFileUrl || cvResumeId);

  if (!hasView && !hasDownload) {
    return null;
  }

  const buttonVariant = variant === 'inverse' ? 'default' : 'secondary';
  const buttonClassName = variant === 'inverse'
    ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
    : undefined;

  const fetchResumeRecord = async () => {
    if (!cvResumeId) return null;
    const endpoint = isPreview
      ? `/api/resumes/${cvResumeId}`
      : `/api/seera-link/${slug}/cv`;
    const response = await fetch(endpoint);
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.data || payload;
  };

  const handleView = async () => {
    if (cvFileUrl) {
      window.open(cvFileUrl, '_blank', 'noopener,noreferrer');
      trackCTA('VIEW_CV');
      return;
    }

    if (!cvResumeId) return;
    setLoading('view');
    try {
      const resumeRecord = await fetchResumeRecord();
      if (!resumeRecord) return;
      const resumeData = mapResumeRecordToResumeData(resumeRecord);
      const blob = await generatePDF(resumeData);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      trackCTA('VIEW_CV');
    } finally {
      setLoading(null);
    }
  };

  const handleDownload = async () => {
    if (cvFileUrl) {
      trackCTA('DOWNLOAD_CV');
      if (onDownload) onDownload();
      const link = document.createElement('a');
      link.href = cvFileUrl;
      link.download = 'cv.pdf';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      return;
    }

    if (!cvResumeId) return;
    setLoading('download');
    try {
      const resumeRecord = await fetchResumeRecord();
      if (!resumeRecord) return;
      const resumeData = mapResumeRecordToResumeData(resumeRecord);
      await downloadPDF(resumeData);
      trackCTA('DOWNLOAD_CV');
      if (onDownload) onDownload();
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {hasView && (
        <Button
          variant="outline"
          className={buttonClassName}
          onClick={handleView}
          disabled={loading !== null}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {loading === 'view' ? labels.preparing : labels.view}
        </Button>
      )}
      {hasDownload && (
        <Button
          variant={buttonVariant}
          className={buttonClassName}
          onClick={handleDownload}
          disabled={loading !== null}
        >
          <FileDown className="w-4 h-4 mr-2" />
          {loading === 'download' ? labels.preparing : labels.download}
        </Button>
      )}
    </>
  );
}
