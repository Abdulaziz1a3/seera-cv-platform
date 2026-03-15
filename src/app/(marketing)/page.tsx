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
        },
        {
            icon: Sparkles,
            title: t.landing.features.ai.title,
            description: t.landing.features.ai.description,
        },
        {
            icon: Globe2,
            title: t.landing.features.multilang.title,
            description: t.landing.features.multilang.description,
        },
        {
            icon: Target,
            title: t.landing.features.jobTarget.title,
            description: t.landing.features.jobTarget.description,
        },
        {
            icon: Shield,
            title: t.landing.features.privacy.title,
            description: t.landing.features.privacy.description,
        },
        {
            icon: Download,
            title: t.landing.features.export.title,
            description: t.landing.features.export.description,
        },
    ];

    const stats = [
        { value: isArabic ? 'آلاف' : 'Thousands', label: isArabic ? 'سير ذاتية منشأة' : 'Resumes Created' },
        { value: isArabic ? 'مئات' : 'Hundreds', label: isArabic ? 'فرص وشركات' : 'Opportunities Tracked' },
        { value: isArabic ? 'قوي' : 'Strong', label: isArabic ? 'معدل الجاهزية' : 'Readiness Score' },
        { value: isArabic ? 'عالي' : 'Top-rated', label: isArabic ? 'رضا المستخدمين' : 'User Rating' },
    ];

    const templatePreviewBase = getTemplatePreviewData(isArabic ? 'ar' : 'en');
    const templateShowcase: { id: TemplateId; name: string; theme: ThemeId }[] = [
        { id: 'prestige-executive', name: isArabic ? 'هيبة تنفيذية' : 'Prestige Executive', theme: 'obsidian' },
        { id: 'metropolitan-split', name: isArabic ? 'المتروبوليتان المقسّم' : 'Metropolitan Split', theme: 'sapphire' },
        { id: 'nordic-minimal', name: isArabic ? 'الشمالي البسيط' : 'Nordic Minimal', theme: 'ivory' },
        { id: 'classic-professional', name: isArabic ? 'الكلاسيكي الاحترافي' : 'Classic Professional', theme: 'emerald' },
        { id: 'impact-modern', name: isArabic ? 'التأثير العصري' : 'Impact Modern', theme: 'graphite' },
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

    const heroPillars = [
        {
            icon: Globe2,
            title: isArabic ? 'تجربة عالمية' : 'Global-ready experience',
            text: isArabic
                ? 'دعم متعدد اللغات وقوالب احترافية واضحة.'
                : 'Multi-language support and polished professional templates.',
            tone: 'bg-blue-50 text-blue-700',
        },
        {
            icon: Target,
            title: isArabic ? 'جاهزية ATS' : 'ATS-ready output',
            text: isArabic
                ? 'تنسيق نظيف ومحتوى منظم للتقديم بثقة.'
                : 'Clean structure and exports built for real applications.',
            tone: 'bg-emerald-50 text-emerald-700',
        },
        {
            icon: Brain,
            title: isArabic ? 'تحضير أذكى' : 'Smarter preparation',
            text: isArabic
                ? 'محاكاة ATS وتحضير مقابلات في تجربة واحدة.'
                : 'ATS simulation and interview prep in one focused workflow.',
            tone: 'bg-violet-50 text-violet-700',
        },
    ];

    const heroSignals = [
        { label: isArabic ? 'جاهزية ATS' : 'ATS readiness', value: '95%+' },
        { label: isArabic ? 'الأسواق' : 'Markets', value: 'Global' },
        { label: isArabic ? 'اللغات' : 'Languages', value: 'EN + AR' },
    ];

    return (
        <div className="flex min-h-screen flex-col" dir={dir}>
            <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 pt-20 pb-32">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="absolute top-20 start-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute bottom-10 end-10 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

                <div className="container relative mx-auto px-4">
                    <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
                        <div className="max-w-4xl text-center lg:text-left">
                            <Badge className="mb-6 bg-gradient-to-r from-primary to-purple-600 px-4 py-1.5 text-sm text-white">
                                {isArabic ? 'الآن مع Career GPS وتحضير المقابلات' : 'Now with Career GPS & Interview Prep'}
                            </Badge>

                            <h1 className="mb-6 bg-gradient-to-r from-gray-900 via-primary to-purple-600 bg-clip-text text-5xl font-bold leading-tight text-transparent md:text-7xl dark:from-white dark:via-primary dark:to-purple-400">
                                {isArabic ? 'مسيرتك المهنية تبدأ هنا' : 'Your Career Journey Starts Here'}
                            </h1>

                            <p className="mb-8 max-w-3xl text-xl text-muted-foreground md:text-2xl">
                                {isArabic
                                    ? 'أكثر من مجرد سيرة ذاتية. منصة واضحة للتخطيط المهني، تحضير المقابلات، والتقديم لفرص عالمية بثقة.'
                                    : 'More than just a resume. A focused platform for career planning, interview prep, and applying with confidence across global markets.'}
                            </p>

                            <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                                <Link href="/register">
                                    <Button size="lg" className="h-14 gap-2 bg-gradient-to-r from-primary to-purple-600 px-8 text-lg hover:from-primary/90 hover:to-purple-600/90">
                                        {isArabic ? 'اصنع سيرتك' : 'Build your Career'}
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </Link>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                {isArabic ? 'Pro للباحثين عن عمل' : 'Pro for job seekers'}
                            </p>
                        </div>

                        <div className="relative mx-auto w-full max-w-xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-cyan-400/10 blur-3xl" />
                            <div className="relative rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-2xl shadow-primary/10 backdrop-blur">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {isArabic ? 'منظومة Seera AI المهنية' : 'Seera AI Career Stack'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {isArabic ? 'سيرة أقوى، تقديم أنظف، تحضير أذكى' : 'Stronger resumes, smarter applications, better prep'}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                        Global
                                    </Badge>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-3xl bg-slate-950 p-5 text-white">
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                                            <Compass className="h-6 w-6 text-cyan-300" />
                                        </div>
                                        <p className="text-lg font-semibold">
                                            {isArabic ? 'مسار مهني واضح' : 'Focused career workflow'}
                                        </p>
                                        <p className="mt-2 text-sm text-white/70">
                                            {isArabic
                                                ? 'من بناء السيرة الذاتية إلى تحضير المقابلات في تجربة واحدة واضحة.'
                                                : 'Move from resume building to interview prep in one clear product flow.'}
                                        </p>
                                    </div>

                                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
                                        {heroPillars.map((item) => (
                                            <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                                                    <item.icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                                    <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                    {heroSignals.map((item) => (
                                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                                            <p className="mt-2 text-lg font-semibold text-foreground">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-4xl font-bold text-primary">{stat.value}</p>
                                <p className="text-muted-foreground">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-gradient-to-b from-background to-muted/30 py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <Badge variant="outline" className="mb-4">
                            {isArabic ? 'ميزات متقدمة' : 'Premium Features'}
                        </Badge>
                        <h2 className="mb-4 text-4xl font-bold">
                            {isArabic ? 'أدوات مهنية مميزة' : 'Premium Career Tools'}
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                            {isArabic
                                ? 'ميزات مدعومة بالذكاء الاصطناعي لتسريع مسيرتك المهنية.'
                                : 'Advanced AI-powered features to accelerate your career journey.'}
                        </p>
                    </div>

                    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
                        {premiumFeatures.map((feature) => (
                            <Card key={feature.title} className="group relative overflow-hidden border-2 transition-all hover:border-primary/50">
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 transition-opacity group-hover:opacity-10`} />
                                <CardContent className="relative p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`h-14 w-14 flex-shrink-0 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                                            <feature.icon className="h-7 w-7 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="mb-2 flex items-center gap-2">
                                                <h3 className="text-xl font-semibold">{feature.title}</h3>
                                                <Badge className={`bg-gradient-to-r ${feature.color} text-xs text-white`}>
                                                    {feature.badge}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground">{feature.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-10 text-center">
                        <Link href="/register">
                            <Button size="lg" className="gap-2">
                                {isArabic ? 'ابدأ الآن' : 'Get Started'}
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold">{t.landing.features.title}</h2>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {isArabic
                                ? 'كل ما تحتاجه لإنشاء سيرة ذاتية احترافية تتجاوز أنظمة ATS.'
                                : 'Everything you need to create a professional resume that passes ATS systems.'}
                        </p>
                    </div>

                    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
                        {features.map((feature) => (
                            <Card key={feature.title} className="text-center">
                                <CardContent className="pt-6">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                        <feature.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-muted/20 py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <Badge variant="outline" className="mb-4">
                            {isArabic ? 'قوالب السيرة' : 'Resume Templates'}
                        </Badge>
                        <h2 className="mb-4 text-3xl font-bold">
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
                                <Card key={template.id} className="overflow-hidden">
                                    <div className="bg-white/70 p-4">
                                        <div className="h-[360px] overflow-hidden rounded-lg border bg-white">
                                            <div className="flex justify-center pt-4">
                                                <LivePreview resume={previewResume as any} scale={0.42} />
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold">{template.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isArabic
                                                ? 'تنسيق واضح ومتوافق مع أنظمة التتبع.'
                                                : 'Clean layout with ATS-ready formatting.'}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="mt-10 text-center">
                        <Link href="/register">
                            <Button size="lg" variant="outline" className="gap-2">
                                {isArabic ? 'ابدأ الآن' : 'Get Started'}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-3xl">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold">
                                {isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                            </h2>
                        </div>

                        <Accordion type="single" collapsible className="space-y-4">
                            {faq.map((item, i) => (
                                <AccordionItem key={i} value={`item-${i}`} className="rounded-lg border px-4">
                                    <AccordionTrigger className="text-start font-semibold">
                                        {item.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        {item.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>

            <section className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 py-20">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="mb-6 text-4xl font-bold">
                            {isArabic ? 'ابدأ مسيرتك المهنية اليوم' : 'Start Your Career Journey Today'}
                        </h2>
                        <p className="mb-8 text-xl text-muted-foreground">
                            {isArabic
                                ? 'انضم إلى مجتمع مهني متنامٍ يستخدم Seera AI لتحقيق أهدافه.'
                                : 'Join a growing community using Seera AI to move faster with confidence.'}
                        </p>

                        <div className="flex flex-col justify-center gap-4 sm:flex-row">
                            <Link href="/register">
                                <Button size="lg" className="h-14 gap-2 px-8 text-lg">
                                    {isArabic ? 'أنشئ سيرتك الذاتية' : 'Create Your Resume'}
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </Link>
                        </div>

                        <SecurityBadges className="mt-8" />
                    </div>
                </div>
            </section>

            <SocialProofNotification />
        </div>
    );
}
