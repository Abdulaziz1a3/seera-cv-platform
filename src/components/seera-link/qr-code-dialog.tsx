'use client';

import { useRef, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Download, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
}

export function QrCodeDialog({ open, onOpenChange, url, title }: QrCodeDialogProps) {
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrReady, setQrReady] = useState(false);

  useEffect(() => {
    setQrReady(Boolean(open && url));
  }, [open, url]);

  const handleDownload = () => {
    const container = qrContainerRef.current;
    if (!container) return;

    const svg = container.querySelector('svg');
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(blobUrl);

      const link = document.createElement('a');
      link.download = `seera-link-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('QR code downloaded');
    };

    image.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      toast.error('Unable to generate QR code image');
    };

    image.src = blobUrl;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to view the profile
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          {/* QR Code Canvas */}
          <div ref={qrContainerRef} className="p-4 bg-white rounded-lg shadow-sm">
            <QRCode value={url} size={256} bgColor="#ffffff" fgColor="#000000" />
          </div>

          {/* URL Display */}
          <div className="w-full p-3 bg-secondary rounded-lg">
            <p className="text-sm text-center font-mono text-muted-foreground break-all">
              {url}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
            <Button
              className="flex-1"
              onClick={handleDownload}
              disabled={!qrReady}
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
