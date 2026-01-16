'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
    Search,
    BookOpen,
    FileText,
    Zap,
    Target,
    Download,
    CreditCard,
    Shield,
    MessageCircle,
    ChevronRight,
    Mail,
    HelpCircle,
    Video,
    Sparkles,
} from 'lucide-react';

const helpCategories = [
    {
        id: 'getting-started',
        icon: Zap,
        name: { en: 'Getting Started', ar: 'البدء' },
        description: {
            en: 'Learn the basics of Seera AI',
            ar: 'تعلم أساسيات Seera AI',
        },
        articles: 5,
        href: '#getting-started',
    },
    {
        id: 'resume-builder',
        icon: FileText,
        name: { en: 'Resume Builder', ar: 'منشئ السيرة الذاتية' },
        description: { en: 'Create and edit your resume', ar: 'أنشئ وعدّل سيرتك الذاتية' },
        articles: 12,
        href: '#resume-builder',
    },
    {
        id: 'ats-optimization',
        icon: Target,
        name: { en: 'ATS Optimization', ar: 'تحسين ATS' },
        description: { en: 'Pass applicant tracking systems', ar: 'تجاوز أنظمة تتبع المتقدمين' },
        articles: 8,
        href: '#ats-optimization',
    },
    {
        id: 'export-download',
        icon: Download,
        name: { en: 'Export & Download', ar: 'التصدير والتحميل' },
        description: { en: 'Download your resume in any format', ar: 'حمّل سيرتك بأي صيغة' },
        articles: 6,
        href: '#export-download',
    },
    {
        id: 'billing',
        icon: CreditCard,
        name: { en: 'Billing & Plans', ar: 'الفواتير والخطط' },
        description: { en: 'Manage your subscription', ar: 'إدارة اشتراكك' },
        articles: 7,
        href: '/pricing',
    },
    {
        id: 'account',
        icon: Shield,
        name: { en: 'Account & Security', ar: 'الحساب والأمان' },
        description: { en: 'Manage your account settings', ar: 'إدارة إعدادات حسابك' },
        articles: 4,
        href: '#account',
    },
];

const popularArticles = [
    {
        id: 1,
        title: { en: 'How to create your first resume', ar: 'كيفية إنشاء أول سيرة ذاتية' },
        category: 'getting-started',
        views: 15420,
        href: '/dashboard/resumes/new',
    },
    {
        id: 2,
        title: { en: 'Understanding your ATS score', ar: 'فهم نتيجة ATS الخاصة بك' },
        category: 'ats-optimization',
        views: 12350,
        href: '#ats-optimization',
    },
    {
        id: 3,
        title: { en: 'Using AI to generate bullet points', ar: 'استخدام الذكاء الاصطناعي لتوليد النقاط' },
        category: 'resume-builder',
        views: 10890,
        href: '#resume-builder',
    },
    {
        id: 4,
        title: { en: 'Exporting to PDF vs DOCX', ar: 'التصدير إلى PDF مقابل DOCX' },
        category: 'export-download',
        views: 8760,
        href: '#export-download',
    },
    {
        id: 5,
        title: { en: 'How to upgrade to Pro', ar: 'كيفية الترقية للخطة الاحترافية' },
        category: 'billing',
        views: 7540,
        href: '/pricing',
    },
];

const faqs = {
    en: [
        {
            q: 'What is an ATS and why does it matter?',
            a: 'An ATS (Applicant Tracking System) is software used by employers to filter resumes. Up to 75% of resumes are rejected by ATS before a human sees them. Our resumes are optimized to pass these systems.',
        },
        {
            q: 'Can I create a resume in Arabic?',
            a: 'Yes! We fully support Arabic with proper RTL (right-to-left) layout. You can create bilingual resumes or choose either language.',
        },
        {
            q: 'How does the AI writing assistant work?',
            a: 'Our AI analyzes your experience and suggests impactful bullet points using proven frameworks. It never invents information—it helps you express your real achievements better.',
        },
        {
            q: 'What export formats do you support?',
            a: 'We support PDF, DOCX, and plain text formats. All formats are ATS-safe and recruiter-friendly.',
        },
        {
            q: 'Can I cancel my subscription anytime?',
            a: 'Yes, you can cancel anytime. Your subscription will remain active until the end of your billing period.',
        },
        {
            q: 'Is my data secure?',
            a: 'Absolutely. We use bank-level encryption and never share your data. You can delete your account and all data at any time.',
        },
    ],
    ar: [
        {
            q: 'ما هو نظام ATS ولماذا هو مهم؟',
            a: 'نظام ATS (نظام تتبع المتقدمين) هو برنامج يستخدمه أصحاب العمل لتصفية السير الذاتية. يتم رفض ما يصل إلى 75% من السير الذاتية قبل أن يراها إنسان. سيرنا الذاتية مُحسّنة لتجاوز هذه الأنظمة.',
        },
        {
            q: 'هل يمكنني إنشاء سيرة ذاتية بالعربية؟',
            a: 'نعم! نحن ندعم العربية بالكامل مع تخطيط RTL (من اليمين إلى اليسار) الصحيح. يمكنك إنشاء سير ذاتية ثنائية اللغة أو اختيار أي لغة.',
        },
        {
            q: 'كيف يعمل مساعد الكتابة بالذكاء الاصطناعي؟',
            a: 'يحلل الذكاء الاصطناعي تجربتك ويقترح نقاطاً مؤثرة باستخدام أُطر مثبتة. لا يخترع معلومات أبداً - يساعدك في التعبير عن إنجازاتك الحقيقية بشكل أفضل.',
        },
        {
            q: 'ما صيغ التصدير المدعومة؟',
            a: 'ندعم صيغ PDF و DOCX والنص العادي. جميع الصيغ آمنة لـ ATS ومناسبة للمسؤولين.',
        },
        {
            q: 'هل يمكنني إلغاء اشتراكي في أي وقت؟',
            a: 'نعم، يمكنك الإلغاء في أي وقت. سيظل اشتراكك نشطاً حتى نهاية فترة الفوترة.',
        },
        {
            q: 'هل بياناتي آمنة؟',
            a: 'بالتأكيد. نستخدم تشفيراً على مستوى البنوك ولا نشارك بياناتك أبداً. يمكنك حذف حسابك وجميع البيانات في أي وقت.',
        },
    ],
};

