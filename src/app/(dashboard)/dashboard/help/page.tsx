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
