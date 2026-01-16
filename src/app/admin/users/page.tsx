'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Mail,
    Shield,
    Ban,
    UserPlus,
    Download,
    RefreshCw,
    CheckCircle,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface User {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    plan: string;
    subscriptionStatus: string;
    status: string;
    resumes: number;
    createdAt: string;
    lastActive: string;
}

interface UsersData {
    users: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

function AdminUsersContent() {
    const { locale } = useLocale();
    const [data, setData] = useState<UsersData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [planFilter, setPlanFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
        open: false,
        user: null,
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search: searchQuery,
                plan: planFilter,
                status: statusFilter,
            });
            const res = await fetch(`/api/admin/users?${params}`);
            if (!res.ok) throw new Error('Failed to fetch users');
            const json = await res.json();
            setData(json);
        } catch (error) {
            toast.error('Failed to load users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, planFilter, statusFilter]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(debounce);
    }, [fetchUsers]);

    const handleAction = async (userId: string, action: string, data?: any) => {
        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action, data }),
            });
            if (!res.ok) throw new Error('Action failed');
            toast.success(`User ${action} successful`);
            fetchUsers();
        } catch (error) {
            toast.error(`Failed to ${action} user`);
        } finally {
            setActionLoading(null);
            setDeleteDialog({ open: false, user: null });
        }
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'MMM d, yyyy', {
            locale: locale === 'ar' ? ar : enUS,
        });
    };

    const formatTimeAgo = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), {
            addSuffix: true,
            locale: locale === 'ar' ? ar : enUS,
        });
    };

    const toggleSelectAll = () => {
        if (!data) return;
        if (selectedUsers.length === data.users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(data.users.map((u) => u.id));
        }
    };

    const toggleSelectUser = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter((id) => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    if (loading && !data) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-0">
                        <div className="space-y-4 p-6">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {locale === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === 'ar'
                            ? `${data?.pagination.total || 0} مستخدم مسجل`
                            : `${data?.pagination.total || 0} registered users`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchUsers} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
                        {locale === 'ar' ? 'تحديث' : 'Refresh'}
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 me-2" />
                        {locale === 'ar' ? 'تصدير' : 'Export'}
                    </Button>
                </div>
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
                            value={planFilter}
                            onValueChange={(v) => {
                                setPlanFilter(v);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder={locale === 'ar' ? 'الخطة' : 'Plan'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{locale === 'ar' ? 'جميع الخطط' : 'All Plans'}</SelectItem>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                        </Select>
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
                                <SelectItem value="suspended">{locale === 'ar' ? 'معلق' : 'Suspended'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedUsers.length > 0 && (
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                            <span className="text-sm text-muted-foreground">
                                {selectedUsers.length} {locale === 'ar' ? 'محدد' : 'selected'}
                            </span>
                            <Button variant="outline" size="sm">
                                <Mail className="h-4 w-4 me-1" />
                                {locale === 'ar' ? 'إرسال بريد' : 'Send Email'}
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive">
                                <Ban className="h-4 w-4 me-1" />
                                {locale === 'ar' ? 'تعليق' : 'Suspend'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={!!data && selectedUsers.length === data.users.length && data.users.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>{locale === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'الخطة' : 'Plan'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                <TableHead className="text-center">{locale === 'ar' ? 'السير' : 'Resumes'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'التسجيل' : 'Joined'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'آخر نشاط' : 'Last Active'}</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        {locale === 'ar' ? 'لا يوجد مستخدمين' : 'No users found'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedUsers.includes(user.id)}
                                                onCheckedChange={() => toggleSelectUser(user.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {user.image ? (
                                                    <img
                                                        src={user.image}
                                                        alt={user.name}
                                                        className="h-9 w-9 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{user.name}</p>
                                                        {user.role !== 'USER' && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {user.role}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    user.plan === 'PRO'
                                                        ? 'default'
                                                        : user.plan === 'ENTERPRISE'
                                                            ? 'secondary'
                                                            : 'outline'
                                                }
                                            >
                                                {user.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    user.status === 'active'
                                                        ? 'border-green-500 text-green-600'
                                                        : user.status === 'pending'
                                                            ? 'border-yellow-500 text-yellow-600'
                                                            : 'border-red-500 text-red-600'
                                                }
                                            >
                                                {user.status === 'active'
                                                    ? locale === 'ar'
                                                        ? 'نشط'
                                                        : 'Active'
                                                    : user.status === 'pending'
                                                        ? locale === 'ar'
                                                            ? 'في الانتظار'
                                                            : 'Pending'
                                                        : locale === 'ar'
                                                            ? 'معلق'
                                                            : 'Suspended'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">{user.resumes}</TableCell>
                                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                                        <TableCell>{formatTimeAgo(user.lastActive)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={actionLoading === user.id}>
                                                        {actionLoading === user.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <MoreVertical className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Edit className="h-4 w-4 me-2" />
                                                        {locale === 'ar' ? 'تعديل' : 'Edit'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Mail className="h-4 w-4 me-2" />
                                                        {locale === 'ar' ? 'إرسال بريد' : 'Send Email'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Shield className="h-4 w-4 me-2" />
                                                        {locale === 'ar' ? 'إعادة كلمة المرور' : 'Reset Password'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {user.status === 'suspended' ? (
                                                        <DropdownMenuItem
                                                            onClick={() => handleAction(user.id, 'activate')}
                                                        >
                                                            <CheckCircle className="h-4 w-4 me-2" />
                                                            {locale === 'ar' ? 'تفعيل' : 'Activate'}
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onClick={() => handleAction(user.id, 'suspend')}
                                                            className="text-amber-600"
                                                        >
                                                            <Ban className="h-4 w-4 me-2" />
                                                            {locale === 'ar' ? 'تعليق' : 'Suspend'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => setDeleteDialog({ open: true, user })}
                                                    >
                                                        <Trash2 className="h-4 w-4 me-2" />
                                                        {locale === 'ar' ? 'حذف' : 'Delete'}
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {locale === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                        </DialogTitle>
                        <DialogDescription>
                            {locale === 'ar'
                                ? `هل أنت متأكد من حذف المستخدم "${deleteDialog.user?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                                : `Are you sure you want to delete user "${deleteDialog.user?.name}"? This action cannot be undone.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteDialog.user && handleAction(deleteDialog.user.id, 'delete')}
                            disabled={actionLoading === deleteDialog.user?.id}
                        >
                            {actionLoading === deleteDialog.user?.id && (
                                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                            )}
                            {locale === 'ar' ? 'حذف' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function AdminUsersPage() {
    return (
        <AdminUsersContent />
    );
}
