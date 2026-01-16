'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Users,
    FileText,
    CreditCard,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    DollarSign,
    Activity,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import Link from 'next/link';

interface DashboardStats {
    stats: {
        totalUsers: { value: number; change: string; trend: string };
        totalResumes: { value: number; change: string; trend: string };
        activeSubscribers: { value: number; change: string; trend: string };
        monthlyRevenue: { value: string; change: string; trend: string };
    };
    recentUsers: Array<{
        id: string;
        name: string;
        email: string;
        plan: string;
        createdAt: string;
    }>;
    recentActivity: Array<{
        id: string;
        action: string;
        entity: string;
        user: string;
        details: any;
        createdAt: string;
    }>;
    todayStats: {
        newUsers: number;
    };
}

export function AdminDashboardClient() {
    const { locale } = useLocale();
    const [data, setData] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            const json = await res.json();
            setData(json);
            setError(null);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatDate = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), {
            addSuffix: true,
            locale: locale === 'ar' ? ar : enUS
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: 'SAR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const statCards = [
        {
            key: 'totalUsers',
            title: locale === 'ar' ? 'إجمالي المستخدمين' : 'Total Users',
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
        },
        {
            key: 'totalResumes',
            title: locale === 'ar' ? 'السير الذاتية المنشأة' : 'Resumes Created',
            icon: FileText,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
        },
        {
            key: 'activeSubscribers',
            title: locale === 'ar' ? 'المشتركين النشطين' : 'Active Subscribers',
            icon: CreditCard,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
        },
        {
            key: 'monthlyRevenue',
            title: locale === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue',
            icon: DollarSign,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
        },
    ];

    if (loading) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">{error || 'No data available'}</p>
                <Button onClick={fetchData}>
                    <RefreshCw className="h-4 w-4 me-2" />
                    {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {locale === 'ar' ? 'لوحة تحكم المسؤول' : 'Admin Dashboard'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === 'ar' ? 'مرحباً بك في لوحة تحكم Seera AI' : 'Welcome to Seera AI admin panel'}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4 me-2" />
                    {locale === 'ar' ? 'تحديث' : 'Refresh'}
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => {
                    const statData = data.stats[stat.key as keyof typeof data.stats];
                    const value = stat.key === 'monthlyRevenue'
                        ? formatCurrency(Number(statData.value))
                        : Number(statData.value).toLocaleString();

                    return (
                        <Card key={stat.key}>
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                        <p className="text-2xl font-bold mt-1">{value}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            {statData.trend === 'up' ? (
                                                <TrendingUp className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4 text-red-500" />
                                            )}
                                            <span
                                                className={`text-sm ${statData.trend === 'up' ? 'text-green-500' : 'text-red-500'
                                                    }`}
                                            >
                                                {statData.change}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Users */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">
                            {locale === 'ar' ? 'المستخدمون الجدد' : 'Recent Users'}
                        </CardTitle>
                        <Badge variant="secondary">
                            {data.todayStats.newUsers} {locale === 'ar' ? 'جدد اليوم' : 'new today'}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        {data.recentUsers.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                {locale === 'ar' ? 'لا يوجد مستخدمين جدد' : 'No recent users'}
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {data.recentUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <Badge
                                                variant={
                                                    user.plan === 'PRO'
                                                        ? 'default'
                                                        : user.plan === 'ENTERPRISE'
                                                            ? 'secondary'
                                                            : 'outline'
                                                }
                                                className="text-xs"
                                            >
                                                {user.plan}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDate(user.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link href="/admin/users">
                            <Button variant="ghost" className="w-full mt-4">
                                {locale === 'ar' ? 'عرض جميع المستخدمين' : 'View All Users'}
                                <ArrowUpRight className="h-4 w-4 ms-2" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">
                            {locale === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
                        </CardTitle>
                        <Activity className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {data.recentActivity.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                {locale === 'ar' ? 'لا يوجد نشاط حديث' : 'No recent activity'}
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {data.recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-4">
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                <span className="font-medium">{activity.action}</span>
                                                <span className="text-muted-foreground"> by {activity.user}</span>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {activity.entity}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(activity.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: locale === 'ar' ? 'إدارة المستخدمين' : 'Manage Users', icon: Users, href: '/admin/users' },
                    { label: locale === 'ar' ? 'الاشتراكات' : 'Subscriptions', icon: CreditCard, href: '/admin/subscriptions' },
                    { label: locale === 'ar' ? 'التحليلات' : 'Analytics', icon: TrendingUp, href: '/admin/analytics' },
                    { label: locale === 'ar' ? 'القوالب' : 'Templates', icon: FileText, href: '/admin/templates' },
                ].map((action) => (
                    <Link key={action.label} href={action.href}>
                        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <CardContent className="pt-6 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <action.icon className="h-5 w-5 text-primary" />
                                </div>
                                <span className="font-medium">{action.label}</span>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
