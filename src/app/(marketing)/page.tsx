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
    Building2,
    Zap,
    Award,
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

    // New premium features
    const premiumFeatures = [
        {
            icon: FileText,
            title: locale === 'ar' ? 'منشئ السيرة الذاتية' : 'Smart Resume Builder',
            description: locale === 'ar'
                ? 'أنشئ سيرة ذاتية احترافية في دقائق مع قوالب جاهزة ومحتوى ذكي يتجاوز أنظمة ATS بنجاح'
                : 'Create a professional resume in minutes with ready-to-use templates and AI-powered content that beats ATS systems',
            color: 'from-amber-500 to-orange-500',
            badge: 'CORE',
        },
        {
            icon: Compass,
            title: locale === 'ar' ? 'GPS المهني' : 'Career GPS',
            description: locale === 'ar'
                ? 'خارطة طريق شخصية تظهر مسارات مهنية واقعية مع توقعات الراتب وفجوات المهارات'
                : 'Personal roadmap showing realistic career paths with salary projections and skill gaps',
            color: 'from-blue-500 to-cyan-500',
            badge: 'NEW',
        },
        {
            icon: Brain,
            title: locale === 'ar' ? 'تحضير المقابلة بالذكاء الاصطناعي' : 'AI Interview Prep',
            description: locale === 'ar'
                ? 'تدرب على المقابلات مع محاور ذكي صوتي يقدم تقييم STAR وملاحظات فورية'
                : 'Practice interviews with a voice AI interviewer that provides STAR scoring and instant feedback',
            color: 'from-purple-500 to-pink-500',
            badge: 'VOICE AI',
        },
        {
            icon: Users,
            title: locale === 'ar' ? 'محسن LinkedIn' : 'LinkedIn Optimizer',
            description: locale === 'ar'
                ? 'حول سيرتك الذاتية إلى ملف LinkedIn مثالي مع عناوين جذابة وملخص احترافي'
                : 'Transform your resume into the perfect LinkedIn profile with compelling headlines and summary',
            color: 'from-blue-600 to-blue-400',
            badge: 'AI POWERED',
        },
        {
            icon: PenTool,
            title: locale === 'ar' ? 'سيرة لينك' : 'Seera Link',
            description: locale === 'ar'
                ? 'أنشئ صفحة ملف مهني قابلة للمشاركة مع وسائل تواصل مباشرة والوصول للسيرة الذاتية.'
                : 'Create a shareable career profile page with direct contact actions and CV access.',
            color: 'from-fuchsia-500 to-rose-500',
            badge: 'PUBLIC PROFILE',
        },
        {
            icon: ScanSearch,
            title: locale === 'ar' ? 'محاكي ATS' : 'ATS Simulator',
            description: locale === 'ar'
                ? 'شاهد سيرتك كما يراها مسؤولو التوظيف وأنظمة ATS مع تحليل فوري ونصائح للتحسين'
                : 'See your resume exactly as recruiters and ATS systems see it with instant analysis and improvement tips',
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
        { value: locale === 'ar' ? 'آلاف' : 'Thousands', label: locale === 'ar' ? 'سير ذاتية منشأة' : 'Resumes Created' },
        { value: locale === 'ar' ? 'مئات' : 'Hundreds', label: locale === 'ar' ? 'شركات توظف' : 'Companies Hiring' },
        { value: locale === 'ar' ? 'قوي' : 'Strong', label: locale === 'ar' ? 'معدل النجاح' : 'Success Rate' },
        { value: locale === 'ar' ? 'تقييم عالٍ' : 'Top-rated', label: locale === 'ar' ? 'تقييم المستخدمين' : 'User Rating' },
    ];

    const templatePreviewBase = getTemplatePreviewData(locale === 'ar' ? 'ar' : 'en');
    const templateShowcase: { id: TemplateId; name: string; theme: ThemeId }[] = [
        { id: 'prestige-executive', name: locale === 'ar' ? 'هيبة تنفيذية' : 'Prestige Executive', theme: 'obsidian' },
        { id: 'metropolitan-split', name: locale === 'ar' ? 'المتروبوليتان المقسّم' : 'Metropolitan Split', theme: 'sapphire' },
        { id: 'nordic-minimal', name: locale === 'ar' ? 'الشمالي البسيط' : 'Nordic Minimal', theme: 'ivory' },
        { id: 'classic-professional', name: locale === 'ar' ? 'الكلاسيكي الاحترافي' : 'Classic Professional', theme: 'emerald' },
        { id: 'impact-modern', name: locale === 'ar' ? 'التأثير العصري' : 'Impact Modern', theme: 'graphite' },
    ];

    const faq = [
        {
            q: locale === 'ar' ? 'ما هي الخطط المتاحة؟' : 'What plans are available?',
            a: locale === 'ar'
                ? 'نقدم خطة برو للباحثين عن عمل مع أدوات ذكية لبناء السيرة الذاتية، الاستهداف، وتحضير المقابلات.'
                : 'We offer a Pro plan for job seekers with AI tools for resumes, job targeting, and interview prep.',
        },
        {
            q: locale === 'ar' ? 'لمن تناسب منصة Seera AI؟' : 'Who is Seera AI built for?',
            a: locale === 'ar'
                ? 'المنصة مناسبة للباحثين عن عمل، والمهنيين الراغبين في تطوير مسارهم، وكل من يريد تجربة أكثر احترافية في بناء السيرة الذاتية والتقديم للوظائف.'
                : 'Seera AI is built for job seekers, career switchers, and professionals who want a sharper workflow for resumes, applications, and interview prep.',
        },
        {
            q: locale === 'ar' ? 'ما هو GPS المهني؟' : 'What is Career GPS?',
            a: locale === 'ar'
                ? 'GPS المهني يحلل سيرتك الذاتية ويظهر لك 4 مسارات مهنية واقعية مع توقعات الراتب، فجوات المهارات، وخطة عمل أسبوعية لتحقيق أهدافك.'
                : 'Career GPS analyzes your resume and shows you 4 realistic career paths with salary projections, skill gaps, and a weekly action plan to achieve your goals.',
        },
    ];

    return (
        <div className="flex flex-col min-h-screen" dir={dir}>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 pt-20 pb-32">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="absolute top-20 start-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-10 end-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="container mx-auto px-4 relative">
                    <div className="pointer-events-none absolute inset-x-0 top-8 hidden lg:block">
                        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-start">
                            <div className="flex justify-start">
                                <div className="w-72 rounded-3xl border border-white/60 bg-white/75 p-5 shadow-2xl shadow-blue-200/40 backdrop-blur">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-700">
                                            <Globe2 className="h-5 w-5" />
                                        </div>
                                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                            Global
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {locale === 'ar' ? 'مسارات مهنية مرنة عبر أسواق متعددة' : 'Career momentum across multiple markets'}
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        {[
                                            locale === 'ar' ? 'سير ذاتية جاهزة لفرق التوظيف الدولية' : 'Recruiter-ready resumes',
                                            locale === 'ar' ? 'تخطيط مهني يعتمد على المهارات' : 'Skill-based career mapping',
                                            locale === 'ar' ? 'دعم متعدد اللغات' : 'Multi-language workflows',
                                        ].map((item) => (
                                            <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="relative h-[460px] w-[440px]">
                                <div className="absolute inset-x-12 top-6 h-24 rounded-full bg-primary/20 blur-3xl" />
                                <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full border border-primary/15 bg-gradient-to-br from-primary/10 via-white/80 to-cyan-200/40 shadow-2xl shadow-primary/10 backdrop-blur">
                                    <div className="absolute inset-6 rounded-full border border-dashed border-primary/20" />
                                    <div className="absolute inset-16 rounded-full border border-primary/15" />
                                    <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg">
                                        <Compass className="h-7 w-7" />
                                    </div>
                                    <div className="absolute left-8 top-16 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-600 shadow-md">
                                        <Target className="h-5 w-5" />
                                    </div>
                                    <div className="absolute bottom-12 right-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-md">
                                        <Brain className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="absolute left-4 top-56 w-44 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-xl backdrop-blur">
                                    <div className="mb-3 flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-semibold">
                                            {locale === 'ar' ? 'جاهز للتوظيف' : 'Hiring-ready'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2 rounded-full bg-slate-200" />
                                        <div className="h-2 w-4/5 rounded-full bg-slate-200" />
                                        <div className="h-2 w-3/5 rounded-full bg-primary/30" />
                                    </div>
                                </div>
                                <div className="absolute right-0 top-52 w-44 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-xl backdrop-blur">
                                    <div className="mb-3 flex items-center gap-2">
                                        <Award className="h-4 w-4 text-amber-500" />
                                        <span className="text-sm font-semibold">
                                            {locale === 'ar' ? 'جاهزية مهنية' : 'Career readiness'}
                                        </span>
                                    </div>
                                    <p className="text-xs leading-5 text-muted-foreground">
                                        {locale === 'ar' ? 'قوالب واضحة، محتوى ذكي، وتجربة مناسبة لسوق عالمي.' : 'Clean templates, smarter content, and a platform designed for international careers.'}
                                    </p>
                                </div>
                                <div className="absolute bottom-8 left-1/2 w-64 -translate-x-1/2 rounded-2xl border border-white/60 bg-slate-950 px-4 py-3 text-white shadow-2xl">
                                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
                                        <span>Seera AI</span>
                                        <span>Live</span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                            <Zap className="h-5 w-5 text-cyan-300" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">
                                                {locale === 'ar' ? 'سير عمل مهني عالمي' : 'International career workflows'}
                                            </p>
                                            <p className="text-xs text-white/70">
                                                {locale === 'ar' ? 'من البناء إلى التقديم والتحضير' : 'From resume building to prep and applications'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <div className="mt-10 w-72 rounded-3xl border border-white/60 bg-slate-950/90 p-5 text-white shadow-2xl shadow-slate-900/20 backdrop-blur">
                                    <div className="mb-4 flex items-center justify-between">
                                        <p className="text-sm font-semibold">
                                            {locale === 'ar' ? 'مؤشرات المنصة' : 'Platform signals'}
                                        </p>
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { label: locale === 'ar' ? 'جاهزية ATS' : 'ATS readiness', value: '95%+' },
                                            { label: locale === 'ar' ? 'أسواق مستهدفة' : 'Supported markets', value: 'Global' },
                                            { label: locale === 'ar' ? 'تجربة متعددة اللغات' : 'Multi-language UX', value: 'EN + AR' },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                                                <span className="text-sm text-white/70">{item.label}</span>
                                                <span className="text-sm font-semibold">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto text-center">
                        <Badge className="mb-6 bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-1.5 text-sm">
                            🚀 {locale === 'ar' ? 'الآن مع GPS المهني وتحضير المقابلات' : 'Now with Career GPS & Interview Prep'}
                        </Badge>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400">
                            {locale === 'ar' ? 'مسيرتك المهنية تبدأ هنا' : 'Your Career Journey Starts Here'}
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                            {locale === 'ar'
                                ? 'أكثر من مجرد سيرة ذاتية — منصة شاملة للتخطيط المهني، تحضير المقابلات، والتواصل مع أفضل الشركات حول العالم.'
                                : 'More than just a resume — a complete platform for career planning, interview prep, and connecting with top companies worldwide.'}
                        </p>

                        {/* Dual CTA - Job Seekers vs Recruiters */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                            <Link href="/register">
                                <Button size="lg" className="h-14 px-8 text-lg gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                                    {locale === 'ar' ? 'اصنع سيرتك' : 'Build your Career'}
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </Link>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {locale === 'ar'
                                ? 'برو للباحثين عن عمل'
                                : 'Pro for job seekers'}
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-4xl font-bold text-primary">{stat.value}</p>
                                <p className="text-muted-foreground">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Premium Features - NEW */}
            <section className="py-20 bg-gradient-to-b from-background to-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <Badge variant="outline" className="mb-4">
                            {locale === 'ar' ? 'ميزات متقدمة' : 'Premium Features'}
                        </Badge>
                        <h2 className="text-4xl font-bold mb-4">
                            {locale === 'ar' ? 'أدوات مهنية مميزة' : 'Premium Career Tools'}
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            {locale === 'ar'
                                ? 'ميزات متقدمة مدعومة بالذكاء الاصطناعي لتسريع مسيرتك المهنية'
                                : 'Advanced AI-powered features to accelerate your career journey'}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        {premiumFeatures.map((feature) => (
                            <Card key={feature.title} className="relative overflow-hidden border-2 hover:border-primary/50 transition-all group">
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                                <CardContent className="p-6 relative">
                                    <div className="flex items-start gap-4">
                                        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                                            <feature.icon className="h-7 w-7 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-xl font-semibold">{feature.title}</h3>
                                                <Badge className={`bg-gradient-to-r ${feature.color} text-white text-xs`}>
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

                    <div className="text-center mt-10">
                        <Link href="/register">
                            <Button size="lg" className="gap-2">
                                {locale === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Core Features */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">{t.landing.features.title}</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            {locale === 'ar'
                                ? 'كل ما تحتاجه لإنشاء سيرة ذاتية احترافية تتجاوز أنظمة ATS'
                                : 'Everything you need to create a professional resume that passes ATS systems'}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {features.map((feature) => (
                            <Card key={feature.title} className="text-center">
                                <CardContent className="pt-6">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                        <feature.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Template Preview */}
            <section className="py-20 bg-muted/20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <Badge variant="outline" className="mb-4">
                            {locale === 'ar' ? 'قوالب السيرة' : 'Resume Templates'}
                        </Badge>
                        <h2 className="text-3xl font-bold mb-4">
                            {locale === 'ar' ? 'معاينة فعلية للقوالب' : 'Real Template Previews'}
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            {locale === 'ar'
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
                                            {locale === 'ar'
                                                ? 'منسق بشكل واضح ومتوافق مع أنظمة التتبع.'
                                                : 'Clean layout with ATS-ready formatting.'}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="text-center mt-10">
                        <Link href="/register">
                            <Button size="lg" variant="outline" className="gap-2">
                                {locale === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">
                                {locale === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                            </h2>
                        </div>

                        <Accordion type="single" collapsible className="space-y-4">
                            {faq.map((item, i) => (
                                <AccordionItem key={i} value={`item-${i}`} className="border rounded-lg px-4">
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

            {/* Final CTA */}
            <section className="py-20 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-4xl font-bold mb-6">
                            {locale === 'ar' ? 'ابدأ مسيرتك المهنية اليوم' : 'Start Your Career Journey Today'}
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8">
                            {locale === 'ar'
                                ? 'انضم إلى مجتمع مهني متنامٍ يستخدم Seera AI لتحقيق أهدافهم'
                                : 'Join a growing community using Seera AI to achieve their goals'}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/register">
                                <Button size="lg" className="h-14 px-8 text-lg gap-2">
                                    {locale === 'ar' ? 'أنشئ سيرتك الذاتية' : 'Create Your Resume'}
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                        {/* Trust Elements */}
                        <SecurityBadges className="mt-8" />
                    </div>
                </div>
            </section>

            {/* Social Proof Notification */}
            <SocialProofNotification />
        </div>
    );
}
