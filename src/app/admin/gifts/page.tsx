'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    Gift,
    RefreshCw,
    Copy,
    Mail,
    Search,
} from 'lucide-react';

interface GiftInvite {
    id: string;
    token: string;
    recipientEmail: string | null;
    plan: string;
    interval: string;
    status: string;
    createdAt: string;
    expiresAt: string | null;
    redeemedAt: string | null;
    createdBy?: string | null;
}

export default function AdminGiftsPage() {
    const { locale } = useLocale();
    const [loading, setLoading] = useState(true);
    const [gifts, setGifts] = useState<GiftInvite[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [form, setForm] = useState({
        recipientEmail: '',
        interval: 'monthly',
        message: '',
    });

    const fetchGifts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: searchQuery,
                status: statusFilter,
            });
            const res = await fetch(`/api/admin/gifts?${params}`);
            if (!res.ok) throw new Error('Failed to fetch gifts');
            const json = await res.json();
            setGifts(Array.isArray(json.gifts) ? json.gifts : []);
        } catch (error) {
            toast.error(locale === 'ar' ? 'فشل تحميل الدعوات' : 'Failed to load invitations');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter, locale]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchGifts();
        }, 250);
        return () => clearTimeout(debounce);
    }, [fetchGifts]);

    const handleCreate = async () => {
        if (!form.recipientEmail.trim()) {
            toast.error(locale === 'ar' ? 'البريد مطلوب' : 'Email is required');
            return;
        }

        setActionLoading('create');
        try {
            const res = await fetch('/api/admin/gifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(json.error || 'Failed to create gift');
            }
            if (json.emailSent === false) {
                toast.error(locale === 'ar'
                    ? 'تم إنشاء الدعوة لكن خدمة البريد غير مهيأة'
                    : 'Gift created but email service is not configured');
            } else {
                toast.success(locale === 'ar' ? 'تم إرسال الدعوة' : 'Invitation sent');
            }
            setForm({ recipientEmail: '', interval: 'monthly', message: '' });
            fetchGifts();
        } catch (error: any) {
            toast.error(error.message || (locale === 'ar' ? 'فشل إرسال الدعوة' : 'Failed to send invitation'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleCopy = async (token: string) => {
        const url = `${window.location.origin}/gift/${token}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success(locale === 'ar' ? 'تم النسخ' : 'Copied');
        } catch {
            toast.error(locale === 'ar' ? 'فشل النسخ' : 'Copy failed');
        }
    };

    const handleResend = async (giftId: string) => {
        setActionLoading(giftId);
        try {
            const res = await fetch('/api/admin/gifts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: giftId, action: 'resend' }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(json.error || 'Failed to resend');
            }
            toast.success(locale === 'ar' ? 'تمت إعادة الإرسال' : 'Resent successfully');
        } catch (error: any) {
            toast.error(error.message || (locale === 'ar' ? 'فشل إعادة الإرسال' : 'Failed to resend'));
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge className="bg-amber-500/10 text-amber-600">{locale === 'ar' ? 'بانتظار' : 'Pending'}</Badge>;
            case 'REDEEMED':
                return <Badge className="bg-green-500/10 text-green-600">{locale === 'ar' ? 'تم الاسترداد' : 'Redeemed'}</Badge>;
            case 'EXPIRED':
                return <Badge variant="secondary">{locale === 'ar' ? 'منتهي' : 'Expired'}</Badge>;
            case 'CANCELED':
                return <Badge variant="outline">{locale === 'ar' ? 'ملغي' : 'Canceled'}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {locale === 'ar' ? 'دعوات الهدايا' : 'Gift Invitations'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === 'ar'
                            ? 'إرسال اشتراك برو مجاني لمدة شهر أو سنة'
                            : 'Send free Pro gifts for 1 month or 1 year'}
                    </p>
                </div>
                <Button variant="outline" onClick={fetchGifts} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
                    {locale === 'ar' ? 'تحديث' : 'Refresh'}
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2 sm:col-span-2">
                            <Label>{locale === 'ar' ? 'البريد الإلكتروني' : 'Recipient Email'}</Label>
                            <Input
                                type="email"
                                value={form.recipientEmail}
                                onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                                placeholder="name@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{locale === 'ar' ? 'المدة' : 'Duration'}</Label>
                            <Select
                                value={form.interval}
                                onValueChange={(value) => setForm({ ...form, interval: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">{locale === 'ar' ? 'شهر واحد' : '1 Month'}</SelectItem>
                                    <SelectItem value="yearly">{locale === 'ar' ? 'سنة واحدة' : '1 Year'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>{locale === 'ar' ? 'رسالة اختيارية' : 'Optional Message'}</Label>
                        <Textarea
                            rows={3}
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            placeholder={locale === 'ar' ? 'اكتب رسالة قصيرة...' : 'Write a short note...'}
                        />
                    </div>
                    <Button onClick={handleCreate} disabled={actionLoading === 'create'}>
                        {actionLoading === 'create' ? (
                            <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                        ) : (
                            <Gift className="h-4 w-4 me-2" />
                        )}
                        {locale === 'ar' ? 'إرسال الدعوة' : 'Send Invitation'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={locale === 'ar' ? 'بحث بالبريد...' : 'Search by email...'}
                                className="ps-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder={locale === 'ar' ? 'الحالة' : 'Status'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{locale === 'ar' ? 'الكل' : 'All'}</SelectItem>
                                <SelectItem value="PENDING">{locale === 'ar' ? 'بانتظار' : 'Pending'}</SelectItem>
                                <SelectItem value="REDEEMED">{locale === 'ar' ? 'مسترد' : 'Redeemed'}</SelectItem>
                                <SelectItem value="EXPIRED">{locale === 'ar' ? 'منتهي' : 'Expired'}</SelectItem>
                                <SelectItem value="CANCELED">{locale === 'ar' ? 'ملغي' : 'Canceled'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((item) => (
                                <Skeleton key={item} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{locale === 'ar' ? 'المستلم' : 'Recipient'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'الخطة' : 'Plan'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'المدة' : 'Duration'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'تاريخ الانتهاء' : 'Expires'}</TableHead>
                                    <TableHead>{locale === 'ar' ? 'تاريخ الاسترداد' : 'Redeemed'}</TableHead>
                                    <TableHead className="w-32"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gifts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            {locale === 'ar' ? 'لا توجد دعوات' : 'No invitations found'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    gifts.map((gift) => (
                                        <TableRow key={gift.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{gift.recipientEmail || '-'}</p>
                                                    {gift.createdBy && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {locale === 'ar' ? 'من' : 'By'} {gift.createdBy}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{gift.plan}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {gift.interval === 'YEARLY'
                                                    ? locale === 'ar'
                                                        ? 'سنة'
                                                        : '1 year'
                                                    : locale === 'ar'
                                                        ? 'شهر'
                                                        : '1 month'}
                                            </TableCell>
                                            <TableCell>{statusBadge(gift.status)}</TableCell>
                                            <TableCell>{formatDate(gift.createdAt)}</TableCell>
                                            <TableCell>{formatDate(gift.expiresAt)}</TableCell>
                                            <TableCell>{formatDate(gift.redeemedAt)}</TableCell>
                                            <TableCell className="space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleCopy(gift.token)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    disabled={!gift.recipientEmail || gift.status !== 'PENDING' || actionLoading === gift.id}
                                                    onClick={() => handleResend(gift.id)}
                                                >
                                                    {actionLoading === gift.id ? (
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Mail className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
