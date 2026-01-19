'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Briefcase,
    Plus,
    Search,
    MoreVertical,
    Building2,
    MapPin,
    Calendar,
    Clock,
    Edit,
    Trash2,
    ExternalLink,
    FileText,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from 'lucide-react';

type ApplicationStatus =
    | 'saved'
    | 'applied'
    | 'screening'
    | 'interview'
    | 'offer'
    | 'accepted'
    | 'rejected'
    | 'withdrawn';

type ApplicationRecord = {
    id: string;
    company: string;
    position: string;
    location?: string | null;
    salary?: string | null;
    status: ApplicationStatus;
    appliedDate?: string | null;
    resumeId?: string | null;
    resumeTitle?: string | null;
    notes?: string | null;
    url?: string | null;
};

export default function ApplicationsPage() {
    const { locale, t } = useLocale();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
    const [applications, setApplications] = useState<ApplicationRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const statusConfig: Record<ApplicationStatus, { label: { en: string; ar: string }; color: string; icon: typeof CheckCircle2 }> = {
        saved: {
            label: { en: 'Saved', ar: 'محفوظ' },
            color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
            icon: FileText,
        },
        applied: {
            label: { en: 'Applied', ar: 'تم التقديم' },
            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            icon: Clock,
        },
        screening: {
            label: { en: 'Screening', ar: 'المراجعة' },
            color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
            icon: AlertCircle,
        },
        interview: {
            label: { en: 'Interview', ar: 'المقابلة' },
            color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            icon: Calendar,
        },
        offer: {
            label: { en: 'Offer', ar: 'العرض' },
            color: 'bg-green-500/10 text-green-600 dark:text-green-400',
            icon: CheckCircle2,
        },
        accepted: {
            label: { en: 'Accepted', ar: 'تم القبول' },
            color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            icon: CheckCircle2,
        },
        rejected: {
            label: { en: 'Rejected', ar: 'مرفوض' },
            color: 'bg-red-500/10 text-red-600 dark:text-red-400',
            icon: XCircle,
        },
        withdrawn: {
            label: { en: 'Withdrawn', ar: 'منسحب' },
            color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
            icon: XCircle,
        },
    };

    useEffect(() => {
        let active = true;

        const loadApplications = async () => {
            setIsLoading(true);
            setLoadError('');
            try {
                const res = await fetch('/api/applications');
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data?.error || 'Failed to load applications');
                }
                const data = await res.json();
                if (!active) return;
                setApplications(data.applications || []);
            } catch (error) {
                if (!active) return;
                const message = error instanceof Error ? error.message : 'Failed to load applications';
                setLoadError(message);
            } finally {
                if (active) setIsLoading(false);
            }
        };

        loadApplications();
        return () => {
            active = false;
        };
    }, []);

    const filteredApplications = applications.filter((app) => {
        const matchesSearch =
            app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.position.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDate = (value?: string | null) => {
        if (!value) return locale === 'ar' ? 'غير محدد' : 'Not set';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // Stats
    const stats = {
        total: applications.length,
        active: applications.filter((a) => !['rejected', 'withdrawn', 'accepted'].includes(a.status)).length,
        interviews: applications.filter((a) => a.status === 'interview').length,
        offers: applications.filter((a) => a.status === 'offer' || a.status === 'accepted').length,
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{t.nav.applications}</h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === 'ar' ? 'تتبع طلباتك الوظيفية' : 'Track your job applications'}
                    </p>
                </div>
                <Button size="lg" className="shadow-lg" asChild>
                    <Link href="/dashboard/job-targets/new">
                        <Plus className="h-5 w-5 me-2" />
                        {locale === 'ar' ? 'إنشاء هدف وظيفي' : 'Create Job Target'}
                    </Link>
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: locale === 'ar' ? 'إجمالي الطلبات' : 'Total Applications',
                        value: stats.total,
                        icon: Briefcase,
                        color: 'text-primary',
                    },
                    {
                        label: locale === 'ar' ? 'الطلبات النشطة' : 'Active',
                        value: stats.active,
                        icon: Clock,
                        color: 'text-blue-500',
                    },
                    {
                        label: locale === 'ar' ? 'المقابلات' : 'Interviews',
                        value: stats.interviews,
                        icon: Calendar,
                        color: 'text-amber-500',
                    },
                    {
                        label: locale === 'ar' ? 'العروض' : 'Offers',
                        value: stats.offers,
                        icon: CheckCircle2,
                        color: 'text-green-500',
                    },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={locale === 'ar' ? 'البحث في الطلبات...' : 'Search applications...'}
                        className="ps-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('all')}
                    >
                        {locale === 'ar' ? 'الكل' : 'All'}
                    </Button>
                    {Object.entries(statusConfig).slice(0, 4).map(([status, config]) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter(status as ApplicationStatus)}
                        >
                            {config.label[locale]}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Applications List */}
            {isLoading ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                            {locale === 'ar' ? 'جار تحميل الطلبات' : 'Loading applications'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {locale === 'ar' ? 'يرجى الانتظار قليلاً' : 'Please wait a moment'}
                        </p>
                    </CardContent>
                </Card>
            ) : loadError ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                            {locale === 'ar' ? 'تعذر تحميل الطلبات' : 'Failed to load applications'}
                        </h3>
                        <p className="text-sm text-muted-foreground">{loadError}</p>
                    </CardContent>
                </Card>
            ) : filteredApplications.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                            {locale === 'ar' ? 'لا توجد طلبات' : 'No applications found'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            {searchQuery || statusFilter !== 'all'
                                ? locale === 'ar'
                                    ? 'جرب تغيير معايير البحث'
                                    : 'Try changing your search criteria'
                                : locale === 'ar'
                                    ? 'ابدأ بإنشاء هدف وظيفي وربطه بطلباتك'
                                    : 'Start by creating a job target to track applications'}
                        </p>
                        {!searchQuery && statusFilter === 'all' && (
                            <Button asChild>
                                <Link href="/dashboard/job-targets/new">
                                    <Plus className="h-4 w-4 me-2" />
                                    {locale === 'ar' ? 'إنشاء هدف وظيفي' : 'Create Job Target'}
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredApplications.map((app) => {
                        const statusInfo = statusConfig[app.status];
                        const StatusIcon = statusInfo.icon;

                        return (
                            <Card key={app.id} className="group hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Building2 className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold truncate">{app.position}</h3>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span>{app.company}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {app.location || (locale === 'ar' ? 'غير محدد' : 'Not specified')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-end hidden sm:block">
                                                <Badge className={statusInfo.color}>
                                                    <StatusIcon className="h-3 w-3 me-1" />
                                                    {statusInfo.label[locale]}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDate(app.appliedDate)}
                                                </p>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Edit className="h-4 w-4 me-2" />
                                                        {t.common.edit}
                                                    </DropdownMenuItem>
                                                    {app.resumeId ? (
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/resumes/${app.resumeId}/edit`}>
                                                                <FileText className="h-4 w-4 me-2" />
                                                                {app.resumeTitle || (locale === 'ar' ? 'عرض السيرة' : 'View Resume')}
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem disabled>
                                                            <FileText className="h-4 w-4 me-2" />
                                                            {locale === 'ar' ? 'عرض السيرة' : 'View Resume'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {app.url ? (
                                                        <DropdownMenuItem asChild>
                                                            <a href={app.url} target="_blank" rel="noreferrer">
                                                                <ExternalLink className="h-4 w-4 me-2" />
                                                                {locale === 'ar' ? 'فتح إعلان الوظيفة' : 'Open Job Posting'}
                                                            </a>
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem disabled>
                                                            <ExternalLink className="h-4 w-4 me-2" />
                                                            {locale === 'ar' ? 'فتح إعلان الوظيفة' : 'Open Job Posting'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash2 className="h-4 w-4 me-2" />
                                                        {t.common.delete}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {app.notes && (
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="text-sm text-muted-foreground">
                                                💬 {app.notes}
                                            </p>
                                        </div>
                                    )}

                                    <div className="sm:hidden mt-3">
                                        <Badge className={statusInfo.color}>
                                            <StatusIcon className="h-3 w-3 me-1" />
                                            {statusInfo.label[locale]}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
