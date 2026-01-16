'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PasswordGateProps {
  slug: string;
  displayName: string;
  language: 'en' | 'ar';
}

const translations = {
  en: {
    title: 'Protected Profile',
    description: 'This profile is password protected. Enter the access code to continue.',
    placeholder: 'Enter access code',
    submit: 'Access Profile',
    verifying: 'Verifying...',
    error: 'Invalid access code. Please try again.',
    tooManyAttempts: 'Too many attempts. Please try again later.',
    poweredBy: 'Powered by',
  },
  ar: {
    title: 'ملف محمي',
    description: 'هذا الملف محمي بكلمة مرور. أدخل رمز الوصول للمتابعة.',
    placeholder: 'أدخل رمز الوصول',
    submit: 'الوصول إلى الملف',
    verifying: 'جاري التحقق...',
    error: 'رمز الوصول غير صحيح. حاول مرة أخرى.',
    tooManyAttempts: 'محاولات كثيرة جداً. حاول لاحقاً.',
    poweredBy: 'مدعوم من',
  },
};

export function PasswordGate({ slug, displayName, language }: PasswordGateProps) {
  const router = useRouter();
  const t = translations[language];
  const isRtl = language === 'ar';

  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/seera-link/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, accessCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(t.tooManyAttempts);
        } else {
          setError(t.error);
        }
        return;
      }

      if (data.success) {
        // Refresh the page to load the profile
        router.refresh();
      }
    } catch {
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center px-4"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">{t.title}</CardTitle>
          <CardDescription className="text-center">
            {t.description}
          </CardDescription>
          {displayName && (
            <p className="text-sm font-medium text-foreground mt-2">
              {displayName}
            </p>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder={t.placeholder}
                className={`${isRtl ? 'pl-10 pr-4' : 'pr-10 pl-4'}`}
                minLength={4}
                maxLength={8}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${
                  isRtl ? 'left-3' : 'right-3'
                }`}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || accessCode.length < 4}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.verifying}
                </>
              ) : (
                t.submit
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {t.poweredBy}{' '}
            <a href="/" className="text-primary hover:underline">
              Seera AI
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
