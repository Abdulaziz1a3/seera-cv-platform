'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    MessageSquare,
    Search,
    Clock,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    Reply,
    Archive,
    RefreshCw,
    Loader2,
    Send,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { AdminServerGuard } from '../_components/admin-server-guard';

interface Ticket {
    id: string;
    subject: string;
    message: string;
    email: string;
    status: string;
    priority: string;
    category: string | null;
    user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    } | null;
    assignedTo: string | null;
    lastResponse: {
        message: string;
        createdAt: string;
    } | null;
    createdAt: string;
    updatedAt: string;
    resolvedAt: string | null;
}

interface TicketsData {
    tickets: Ticket[];
    stats: {
        open: number;
        inProgress: number;
        closedToday: number;
        urgent: number;
        avgResponseTime: string;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

function AdminSupportContent() {
    const { locale } = useLocale();
    const [data, setData] = useState<TicketsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [page, setPage] = useState(1);
    const [replyDialog, setReplyDialog] = useState<{ open: boolean; ticket: Ticket | null }>({
        open: false,
        ticket: null,
    });
    const [replyMessage, setReplyMessage] = useState('');

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search: searchQuery,
                status: activeTab === 'all' ? 'all' : activeTab.toUpperCase(),
            });
            const res = await fetch(`/api/admin/support?${params}`);
            if (!res.ok) throw new Error('Failed to fetch tickets');
            const json = await res.json();
            setData(json);
        } catch (error) {
            toast.error('Failed to load tickets');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, activeTab]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchTickets();
        }, 300);
        return () => clearTimeout(debounce);
    }, [fetchTickets]);

    const handleAction = async (ticketId: string, action: string, actionData?: any) => {
        setActionLoading(ticketId);
        try {
            const res = await fetch('/api/admin/support', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId, action, data: actionData }),
            });
            if (!res.ok) throw new Error('Action failed');
            toast.success(`Ticket ${action} successful`);
            fetchTickets();
            setReplyDialog({ open: false, ticket: null });
            setReplyMessage('');
        } catch (error) {
            toast.error(`Failed to ${action} ticket`);
        } finally {
            setActionLoading(null);
        }
    };

    const formatTime = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), {
            addSuffix: true,
            locale: locale === 'ar' ? ar : enUS,
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'OPEN':
                return <Badge className="bg-blue-500/10 text-blue-600">{locale === 'ar' ? 'مفتوح' : 'Open'}</Badge>;
            case 'IN_PROGRESS':
                return <Badge className="bg-amber-500/10 text-amber-600">{locale === 'ar' ? 'قيد المعالجة' : 'In Progress'}</Badge>;
            case 'WAITING_ON_CUSTOMER':
                return <Badge className="bg-purple-500/10 text-purple-600">{locale === 'ar' ? 'بانتظار الرد' : 'Waiting'}</Badge>;
            case 'RESOLVED':
                return <Badge className="bg-green-500/10 text-green-600">{locale === 'ar' ? 'تم الحل' : 'Resolved'}</Badge>;
            case 'CLOSED':
                return <Badge variant="secondary">{locale === 'ar' ? 'مغلق' : 'Closed'}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return <Badge variant="destructive">{locale === 'ar' ? 'عاجل' : 'Urgent'}</Badge>;
            case 'HIGH':
                return <Badge className="bg-red-500/10 text-red-600">{locale === 'ar' ? 'عالي' : 'High'}</Badge>;
            case 'MEDIUM':
                return <Badge className="bg-amber-500/10 text-amber-600">{locale === 'ar' ? 'متوسط' : 'Medium'}</Badge>;
            case 'LOW':
                return <Badge variant="outline">{locale === 'ar' ? 'منخفض' : 'Low'}</Badge>;
            default:
                return <Badge variant="outline">{priority}</Badge>;
        }
    };

    const stats = data?.stats ? [
        { label: locale === 'ar' ? 'مفتوحة' : 'Open', value: data.stats.open, color: 'text-blue-500' },
        { label: locale === 'ar' ? 'قيد المعالجة' : 'In Progress', value: data.stats.inProgress, color: 'text-amber-500' },
        { label: locale === 'ar' ? 'مغلقة اليوم' : 'Closed Today', value: data.stats.closedToday, color: 'text-green-500' },
        { label: locale === 'ar' ? 'متوسط الرد' : 'Avg. Response', value: `${data.stats.avgResponseTime}h`, color: 'text-primary' },
    ] : [];

    if (loading && !data) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-4 sm:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <Skeleton className="h-16 w-full" />
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
                        {locale === 'ar' ? 'تذاكر الدعم' : 'Support Tickets'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === 'ar' ? 'إدارة طلبات الدعم من المستخدمين' : 'Manage user support requests'}
                    </p>
                </div>
                <Button variant="outline" onClick={fetchTickets} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
                    {locale === 'ar' ? 'تحديث' : 'Refresh'}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }} className="flex-1">
                    <TabsList>
                        <TabsTrigger value="all">
                            {locale === 'ar' ? 'الكل' : 'All'}
                        </TabsTrigger>
                        <TabsTrigger value="open" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {locale === 'ar' ? 'مفتوح' : 'Open'}
                        </TabsTrigger>
                        <TabsTrigger value="in_progress" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {locale === 'ar' ? 'قيد المعالجة' : 'In Progress'}
                        </TabsTrigger>
                        <TabsTrigger value="resolved" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {locale === 'ar' ? 'تم الحل' : 'Resolved'}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                        className="ps-10"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* Tickets Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{locale === 'ar' ? 'التذكرة' : 'Ticket'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'الأولوية' : 'Priority'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'آخر تحديث' : 'Last Update'}</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.tickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        {locale === 'ar' ? 'لا توجد تذاكر' : 'No tickets found'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.tickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                        {ticket.id.slice(0, 8)}
                                                    </code>
                                                </div>
                                                <p className="font-medium mt-1">{ticket.subject}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {ticket.user?.image ? (
                                                    <img
                                                        src={ticket.user.image}
                                                        alt={ticket.user.name || ''}
                                                        className="h-8 w-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                                        {(ticket.user?.name || ticket.email).charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {ticket.user?.name || 'Guest'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{ticket.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatTime(ticket.updatedAt)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={actionLoading === ticket.id}>
                                                        {actionLoading === ticket.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <MoreVertical className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => setReplyDialog({ open: true, ticket })}
                                                    >
                                                        <Reply className="h-4 w-4 me-2" />
                                                        {locale === 'ar' ? 'رد' : 'Reply'}
                                                    </DropdownMenuItem>
                                                    {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleAction(ticket.id, 'resolve')}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 me-2" />
                                                            {locale === 'ar' ? 'حل' : 'Resolve'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => handleAction(ticket.id, 'close')}
                                                    >
                                                        <Archive className="h-4 w-4 me-2" />
                                                        {locale === 'ar' ? 'إغلاق' : 'Close'}
                                                    </DropdownMenuItem>
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

            {/* Reply Dialog */}
            <Dialog open={replyDialog.open} onOpenChange={(open) => { setReplyDialog({ open, ticket: null }); setReplyMessage(''); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {locale === 'ar' ? 'الرد على التذكرة' : 'Reply to Ticket'}
                        </DialogTitle>
                        <DialogDescription>
                            {replyDialog.ticket?.subject}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">
                                {replyDialog.ticket?.user?.name || 'Guest'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {replyDialog.ticket?.message}
                            </p>
                        </div>
                        <Textarea
                            placeholder={locale === 'ar' ? 'اكتب ردك هنا...' : 'Type your reply...'}
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setReplyDialog({ open: false, ticket: null }); setReplyMessage(''); }}>
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button
                            onClick={() => replyDialog.ticket && handleAction(replyDialog.ticket.id, 'reply', { message: replyMessage })}
                            disabled={!replyMessage.trim() || actionLoading === replyDialog.ticket?.id}
                        >
                            {actionLoading === replyDialog.ticket?.id && (
                                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                            )}
                            <Send className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'إرسال' : 'Send'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function AdminSupportPage() {
    return (
        <AdminServerGuard>
            <AdminSupportContent />
        </AdminServerGuard>
    );
}
