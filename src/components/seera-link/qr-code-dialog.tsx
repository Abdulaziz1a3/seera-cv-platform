'use client';

import { useRef, useEffect, useState } from 'react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    // Dynamically import QRCode library
    import('qrcode').then((QRCode) => {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      }, (error) => {
        if (error) {
          console.error('QR Code generation error:', error);
        } else {
          setQrLoaded(true);
        }
      });
    }).catch((error) => {
      console.error('Failed to load QRCode library:', error);
    });
  }, [open, url]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `seera-link-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();

    toast.success('QR code downloaded');
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
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <canvas ref={canvasRef} className="rounded" />
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
              disabled={!qrLoaded}
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
