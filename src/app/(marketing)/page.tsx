'use client';

import Link from 'next/link';
import {
    ArrowRight,
    FileText,
    Sparkles,
    Globe2,
    Target,
    Shield,
    Download,
    Users,
    Compass,
    Brain,
    PenTool,
    ScanSearch,
    CheckCircle2,
    Rocket,
    UserPlus,
    PenLine,
    Star,
    Lock,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLocale } from '@/components/providers/locale-provider';
import { SecurityBadges } from '@/components/marketing/trust-badges';
import { SocialProofNotification } from '@/components/marketing/social-proof-notification';
import { LivePreview } from '@/components/resume-editor/live-preview';
import { getTemplatePreviewData } from '@/components/resume-editor/template-preview-data';
import type { TemplateId, ThemeId } from '@/lib/resume-types';

export default function Home() {
    const { t, locale, dir } = useLocale();

    const isArabic = locale === 'ar';

    const premiumFeatures = [
        {
            icon: FileText,
            title: isArabic ? 'منشئ السيرة الذكية' : 'Smart Resume Builder',
            description: isArabic
                ? 'أنشئ سيرة احترافية بسرعة مع قوالب واضحة ومحتوى محسّن لأنظمة ATS.'
                : 'Create polished resumes quickly with clean templates and ATS-friendly content.',
            color: 'from-amber-500 to-orange-500',
            badge: 'CORE',
        },
        {
            icon: Compass,
            title: isArabic ? 'GPS المهني' : 'Career GPS',
            description: isArabic
                ? 'اكتشف مسارات مهنية واقعية مع فجوات المهارات وخطوات التطوير التالية.'
                : 'Explore realistic career paths with skill-gap insights and next-step planning.',
            color: 'from-blue-500 to-cyan-500',
            badge: 'NEW',
        },
        {
            icon: Brain,
            title: isArabic ? 'تحضير المقابلات بالذكاء الاصطناعي' : 'AI Interview Prep',
            description: isArabic
                ? 'تدرّب على المقابلات مع ملاحظات فورية وتحسينات عملية.'
                : 'Practice interviews with instant feedback and sharper preparation loops.',
            color: 'from-purple-500 to-pink-500',
            badge: 'VOICE AI',
        },
        {
            icon: Users,
            title: isArabic ? 'محسّن LinkedIn' : 'LinkedIn Optimizer',
            description: isArabic
                ? 'حوّل سيرتك إلى ملف LinkedIn جاهز للنشر بطريقة أكثر احترافية.'
                : 'Turn your resume into a stronger LinkedIn profile with cleaner positioning.',
            color: 'from-blue-600 to-blue-400',
            badge: 'AI POWERED',
        },
        {
            icon: PenTool,
            title: isArabic ? 'سيرة لينك' : 'Seera Link',
            description: isArabic
                ? 'أنشئ صفحة مهنية قابلة للمشاركة تعرض خبرتك وروابطك بشكل منظم.'
                : 'Create a shareable professional page that presents your profile clearly.',
            color: 'from-fuchsia-500 to-rose-500',
            badge: 'PUBLIC PROFILE',
        },
        {
            icon: ScanSearch,
            title: isArabic ? 'محاكي ATS' : 'ATS Simulator',
            description: isArabic
                ? 'شاهد كيف تُقرأ سيرتك في أنظمة التتبع مع ملاحظات واضحة للتحسين.'
                : 'See how your resume performs in ATS-style reviews with actionable guidance.',
            color: 'from-indigo-500 to-violet-500',
            badge: 'RECRUITER VIEW',
        },
    ];

    const features = [
        {
            icon: FileText,
            title: t.landing.features.ats.title,
            description: t.landing.features.ats.description,
            color: 'text-primary bg-primary/10',
        },
        {
            icon: Sparkles,
            title: t.landing.features.ai.title,
            description: t.landing.features.ai.description,
            color: 'text-purple-500 bg-purple-500/10',
        },
        {
            icon: Globe2,
            title: t.landing.features.multilang.title,
            description: t.landing.features.multilang.description,
            color: 'text-blue-500 bg-blue-500/10',
        },
        {
            icon: Target,
            title: t.landing.features.jobTarget.title,
            description: t.landing.features.jobTarget.description,
            color: 'text-amber-500 bg-amber-500/10',
        },
        {
            icon: Shield,
            title: t.landing.features.privacy.title,
            description: t.landing.features.privacy.description,
            color: 'text-green-500 bg-green-500/10',
        },
        {
            icon: Download,
            title: t.landing.features.export.title,
            description: t.landing.features.export.description,
            color: 'text-rose-500 bg-rose-500/10',
        },
    ];

    const howItWorks = [
        {
            icon: UserPlus,
            title: isArabic ? 'أنشئ حسابك' : 'Create Your Account',
            description: isArabic
                ? 'سجّل مجاناً وابدأ في دقيقتين فقط.'
                : 'Sign up for free and get started in under two minutes.',
            step: '01',
        },
        {
            icon: PenLine,
            title: isArabic ? 'أنشئ سيرتك' : 'Build Your Resume',
            description: isArabic
                ? 'استخدم قوالبنا الاحترافية مع مساعدة الذكاء الاصطناعي لكتابة المحتوى.'
                : 'Use professional templates with AI-powered content suggestions tailored to your role.',
            step: '02',
        },
        {
            icon: Rocket,
            title: isArabic ? 'قدّم بثقة' : 'Apply with Confidence',
            description: isArabic
                ? 'حسّن سيرتك، تدرّب على المقابلات، وقدّم لأفضل الفرص العالمية.'
                : 'Optimize your resume, practice interviews, and land better opportunities globally.',
            step: '03',
        },
    ];

    const stats = [
        { value: isArabic ? '+٥٠٠٠' : '5,000+', label: isArabic ? 'سيرة ذاتية منشأة' : 'Resumes Created' },
        { value: isArabic ? '+١٠' : '10+', label: isArabic ? 'قوالب احترافية' : 'Pro Templates' },
        { value: isArabic ? '٩٢٪' : '92%', label: isArabic ? 'معدل تمرير ATS' : 'Avg. ATS Pass Rate' },
        { value: isArabic ? 'عربي + إنجليزي' : 'AR + EN', label: isArabic ? 'دعم كامل لغتين' : 'Full Bilingual Support' },
    ];

    const templatePreviewBase = getTemplatePreviewData(isArabic ? 'ar' : 'en');
    const templateShowcase: { id: TemplateId; name: string; theme: ThemeId; badge?: string }[] = [
        { id: 'prestige-executive', name: isArabic ? 'هيبة تنفيذية' : 'Prestige Executive', theme: 'obsidian' },
        { id: 'metropolitan-split', name: isArabic ? 'المتروبوليتان المقسّم' : 'Metropolitan Split', theme: 'sapphire' },
        { id: 'nordic-minimal', name: isArabic ? 'الشمالي البسيط' : 'Nordic Minimal', theme: 'ivory' },
        { id: 'azure-sidebar', name: isArabic ? 'الشريط الجانبي الأزرق' : 'Azure Sidebar', theme: 'sapphire', badge: isArabic ? 'برو' : 'Pro' },
        { id: 'terra-tech', name: isArabic ? 'تيرا تك' : 'Terra Tech', theme: 'terra', badge: isArabic ? 'برو' : 'Pro' },
        { id: 'pearl-executive', name: isArabic ? 'اللؤلؤي التنفيذي' : 'Pearl Executive', theme: 'pearl', badge: isArabic ? 'برو' : 'Pro' },
    ];

    const faq = [
        {
            q: isArabic ? 'ما هي الخطط المتاحة؟' : 'What plans are available?',
            a: isArabic
                ? 'نقدم خطة Pro للباحثين عن عمل مع أدوات الذكاء الاصطناعي لبناء السيرة، الاستهداف، وتحضير المقابلات.'
                : 'We offer a Pro plan for job seekers with AI tools for resumes, targeting, and interview prep.',
        },
        {
            q: isArabic ? 'لمن صُممت Seera AI؟' : 'Who is Seera AI built for?',
            a: isArabic
                ? 'المنصة مناسبة للباحثين عن عمل، من يغيّرون مسارهم المهني، وكل من يريد طريقة أوضح لبناء السيرة والتقديم.'
                : 'Seera AI is built for job seekers, career switchers, and professionals who want a sharper workflow.',
        },
        {
            q: isArabic ? 'ما هو Career GPS؟' : 'What is Career GPS?',
            a: isArabic
                ? 'ميزة تحلل سيرتك وتعرض لك مسارات محتملة، فجوات المهارات، وخطوات عملية للتقدم.'
                : 'Career GPS analyzes your resume and shows likely paths, skill gaps, and next actions.',
        },
    ];

    return (
        <div className="flex min-h-screen flex-col" dir={dir}>

            {/* ─── HERO ─── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 pt-24 pb-20 lg:pb-32">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="absolute top-20 start-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute bottom-10 end-10 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

                <div className="container relative mx-auto px-4">
                    <div className="flex flex-col items-center gap-16 lg:flex-row lg:items-center">

                        {/* Left — copy */}
                        <div className="flex-1 text-center lg:text-start">
                            <Badge className="mb-6 inline-flex bg-gradient-to-r from-primary to-purple-600 px-4 py-1.5 text-sm text-white">
                                {isArabic ? 'الآن مع Career GPS وتحضير المقابلات' : 'Now with Career GPS & Interview Prep'}
                            </Badge>

                            <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
                                <span className="bg-gradient-to-r from-gray-900 via-primary to-purple-600 bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-purple-400">
                                    {isArabic ? 'مسيرتك المهنية' : 'Your Career'}
                                </span>
                                <br />
                                <span className="text-foreground">
                                    {isArabic ? 'تبدأ هنا' : 'Starts Here'}
                                </span>
                            </h1>

                            <p className="mb-8 text-xl text-muted-foreground lg:max-w-xl md:text-2xl">
                                {isArabic
                                    ? 'أكثر من مجرد سيرة ذاتية. منصة واضحة للتخطيط المهني، تحضير المقابلات، والتقديم لفرص عالمية بثقة.'
                                    : 'More than just a resume. A focused platform for career planning, interview prep, and applying with confidence across global markets.'}
                            </p>

                            <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                                <Link href="/register">
                                    <Button size="lg" className="h-14 gap-2 bg-gradient-to-r from-primary to-purple-600 px-8 text-lg hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25">
                                        {isArabic ? 'اصنع سيرتك' : 'Build your Career'}
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="/pricing">
                                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                                        {isArabic ? 'الأسعار' : 'View Pricing'}
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust indicators */}
                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground lg:justify-start">
                                <span className="flex items-center gap-1.5">
                                    <Shield className="h-4 w-4 text-green-500" />
                                    {isArabic ? 'بيانات آمنة ١٠٠٪' : '100% Secure Data'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    {isArabic ? 'قوالب متوافقة ATS' : 'ATS-Ready Templates'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Globe2 className="h-4 w-4 text-primary" />
                                    {isArabic ? 'عربي وإنجليزي' : 'Arabic & English'}
                                </span>
                            </div>
                        </div>

                        {/* Right — visual mockup (desktop only) */}
                        <div className="hidden w-full max-w-sm shrink-0 lg:block xl:max-w-md">
                            <div className="relative">
                                {/* Main card */}
                                <div className="rounded-2xl border bg-card p-4 shadow-2xl ring-1 ring-primary/10">
                                    {/* Browser chrome */}
                                    <div className="mb-4 flex items-center gap-2">
                                        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                                        <div className="ms-3 flex-1 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
                                            app.seera.ai/dashboard
                                        </div>
                                    </div>

                                    {/* Dashboard preview content */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1.5">
                                                <div className="h-3 w-32 rounded-md bg-muted" />
                                                <div className="h-2 w-24 rounded-md bg-muted/60" />
                                            </div>
                                            <div className="h-8 w-24 rounded-lg bg-primary/20" />
                                        </div>

                                        {/* Stats row */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { color: 'bg-primary/10', textColor: 'text-primary', value: '5' },
                                                { color: 'bg-amber-500/10', textColor: 'text-amber-500', value: '87%' },
                                                { color: 'bg-green-500/10', textColor: 'text-green-500', value: '12' },
                                            ].map((stat, i) => (
                                                <div key={i} className={`rounded-xl ${stat.color} p-3`}>
                                                    <p className={`text-base font-bold ${stat.textColor}`}>{stat.value}</p>
                                                    <div className="mt-1 h-1.5 w-10 rounded bg-current opacity-20" />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Resume list items */}
                                        {[92, 78, 65].map((score, i) => (
                                            <div key={i} className="flex items-center gap-3 rounded-xl border bg-background/50 p-3">
                                                <div className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1 space-y-1.5">
                                                    <div className="h-2.5 w-24 rounded bg-muted" />
                                                    <div className="h-2 w-16 rounded bg-muted/60" />
                                                </div>
                                                <span className={`text-xs font-semibold ${score >= 80 ? 'text-green-500' : 'text-amber-500'}`}>
                                                    {score}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Floating ATS badge */}
                                <div className="absolute -bottom-4 -start-4 rounded-xl border bg-card p-3 shadow-xl ring-1 ring-border">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/15">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold leading-none">92% ATS Score</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {isArabic ? 'محسّن' : 'Optimized'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating AI badge */}
                                <div className="absolute -top-4 -end-4 rounded-xl border bg-card p-3 shadow-xl ring-1 ring-border">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-semibold">
                                            {isArabic ? 'ذكاء اصطناعي' : 'AI Powered'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <Badge variant="outline" className="mb-4">
                            {isArabic ? 'خطوات بسيطة' : 'Simple Steps'}
                        </Badge>
                        <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                            {isArabic ? 'كيف تعمل؟' : 'How It Works'}
                        </h2>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {isArabic
                                ? 'ثلاث خطوات فقط للبدء ببناء مسيرتك المهنية.'
                                : 'Three simple steps to start building your career.'}
                        </p>
                    </div>

                    <div className="mx-auto max-w-4xl">
                        <div className="grid gap-8 md:grid-cols-3">
                            {howItWorks.map((step, i) => (
                                <div key={i} className="relative text-center group">
                                    {/* Connector line */}
                                    {i < howItWorks.length - 1 && (
                                        <div className="absolute top-10 hidden w-full md:block" style={{ insetInlineStart: '55%' }}>
                                            <div className="h-px bg-gradient-to-r from-primary/40 to-transparent" />
                                        </div>
                                    )}

                                    {/* Step number badge */}
                                    <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 transition-colors group-hover:from-primary/30 group-hover:to-primary/10" />
                                        <step.icon className="relative h-9 w-9 text-primary" />
                                        <div className="absolute -top-2.5 -end-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow">
                                            {step.step}
                                        </div>
                                    </div>

                                    <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── PREMIUM FEATURES ─── */}
            <section className="bg-gradient-to-b from-muted/30 to-background py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <Badge variant="outline" className="mb-4">
                            {isArabic ? 'ميزات متقدمة' : 'Premium Features'}
                        </Badge>
                        <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                            {isArabic ? 'أدوات مهنية مميزة' : 'Premium Career Tools'}
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                            {isArabic
                                ? 'ميزات مدعومة بالذكاء الاصطناعي لتسريع مسيرتك المهنية.'
                                : 'Advanced AI-powered features to accelerate your career journey.'}
                        </p>
                    </div>

                    <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
                        {premiumFeatures.map((feature) => (
                            <Card
                                key={feature.title}
                                className="group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5"
                            >
                                {/* Top gradient accent bar */}
                                <div className={`absolute top-0 start-0 end-0 h-0.5 bg-gradient-to-r ${feature.color}`} />
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity group-hover:opacity-5`} />

                                <CardContent className="relative p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-sm`}>
                                            <feature.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="mb-1.5 flex items-center gap-2">
                                                <h3 className="text-lg font-semibold">{feature.title}</h3>
                                                <Badge className={`bg-gradient-to-r ${feature.color} text-[10px] text-white px-1.5 py-0 h-4`}>
                                                    {feature.badge}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-10 text-center">
                        <Link href="/register">
                            <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                                {isArabic ? 'ابدأ الآن' : 'Get Started'}
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── CORE FEATURES ─── */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t.landing.features.title}</h2>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {isArabic
                                ? 'كل ما تحتاجه لإنشاء سيرة ذاتية احترافية تتجاوز أنظمة ATS.'
                                : 'Everything you need to create a professional resume that passes ATS systems.'}
                        </p>
                    </div>

                    <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
                        {features.map((feature) => (
                            <Card
                                key={feature.title}
                                className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <CardContent className="p-6">
                                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── TEMPLATE SHOWCASE ─── */}
            <section className="bg-muted/20 py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <Badge variant="outline" className="mb-4">
                            {isArabic ? 'قوالب السيرة' : 'Resume Templates'}
                        </Badge>
                        <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                            {isArabic ? 'معاينة فعلية للقوالب' : 'Real Template Previews'}
                        </h2>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {isArabic
                                ? 'شاهد القوالب الحقيقية قبل اختيار القالب المناسب.'
                                : 'See the actual templates you can use before you choose.'}
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {templateShowcase.map((template) => {
                            const previewResume = {
                                ...templatePreviewBase,
                                template: template.id,
                                theme: template.theme,
                            };

                            return (
                                <Card key={template.id} className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                                    <div className="relative bg-white/70 p-4 dark:bg-card/50">
                                        <div className="h-[360px] overflow-hidden rounded-lg border bg-white">
                                            <div className="flex justify-center pt-4">
                                                <LivePreview resume={previewResume as any} scale={0.42} />
                                            </div>
                                        </div>
                                        {/* Hover overlay */}
                                        <div className="absolute inset-4 flex items-end justify-center rounded-lg bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                            <div className="mb-4 text-center">
                                                <Link href="/register">
                                                    <Button size="sm" variant="secondary" className="gap-2 shadow-lg">
                                                        {isArabic ? 'استخدم هذا القالب' : 'Use This Template'}
                                                        <ArrowRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold">{template.name}</h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {isArabic ? 'تنسيق واضح ومتوافق مع أنظمة التتبع.' : 'Clean layout with ATS-ready formatting.'}
                                                </p>
                                            </div>
                                            {template.badge ? (
                                                <Badge className="text-xs shrink-0 bg-gradient-to-r from-primary to-purple-600 text-white border-0">
                                                    {template.badge}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs shrink-0">
                                                    {isArabic ? 'ATS جاهز' : 'ATS Ready'}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="mt-10 text-center">
                        <Link href="/register">
                            <Button size="lg" variant="outline" className="gap-2">
                                {isArabic ? 'استعرض جميع القوالب' : 'Browse All Templates'}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── TESTIMONIAL / TRUST BAR ─── */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-4xl">
                        <div className="rounded-2xl border bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 p-8">
                            <div className="text-center mb-8">
                                <div className="flex justify-center gap-1 mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-lg font-medium mb-1">
                                    {isArabic
                                        ? '"Seera AI جعلت بناء سيرتي أسرع وأسهل بكثير. القوالب احترافية ونتائج ATS ممتازة."'
                                        : '"Seera AI made building my resume faster and easier than anything else I\'ve tried. The templates are polished and the ATS scores are excellent."'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isArabic ? '— باحث عن عمل في السوق السعودي' : '— Job seeker targeting the Gulf market'}
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-8 text-center">
                                {[
                                    { icon: Shield, label: isArabic ? 'بيانات آمنة ومشفّرة' : 'Secure & Encrypted Data' },
                                    { icon: Zap, label: isArabic ? 'إنشاء في دقيقتين' : 'Built in Minutes' },
                                    { icon: Globe2, label: isArabic ? 'يدعم العربية والإنجليزية' : 'Arabic & English Support' },
                                    { icon: Lock, label: isArabic ? 'لا مشاركة لبياناتك' : 'Your Data Stays Private' },
                                ].map(({ icon: Icon, label }) => (
                                    <div key={label} className="flex flex-col items-center gap-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground max-w-[100px]">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── FAQ ─── */}
            <section className="bg-muted/20 py-20">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-3xl">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                                {isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                            </h2>
                        </div>

                        <Accordion type="single" collapsible className="space-y-3">
                            {faq.map((item, i) => (
                                <AccordionItem
                                    key={i}
                                    value={`item-${i}`}
                                    className="rounded-xl border bg-card px-5 shadow-sm"
                                >
                                    <AccordionTrigger className="text-start font-semibold hover:no-underline py-5">
                                        {item.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                                        {item.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>

            {/* ─── FINAL CTA ─── */}
            <section className="relative overflow-hidden py-24">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-primary/5" />
                <div className="absolute top-0 start-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-0 end-1/4 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute inset-0 dot-pattern opacity-30" />

                <div className="container relative mx-auto px-4">
                    <div className="mx-auto max-w-3xl text-center">
                        <Badge className="mb-6 bg-gradient-to-r from-primary to-purple-600 px-4 py-1.5 text-sm text-white">
                            {isArabic ? 'ابدأ اليوم' : 'Start Today'}
                        </Badge>
                        <h2 className="mb-6 text-4xl font-bold md:text-5xl">
                            {isArabic ? 'ابدأ مسيرتك المهنية اليوم' : 'Start Your Career Journey Today'}
                        </h2>
                        <p className="mb-8 text-xl text-muted-foreground">
                            {isArabic
                                ? 'انضم إلى مجتمع مهني متنامٍ يستخدم Seera AI لتحقيق أهدافه.'
                                : 'Join a growing community using Seera AI to move faster with confidence.'}
                        </p>

                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link href="/register">
                                <Button
                                    size="lg"
                                    className="h-14 gap-2 bg-gradient-to-r from-primary to-purple-600 px-8 text-lg hover:from-primary/90 hover:to-purple-600/90 shadow-xl shadow-primary/25"
                                >
                                    {isArabic ? 'أنشئ سيرتك الذاتية' : 'Create Your Resume'}
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/pricing">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                                    {isArabic ? 'الأسعار' : 'See Pricing'}
                                </Button>
                            </Link>
                        </div>

                        <SecurityBadges className="mt-10" />
                    </div>
                </div>
            </section>

            <SocialProofNotification />
        </div>
    );
}