export default function HelpCenterPage() {
    const { locale } = useLocale();
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 md:py-28 bg-gradient-to-b from-primary/5 via-background to-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Badge variant="secondary" className="mb-6">
                        <HelpCircle className="h-4 w-4 me-2" />
                        {locale === 'ar' ? 'مركز المساعدة' : 'Help Center'}
                    </Badge>

                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        {locale === 'ar' ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?'}
                    </h1>

                    {/* Search */}
                    <div className="max-w-xl mx-auto relative">
                        <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={
                                locale === 'ar'
                                    ? 'ابحث عن مقالات، أدلة، وأكثر...'
                                    : 'Search for articles, guides, and more...'
                            }
                            className="ps-12 h-14 text-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold mb-8 text-center">
                        {locale === 'ar' ? 'تصفح حسب الفئة' : 'Browse by Category'}
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {helpCategories.map((category) => (
                            <Link key={category.id} href={category.href}>
                                <Card className="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                                <category.icon className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                                                    {category.name[locale]}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {category.description[locale]}
                                                </p>
                                                <span className="text-xs text-muted-foreground">
                                                    {category.articles} {locale === 'ar' ? 'مقالة' : 'articles'}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Popular Articles */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold mb-8 text-center">
                        {locale === 'ar' ? 'المقالات الأكثر شيوعاً' : 'Popular Articles'}
                    </h2>

                    <div className="max-w-3xl mx-auto space-y-3">
                        {popularArticles.map((article) => (
                            <Link key={article.id} href={article.href}>
                                <Card className="group cursor-pointer hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium group-hover:text-primary transition-colors">
                                                {article.title[locale]}
                                            </h3>
                                            <span className="text-xs text-muted-foreground">
                                                {article.views.toLocaleString()} {locale === 'ar' ? 'مشاهدة' : 'views'}
                                            </span>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold mb-8 text-center">
                        {locale === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                    </h2>

                    <div className="max-w-3xl mx-auto">
                        <Accordion type="single" collapsible className="w-full">
                            {faqs[locale].map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger className="text-start hover:no-underline">
                                        {faq.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        {faq.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-bold mb-4">
                            {locale === 'ar' ? 'لم تجد ما تبحث عنه؟' : "Still can't find what you need?"}
                        </h2>
                        <p className="text-muted-foreground">
                            {locale === 'ar'
                                ? 'فريق الدعم لدينا مستعد للمساعدة'
                                : 'Our support team is ready to help'}
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
                        <Card className="text-center">
                            <CardContent className="pt-6">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Mail className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">
                                    {locale === 'ar' ? 'راسلنا' : 'Email Us'}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {locale === 'ar' ? 'نرد خلال 24 ساعة' : 'We respond within 24 hours'}
                                </p>
                                <Button variant="outline" size="sm">
                                    info@seera-sa.com
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="text-center">
                            <CardContent className="pt-6">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">
                                    {locale === 'ar' ? 'محادثة مباشرة' : 'Live Chat'}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {locale === 'ar' ? 'متاح 24/7' : 'Available 24/7'}
                                </p>
                                <Button size="sm">
                                    {locale === 'ar' ? 'ابدأ محادثة' : 'Start Chat'}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="text-center">
                            <CardContent className="pt-6">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Video className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">
                                    {locale === 'ar' ? 'دروس فيديو' : 'Video Tutorials'}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {locale === 'ar' ? 'تعلم بالمشاهدة' : 'Learn by watching'}
                                </p>
                                <Button variant="outline" size="sm">
                                    {locale === 'ar' ? 'شاهد الآن' : 'Watch Now'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}
