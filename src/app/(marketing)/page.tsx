'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowRight,
    Check,
    FileText,
    Sparkles,
    Globe2,
    Target,
    Shield,
    Download,
    Users,
    TrendingUp,
    Compass,
    Brain,
    Building2,
    Zap,
    Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLocale } from '@/components/providers/locale-provider';
import { SecurityBadges, FeaturedIn, GuaranteeBadge } from '@/components/marketing/trust-badges';
import { SocialProofNotification } from '@/components/marketing/social-proof-notification';

export default function Home() {
    const { t, locale, dir } = useLocale();

    // New premium features
    const premiumFeatures = [
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
            icon: TrendingUp,
            title: locale === 'ar' ? 'مجموعة المواهب' : 'Talent Pool',
            description: locale === 'ar'
                ? 'اجعل سيرتك مرئية لأكثر من 500 شركة في الخليج واستقبل عروض العمل مباشرة'
                : 'Make your resume visible to 500+ GCC companies and receive job offers directly',
            color: 'from-green-500 to-emerald-500',
            badge: 'INCLUDED',
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
        { value: '50,000+', label: locale === 'ar' ? 'سيرة ذاتية' : 'Resumes Created' },
        { value: '500+', label: locale === 'ar' ? 'شركة' : 'Companies Hiring' },
        { value: '92%', label: locale === 'ar' ? 'معدل النجاح' : 'Success Rate' },
        { value: '4.9/5', label: locale === 'ar' ? 'تقييم المستخدمين' : 'User Rating' },
    ];

    const faq = [
        {
            q: locale === 'ar' ? 'ما هي الخطط المتاحة؟' : 'What plans are available?',
            a: locale === 'ar'
                ? 'لدينا خطتان واضحتان: برو للباحثين عن عمل، وإنتربرايز للشركات والمُوظِّفين.'
                : 'We offer two plans: Pro for job seekers and Enterprise for recruiters.',
        },
        {
            q: locale === 'ar' ? 'كيف تعمل مجموعة المواهب؟' : 'How does the Talent Pool work?',
            a: locale === 'ar'
                ? 'عند الانضمام لمجموعة المواهب، تصبح سيرتك الذاتية مرئية للشركات المعتمدة التي تبحث عن مواهب. يمكنك التحكم في خصوصيتك وحتى إخفاء صاحب العمل الحالي.'
                : 'When you join the Talent Pool, your resume becomes visible to verified companies looking for talent. You control your privacy and can even hide your current employer.',
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

                {/* Left Side Hero Illustration */}
                <div className="hidden lg:block absolute top-[50%] -translate-y-1/2 mt-[100px] -left-[280px] xl:-left-[120px] w-[700px] h-[700px] pointer-events-none -z-10 select-none opacity-80">
                    <Image
                        src="/hero-bg.png"
                        alt="Career Success Illustration"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                <div className="container mx-auto px-4 relative">
                    <div className="max-w-4xl mx-auto text-center">
                        <Badge className="mb-6 bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-1.5 text-sm">
                            🚀 {locale === 'ar' ? 'الآن مع GPS المهني وتحضير المقابلات' : 'Now with Career GPS & Interview Prep'}
                        </Badge>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400">
                            {locale === 'ar' ? 'مسيرتك المهنية تبدأ هنا' : 'Your Career Journey Starts Here'}
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                            {locale === 'ar'
                                ? 'أكثر من مجرد سيرة ذاتية — منصة شاملة للتخطيط المهني، تحضير المقابلات، والتواصل مع أفضل الشركات في الخليج.'
                                : 'More than just a resume — a complete platform for career planning, interview prep, and connecting with top GCC companies.'}
                        </p>

                        {/* Dual CTA - Job Seekers vs Recruiters */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                            <Link href="/register">
                                <Button size="lg" className="h-14 px-8 text-lg gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                                    {locale === 'ar' ? 'أنا أبحث عن عمل' : "I'm a Job Seeker"}
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/recruiters/register">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg gap-2 border-2">
                                    <Building2 className="h-5 w-5" />
                                    {locale === 'ar' ? 'أنا أوظف مواهب' : "I'm Hiring Talent"}
                                </Button>
                            </Link>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {locale === 'ar'
                                ? 'برو للباحثين عن عمل | إنتربرايز للشركات'
                                : 'Pro for job seekers | Enterprise for recruiters'}
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

                    {/* Featured In / Trusted By */}
                    <FeaturedIn className="mt-16" />

                    {/* Right Side Illustration - Career Journey */}
                    <div className="hidden lg:block absolute top-[50%] -translate-y-1/2 mt-[132px] -right-[320px] xl:-right-[180px] w-[900px] h-[900px] pointer-events-none -z-10 select-none">
                        <Image
                            src="/hero-illustration.png"
                            alt="Career Journey Illustration"
                            fill
                            className="object-contain opacity-100"
                            priority
                        />
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
                            {locale === 'ar' ? 'أدوات لا تجدها في أي مكان آخر' : 'Tools You Won\'t Find Anywhere Else'}
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

            {/* For Recruiters Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <Badge className="bg-white/20 text-white mb-4">
                                    {locale === 'ar' ? 'للشركات والمسؤولين عن التوظيف' : 'For Companies & Recruiters'}
                                </Badge>
                                <h2 className="text-4xl font-bold mb-6">
                                    {locale === 'ar'
                                        ? 'وظف أفضل المواهب في دقائق'
                                        : 'Hire Top Talent in Minutes'}
                                </h2>
                                <p className="text-xl text-white/90 mb-8">
                                    {locale === 'ar'
                                        ? 'ابحث في أكثر من 50,000 سيرة ذاتية لمحترفين في الخليج. ادفع فقط مقابل المرشحين الذين تريد التواصل معهم.'
                                        : 'Search 50,000+ CVs of GCC professionals. Pay only for candidates you want to contact.'}
                                </p>

                                <ul className="space-y-3 mb-8">
                                    {[
                                        locale === 'ar' ? 'بحث ذكي بالمسمى الوظيفي والمهارات والموقع' : 'Smart search by title, skills, location',
                                        locale === 'ar' ? 'مطابقة بالذكاء الاصطناعي للمرشحين الأنسب' : 'AI matching to find best candidates',
                                        locale === 'ar' ? 'ادفع فقط مقابل السير الذاتية التي تفتحها' : 'Pay only for CVs you unlock',
                                        locale === 'ar' ? 'شركات معتمدة فقط' : 'Verified companies only',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <Check className="h-5 w-5 text-green-400" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link href="/recruiters/register">
                                        <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90 gap-2">
                                            {locale === 'ar' ? 'ابدأ التوظيف' : 'Start Hiring'}
                                            <ArrowRight className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                    <Link href="/recruiters/login">
                                        <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10">
                                            {locale === 'ar' ? 'شاهد الأسعار' : 'View Pricing'}
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: Users, value: '50,000+', label: locale === 'ar' ? 'سيرة ذاتية' : 'CVs' },
                                    { icon: Building2, value: '500+', label: locale === 'ar' ? 'شركة' : 'Companies' },
                                    { icon: Zap, value: '73%', label: locale === 'ar' ? 'معدل الاستجابة' : 'Response Rate' },
                                    { icon: Award, value: '2', label: locale === 'ar' ? 'أيام للتوظيف' : 'Days to Hire' },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                                        <stat.icon className="h-8 w-8 mx-auto mb-2 text-white/80" />
                                        <p className="text-3xl font-bold">{stat.value}</p>
                                        <p className="text-white/70 text-sm">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                                ? 'انضم لأكثر من 50,000 محترف يستخدمون Seera AI لتحقيق أهدافهم'
                                : 'Join 50,000+ professionals using Seera AI to achieve their goals'}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/register">
                                <Button size="lg" className="h-14 px-8 text-lg gap-2">
                                    {locale === 'ar' ? 'أنشئ سيرتك الذاتية' : 'Create Your Resume'}
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/recruiters/register">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg gap-2">
                                    <Building2 className="h-5 w-5" />
                                    {locale === 'ar' ? 'للشركات' : 'For Recruiters'}
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
