'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    TrendingUp,
    TrendingDown,
    Users,
    FileText,
    Eye,
    Download,
    DollarSign,
    Calendar,
    BarChart3,
    CreditCard,
    UserPlus,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AnalyticsData {
    overview: {
        totalUsers: number;
        newUsersThisPeriod: number;
        userGrowth: number;
        totalResumes: number;
        resumesThisPeriod: number;
        resumeGrowth: number;
        totalSubscriptions: number;
        activeSubscriptions: number;
        subscriptionGrowth: number;
        totalRevenue: number;
        revenueThisPeriod: number;
        revenueGrowth: number;
    };
    charts: {
        dailySignups: Array<{ date: string; count: number }>;
        dailyResumes: Array<{ date: string; count: number }>;
    };
    planDistribution: Array<{ plan: string; count: number; percentage: number }>;
    conversionFunnel: {
        registeredUsers: number;
        usersWithResumes: number;
        exports: number;
        activeSubscriptions: number;
        enterpriseSubscriptions: number;
    };
}

export default function AdminAnalyticsPage() {
    const { locale } = useLocale();
    const [period, setPeriod] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<AnalyticsData | null>(null);

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/admin/analytics?period=${period}`);
            if (!response.ok) {
                throw new Error('Failed to fetch analytics');
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            toast.error(locale === 'ar' ? 'فشل في تحميل التحليلات' : 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    }, [period, locale]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(num);
    };

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: 'SAR',
            maximumFractionDigits: 0,
        }).format(num);
    };

    const formatPercentage = (num: number) => {
        const sign = num > 0 ? '+' : '';
        return `${sign}${num.toFixed(1)}%`;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-[150px]" />
                </div>

                {/* Stats Skeleton */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-8 w-20" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                    <Skeleton className="h-12 w-12 rounded-xl" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts Skeleton */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-lg font-semibold mb-2">
                    {locale === 'ar' ? 'خطأ في تحميل البيانات' : 'Error Loading Data'}
                </h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchAnalytics}>
                    <RefreshCw className="h-4 w-4 me-2" />
                    {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </Button>
            </div>
        );
    }

    const stats = data ? [
        {
            label: locale === 'ar' ? 'إجمالي المستخدمين' : 'Total Users',
            value: formatNumber(data.overview.totalUsers),
            change: formatPercentage(data.overview.userGrowth),
            trend: data.overview.userGrowth >= 0 ? 'up' : 'down',
            subtext: locale === 'ar'
                ? `${formatNumber(data.overview.newUsersThisPeriod)} جديد`
                : `${formatNumber(data.overview.newUsersThisPeriod)} new`,
            icon: Users,
        },
        {
            label: locale === 'ar' ? 'السير الذاتية' : 'Resumes',
            value: formatNumber(data.overview.totalResumes),
            change: formatPercentage(data.overview.resumeGrowth),
            trend: data.overview.resumeGrowth >= 0 ? 'up' : 'down',
            subtext: locale === 'ar'
                ? `${formatNumber(data.overview.resumesThisPeriod)} هذه الفترة`
                : `${formatNumber(data.overview.resumesThisPeriod)} this period`,
            icon: FileText,
        },
        {
            label: locale === 'ar' ? 'الاشتراكات النشطة' : 'Active Subscriptions',
            value: formatNumber(data.overview.activeSubscriptions),
            change: formatPercentage(data.overview.subscriptionGrowth),
            trend: data.overview.subscriptionGrowth >= 0 ? 'up' : 'down',
            subtext: locale === 'ar'
                ? `${formatNumber(data.overview.totalSubscriptions)} إجمالي`
                : `${formatNumber(data.overview.totalSubscriptions)} total`,
            icon: CreditCard,
        },
        {
            label: locale === 'ar' ? 'الإيرادات' : 'Revenue',
            value: formatCurrency(data.overview.totalRevenue),
            change: formatPercentage(data.overview.revenueGrowth),
            trend: data.overview.revenueGrowth >= 0 ? 'up' : 'down',
            subtext: locale === 'ar'
                ? `${formatCurrency(data.overview.revenueThisPeriod)} هذه الفترة`
                : `${formatCurrency(data.overview.revenueThisPeriod)} this period`,
            icon: DollarSign,
        },
    ] : [];

    const conversionFunnel = data ? [
        {
            stage: locale === 'ar' ? '??????? ???????' : 'Registered Users',
            count: data.conversionFunnel.registeredUsers,
            rate: 100
        },
        {
            stage: locale === 'ar' ? '????? ???????' : 'Users with Resumes',
            count: data.conversionFunnel.usersWithResumes,
            rate: data.conversionFunnel.registeredUsers > 0
                ? (data.conversionFunnel.usersWithResumes / data.conversionFunnel.registeredUsers) * 100
                : 0
        },
        {
            stage: locale === 'ar' ? '?????? ???????' : 'Resume Exports',
            count: data.conversionFunnel.exports,
            rate: data.conversionFunnel.usersWithResumes > 0
                ? (data.conversionFunnel.exports / data.conversionFunnel.usersWithResumes) * 100
                : 0
        },
        {
            stage: locale === 'ar' ? '?????????? ??????' : 'Active Subscriptions',
            count: data.conversionFunnel.activeSubscriptions,
            rate: data.conversionFunnel.registeredUsers > 0
                ? (data.conversionFunnel.activeSubscriptions / data.conversionFunnel.registeredUsers) * 100
                : 0
        },
        {
            stage: locale === 'ar' ? '?????????? ????????' : 'Enterprise Subscribers',
            count: data.conversionFunnel.enterpriseSubscriptions,
            rate: data.conversionFunnel.activeSubscriptions > 0
                ? (data.conversionFunnel.enterpriseSubscriptions / data.conversionFunnel.activeSubscriptions) * 100
                : 0
        },
    ] : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {locale === 'ar' ? 'التحليلات' : 'Analytics'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === 'ar' ? 'تتبع أداء المنصة' : 'Track platform performance'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchAnalytics}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[150px]">
                            <Calendar className="h-4 w-4 me-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">{locale === 'ar' ? '7 أيام' : 'Last 7 days'}</SelectItem>
                            <SelectItem value="30d">{locale === 'ar' ? '30 يوم' : 'Last 30 days'}</SelectItem>
                            <SelectItem value="90d">{locale === 'ar' ? '90 يوم' : 'Last 90 days'}</SelectItem>
                            <SelectItem value="1y">{locale === 'ar' ? 'سنة' : 'Last year'}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        {stat.trend === 'up' ? (
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                            {stat.change}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <stat.icon className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Chart Placeholder - Daily Signups */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            {locale === 'ar' ? 'الإحصائيات اليومية' : 'Daily Statistics'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data && data.charts.dailySignups.length > 0 ? (
                            <div className="space-y-4">
                                {/* Simple bar chart representation */}
                                <div className="flex items-end gap-1 h-48">
                                    {data.charts.dailySignups.slice(-14).map((day, i) => {
                                        const maxCount = Math.max(...data.charts.dailySignups.map(d => d.count), 1);
                                        const height = (day.count / maxCount) * 100;
                                        return (
                                            <div
                                                key={i}
                                                className="flex-1 flex flex-col items-center gap-1"
                                            >
                                                <div
                                                    className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                    title={`${day.date}: ${day.count}`}
                                                />
                                                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                                                    {new Date(day.date).getDate()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center justify-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 bg-primary rounded" />
                                        <span className="text-muted-foreground">
                                            {locale === 'ar' ? 'تسجيلات جديدة' : 'New Signups'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                                <div className="text-center text-muted-foreground">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>{locale === 'ar' ? 'لا توجد بيانات متاحة' : 'No data available'}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Plan Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>{locale === 'ar' ? 'توزيع الخطط' : 'Plan Distribution'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data && data.planDistribution.length > 0 ? (
                            <div className="space-y-4">
                                {data.planDistribution.map((plan) => (
                                    <div key={plan.plan}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium capitalize">{plan.plan}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {formatNumber(plan.count)} ({plan.percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${plan.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">
                                {locale === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Conversion Funnel */}
                <Card>
                    <CardHeader>
                        <CardTitle>{locale === 'ar' ? 'قمع التحويل' : 'Conversion Funnel'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {conversionFunnel.map((stage, i) => (
                                <div key={stage.stage}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">{stage.stage}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {formatNumber(stage.count)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: `${Math.min(stage.rate, 100)}%` }}
                                        />
                                    </div>
                                    {i < conversionFunnel.length - 1 && (
                                        <p className="text-xs text-muted-foreground mt-1 text-end">
                                            {stage.rate.toFixed(1)}% {locale === 'ar' ? 'تحويل' : 'conversion'}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        {locale === 'ar' ? 'نظرة على الإيرادات' : 'Revenue Overview'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {data && (
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    {locale === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                                </p>
                                <p className="text-2xl font-bold mt-1">{formatCurrency(data.overview.totalRevenue)}</p>
                                <p className={`text-sm mt-1 ${data.overview.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatPercentage(data.overview.revenueGrowth)}
                                </p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    {locale === 'ar' ? 'إيرادات الفترة' : 'Period Revenue'}
                                </p>
                                <p className="text-2xl font-bold mt-1">{formatCurrency(data.overview.revenueThisPeriod)}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {period === '7d' && (locale === 'ar' ? 'آخر 7 أيام' : 'Last 7 days')}
                                    {period === '30d' && (locale === 'ar' ? 'آخر 30 يوم' : 'Last 30 days')}
                                    {period === '90d' && (locale === 'ar' ? 'آخر 90 يوم' : 'Last 90 days')}
                                    {period === '1y' && (locale === 'ar' ? 'آخر سنة' : 'Last year')}
                                </p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    {locale === 'ar' ? 'الاشتراكات النشطة' : 'Active Subscriptions'}
                                </p>
                                <p className="text-2xl font-bold mt-1">{formatNumber(data.overview.activeSubscriptions)}</p>
                                <p className={`text-sm mt-1 ${data.overview.subscriptionGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatPercentage(data.overview.subscriptionGrowth)}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
