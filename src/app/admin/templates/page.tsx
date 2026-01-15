'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    Palette,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Copy,
    Star,
    Download,
    RefreshCw,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    LayoutTemplate,
    Crown,
    CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Template {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    thumbnail: string | null;
    isPremium: boolean;
    isActive: boolean;
    usageCount: number;
    createdAt: string;
    updatedAt: string;
}

interface TemplatesData {
    templates: Template[];
    stats: {
        total: number;
        active: number;
        premium: number;
        totalUsage: number;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function AdminTemplatesPage() {
    const { locale } = useLocale();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<TemplatesData | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        slug: '',
        description: '',
        isPremium: false,
    });

    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search: searchQuery,
                type: typeFilter,
            });
            const response = await fetch(`/api/admin/templates?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch templates');
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            toast.error(locale === 'ar' ? 'فشل في تحميل القوالب' : 'Failed to load templates');
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, typeFilter, locale]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, typeFilter]);

    const handleAction = async (action: string, templateId: string, actionData?: any) => {
        try {
            setActionLoading(templateId);
            const response = await fetch('/api/admin/templates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: templateId, action, data: actionData }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Action failed');
            }

            toast.success(
                locale === 'ar'
                    ? 'تم تنفيذ الإجراء بنجاح'
                    : 'Action completed successfully'
            );
            fetchTemplates();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreate = async () => {
        if (!newTemplate.name || !newTemplate.slug) {
            toast.error(locale === 'ar' ? 'الاسم والمعرف مطلوبان' : 'Name and slug are required');
            return;
        }

        try {
            setActionLoading('create');
            const response = await fetch('/api/admin/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTemplate),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create template');
            }

            toast.success(locale === 'ar' ? 'تم إنشاء القالب' : 'Template created');
            setCreateDialogOpen(false);
            setNewTemplate({ name: '', slug: '', description: '', isPremium: false });
            fetchTemplates();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create template');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!selectedTemplate) return;

        try {
            await handleAction('delete', selectedTemplate.id);
            setDeleteDialogOpen(false);
            setSelectedTemplate(null);
        } catch (err) {
            // Error handled in handleAction
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(num);
    };

    if (loading && !data) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>

                {/* Stats Skeleton */}
                <div className="grid gap-4 sm:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <Skeleton className="h-4 w-20 mb-2" />
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table Skeleton */}
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-10 w-full max-w-md mb-6" />
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

    if (error && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-lg font-semibold mb-2">
                    {locale === 'ar' ? 'خطأ في تحميل البيانات' : 'Error Loading Data'}
                </h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchTemplates}>
                    <RefreshCw className="h-4 w-4 me-2" />
                    {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {locale === 'ar' ? 'إدارة القوالب' : 'Template Manager'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === 'ar'
                            ? `${data?.stats.total || 0} قالب متاح`
                            : `${data?.stats.total || 0} templates available`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchTemplates}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 me-2" />
                        {locale === 'ar' ? 'إضافة قالب' : 'Add Template'}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {data?.stats && (
                <div className="grid gap-4 sm:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <LayoutTemplate className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'إجمالي القوالب' : 'Total Templates'}
                                    </p>
                                    <p className="text-2xl font-bold">{formatNumber(data.stats.total)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'نشط' : 'Active'}
                                    </p>
                                    <p className="text-2xl font-bold">{formatNumber(data.stats.active)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <Crown className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'مدفوع' : 'Premium'}
                                    </p>
                                    <p className="text-2xl font-bold">{formatNumber(data.stats.premium)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Download className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'إجمالي الاستخدام' : 'Total Usage'}
                                    </p>
                                    <p className="text-2xl font-bold">{formatNumber(data.stats.totalUsage)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search and Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={locale === 'ar' ? 'بحث في القوالب...' : 'Search templates...'}
                                className="ps-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{locale === 'ar' ? 'الكل' : 'All'}</SelectItem>
                                <SelectItem value="free">{locale === 'ar' ? 'مجاني' : 'Free'}</SelectItem>
                                <SelectItem value="premium">{locale === 'ar' ? 'مدفوع' : 'Premium'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Templates Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{locale === 'ar' ? 'القالب' : 'Template'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'المعرف' : 'Slug'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'النوع' : 'Type'}</TableHead>
                                <TableHead className="text-center">{locale === 'ar' ? 'الاستخدام' : 'Uses'}</TableHead>
                                <TableHead>{locale === 'ar' ? 'نشط' : 'Active'}</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded border flex items-center justify-center">
                                                <Palette className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{template.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(template.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                            {template.slug}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        {template.isPremium ? (
                                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                                Premium
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">Free</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {formatNumber(template.usageCount)}
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={template.isActive}
                                            disabled={actionLoading === template.id}
                                            onCheckedChange={() => handleAction('toggle_active', template.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={!!actionLoading}>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleAction('duplicate', template.id)}>
                                                    <Copy className="h-4 w-4 me-2" />
                                                    {locale === 'ar' ? 'نسخ' : 'Duplicate'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        setSelectedTemplate(template);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 me-2" />
                                                    {locale === 'ar' ? 'حذف' : 'Delete'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data?.templates.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        {locale === 'ar' ? 'لا توجد قوالب' : 'No templates found'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {locale === 'ar'
                            ? `عرض ${(page - 1) * 20 + 1} - ${Math.min(page * 20, data.pagination.total)} من ${data.pagination.total}`
                            : `Showing ${(page - 1) * 20 + 1} - ${Math.min(page * 20, data.pagination.total)} of ${data.pagination.total}`}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                            {page} / {data.pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(page + 1)}
                            disabled={page === data.pagination.totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Create Template Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {locale === 'ar' ? 'إضافة قالب جديد' : 'Add New Template'}
                        </DialogTitle>
                        <DialogDescription>
                            {locale === 'ar'
                                ? 'أدخل معلومات القالب الجديد'
                                : 'Enter the details for the new template'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{locale === 'ar' ? 'الاسم' : 'Name'}</Label>
                            <Input
                                value={newTemplate.name}
                                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                placeholder={locale === 'ar' ? 'اسم القالب' : 'Template name'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{locale === 'ar' ? 'المعرف' : 'Slug'}</Label>
                            <Input
                                value={newTemplate.slug}
                                onChange={(e) => setNewTemplate({ ...newTemplate, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                placeholder={locale === 'ar' ? 'معرف-القالب' : 'template-slug'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{locale === 'ar' ? 'الوصف' : 'Description'}</Label>
                            <Textarea
                                value={newTemplate.description}
                                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                placeholder={locale === 'ar' ? 'وصف القالب' : 'Template description'}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={newTemplate.isPremium}
                                onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, isPremium: checked })}
                            />
                            <Label>{locale === 'ar' ? 'قالب مدفوع' : 'Premium Template'}</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button onClick={handleCreate} disabled={actionLoading === 'create'}>
                            {actionLoading === 'create' ? (
                                <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4 me-2" />
                            )}
                            {locale === 'ar' ? 'إنشاء' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {locale === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                        </DialogTitle>
                        <DialogDescription>
                            {locale === 'ar'
                                ? `هل أنت متأكد من حذف القالب "${selectedTemplate?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                                : `Are you sure you want to delete "${selectedTemplate?.name}"? This action cannot be undone.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={!!actionLoading}>
                            {actionLoading ? (
                                <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4 me-2" />
                            )}
                            {locale === 'ar' ? 'حذف' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
