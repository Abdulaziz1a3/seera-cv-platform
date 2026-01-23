'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    ArrowLeft,
    Users,
    FolderPlus,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Loader2,
    AlertCircle,
    Crown,
    MapPin,
    Briefcase,
    Zap,
    Clock,
    X,
    Search,
    ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

type Candidate = {
    id: string;
    talentProfileId: string;
    note: string | null;
    addedAt: string;
    talentProfile: {
        id: string;
        displayName: string;
        currentTitle: string | null;
        currentCompany: string | null;
        location: string | null;
        yearsExperience: number | null;
        skills: string[];
        availabilityStatus: string;
        desiredSalaryMin: number | null;
        desiredSalaryMax: number | null;
        noticePeriod: string | null;
        desiredRoles: string[];
    };
};

type Shortlist = {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    candidates: Candidate[];
    _count: { candidates: number };
};

export default function ShortlistsPage() {
    const { locale } = useLocale();

    const [shortlists, setShortlists] = useState<Shortlist[]>([]);
    const [selectedShortlist, setSelectedShortlist] = useState<Shortlist | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog states
    const [isNewShortlistOpen, setIsNewShortlistOpen] = useState(false);
    const [isEditShortlistOpen, setIsEditShortlistOpen] = useState(false);
    const [editingShortlist, setEditingShortlist] = useState<Shortlist | null>(null);
    const [shortlistName, setShortlistName] = useState('');
    const [shortlistDesc, setShortlistDesc] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const loadShortlists = useCallback(async () => {
        try {
            const res = await fetch('/api/talent-hunter/shortlists');

            if (res.status === 403) {
                setHasAccess(false);
                return;
            }

            if (!res.ok) throw new Error('Failed to load');

            const data = await res.json();
            setShortlists(data.shortlists || []);

            // Auto-select first shortlist if none selected
            if (data.shortlists?.length > 0 && !selectedShortlist) {
                loadShortlistDetails(data.shortlists[0].id);
            }
        } catch (err) {
            console.error('Load error:', err);
            setError(locale === 'ar' ? 'فشل في تحميل القوائم' : 'Failed to load shortlists');
        } finally {
            setIsLoading(false);
        }
    }, [locale, selectedShortlist]);

    const loadShortlistDetails = async (id: string) => {
        try {
            const res = await fetch(`/api/talent-hunter/shortlists/${id}`);
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setSelectedShortlist(data.shortlist);
        } catch (err) {
            console.error('Load shortlist error:', err);
            toast.error(locale === 'ar' ? 'فشل في تحميل القائمة' : 'Failed to load shortlist');
        }
    };

    useEffect(() => {
        loadShortlists();
    }, [loadShortlists]);

    // Create shortlist
    const createShortlist = async () => {
        if (!shortlistName.trim()) {
            toast.error(locale === 'ar' ? 'يرجى إدخال اسم القائمة' : 'Please enter a name');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/talent-hunter/shortlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: shortlistName,
                    description: shortlistDesc,
                }),
            });

            if (!res.ok) throw new Error('Failed to create');

            const data = await res.json();
            const newShortlist = { ...data.shortlist, candidates: [], _count: { candidates: 0 } };
            setShortlists((prev) => [newShortlist, ...prev]);
            setSelectedShortlist(newShortlist);
            setIsNewShortlistOpen(false);
            setShortlistName('');
            setShortlistDesc('');
            toast.success(locale === 'ar' ? 'تم إنشاء القائمة' : 'Shortlist created');
        } catch (err) {
            toast.error(locale === 'ar' ? 'فشل في إنشاء القائمة' : 'Failed to create shortlist');
        } finally {
            setIsSaving(false);
        }
    };

    // Update shortlist
    const updateShortlist = async () => {
        if (!editingShortlist || !shortlistName.trim()) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/talent-hunter/shortlists/${editingShortlist.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: shortlistName,
                    description: shortlistDesc,
                }),
            });

            if (!res.ok) throw new Error('Failed to update');

            setShortlists((prev) =>
                prev.map((s) =>
                    s.id === editingShortlist.id
                        ? { ...s, name: shortlistName, description: shortlistDesc }
                        : s
                )
            );

            if (selectedShortlist?.id === editingShortlist.id) {
                setSelectedShortlist((prev) =>
                    prev ? { ...prev, name: shortlistName, description: shortlistDesc } : prev
                );
            }

            setIsEditShortlistOpen(false);
            setEditingShortlist(null);
            setShortlistName('');
            setShortlistDesc('');
            toast.success(locale === 'ar' ? 'تم التحديث' : 'Updated successfully');
        } catch (err) {
            toast.error(locale === 'ar' ? 'فشل في التحديث' : 'Failed to update');
        } finally {
            setIsSaving(false);
        }
    };

    // Delete shortlist
    const deleteShortlist = async (id: string) => {
        try {
            const res = await fetch(`/api/talent-hunter/shortlists/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete');

            setShortlists((prev) => prev.filter((s) => s.id !== id));
            if (selectedShortlist?.id === id) {
                setSelectedShortlist(shortlists.find((s) => s.id !== id) || null);
            }
            toast.success(locale === 'ar' ? 'تم الحذف' : 'Deleted successfully');
        } catch (err) {
            toast.error(locale === 'ar' ? 'فشل في الحذف' : 'Failed to delete');
        }
    };

    // Remove candidate from shortlist
    const removeCandidate = async (candidateId: string) => {
        if (!selectedShortlist) return;

        try {
            const res = await fetch(
                `/api/talent-hunter/shortlists/${selectedShortlist.id}/candidates?candidateId=${candidateId}`,
                { method: 'DELETE' }
            );

            if (!res.ok) throw new Error('Failed to remove');

            setSelectedShortlist((prev) =>
                prev
                    ? {
                        ...prev,
                        candidates: prev.candidates.filter((c) => c.talentProfileId !== candidateId),
                    }
                    : prev
            );

            setShortlists((prev) =>
                prev.map((s) =>
                    s.id === selectedShortlist.id
                        ? { ...s, _count: { candidates: s._count.candidates - 1 } }
                        : s
                )
            );

            toast.success(locale === 'ar' ? 'تم الإزالة' : 'Removed successfully');
        } catch (err) {
            toast.error(locale === 'ar' ? 'فشل في الإزالة' : 'Failed to remove');
        }
    };

    // Open edit dialog
    const openEditDialog = (shortlist: Shortlist) => {
        setEditingShortlist(shortlist);
        setShortlistName(shortlist.name);
        setShortlistDesc(shortlist.description || '');
        setIsEditShortlistOpen(true);
    };

    // No access state
    if (!hasAccess) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                            <Crown className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">
                            {locale === 'ar' ? 'وصول محدود' : 'Restricted Access'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="h-4 w-4 me-2" />
                                {locale === 'ar' ? 'العودة' : 'Go Back'}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] p-6">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 rounded-xl" />
                        ))}
                    </div>
                    <div className="md:col-span-2">
                        <Skeleton className="h-96 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <CardTitle>{locale === 'ar' ? 'خطأ' : 'Error'}</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => window.location.reload()}>
                            {locale === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-transparent px-6 py-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/dashboard/talent-hunter">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                <Users className="h-7 w-7 text-purple-500" />
                                {locale === 'ar' ? 'القوائم المختصرة' : 'Shortlists'}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {locale === 'ar'
                                    ? 'نظم المرشحين المفضلين في قوائم'
                                    : 'Organize your favorite candidates into lists'}
                            </p>
                        </div>
                    </div>

                    <Dialog open={isNewShortlistOpen} onOpenChange={setIsNewShortlistOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <FolderPlus className="h-4 w-4 me-2" />
                                {locale === 'ar' ? 'قائمة جديدة' : 'New List'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{locale === 'ar' ? 'إنشاء قائمة جديدة' : 'Create New Shortlist'}</DialogTitle>
                                <DialogDescription>
                                    {locale === 'ar' ? 'أنشئ قائمة لتنظيم المرشحين' : 'Create a list to organize candidates'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>{locale === 'ar' ? 'اسم القائمة' : 'List Name'}</Label>
                                    <Input
                                        placeholder={locale === 'ar' ? 'مثال: مطورين React' : 'e.g., React Developers'}
                                        value={shortlistName}
                                        onChange={(e) => setShortlistName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{locale === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'}</Label>
                                    <Textarea
                                        placeholder={locale === 'ar' ? 'وصف مختصر للقائمة' : 'Brief description'}
                                        value={shortlistDesc}
                                        onChange={(e) => setShortlistDesc(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsNewShortlistOpen(false)}>
                                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button onClick={createShortlist} disabled={isSaving}>
                                    {isSaving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                                    {locale === 'ar' ? 'إنشاء' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex-1 p-6">
                {shortlists.length === 0 ? (
                    /* Empty State */
                    <Card className="max-w-md mx-auto mt-12 text-center">
                        <CardHeader>
                            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <CardTitle>{locale === 'ar' ? 'لا توجد قوائم' : 'No Shortlists Yet'}</CardTitle>
                            <CardDescription>
                                {locale === 'ar'
                                    ? 'أنشئ قائمتك الأولى لتنظيم المرشحين المفضلين'
                                    : 'Create your first shortlist to organize favorite candidates'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => setIsNewShortlistOpen(true)}>
                                <FolderPlus className="h-4 w-4 me-2" />
                                {locale === 'ar' ? 'إنشاء قائمة' : 'Create Shortlist'}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    /* Main Content */
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Shortlists Sidebar */}
                        <div className="space-y-3">
                            {shortlists.map((shortlist) => (
                                <Card
                                    key={shortlist.id}
                                    className={`cursor-pointer transition-all hover:shadow-md ${
                                        selectedShortlist?.id === shortlist.id
                                            ? 'ring-2 ring-primary'
                                            : ''
                                    }`}
                                    onClick={() => loadShortlistDetails(shortlist.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold truncate">{shortlist.name}</h3>
                                                {shortlist.description && (
                                                    <p className="text-sm text-muted-foreground truncate mt-1">
                                                        {shortlist.description}
                                                    </p>
                                                )}
                                                <Badge variant="secondary" className="mt-2">
                                                    {shortlist._count.candidates} {locale === 'ar' ? 'مرشح' : 'candidates'}
                                                </Badge>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditDialog(shortlist);
                                                    }}>
                                                        <Edit className="h-4 w-4 me-2" />
                                                        {locale === 'ar' ? 'تعديل' : 'Edit'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onSelect={(e) => e.preventDefault()}
                                                            >
                                                                <Trash2 className="h-4 w-4 me-2" />
                                                                {locale === 'ar' ? 'حذف' : 'Delete'}
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    {locale === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    {locale === 'ar'
                                                                        ? 'سيتم حذف هذه القائمة نهائياً'
                                                                        : 'This shortlist will be permanently deleted'}
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                    onClick={() => deleteShortlist(shortlist.id)}
                                                                >
                                                                    {locale === 'ar' ? 'حذف' : 'Delete'}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Candidates Panel */}
                        <div className="md:col-span-2">
                            {selectedShortlist ? (
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>{selectedShortlist.name}</CardTitle>
                                                {selectedShortlist.description && (
                                                    <CardDescription className="mt-1">
                                                        {selectedShortlist.description}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <Badge variant="outline">
                                                {selectedShortlist.candidates.length} {locale === 'ar' ? 'مرشح' : 'candidates'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedShortlist.candidates.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                                <h3 className="text-lg font-semibold mb-2">
                                                    {locale === 'ar' ? 'لا يوجد مرشحين' : 'No Candidates'}
                                                </h3>
                                                <p className="text-muted-foreground mb-4">
                                                    {locale === 'ar'
                                                        ? 'ابدأ بإضافة مرشحين من صفحة البحث'
                                                        : 'Start adding candidates from the search page'}
                                                </p>
                                                <Button asChild>
                                                    <Link href="/dashboard/talent-hunter">
                                                        <Search className="h-4 w-4 me-2" />
                                                        {locale === 'ar' ? 'البحث عن مرشحين' : 'Search Candidates'}
                                                    </Link>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {selectedShortlist.candidates.map((candidate) => (
                                                    <div
                                                        key={candidate.id}
                                                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                                    >
                                                        {/* Avatar */}
                                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                                                            {candidate.talentProfile.displayName[0].toUpperCase()}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold truncate">
                                                                    {candidate.talentProfile.displayName}
                                                                </h4>
                                                                {candidate.talentProfile.availabilityStatus === 'actively_looking' && (
                                                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                                                                        <Zap className="h-3 w-3 me-1" />
                                                                        {locale === 'ar' ? 'نشط' : 'Active'}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground truncate">
                                                                {candidate.talentProfile.currentTitle || (locale === 'ar' ? 'باحث عن عمل' : 'Job Seeker')}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                                {candidate.talentProfile.location && (
                                                                    <span className="flex items-center gap-1">
                                                                        <MapPin className="h-3 w-3" />
                                                                        {candidate.talentProfile.location}
                                                                    </span>
                                                                )}
                                                                {candidate.talentProfile.yearsExperience !== null && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Briefcase className="h-3 w-3" />
                                                                        {candidate.talentProfile.yearsExperience}y
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {candidate.note && (
                                                                <p className="text-xs text-muted-foreground mt-2 italic">
                                                                    "{candidate.note}"
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/dashboard/talent-hunter/candidates/${candidate.talentProfile.id}`}>
                                                                    <Eye className="h-4 w-4 me-1" />
                                                                    {locale === 'ar' ? 'عرض' : 'View'}
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => removeCandidate(candidate.talentProfile.id)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="flex items-center justify-center h-64">
                                    <CardContent className="text-center">
                                        <p className="text-muted-foreground">
                                            {locale === 'ar' ? 'اختر قائمة لعرض المرشحين' : 'Select a shortlist to view candidates'}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Shortlist Dialog */}
            <Dialog open={isEditShortlistOpen} onOpenChange={setIsEditShortlistOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{locale === 'ar' ? 'تعديل القائمة' : 'Edit Shortlist'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{locale === 'ar' ? 'اسم القائمة' : 'List Name'}</Label>
                            <Input
                                value={shortlistName}
                                onChange={(e) => setShortlistName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{locale === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'}</Label>
                            <Textarea
                                value={shortlistDesc}
                                onChange={(e) => setShortlistDesc(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditShortlistOpen(false)}>
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button onClick={updateShortlist} disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                            {locale === 'ar' ? 'حفظ' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
