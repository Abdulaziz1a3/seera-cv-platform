'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Flag,
    Plus,
    RefreshCw,
    Loader2,
    Settings,
    Trash2,
    Percent,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminServerGuard } from '../_components/admin-server-guard';

interface FeatureFlag {
    id: string;
    key: string;
    name: string;
    description: string | null;
    enabled: boolean;
    percentage: number;
    enabledFor: string[];
    disabledFor: string[];
    createdAt: string;
    updatedAt: string;
}

interface FeatureFlagsData {
    flags: Record<string, FeatureFlag[]>;
    allFlags: FeatureFlag[];
    stats: {
        total: number;
        enabled: number;
        disabled: number;
        partialRollouts: number;
    };
}

function AdminFeatureFlagsContent() {
    const { locale } = useLocale();
    const [data, setData] = useState<FeatureFlagsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [createDialog, setCreateDialog] = useState(false);
    const [newFlag, setNewFlag] = useState({ key: '', name: '', description: '' });
    const [percentageDialog, setPercentageDialog] = useState<{ open: boolean; flag: FeatureFlag | null }>({
        open: false,
        flag: null,
    });
    const [newPercentage, setNewPercentage] = useState(100);

    const fetchFlags = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/feature-flags');
            if (!res.ok) throw new Error('Failed to fetch flags');
            const json = await res.json();
            setData(json);
        } catch (error) {
            toast.error('Failed to load feature flags');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlags();
    }, []);

    const handleToggle = async (flagId: string) => {
        setActionLoading(flagId);
        try {
            const res = await fetch('/api/admin/feature-flags', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: flagId, action: 'toggle' }),
            });
            if (!res.ok) throw new Error('Toggle failed');
            toast.success('Feature flag updated');
            fetchFlags();
        } catch (error) {
            toast.error('Failed to toggle feature flag');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreate = async () => {
        if (!newFlag.key || !newFlag.name) {
            toast.error('Key and name are required');
            return;
        }
        setActionLoading('create');
        try {
            const res = await fetch('/api/admin/feature-flags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFlag),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Create failed');
            }
            toast.success('Feature flag created');
            setCreateDialog(false);
            setNewFlag({ key: '', name: '', description: '' });
            fetchFlags();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create feature flag');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdatePercentage = async () => {
        if (!percentageDialog.flag) return;
        setActionLoading(percentageDialog.flag.id);
        try {
            const res = await fetch('/api/admin/feature-flags', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: percentageDialog.flag.id,
                    action: 'update_percentage',
                    data: { percentage: newPercentage }
                }),
            });
            if (!res.ok) throw new Error('Update failed');
            toast.success('Rollout percentage updated');
            setPercentageDialog({ open: false, flag: null });
            fetchFlags();
        } catch (error) {
            toast.error('Failed to update percentage');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (flagId: string) => {
        setActionLoading(flagId);
        try {
            const res = await fetch('/api/admin/feature-flags', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: flagId, action: 'delete' }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Delete failed');
            }
            toast.success('Feature flag deleted');
            fetchFlags();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete feature flag');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading && !data) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <Skeleton className="h-16 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {locale === 'ar' ? 'إدارة الميزات' : 'Feature Flags'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === 'ar'
                            ? 'تفعيل وإلغاء تفعيل ميزات التطبيق'
                            : 'Enable and disable application features'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchFlags} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
                        {locale === 'ar' ? 'تحديث' : 'Refresh'}
                    </Button>
                    <Button onClick={() => setCreateDialog(true)}>
                        <Plus className="h-4 w-4 me-2" />
                        {locale === 'ar' ? 'إضافة ميزة' : 'Add Flag'}
                    </Button>
                </div>
            </div>

            {/* Warning */}
            <Card className="border-amber-500/50 bg-amber-500/5">
                <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <p className="text-sm">
                            {locale === 'ar'
                                ? 'تغيير إعدادات الميزات قد يؤثر على تجربة المستخدمين فوراً.'
                                : 'Changing feature flags may immediately affect the user experience.'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            {data?.stats && (
                <div className="grid gap-4 sm:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'إجمالي الميزات' : 'Total Flags'}
                                    </p>
                                    <p className="text-2xl font-bold">{data.stats.total}</p>
                                </div>
                                <Flag className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'مفعلة' : 'Enabled'}
                                    </p>
                                    <p className="text-2xl font-bold text-green-500">{data.stats.enabled}</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <div className="h-3 w-3 rounded-full bg-green-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'معطلة' : 'Disabled'}
                                    </p>
                                    <p className="text-2xl font-bold text-red-500">{data.stats.disabled}</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <div className="h-3 w-3 rounded-full bg-red-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'تدريجي' : 'Partial Rollout'}
                                    </p>
                                    <p className="text-2xl font-bold text-amber-500">{data.stats.partialRollouts}</p>
                                </div>
                                <Percent className="h-8 w-8 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Feature Flags List */}
            {data?.allFlags.length === 0 ? (
                <Card>
                    <CardContent className="pt-6 text-center py-12">
                        <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            {locale === 'ar' ? 'لا توجد ميزات' : 'No feature flags yet'}
                        </p>
                        <Button className="mt-4" onClick={() => setCreateDialog(true)}>
                            <Plus className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'إضافة ميزة' : 'Add Your First Flag'}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {Object.entries(data?.flags || {}).map(([category, flags]) => (
                        <Card key={category}>
                            <CardHeader>
                                <CardTitle className="text-lg">{category}</CardTitle>
                                <CardDescription>
                                    {flags.length} {locale === 'ar' ? 'ميزة' : 'feature(s)'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {flags.map((flag) => (
                                        <div
                                            key={flag.id}
                                            className="flex items-center justify-between p-4 border rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-medium">{flag.name}</h4>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {flag.key}
                                                    </Badge>
                                                    {flag.percentage < 100 && flag.enabled && (
                                                        <Badge className="bg-amber-500/10 text-amber-600">
                                                            {flag.percentage}%
                                                        </Badge>
                                                    )}
                                                </div>
                                                {flag.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {flag.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setNewPercentage(flag.percentage);
                                                        setPercentageDialog({ open: true, flag });
                                                    }}
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(flag.id)}
                                                    disabled={actionLoading === flag.id}
                                                >
                                                    {actionLoading === flag.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Switch
                                                    checked={flag.enabled}
                                                    onCheckedChange={() => handleToggle(flag.id)}
                                                    disabled={actionLoading === flag.id}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Flag Dialog */}
            <Dialog open={createDialog} onOpenChange={setCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {locale === 'ar' ? 'إضافة ميزة جديدة' : 'Create Feature Flag'}
                        </DialogTitle>
                        <DialogDescription>
                            {locale === 'ar'
                                ? 'أضف ميزة جديدة للتحكم في تفعيلها'
                                : 'Add a new feature flag to control feature availability'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="key">{locale === 'ar' ? 'المفتاح' : 'Key'}</Label>
                            <Input
                                id="key"
                                placeholder="feature_key"
                                value={newFlag.key}
                                onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">{locale === 'ar' ? 'الاسم' : 'Name'}</Label>
                            <Input
                                id="name"
                                placeholder="Feature Name"
                                value={newFlag.name}
                                onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">{locale === 'ar' ? 'الوصف' : 'Description'}</Label>
                            <Input
                                id="description"
                                placeholder="Optional description"
                                value={newFlag.description}
                                onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialog(false)}>
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button onClick={handleCreate} disabled={actionLoading === 'create'}>
                            {actionLoading === 'create' && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                            {locale === 'ar' ? 'إنشاء' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Percentage Dialog */}
            <Dialog open={percentageDialog.open} onOpenChange={(open) => setPercentageDialog({ open, flag: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {locale === 'ar' ? 'نسبة التفعيل' : 'Rollout Percentage'}
                        </DialogTitle>
                        <DialogDescription>
                            {locale === 'ar'
                                ? `ضبط نسبة المستخدمين لـ "${percentageDialog.flag?.name}"`
                                : `Set the rollout percentage for "${percentageDialog.flag?.name}"`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>{locale === 'ar' ? 'النسبة' : 'Percentage'}</Label>
                                <span className="text-2xl font-bold">{newPercentage}%</span>
                            </div>
                            <Slider
                                value={[newPercentage]}
                                onValueChange={([value]) => setNewPercentage(value)}
                                max={100}
                                step={5}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {locale === 'ar'
                                ? `سيتم تفعيل هذه الميزة لـ ${newPercentage}% من المستخدمين`
                                : `This feature will be enabled for ${newPercentage}% of users`}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPercentageDialog({ open: false, flag: null })}>
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button
                            onClick={handleUpdatePercentage}
                            disabled={actionLoading === percentageDialog.flag?.id}
                        >
                            {actionLoading === percentageDialog.flag?.id && (
                                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                            )}
                            {locale === 'ar' ? 'حفظ' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function AdminFeatureFlagsPage() {
    return (
        <AdminServerGuard>
            <AdminFeatureFlagsContent />
        </AdminServerGuard>
    );
}
