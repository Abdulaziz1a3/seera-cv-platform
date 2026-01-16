'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FileText, Check } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/components/providers/locale-provider';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { t, dir } = useLocale();

    // Redirect if already authenticated
    useEffect(() => {
        if (status !== 'loading' && session) {
            router.push('/dashboard');
        }
    }, [session, status, router]);

    const features = [
        t.auth.branding.feature1,
        t.auth.branding.feature2,
        t.auth.branding.feature3,
    ];

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-12">
                <div>
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold">Seera AI</span>
                    </Link>
                </div>

                <div className="space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-4">{t.auth.branding.title}</h1>
                        <p className="text-lg opacity-90 max-w-md">
                            {t.auth.branding.description}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {features.map((feature) => (
                            <div key={feature} className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <Check className="h-4 w-4" />
                                </div>
                                <span className="text-lg">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-sm opacity-70">
                    {t.footer.copyright}
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="flex flex-col min-h-screen">
                {/* Top Bar */}
                <div className="flex items-center justify-between p-4 lg:p-6">
                    <Link href="/" className="flex items-center gap-2 lg:hidden">
                        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-lg font-bold">Seera AI</span>
                    </Link>
                    <div className="lg:ms-auto">
                        <LanguageSwitcher variant="toggle" />
                    </div>
                </div>

                {/* Form Container */}
                <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
