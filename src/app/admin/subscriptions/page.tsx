'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    CreditCard,
    Search,
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    MoreVertical,
    Eye,
    Mail,
    Ban,
    RefreshCw,
    Loader2,
    CheckCircle,
    Zap,
    Crown,
    Calendar,
    Sparkles,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface Subscription {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    };
    plan: string;
    status: string;
    amount: number;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
    updatedAt: string;
}

interface SubscriptionStats {
    monthlyRevenue: string;
    activeSubscribers: number;
    churnRate: string;
    arpu: string;
    proCount: number;
    enterpriseCount: number;
    newThisMonth: number;
}

interface SubscriptionsData {
    subscriptions: Subscription[];
    stats: SubscriptionStats;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

function AdminSubscriptionsContent() {
    const { locale } = useLocale();
    const [data, setData] = useState<SubscriptionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; subscription: Subscription | null }>({
        open: false,
        subscription: null,
    });
    const [activateDialog, setActivateDialog] = useState<{
        open: boolean;
        subscription: Subscription | null;
        plan: 'PRO' | 'ENTERPRISE';
        duration: string;
        note: string;
    }>({
        open: false,
        subscription: null,
        plan: 'PRO',
        duration: '1_month',
        note: '',
    });

    const fetchSubscriptions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search: searchQuery,
                status: statusFilter,
            });
            const res = await fetch(`/api/admin/subscriptions?${params}`);
            if (!res.ok) throw new Error('Failed to fetch subscriptions');
            const json = await res.json();
            setData(json);
        } catch (error) {
            toast.error('Failed to load subscriptions');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, statusFilter]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchSubscriptions();
        }, 300);
        return () => clearTimeout(debounce);
    }, [fetchSubscriptions]);

    const handleAction = async (subscriptionId: string, action: string, actionData?: any) => {
        setActionLoading(subscriptionId);
        try {
            const res = await fetch('/api/admin/subscriptions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId, action, data: actionData }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || 'Action failed');
            toast.success(`Subscription ${action} successful`);
            fetchSubscriptions();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Failed to ${action} subscription`);
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return format(new Date(dateString), 'MMM d, yyyy', {
            locale: locale === 'ar' ? ar : enUS,
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-500/10 text-green-600">{locale === 'ar' ? 'نشط' : 'Active'}</Badge>;
            case 'CANCELED':
                return <Badge variant="secondary">{locale === 'ar' ? 'ملغي' : 'Canceled'}</Badge>;
            case 'PAST_DUE':
                return <Badge className="bg-red-500/10 text-red-600">{locale === 'ar' ? 'متأخر' : 'Past Due'}</Badge>;
            case 'TRIALING':
                return <Badge className="bg-blue-500/10 text-blue-600">{locale === 'ar' ? 'تجريبي' : 'Trialing'}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const stats = data?.stats ? [
        {
            label: locale === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue',
            value: `${Number(data.stats.monthlyRevenue).toLocaleString()} SAR`,
            change: '+15.2%',
            trend: 'up',
            icon: DollarSign,
        },
        {
            label: locale === 'ar' ? 'المشتركين النشطين' : 'Active Subscribers',
            value: data.stats.activeSubscribers.toLocaleString(),
            change: `+${data.stats.newThisMonth}`,
            trend: 'up',
            icon: Users,
        },
        {
            label: locale === 'ar' ? 'معدل الإلغاء' : 'Churn Rate',
            value: `${data.stats.churnRate}%`,
            change: '-0.5%',
            trend: 'down',
            icon: TrendingDown,
        },
        {
            label: locale === 'ar' ? 'متوسط العائد' : 'ARPU',
            value: `${data.stats.arpu} SAR`,
            change: '+3.2%',
            trend: 'up',
            icon: TrendingUp,
        },
    ] : [];

    if (loading && !data) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {locale === 'ar' ? 'إدارة الاشتراكات' : 'Subscription Management'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === 'ar' ? 'إدارة وتتبع اشتراكات المستخدمين' : 'Manage and track user subscriptions'}
                    </p>
                </div>
                <Button variant="outline" onClick={fetchSubscriptions} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
                    {locale === 'ar' ? 'تحديث' : 'Refresh'}
                </Button>
            </div>

            {/* Stats */}
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
                                            <TrendingDown className="h-4 w-4 text-green-500" />
                                        )}
                                        <span className="text-sm text-green-500">{stat.change}</span>
                                    </div>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <stat.icon className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={locale === 'ar' ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
                                className="ps-10"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={(v) => {
                                setStatusFilter(v);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder={locale === 'ar' ? 'الحالة' : 'Status'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{locale === 'ar' ? 'الكل' : 'All'}</SelectItem>
                                <SelectItem value="active">{locale === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                                <SelectItem value="canceled">{locale === 'ar' ? 'ملغي' : 'Canceled'}</SelectItem>
                                <SelectItem value="past_due">{locale === 'ar' ? 'متأخر' : 'Past Due'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Subscriptions Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{locale === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'الخطة' : 'Plan'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'بداية الاشتراك' : 'Start Date'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'الفاتورة القادمة' : 'Next Billing'}</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.subscriptions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        {locale === 'ar' ? 'لا يوجد اشتراكات' : 'No subscriptions found'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.subscriptions.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {sub.user.image ? (
                                                    <img
                                                        src={sub.user.image}
                                                        alt={sub.user.name}
                                                        className="h-9 w-9 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                                        {sub.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium">{sub.user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{sub.user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={sub.plan === 'ENTERPRISE' ? 'secondary' : 'default'}>
                                                {sub.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                                        <TableCell>{sub.amount} SAR/mo</TableCell>
                                        <TableCell>{formatDate(sub.currentPeriodStart)}</TableCell>
                                        <TableCell>
                                            {sub.cancelAtPeriodEnd ? (
                                                <span className="text-red-500">
                                                    {locale === 'ar' ? 'ينتهي ' : 'Ends '}
                                                    {formatDate(sub.currentPeriodEnd)}
                                                </span>
                                            ) : (
                                                formatDate(sub.currentPeriodEnd)
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={actionLoading === sub.id}>
                                                        {actionLoading === sub.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <MoreVertical className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => setDetailsDialog({ open: true, subscription: sub })}
                                                    >
                                                        <Eye className="h-4 w-4 me-2" />
                                                        {locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                                                    </DropdownMenuItem>
                                                    {sub.status !== 'ACTIVE' && (
                                                        <DropdownMenuItem
                                                            className="text-green-600"
                                                            onClick={() => setActivateDialog({
                                                                open: true,
                                                                subscription: sub,
                                                                plan: sub.plan === 'ENTERPRISE' ? 'ENTERPRISE' : 'PRO',
                                                                duration: '1_month',
                                                                note: '',
                                                            })}
                                                        >
                                                            <Sparkles className="h-4 w-4 me-2" />
                                                            {locale === 'ar' ? 'تفعيل الوصول الكامل' : 'Activate Full Access'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => handleAction(sub.id, 'send_invoice')}
                                                    >
                                                        <Mail className="h-4 w-4 me-2" />
                                                        {locale === 'ar' ? 'إرسال فاتورة' : 'Send Invoice'}
                                                    </DropdownMenuItem>
                                                    {sub.status === 'CANCELED' ? (
                                                        <DropdownMenuItem
                                                            onClick={() => handleAction(sub.id, 'reactivate')}
                                                        >
                                                            <CheckCircle className="h-4 w-4 me-2" />
                                                            {locale === 'ar' ? 'إعادة التفعيل' : 'Reactivate'}
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleAction(sub.id, 'cancel')}
                                                        >
                                                            <Ban className="h-4 w-4 me-2" />
                                                            {locale === 'ar' ? 'إلغاء الاشتراك' : 'Cancel Subscription'}
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {locale === 'ar'
                            ? `صفحة ${data.pagination.page} من ${data.pagination.totalPages}`
                            : `Page ${data.pagination.page} of ${data.pagination.totalPages}`}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            {locale === 'ar' ? 'السابق' : 'Previous'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === data.pagination.totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            {locale === 'ar' ? 'التالي' : 'Next'}
                        </Button>
                    </div>
                </div>
            )}

            <Dialog
                open={detailsDialog.open}
                onOpenChange={(open) => setDetailsDialog({ open, subscription: null })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{locale === 'ar' ? 'تفاصيل الاشتراك' : 'Subscription Details'}</DialogTitle>
                        <DialogDescription>
                            {detailsDialog.subscription?.user.email}
                        </DialogDescription>
                    </DialogHeader>
                    {detailsDialog.subscription && (
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span>{locale === 'ar' ? 'الخطة' : 'Plan'}</span>
                                <span className="font-medium">{detailsDialog.subscription.plan}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>{locale === 'ar' ? 'الحالة' : 'Status'}</span>
                                <span className="font-medium">{detailsDialog.subscription.status}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>{locale === 'ar' ? 'المبلغ' : 'Amount'}</span>
                                <span className="font-medium">{detailsDialog.subscription.amount} SAR/mo</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>{locale === 'ar' ? 'بداية الفترة' : 'Period Start'}</span>
                                <span className="font-medium">{formatDate(detailsDialog.subscription.currentPeriodStart)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>{locale === 'ar' ? 'نهاية الفترة' : 'Period End'}</span>
                                <span className="font-medium">{formatDate(detailsDialog.subscription.currentPeriodEnd)}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailsDialog({ open: false, subscription: null })}>
                            {locale === 'ar' ? 'إغلاق' : 'Close'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Activate Subscription Dialog */}
            <Dialog
                open={activateDialog.open}
                onOpenChange={(open) => {
                    if (!open) {
                        setActivateDialog(prev => ({ ...prev, open: false }));
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <span>{locale === 'ar' ? 'تفعيل الاشتراك' : 'Activate Subscription'}</span>
                                <p className="text-sm font-normal text-muted-foreground mt-0.5">
                                    {activateDialog.subscription?.user.email}
                                </p>
                            </div>
                        </DialogTitle>
                        <DialogDescription>
                            {locale === 'ar'
                                ? 'سيتم تفعيل وصول المستخدم الكامل فوراً'
                                : 'This will instantly grant the user full access to all features'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Plan Selection */}
                        <div className="space-y-2">
                            <Label>{locale === 'ar' ? 'الخطة' : 'Plan'}</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setActivateDialog(prev => ({ ...prev, plan: 'PRO' }))}
                                    className={`relative p-4 rounded-xl border-2 transition-all ${activateDialog.plan === 'PRO'
                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-primary" />
                                        <span className="font-semibold">PRO</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">39 SAR/mo</p>
                                    {activateDialog.plan === 'PRO' && (
                                        <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-primary" />
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActivateDialog(prev => ({ ...prev, plan: 'ENTERPRISE' }))}
                                    className={`relative p-4 rounded-xl border-2 transition-all ${activateDialog.plan === 'ENTERPRISE'
                                            ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20'
                                            : 'border-border hover:border-amber-500/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Crown className="h-5 w-5 text-amber-500" />
                                        <span className="font-semibold">ENTERPRISE</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">249 SAR/mo</p>
                                    {activateDialog.plan === 'ENTERPRISE' && (
                                        <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-amber-500" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Duration Selection */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {locale === 'ar' ? 'المدة' : 'Duration'}
                            </Label>
                            <Select
                                value={activateDialog.duration}
                                onValueChange={(v) => setActivateDialog(prev => ({ ...prev, duration: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1_month">{locale === 'ar' ? 'شهر واحد' : '1 Month'}</SelectItem>
                                    <SelectItem value="3_months">{locale === 'ar' ? '3 أشهر' : '3 Months'}</SelectItem>
                                    <SelectItem value="6_months">{locale === 'ar' ? '6 أشهر' : '6 Months'}</SelectItem>
                                    <SelectItem value="1_year">{locale === 'ar' ? 'سنة واحدة' : '1 Year'}</SelectItem>
                                    <SelectItem value="lifetime">
                                        <span className="flex items-center gap-2">
                                            <span className="text-amber-500">★</span>
                                            {locale === 'ar' ? 'مدى الحياة' : 'Lifetime'}
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Admin Note */}
                        <div className="space-y-2">
                            <Label>{locale === 'ar' ? 'ملاحظة (اختياري)' : 'Note (optional)'}</Label>
                            <Textarea
                                placeholder={locale === 'ar' ? 'سبب التفعيل...' : 'Reason for activation...'}
                                value={activateDialog.note}
                                onChange={(e) => setActivateDialog(prev => ({ ...prev, note: e.target.value }))}
                                className="resize-none"
                                rows={2}
                            />
                        </div>

                        {/* Summary */}
                        <div className="p-3 rounded-lg bg-muted/50 border">
                            <p className="text-sm">
                                <span className="text-muted-foreground">
                                    {locale === 'ar' ? 'سيتم تفعيل' : 'Will activate'}:
                                </span>{' '}
                                <span className="font-semibold">{activateDialog.plan}</span>
                                {' '}
                                <span className="text-muted-foreground">
                                    {locale === 'ar' ? 'لمدة' : 'for'}
                                </span>{' '}
                                <span className="font-semibold">
                                    {activateDialog.duration === 'lifetime'
                                        ? (locale === 'ar' ? 'مدى الحياة' : 'Lifetime')
                                        : activateDialog.duration.replace('_', ' ')}
                                </span>
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setActivateDialog(prev => ({ ...prev, open: false }))}
                        >
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            onClick={async () => {
                                if (!activateDialog.subscription) return;
                                await handleAction(activateDialog.subscription.id, 'activate_full', {
                                    plan: activateDialog.plan,
                                    duration: activateDialog.duration,
                                    note: activateDialog.note,
                                });
                                setActivateDialog(prev => ({ ...prev, open: false }));
                            }}
                            disabled={actionLoading === activateDialog.subscription?.id}
                        >
                            {actionLoading === activateDialog.subscription?.id ? (
                                <>
                                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                    {locale === 'ar' ? 'جاري التفعيل...' : 'Activating...'}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 me-2" />
                                    {locale === 'ar' ? 'تفعيل الاشتراك' : 'Activate Subscription'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function AdminSubscriptionsPage() {
    return (
        <AdminSubscriptionsContent />
    );
}
