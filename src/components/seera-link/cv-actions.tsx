'use client';

import { useState } from 'react';
import { FileDown, Share2, Copy, QrCode, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { downloadPDF } from '@/lib/templates/renderer';
import { mapResumeRecordToResumeData } from '@/lib/resume-normalizer';
import { useAnalyticsTracker } from './analytics-beacon';
import { toast } from 'sonner';
import { QrCodeDialog } from './qr-code-dialog';

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
  const [copied, setCopied] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const hasView = enabledCtas.includes('VIEW_CV') && enableDownloadCv && !!cvResumeId;
  const hasDownload = enabledCtas.includes('DOWNLOAD_CV') && enableDownloadCv && (cvFileUrl || cvResumeId);

  if (!hasView && !hasDownload) {
    return null;
  }

  const buttonVariant = variant === 'inverse' ? 'default' : 'secondary';
  const buttonClassName = variant === 'inverse'
    ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
    : undefined;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${slug}`
    : '';

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

  const handleCopyLink = async () => {
    try {
      trackCTA('VIEW_CV');
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Unable to copy link');
    }
  };

  const handleShowQR = () => {
    trackCTA('VIEW_CV');
    setQrDialogOpen(true);
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={buttonClassName}
              disabled={loading !== null}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {labels.view}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem onClick={handleCopyLink}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShowQR}>
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

      {/* QR Code Dialog */}
      <QrCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        url={shareUrl}
        title={slug}
      />
    </>
  );
}
