'use client';

import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Sparkles,
    Target,
    Mic,
    Compass,
    Linkedin,
    Briefcase,
    Share2,
    BookOpen,
    LifeBuoy,
} from 'lucide-react';

type HelpFeature = {
    key: string;
    icon: typeof FileText;
    label: { en: string; ar: string };
    description: { en: string; ar: string };
    href: string;
};

const helpFeatures: HelpFeature[] = [
    {
        key: 'resume',
        icon: FileText,
        label: { en: 'Resume Builder', ar: 'منشئ السيرة الذاتية' },
        description: {
            en: 'Create or import a resume, then organize sections with ATS-friendly formatting.',
            ar: 'أنشئ أو استورد سيرتك، ثم نظّم الأقسام بتنسيق متوافق مع أنظمة ATS.',
        },
        href: '/dashboard/resumes/new',
    },
    {
        key: 'ai-writing',
        icon: Sparkles,
        label: { en: 'AI Writing & Polish', ar: 'تحسين وكتابة بالذكاء الاصطناعي' },
        description: {
            en: 'Generate summaries, bullets, and skills with smart prompts that keep your facts intact.',
            ar: 'ولّد الملخصات والنقاط والمهارات مع الحفاظ على تفاصيلك الواقعية.',
        },
        href: '/dashboard/resumes',
    },
    {
        key: 'job-targets',
        icon: Target,
        label: { en: 'Job Targets', ar: 'استهداف الوظائف' },
        description: {
            en: 'Paste a job description to get ATS match insights and tailored content.',
            ar: 'الصق وصف الوظيفة للحصول على تحليل التوافق وتعديلات مخصصة.',
        },
        href: '/dashboard/job-targets/new',
    },
    {
        key: 'interview',
        icon: Mic,
        label: { en: 'Interview Prep (Live)', ar: 'تدريب المقابلات (مباشر)' },
        description: {
            en: 'Practice interviews with AI voice, scoring, and actionable feedback.',
            ar: 'تدرّب مع مقابلات صوتية بالذكاء الاصطناعي وتقييمات عملية.',
        },
        href: '/dashboard/interview',
    },
    {
        key: 'career',
        icon: Compass,
        label: { en: 'Career GPS', ar: 'موجه المسار المهني' },
        description: {
            en: 'Get career guidance, skill gaps, and next-step recommendations.',
            ar: 'احصل على توجيه مهني وتحليل فجوات المهارات وخطوات تالية.',
        },
        href: '/dashboard/career',
    },
    {
        key: 'linkedin',
        icon: Linkedin,
        label: { en: 'LinkedIn Optimizer', ar: 'تحسين لينكدإن' },
        description: {
            en: 'Upgrade your headline, summary, and experience to boost visibility.',
            ar: 'حسّن العنوان والملخص والخبرات لزيادة الظهور.',
        },
        href: '/dashboard/linkedin',
    },
    {
        key: 'applications',
        icon: Briefcase,
        label: { en: 'Application Tracker', ar: 'متابعة التقديمات' },
        description: {
            en: 'Track applications, add notes, and stay on top of deadlines.',
            ar: 'تتبّع التقديمات وأضف الملاحظات وابقَ على المسار الصحيح.',
        },
        href: '/dashboard/applications',
    },
    {
        key: 'seera-link',
        icon: Share2,
        label: { en: 'Seera Link', ar: 'رابط سيرة' },
        description: {
            en: 'Share a clean, professional profile link with recruiters.',
            ar: 'شارك رابطاً احترافياً لسيرتك مع مسؤولي التوظيف.',
        },
        href: '/dashboard/seera-link',
    },
];

