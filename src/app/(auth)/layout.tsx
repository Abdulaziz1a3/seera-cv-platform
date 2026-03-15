'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sparkles, Check, FileText, Brain, Compass } from 'lucide-react';
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
        { text: t.auth.branding.feature1, icon: FileText },
        { text: t.auth.branding.feature2, icon: Brain },
        { text: t.auth.branding.feature3, icon: Compass },
    ];

    return (
        <div className="min-h-screen grid lg:grid-cols-2" dir={dir}>
            {/* Left Panel — Branding */}
            <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-purple-700 text-primary-foreground p-12">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_-20%,rgba(255,255,255,0.1),transparent)]" />
                <div className="absolute bottom-0 start-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute top-1/2 end-0 h-48 w-48 rounded-full bg-purple-900/30 blur-2xl" />
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />

                {/* Logo */}
                <div className="relative">
                    <Link href="/" className="flex items-center gap-3 group w-fit">
                        <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-white/30 transition-colors">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">Seera AI</span>
                    </Link>
                </div>

                {/* Main content */}
                <div className="relative space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-4 leading-tight">{t.auth.branding.title}</h1>
                        <p className="text-lg opacity-85 max-w-md leading-relaxed">
                            {t.auth.branding.description}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {features.map(({ text, icon: Icon }) => (
                            <div key={text} className="flex items-center gap-4">
                                <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 shrink-0">
                                    <Icon className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-base opacity-90">{text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Social proof */}
                    <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-5">
                        <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} className="h-4 w-4 fill-amber-300 text-amber-300" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <p className="text-sm opacity-90 italic leading-relaxed">
                            "Seera AI made building my resume faster and easier. The ATS scores are excellent."
                        </p>
                        <p className="text-xs opacity-60 mt-2">— Job seeker, Gulf market</p>
                    </div>
                </div>

                {/* Copyright */}
                <div className="relative text-sm opacity-60">
                    {t.footer.copyright}
                </div>
            </div>

            {/* Right Panel — Auth Form */}
            <div className="flex flex-col min-h-screen bg-background">
                {/* Top Bar */}
                <div className="flex items-center justify-between p-4 lg:p-6 border-b lg:border-b-0">
                    {/* Mobile logo */}
                    <Link href="/" className="flex items-center gap-2.5 lg:hidden">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-sm">
                            <Sparkles className="h-4.5 w-4.5 text-white" style={{ width: '1.125rem', height: '1.125rem' }} />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            Seera AI
                        </span>
                    </Link>

                    {/* Language switcher — always shown */}
                    <div className="ms-auto">
                        <LanguageSwitcher variant="toggle" />
                    </div>
                </div>

                {/* Form Container */}
                <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
                    <div className="w-full max-w-md">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
