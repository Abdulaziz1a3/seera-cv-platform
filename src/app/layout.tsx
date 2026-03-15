import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Arabic, Plus_Jakarta_Sans, Merriweather, Playfair_Display } from 'next/font/google';
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

const jakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-jakarta',
});

const merriweather = Merriweather({
    subsets: ['latin'],
    weight: ['300', '400', '700', '900'],
    variable: '--font-merriweather',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800', '900'],
    variable: '--font-playfair',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://seera-ai.com';

export const metadata: Metadata = {
    title: {
        default: 'Seera AI — AI Resume Builder for Arabic & English Job Seekers',
        template: '%s | Seera AI',
    },
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Seera AI',
    },
    description:
        'Build a standout, ATS-optimized resume in minutes with Seera AI. Choose from 10+ professional templates, get AI-powered writing assistance, and export in Arabic or English. Used by 5,000+ job seekers.',
    keywords: [
        // English primary
        'resume builder',
        'CV maker',
        'ATS resume builder',
        'AI resume builder',
        'professional resume templates',
        'ATS-friendly resume',
        'resume builder free',
        'online CV builder',
        'job application resume',
        'resume maker',
        'resume creator',
        'career tools',
        // Arabic primary
        'منشئ السيرة الذاتية',
        'سيرة ذاتية احترافية',
        'برنامج إنشاء السيرة الذاتية',
        'سيرة ذاتية بالعربي',
        'نموذج سيرة ذاتية',
        'بناء السيرة الذاتية',
        'cv بالعربية',
        // Regional / niche
        'resume builder Saudi Arabia',
        'CV maker Arab',
        'Arabic resume builder',
        'bilingual resume',
        'RTL resume',
        'Gulf jobs resume',
    ],
    authors: [{ name: 'Seera AI', url: APP_URL }],
    creator: 'Seera AI',
    publisher: 'Seera AI',
    category: 'Career & Job Tools',
    classification: 'Business/Productivity',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(APP_URL),
    alternates: {
        canonical: '/',
        languages: {
            'en-US': '/en',
            'ar-SA': '/ar',
        },
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        alternateLocale: ['ar_SA'],
        url: '/',
        siteName: 'Seera AI',
        title: 'Seera AI — AI Resume Builder for Arabic & English Job Seekers',
        description:
            'Build a standout, ATS-optimized resume in minutes. 10+ professional templates, AI writing assistance, Arabic + English support.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Seera AI — Professional Resume Builder',
                type: 'image/png',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        site: '@seera_ai',
        creator: '@seera_ai',
        title: 'Seera AI — AI Resume Builder for Arabic & English Job Seekers',
        description:
            'Build a standout, ATS-optimized resume in minutes. 10+ templates, AI writing assistance, Arabic + English.',
        images: [{ url: '/og-image.png', alt: 'Seera AI Resume Builder' }],
    },
    robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
            index: true,
            follow: true,
            noimageindex: false,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        // google: 'your-google-search-console-verification-code',
        // yandex: 'your-yandex-verification-code',
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

const jsonLdOrganization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Seera AI',
    url: APP_URL,
    logo: `${APP_URL}/icons/icon-512x512.png`,
    description: 'AI-powered professional resume builder with ATS optimization, 10+ templates, and full Arabic/English bilingual support.',
    foundingDate: '2024',
    sameAs: [
        'https://twitter.com/seera_ai',
    ],
    contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${APP_URL}/contact`,
        availableLanguage: ['English', 'Arabic'],
    },
};

const jsonLdWebSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Seera AI',
    url: APP_URL,
    description: 'Build a standout, ATS-optimized resume in minutes with Seera AI.',
    potentialAction: {
        '@type': 'SearchAction',
        target: {
            '@type': 'EntryPoint',
            urlTemplate: `${APP_URL}/blog?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
    },
    inLanguage: ['en', 'ar'],
};

const jsonLdSoftwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Seera AI Resume Builder',
    url: APP_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'AI-powered resume builder with ATS optimization, 10+ professional templates, and Arabic/English bilingual support.',
    offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: '0',
        highPrice: '9.99',
        offerCount: '2',
    },
    aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1240',
        bestRating: '5',
        worstRating: '1',
    },
    featureList: [
        'ATS-Optimized Resume Builder',
        'AI Writing Assistance',
        '10+ Professional Templates',
        'Arabic & English Support',
        'RTL Layout',
        'PDF Export',
        'Real-time Preview',
    ],
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
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftwareApp) }}
                />
            </head>
            <body
                className={`${inter.variable} ${notoArabic.variable} ${jakarta.variable} ${merriweather.variable} ${playfair.variable} font-sans antialiased`}
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

