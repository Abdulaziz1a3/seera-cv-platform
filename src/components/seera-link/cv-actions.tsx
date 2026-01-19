'use client';

import { useState } from 'react';
import { FileDown, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadPDF } from '@/lib/templates/renderer';
import { mapResumeRecordToResumeData } from '@/lib/resume-normalizer';
import { useAnalyticsTracker } from './analytics-beacon';
import { toast } from 'sonner';

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
  previewAnchorId?: string;
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
  previewAnchorId = 'cv-preview',
}: CvActionsProps) {
  const { trackCTA } = useAnalyticsTracker(profileId);
  const [loading, setLoading] = useState<'share' | 'download' | null>(null);

  const hasView = enabledCtas.includes('VIEW_CV') && enableDownloadCv && !!cvResumeId;
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

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/${slug}`
      : '';
    if (!shareUrl) return;
    setLoading('share');
    try {
      trackCTA('VIEW_CV');
      if (navigator.share) {
        await navigator.share({
          title: 'Seera AI Profile',
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Profile link copied');
      } else {
        window.prompt('Copy this link', shareUrl);
      }
    } catch {
      toast.error('Unable to share right now');
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
          onClick={handleShare}
          disabled={loading !== null}
        >
          <Share2 className="w-4 h-4 mr-2" />
          {loading === 'share' ? labels.preparing : labels.view}
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
