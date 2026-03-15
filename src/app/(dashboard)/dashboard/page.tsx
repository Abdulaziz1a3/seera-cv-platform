'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/components/providers/locale-provider';
import { useResumes } from '@/components/providers/resume-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    FileText,
    Plus,
    Target,
    Briefcase,
    Sparkles,
    Clock,
    ArrowRight,
    BarChart3,
    Zap,
    CheckCircle2,
    AlertCircle,
    Rocket,
    Eye,
    TrendingUp,
} from 'lucide-react';

function getGreeting(locale: string) {
    const hour = new Date().getHours();
    if (locale === 'ar') {
        if (hour < 12) return 'صباح الخير';
        if (hour < 17) return 'مساء الخير';
        return 'مساء النور';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const { locale, t } = useLocale();
    const { resumes, isLoading } = useResumes();
    const [creditsSummary, setCreditsSummary] = useState<{
        baseCredits: number;
        remainingCredits: number;
    } | null>(null);

    const firstName = session?.user?.name?.split(' ')[0] || 'User';
    const greeting = getGreeting(locale);

    const stats = {
        totalResumes: resumes.length,
        avgAtsScore: resumes.length > 0
            ? Math.round(resumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / resumes.length)
            : 0,
    };

    const recentResumes = resumes.slice(0, 3);
    const baseCredits = creditsSummary?.baseCredits ?? 50;
    const remainingCredits = creditsSummary?.remainingCredits ?? 0;
    const creditsPercent = baseCredits > 0 ? Math.round((remainingCredits / baseCredits) * 100) : 0;

    const quickActions = [
        {
            title: t.dashboard.quickActions.create.title,
            description: t.dashboard.quickActions.create.description,
            icon: Plus,
            href: '/dashboard/resumes/new',
            gradient: 'from-blue-500 to-cyan-500',
            bgLight: 'bg-blue-50 dark:bg-blue-950/30',
        },
        {
            title: t.dashboard.quickActions.target.title,
            description: t.dashboard.quickActions.target.description,
            icon: Target,
            href: '/dashboard/job-targets/new',
            gradient: 'from-purple-500 to-violet-500',
            bgLight: 'bg-purple-50 dark:bg-purple-950/30',
        },
        {
            title: t.dashboard.quickActions.atsSimulator.title,
            description: t.dashboard.quickActions.atsSimulator.description,
            icon: Eye,
            href: '/dashboard/ats-simulator',
            gradient: 'from-amber-500 to-orange-500',
            bgLight: 'bg-amber-50 dark:bg-amber-950/30',
        },
    ];

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return locale === 'ar' ? 'اليوم' : 'Today';
        if (diffDays === 1) return locale === 'ar' ? 'أمس' : 'Yesterday';
        if (diffDays < 7) return locale === 'ar' ? `منذ ${diffDays} أيام` : `${diffDays}d ago`;
        return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US');
    };

    useEffect(() => {
        if (!session?.user?.id) return;
        let mounted = true;
        fetch('/api/credits')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!mounted || !data) return;
                setCreditsSummary({
                    baseCredits: data.baseCredits ?? 50,
                    remainingCredits: data.remainingCredits ?? 0,
                });
            })
            .catch(() => null);
        return () => {
            mounted = false;
        };
    }, [session?.user?.id]);

    const StatSkeleton = () => (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const ResumeSkeleton = () => (
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-card">
            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-2 text-end">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    );

    return (
        <div className="space-y-6 max-w-7xl">

            {/* ─── WELCOME ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-sm text-muted-foreground mb-0.5">{greeting},</p>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {firstName} 👋
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">{t.dashboard.overview}</p>
                </div>
                <Button asChild size="lg" className="shadow-md bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shrink-0">
                    <Link href="/dashboard/resumes/new">
                        <Plus className="h-5 w-5 me-2" />
                        {t.dashboard.newResume}
                    </Link>
                </Button>
            </div>

            {/* ─── STATS ─── */}
            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatSkeleton />
                    <StatSkeleton />
                    <StatSkeleton />
                    <StatSkeleton />
                </div>
            ) : resumes.length === 0 ? (
                /* First-time user onboarding card */
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent overflow-hidden">
                    <CardContent className="py-8">
                        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-start">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                                <Rocket className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <Badge className="mb-2 bg-primary/10 text-primary border-0">
                                    {locale === 'ar' ? 'مرحباً بك!' : 'Welcome!'}
                                </Badge>
                                <h2 className="text-xl font-bold mb-2">
                                    {locale === 'ar' ? 'مرحباً بك في Seera AI!' : 'Welcome to Seera AI!'}
                                </h2>
                                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                                    {locale === 'ar'
                                        ? 'ابدأ بإنشاء سيرتك الذاتية الأولى واحصل على تقييم ATS فوري لمعرفة مدى جاهزيتها.'
                                        : 'Start by creating your first resume and get instant ATS scoring to see how job-ready it is.'}
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    <Button asChild className="shadow-md">
                                        <Link href="/dashboard/resumes/new">
                                            <Plus className="h-4 w-4 me-2" />
                                            {locale === 'ar' ? 'إنشاء سيرة ذاتية' : 'Create Resume'}
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline">
                                        <Link href="/dashboard/help">
                                            {locale === 'ar' ? 'استعرض الميزات' : 'Explore Features'}
                                            <ArrowRight className="h-4 w-4 ms-2" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Resumes */}
                    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary rounded-se-full rounded-ee-full" />
                        <CardContent className="pt-6 ps-5">
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold leading-none mb-1">{stats.totalResumes}</p>
                                    <p className="text-xs text-muted-foreground">{t.dashboard.stats.totalResumes}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Avg ATS Score */}
                    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute start-0 top-0 bottom-0 w-1 bg-amber-500 rounded-se-full rounded-ee-full" />
                        <CardContent className="pt-6 ps-5">
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <BarChart3 className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold leading-none mb-1">
                                        {stats.avgAtsScore}
                                        <span className="text-base font-medium text-muted-foreground">%</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">{t.dashboard.stats.avgAtsScore}</p>
                                </div>
                            </div>
                            {stats.avgAtsScore >= 80 && (
                                <div className="mt-2 flex items-center gap-1 text-green-500 text-xs">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>{locale === 'ar' ? 'ممتاز' : 'Excellent'}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Applications */}
                    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute start-0 top-0 bottom-0 w-1 bg-green-500 rounded-se-full rounded-ee-full" />
                        <CardContent className="pt-6 ps-5">
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                                    <Briefcase className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold leading-none mb-1">0</p>
                                    <p className="text-xs text-muted-foreground">{t.dashboard.stats.applications}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Credits */}
                    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute start-0 top-0 bottom-0 w-1 bg-purple-500 rounded-se-full rounded-ee-full" />
                        <CardContent className="pt-6 ps-5">
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                                    <Sparkles className="h-5 w-5 text-purple-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-2xl font-bold leading-none mb-1">{remainingCredits}<span className="text-sm font-normal text-muted-foreground">/{baseCredits}</span></p>
                                    <p className="text-xs text-muted-foreground">{t.dashboard.stats.aiCredits}</p>
                                </div>
                            </div>
                            {/* Credits bar */}
                            <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400 transition-all duration-500"
                                    style={{ width: `${creditsPercent}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ─── MAIN CONTENT ─── */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Resumes */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-base">{t.dashboard.recentResumes.title}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">{t.dashboard.recentResumes.subtitle}</CardDescription>
                        </div>
                        {resumes.length > 0 && (
                            <Button variant="ghost" size="sm" asChild className="text-xs h-8 -me-2">
                                <Link href="/dashboard/resumes">
                                    {t.dashboard.recentResumes.viewAll}
                                    <ArrowRight className="h-3.5 w-3.5 ms-1" />
                                </Link>
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3">
                                <ResumeSkeleton />
                                <ResumeSkeleton />
                            </div>
                        ) : recentResumes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-medium mb-1">{t.dashboard.recentResumes.empty.title}</h3>
                                <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                                    {t.dashboard.recentResumes.empty.description}
                                </p>
                                <Button asChild size="sm" className="shadow-sm">
                                    <Link href="/dashboard/resumes/new">
                                        <Plus className="h-4 w-4 me-2" />
                                        {t.dashboard.newResume}
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {recentResumes.map((resume) => (
                                    <Link
                                        key={resume.id}
                                        href={`/dashboard/resumes/${resume.id}/edit`}
                                        className="block group"
                                    >
                                        <div className="flex items-center gap-4 p-3.5 rounded-xl border bg-card hover:bg-muted/50 hover:border-primary/20 transition-all duration-150">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                                                <FileText className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium truncate text-sm group-hover:text-primary transition-colors">
                                                    {resume.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    {resume.targetRole || (locale === 'ar' ? 'بدون هدف وظيفي' : 'No target role')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="text-end">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        {(resume.atsScore || 0) >= 80 ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                        ) : (
                                                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                                        )}
                                                        <span className={`text-sm font-semibold ${(resume.atsScore || 0) >= 80 ? 'text-green-500' : 'text-amber-500'}`}>
                                                            {resume.atsScore || 0}%
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDate(resume.updatedAt)}
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">{t.dashboard.quickActions.title}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">{t.dashboard.quickActions.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                        {quickActions.map((action) => (
                            <Link key={action.href} href={action.href} className="block group">
                                <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-150 hover:shadow-sm ${action.bgLight} hover:border-transparent`}>
                                    <div
                                        className={`h-9 w-9 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0 shadow-sm`}
                                    >
                                        <action.icon className="h-4.5 w-4.5 text-white" style={{ width: '1.125rem', height: '1.125rem' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm leading-none mb-1 group-hover:text-primary transition-colors">
                                            {action.title}
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {action.description}
                                        </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* ─── PRO TIP (if has resumes) ─── */}
            {resumes.length > 0 && (
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-transparent">
                    <CardContent className="py-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm mb-0.5">{t.dashboard.tip.title}</h3>
                                <p className="text-xs text-muted-foreground">{t.dashboard.tip.description}</p>
                            </div>
                            <Button asChild size="sm" variant="outline" className="shrink-0">
                                <Link href="/dashboard/job-targets/new">
                                    {t.dashboard.tip.cta}
                                    <ArrowRight className="h-3.5 w-3.5 ms-2" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
