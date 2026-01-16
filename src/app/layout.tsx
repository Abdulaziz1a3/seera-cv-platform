import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Arabic } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/providers/query-provider';
import { SessionProvider } from '@/components/providers/session-provider';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { ResumeProvider } from '@/components/providers/resume-provider';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';
import { ErrorBoundary } from '@/components/providers/error-boundary';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const notoArabic = Noto_Sans_Arabic({
    subsets: ['arabic'],
    variable: '--font-noto-arabic',
});

export const metadata: Metadata = {
    title: {
        default: 'Seera AI | Professional ATS-Friendly Resume Builder',
        template: '%s | Seera AI',
    },
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Seera AI',
    },
    description:
        'Create professional, ATS-optimized resumes with our intelligent resume builder. Multi-language support including Arabic with RTL layout. Get hired faster with tailored resumes.',
    keywords: [
        'resume builder',
        'CV maker',
        'ATS resume',
        'professional resume',
        'Arabic resume',
        'job application',
        'career',
        'resume templates',
        'سيرة ذاتية',
        'منشئ السيرة الذاتية',
    ],
    authors: [{ name: 'Seera AI' }],
    creator: 'Seera AI',
    publisher: 'Seera AI',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    openGraph: {
        type: 'website',
        locale: 'en_US',
        alternateLocale: 'ar_SA',
        url: '/',
        siteName: 'Seera AI',
        title: 'Seera AI | Professional ATS-Friendly Resume Builder',
        description:
            'Create professional, ATS-optimized resumes with our intelligent resume builder. Multi-language support including Arabic.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Seera AI Resume Builder',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Seera AI | Professional ATS-Friendly Resume Builder',
        description:
            'Create professional, ATS-optimized resumes with our intelligent resume builder.',
        images: ['/og-image.png'],
        creator: '@seera_ai',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        // Add your Google Search Console verification code here
        // google: 'your-actual-verification-code',
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" dir="ltr" suppressHydrationWarning>
            <head>
                <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            </head>
            <body
                className={`${inter.variable} ${notoArabic.variable} font-sans antialiased`}
            >
                <SessionProvider>
                    <QueryProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            <LocaleProvider>
                                <ResumeProvider>
                                    <AnalyticsProvider>
                                        <ErrorBoundary>
                                            {children}
                                        </ErrorBoundary>
                                    </AnalyticsProvider>
                                    <Toaster richColors closeButton position="bottom-right" />
                                </ResumeProvider>
                            </LocaleProvider>
                        </ThemeProvider>
                    </QueryProvider>
                </SessionProvider>
                {/* Service Worker Registration */}
                <Script id="sw-register" strategy="afterInteractive">
                    {`
                        if ('serviceWorker' in navigator) {
                            window.addEventListener('load', function() {
                                navigator.serviceWorker.register('/sw.js').then(
                                    function(registration) {
                                        console.log('SW registered: ', registration.scope);
                                    },
                                    function(err) {
                                        console.log('SW registration failed: ', err);
                                    }
                                );
                            });
                        }
                    `}
                </Script>
            </body>
        </html>
    );
}

