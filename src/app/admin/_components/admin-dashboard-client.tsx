'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    FileText,
    CreditCard,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    DollarSign,
    Activity,
} from 'lucide-react';

export function AdminDashboardClient() {
    const { locale } = useLocale();

    const stats = [
        {
            title: locale === 'ar' ? 'إجمالي المستخدمين' : 'Total Users',
            value: '12,453',
            change: '+12.5%',
            trend: 'up',
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
        },
        {
            title: locale === 'ar' ? 'السير الذاتية المنشأة' : 'Resumes Created',
            value: '34,567',
            change: '+23.1%',
            trend: 'up',
            icon: FileText,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
        },
        {
            title: locale === 'ar' ? 'المشتركين النشطين' : 'Active Subscribers',
            value: '2,847',
            change: '+8.2%',
            trend: 'up',
            icon: CreditCard,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
        },
        {
            title: locale === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue',
            value: '$48,239',
            change: '-3.1%',
            trend: 'down',
            icon: DollarSign,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
        },
    ];

    const recentUsers = [
        { name: 'Ahmed Al-Mansouri', email: 'ahmed@example.com', plan: 'Pro', date: '2 min ago' },
        { name: 'Sarah Johnson', email: 'sarah@example.com', plan: 'Free', date: '15 min ago' },
        { name: 'Mohammed Ali', email: 'mohammed@example.com', plan: 'Pro', date: '1 hour ago' },
        { name: 'Emma Wilson', email: 'emma@example.com', plan: 'Enterprise', date: '2 hours ago' },
        { name: 'Khalid Ibrahim', email: 'khalid@example.com', plan: 'Free', date: '3 hours ago' },
    ];

    const recentActivity = [
        { action: 'New subscription', user: 'Ahmed Al-Mansouri', type: 'Pro', time: '2 min ago' },
        { action: 'Resume exported', user: 'Sarah Johnson', type: 'PDF', time: '5 min ago' },
        { action: 'Support ticket', user: 'Mohammed Ali', type: 'High', time: '10 min ago' },
        { action: 'New registration', user: 'Emma Wilson', type: 'Email', time: '15 min ago' },
        { action: 'Subscription canceled', user: 'James Brown', type: 'Pro', time: '30 min ago' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                    {locale === 'ar' ? 'لوحة تحكم المسؤول' : 'Admin Dashboard'}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {locale === 'ar' ? 'مرحباً بك في لوحة تحكم Seera AI' : 'Welcome to Seera AI admin panel'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        {stat.trend === 'up' ? (
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-500" />
                                        )}
                                        <span
                                            className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                                                }`}
                                        >
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>
                                <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Users */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">
                            {locale === 'ar' ? 'المستخدمون الجدد' : 'Recent Users'}
                        </CardTitle>
                        <Badge variant="secondary">
                            {locale === 'ar' ? '5 جدد اليوم' : '5 new today'}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentUsers.map((user, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <Badge
                                            variant={
                                                user.plan === 'Pro'
                                                    ? 'default'
                                                    : user.plan === 'Enterprise'
                                                        ? 'secondary'
                                                        : 'outline'
                                            }
                                            className="text-xs"
                                        >
                                            {user.plan}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground mt-1">{user.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                        <div className="space-y-4">
                            {recentActivity.map((activity, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <div className="flex-1">
                                        <p className="text-sm">
                                            <span className="font-medium">{activity.action}</span>
                                            <span className="text-muted-foreground"> by {activity.user}</span>
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                {activity.type}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: locale === 'ar' ? 'إضافة قالب' : 'Add Template', icon: FileText },
                    { label: locale === 'ar' ? 'إرسال إشعار' : 'Send Notification', icon: Activity },
                    { label: locale === 'ar' ? 'عرض التقارير' : 'View Reports', icon: TrendingUp },
                    { label: locale === 'ar' ? 'إدارة الميزات' : 'Manage Features', icon: ArrowUpRight },
                ].map((action) => (
                    <Card
                        key={action.label}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                        <CardContent className="pt-6 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <action.icon className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium">{action.label}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
