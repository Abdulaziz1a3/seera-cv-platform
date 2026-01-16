'use client';

import Link from 'next/link';
import { UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <UserX className="w-10 h-10 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Profile Not Found
        </h1>

        <p className="text-muted-foreground mb-6">
          This profile doesn&apos;t exist or may have been removed.
          The link might be incorrect or the profile owner may have unpublished it.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/">
              Go Home
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/login">
              Create Your Profile
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          Powered by{' '}
          <Link href="/" className="text-primary hover:underline">
            Seera AI
          </Link>
        </p>
      </div>
    </div>
  );
}