export default function DashboardHelpPage() {
    const { locale } = useLocale();
    const isArabic = locale === 'ar';

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-3">
                <Badge variant="outline" className="w-fit">
                    {isArabic ? 'مركز المساعدة' : 'Help Center'}
                </Badge>
                <h1 className="text-2xl md:text-3xl font-bold">
                    {isArabic ? 'كل ما تحتاجه للانطلاق بسرعة' : 'Everything you need to get started fast'}
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                    {isArabic
                        ? 'دليل سريع لشرح أهم الميزات داخل لوحة التحكم مع روابط مباشرة لكل أداة.'
                        : 'A quick guide to the most important dashboard features with direct links to each tool.'}
                </p>
                <div className="flex flex-wrap gap-3">
                    <Button asChild>
                        <Link href="/help">
                            <BookOpen className="h-4 w-4 me-2" />
                            {isArabic ? 'الاطلاع على الدليل الكامل' : 'Open full guide'}
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <LifeBuoy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>{isArabic ? 'نظام رصيد الذكاء الاصطناعي' : 'AI Credits System'}</CardTitle>
                            <CardDescription>
                                {isArabic
                                    ? 'شرح سريع لكيفية احتساب الرصيد وما الذي يستهلكه داخل المنصة.'
                                    : 'A quick explanation of how credits work and what consumes them.'}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border p-4">
                            <h3 className="font-semibold mb-2">
                                {isArabic ? 'كيف يتم احتساب الرصيد؟' : 'How credits are calculated'}
                            </h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>
                                    {isArabic
                                        ? 'تحصل على 50 رصيداً شهرياً ضمن الاشتراك.'
                                        : 'You receive 50 credits per month with your subscription.'}
                                </li>
                                <li>
                                    {isArabic
                                        ? 'كل رصيد يعادل تقريباً 0.2 ريال سعودي من تكلفة الذكاء الاصطناعي.'
                                        : 'Each credit roughly equals 0.2 SAR of AI usage cost.'}
                                </li>
                                <li>
                                    {isArabic
                                        ? 'الرصيد يُعاد ضبطه في بداية كل شهر.'
                                        : 'Credits reset at the beginning of each month.'}
                                </li>
                                <li>
                                    {isArabic
                                        ? 'يمكنك شراء رصيد إضافي عند الحاجة.'
                                        : 'You can top up credits whenever needed.'}
                                </li>
                            </ul>
                        </div>
                        <div className="rounded-xl border p-4">
                            <h3 className="font-semibold mb-2">
                                {isArabic ? 'ماذا يستهلك الرصيد؟' : 'What consumes credits'}
                            </h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>
                                    {isArabic
                                        ? 'توليد ملخص السيرة، والنقاط، وتحسين النص.'
                                        : 'Summary generation, bullet writing, and text polish.'}
                                </li>
                                <li>
                                    {isArabic
                                        ? 'تحليل مطابقة الوصف الوظيفي وATS.'
                                        : 'Job description match analysis and ATS insights.'}
                                </li>
                                <li>
                                    {isArabic
                                        ? 'مقابلات الذكاء الاصطناعي والتقييمات.'
                                        : 'AI interview practice and scoring.'}
                                </li>
                                <li>
                                    {isArabic
                                        ? 'مميزات الذكاء الاصطناعي الأخرى داخل لوحة التحكم.'
                                        : 'Other AI-powered tools across the dashboard.'}
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="rounded-xl bg-muted/50 p-4">
                        <h3 className="font-semibold mb-2">
                            {isArabic ? 'أمثلة استهلاك تقديرية' : 'Typical usage examples'}
                        </h3>
                        <div className="grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
                            <div className="rounded-lg border bg-background p-3">
                                <p className="font-medium text-foreground mb-1">
                                    {isArabic ? 'ملخص احترافي' : 'Professional summary'}
                                </p>
                                <p>{isArabic ? '≈ 0.5 - 1 رصيد' : '≈ 0.5 - 1 credit'}</p>
                            </div>
                            <div className="rounded-lg border bg-background p-3">
                                <p className="font-medium text-foreground mb-1">
                                    {isArabic ? 'تحسين نقاط الخبرة' : 'Experience bullets polish'}
                                </p>
                                <p>{isArabic ? '≈ 0.3 - 0.8 رصيد' : '≈ 0.3 - 0.8 credits'}</p>
                            </div>
                            <div className="rounded-lg border bg-background p-3">
                                <p className="font-medium text-foreground mb-1">
                                    {isArabic ? 'تحليل مطابقة الوظيفة' : 'Job match analysis'}
                                </p>
                                <p>{isArabic ? '≈ 0.8 - 2 رصيد' : '≈ 0.8 - 2 credits'}</p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            {isArabic
                                ? 'القيم تقديرية وتختلف حسب طول المحتوى ونوع المهمة.'
                                : 'Estimates vary based on input length and task complexity.'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {helpFeatures.map((feature) => {
                    const Icon = feature.icon;
                    return (
                        <Card key={feature.key} className="h-full">
                            <CardHeader>
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle>{isArabic ? feature.label.ar : feature.label.en}</CardTitle>
                                <CardDescription>
                                    {isArabic ? feature.description.ar : feature.description.en}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={feature.href}>
                                        {isArabic ? 'افتح الأداة' : 'Open tool'}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
