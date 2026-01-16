'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/components/providers/locale-provider';
import { useResumes } from '@/components/providers/resume-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';

export default function DashboardPage() {
    const { data: session } = useSession();
    const { locale, t } = useLocale();
    const { resumes, isLoading } = useResumes();

    const firstName = session?.user?.name?.split(' ')[0] || 'User';

    // Calculate real stats from resumes
    const stats = {
        totalResumes: resumes.length,
        avgAtsScore: resumes.length > 0
            ? Math.round(resumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / resumes.length)
            : 0,
    };

    const recentResumes = resumes.slice(0, 3);

    const quickActions = [
        {
            title: t.dashboard.quickActions.create.title,
            description: t.dashboard.quickActions.create.description,
            icon: Plus,
            href: '/dashboard/resumes/new',
            color: 'bg-blue-500',
        },
        {
            title: t.dashboard.quickActions.target.title,
            description: t.dashboard.quickActions.target.description,
            icon: Target,
            href: '/dashboard/job-targets/new',
            color: 'bg-purple-500',
        },
        {
            title: t.dashboard.quickActions.track.title,
            description: t.dashboard.quickActions.track.description,
            icon: Briefcase,
            href: '/dashboard/applications',
            color: 'bg-green-500',
        },
    ];

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return locale === 'ar' ? 'اليوم' : 'Today';
        if (diffDays === 1) return locale === 'ar' ? 'أمس' : 'Yesterday';
        if (diffDays < 7) return locale === 'ar' ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
        return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US');
    };

    // Skeleton loader for stats
    const StatSkeleton = () => (
        <Card className="relative overflow-hidden">
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

    // Skeleton loader for resume items
    const ResumeSkeleton = () => (
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-card">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {t.dashboard.welcome}, {firstName}! 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">{t.dashboard.overview}</p>
                </div>
                <Button asChild size="lg" className="shadow-lg">
                    <Link href="/dashboard/resumes/new">
                        <Plus className="h-5 w-5 me-2" />
                        {t.dashboard.newResume}
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatSkeleton />
                    <StatSkeleton />
                    <StatSkeleton />
                    <StatSkeleton />
                </div>
            ) : resumes.length === 0 ? (
                // First-time user - show getting started instead of empty stats
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5">
                    <CardContent className="py-8">
                        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-start">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                                <Rocket className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold mb-2">
                                    {locale === 'ar' ? 'مرحباً بك في Seera AI!' : 'Welcome to Seera AI!'}
                                </h2>
                                <p className="text-muted-foreground mb-4">
                                    {locale === 'ar'
                                        ? 'ابدأ بإنشاء سيرتك الذاتية الأولى واحصل على تقييم ATS فوري'
                                        : 'Start by creating your first resume and get instant ATS scoring'}
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    <Button asChild>
                                        <Link href="/dashboard/resumes/new">
                                            <Plus className="h-4 w-4 me-2" />
                                            {locale === 'ar' ? 'إنشاء سيرة ذاتية' : 'Create Resume'}
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href="/help">
                                            {locale === 'ar' ? 'شاهد الدليل' : 'Watch Guide'}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 end-0 h-24 w-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalResumes}</p>
                                    <p className="text-sm text-muted-foreground">{t.dashboard.stats.totalResumes}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 end-0 h-24 w-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <BarChart3 className="h-6 w-6 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.avgAtsScore}%</p>
                                    <p className="text-sm text-muted-foreground">{t.dashboard.stats.avgAtsScore}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 end-0 h-24 w-24 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full" />
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <Briefcase className="h-6 w-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">0</p>
                                    <p className="text-sm text-muted-foreground">{t.dashboard.stats.applications}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 end-0 h-24 w-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Sparkles className="h-6 w-6 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">0/3</p>
                                    <p className="text-sm text-muted-foreground">{t.dashboard.stats.aiCredits}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Resumes */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t.dashboard.recentResumes.title}</CardTitle>
                            <CardDescription>{t.dashboard.recentResumes.subtitle}</CardDescription>
                        </div>
                        {resumes.length > 0 && (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/dashboard/resumes">
                                    {t.dashboard.recentResumes.viewAll}
                                    <ArrowRight className="h-4 w-4 ms-1" />
                                </Link>
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                <ResumeSkeleton />
                                <ResumeSkeleton />
                            </div>
                        ) : recentResumes.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="font-medium mb-1">{t.dashboard.recentResumes.empty.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {t.dashboard.recentResumes.empty.description}
                                </p>
                                <Button asChild>
                                    <Link href="/dashboard/resumes/new">
                                        <Plus className="h-4 w-4 me-2" />
                                        {t.dashboard.newResume}
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentResumes.map((resume) => (
                                    <Link
                                        key={resume.id}
                                        href={`/dashboard/resumes/${resume.id}/edit`}
                                        className="block group"
                                    >
                                        <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                                                <FileText className="h-6 w-6 text-primary-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                                                    {resume.title}
                                                </h4>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {resume.targetRole || (locale === 'ar' ? 'بدون هدف وظيفي' : 'No target role')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-end">
                                                    <div className="flex items-center gap-1">
                                                        {(resume.atsScore || 0) >= 80 ? (
                                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                                        )}
                                                        <span
                                                            className={`font-semibold ${(resume.atsScore || 0) >= 80 ? 'text-green-500' : 'text-amber-500'
                                                                }`}
                                                        >
                                                            {resume.atsScore || 0}%
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDate(resume.updatedAt)}
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
                    <CardHeader>
                        <CardTitle>{t.dashboard.quickActions.title}</CardTitle>
                        <CardDescription>{t.dashboard.quickActions.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {quickActions.map((action) => (
                            <Link key={action.href} href={action.href} className="block group">
                                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                    <div
                                        className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0`}
                                    >
                                        <action.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                                            {action.title}
                                        </h4>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Pro Tip - Only show if user has resumes */}
            {resumes.length > 0 && (
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardContent className="py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Zap className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold mb-1">{t.dashboard.tip.title}</h3>
                                <p className="text-sm text-muted-foreground">{t.dashboard.tip.description}</p>
                            </div>
                            <Button asChild>
                                <Link href="/dashboard/job-targets/new">
                                    {t.dashboard.tip.cta}
                                    <ArrowRight className="h-4 w-4 ms-2" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
