'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
    Search,
    Users,
    Filter,
    MapPin,
    Briefcase,
    GraduationCap,
    Clock,
    DollarSign,
    Building2,
    Zap,
    Star,
    Bookmark,
    BookmarkPlus,
    Eye,
    ChevronRight,
    TrendingUp,
    UserPlus,
    FolderPlus,
    MoreVertical,
    Loader2,
    AlertCircle,
    Crown,
    CheckCircle2,
    X,
    SlidersHorizontal,
    Save,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { GCC_LOCATIONS } from '@/lib/talent-marketplace';

type Candidate = {
    id: string;
    displayName: string;
    currentTitle: string | null;
    currentCompany: string | null;
    location: string | null;
    yearsExperience: number | null;
    skills: string[];
    education: string | null;
    summary: string | null;
    availabilityStatus: string;
    desiredSalaryMin: number | null;
    desiredSalaryMax: number | null;
    noticePeriod: string | null;
    preferredLocations: string[];
    desiredRoles: string[];
    createdAt: string;
    updatedAt: string;
};

type SearchFilters = {
    query: string;
    skills: string[];
    locations: string[];
    availabilityStatus: string[];
    minExperience?: number;
    maxExperience?: number;
    minSalary?: number;
    maxSalary?: number;
    noticePeriod: string[];
    sortBy: 'relevance' | 'experience' | 'recent';
};

type Shortlist = {
    id: string;
    name: string;
    description: string | null;
    _count: { candidates: number };
};

type SavedSearch = {
    id: string;
    name: string;
    filters: any;
    createdAt: string;
};

type Stats = {
    totalCandidates: number;
    activelyLooking: number;
    openToOffers: number;
};

const NOTICE_PERIODS = [
    { value: 'immediate', label: 'Immediate', labelAr: 'فوري' },
    { value: '1_week', label: '1 Week', labelAr: 'أسبوع' },
    { value: '2_weeks', label: '2 Weeks', labelAr: 'أسبوعين' },
    { value: '1_month', label: '1 Month', labelAr: 'شهر' },
    { value: '2_months', label: '2 Months', labelAr: 'شهرين' },
    { value: '3_months', label: '3 Months', labelAr: '3 أشهر' },
];

const AVAILABILITY_OPTIONS = [
    { value: 'actively_looking', label: 'Actively Looking', labelAr: 'يبحث بنشاط', color: 'bg-green-500' },
    { value: 'open_to_offers', label: 'Open to Offers', labelAr: 'منفتح للعروض', color: 'bg-amber-500' },
    { value: 'not_looking', label: 'Not Looking', labelAr: 'غير متاح', color: 'bg-gray-500' },
];

export default function TalentHunterPage() {
    const { locale } = useLocale();

    // State
    const [hasAccess, setHasAccess] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [topSkills, setTopSkills] = useState<{ skill: string; count: number }[]>([]);
    const [topLocations, setTopLocations] = useState<{ location: string; count: number }[]>([]);
    const [shortlists, setShortlists] = useState<Shortlist[]>([]);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    // Filters
    const [filters, setFilters] = useState<SearchFilters>({
        query: '',
        skills: [],
        locations: [],
        availabilityStatus: [],
        noticePeriod: [],
        sortBy: 'relevance',
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Dialogs
    const [isNewShortlistOpen, setIsNewShortlistOpen] = useState(false);
    const [newShortlistName, setNewShortlistName] = useState('');
    const [newShortlistDesc, setNewShortlistDesc] = useState('');
    const [isSaveSearchOpen, setIsSaveSearchOpen] = useState(false);
    const [saveSearchName, setSaveSearchName] = useState('');

    // Load initial data
    const loadInitialData = useCallback(async () => {
        try {
            const res = await fetch('/api/talent-hunter/search');

            if (res.status === 403) {
                setHasAccess(false);
                setIsLoading(false);
                return;
            }

            if (!res.ok) throw new Error('Failed to load data');

            const data = await res.json();
            setStats(data.stats);
            setTopSkills(data.topSkills || []);
            setTopLocations(data.topLocations || []);

            // Load shortlists
            const shortlistsRes = await fetch('/api/talent-hunter/shortlists');
            if (shortlistsRes.ok) {
                const shortlistsData = await shortlistsRes.json();
                setShortlists(shortlistsData.shortlists || []);
            }

            // Load saved searches
            const savedRes = await fetch('/api/talent-hunter/saved-searches');
            if (savedRes.ok) {
                const savedData = await savedRes.json();
                setSavedSearches(savedData.savedSearches || []);
            }
        } catch (err) {
            console.error('Load error:', err);
            setError(locale === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [locale]);

    // Search candidates
    const searchCandidates = useCallback(async (pageNum = 1) => {
        setIsSearching(true);
        try {
            const res = await fetch('/api/talent-hunter/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...filters,
                    page: pageNum,
                    limit: 20,
                }),
            });

            if (!res.ok) throw new Error('Search failed');

            const data = await res.json();
            setCandidates(data.candidates || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalResults(data.pagination?.total || 0);
            setPage(pageNum);
        } catch (err) {
            console.error('Search error:', err);
            toast.error(locale === 'ar' ? 'فشل في البحث' : 'Search failed');
        } finally {
            setIsSearching(false);
        }
    }, [filters, locale]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // Search on filter change (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isLoading) {
                searchCandidates(1);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [filters, isLoading, searchCandidates]);

    // Create shortlist
    const createShortlist = async () => {
        if (!newShortlistName.trim()) {
            toast.error(locale === 'ar' ? 'يرجى إدخال اسم القائمة' : 'Please enter a name');
            return;
        }

        try {
            const res = await fetch('/api/talent-hunter/shortlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newShortlistName,
                    description: newShortlistDesc,
                }),
            });

            if (!res.ok) throw new Error('Failed to create');

            const data = await res.json();
            setShortlists((prev) => [{ ...data.shortlist, _count: { candidates: 0 } }, ...prev]);
            setIsNewShortlistOpen(false);
            setNewShortlistName('');
            setNewShortlistDesc('');
            toast.success(locale === 'ar' ? 'تم إنشاء القائمة' : 'Shortlist created');
        } catch (err) {
            toast.error(locale === 'ar' ? 'فشل في إنشاء القائمة' : 'Failed to create shortlist');
        }
    };

    // Add to shortlist
    const addToShortlist = async (candidateId: string, shortlistId: string) => {
        try {
            const res = await fetch(`/api/talent-hunter/shortlists/${shortlistId}/candidates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateId }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add');
            }

            toast.success(locale === 'ar' ? 'تمت الإضافة للقائمة' : 'Added to shortlist');

            // Update shortlist count
            setShortlists((prev) =>
                prev.map((s) =>
                    s.id === shortlistId
                        ? { ...s, _count: { candidates: s._count.candidates + 1 } }
                        : s
                )
            );
        } catch (err: any) {
            toast.error(err.message || (locale === 'ar' ? 'فشل في الإضافة' : 'Failed to add'));
        }
    };

    // Save search
    const saveCurrentSearch = async () => {
        if (!saveSearchName.trim()) {
            toast.error(locale === 'ar' ? 'يرجى إدخال اسم البحث' : 'Please enter a name');
            return;
        }

        try {
            const res = await fetch('/api/talent-hunter/saved-searches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: saveSearchName,
                    filters,
                }),
            });

            if (!res.ok) throw new Error('Failed to save');

            const data = await res.json();
            setSavedSearches((prev) => [data.savedSearch, ...prev]);
            setIsSaveSearchOpen(false);
            setSaveSearchName('');
            toast.success(locale === 'ar' ? 'تم حفظ البحث' : 'Search saved');
        } catch (err) {
            toast.error(locale === 'ar' ? 'فشل في الحفظ' : 'Failed to save search');
        }
    };

    // Load saved search
    const loadSavedSearch = (search: SavedSearch) => {
        setFilters({
            query: search.filters.query || '',
            skills: search.filters.skills || [],
            locations: search.filters.locations || [],
            availabilityStatus: search.filters.availabilityStatus || [],
            minExperience: search.filters.minExperience,
            maxExperience: search.filters.maxExperience,
            minSalary: search.filters.minSalary,
            maxSalary: search.filters.maxSalary,
            noticePeriod: search.filters.noticePeriod || [],
            sortBy: search.filters.sortBy || 'relevance',
        });
        toast.success(locale === 'ar' ? 'تم تحميل البحث' : 'Search loaded');
    };

    // Delete saved search
    const deleteSavedSearch = async (id: string) => {
        try {
            await fetch(`/api/talent-hunter/saved-searches?id=${id}`, { method: 'DELETE' });
            setSavedSearches((prev) => prev.filter((s) => s.id !== id));
            toast.success(locale === 'ar' ? 'تم الحذف' : 'Deleted');
        } catch (err) {
            toast.error(locale === 'ar' ? 'فشل في الحذف' : 'Failed to delete');
        }
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            query: '',
            skills: [],
            locations: [],
            availabilityStatus: [],
            noticePeriod: [],
            sortBy: 'relevance',
        });
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
                        <CardDescription className="text-base mt-2">
                            {locale === 'ar'
                                ? 'صائد المواهب متاح حالياً للمسؤولين فقط. قريباً للجميع!'
                                : 'Talent Hunter is currently available for administrators only. Coming soon for everyone!'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline">
                            <Link href="/dashboard">
                                {locale === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
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
            <div className="min-h-[calc(100vh-4rem)] flex flex-col">
                <div className="border-b bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent px-6 py-6">
                    <Skeleton className="h-12 w-64" />
                    <Skeleton className="h-5 w-96 mt-2" />
                </div>
                <div className="flex-1 p-6">
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-24 rounded-xl" />
                        ))}
                    </div>
                    <Skeleton className="h-12 w-full rounded-xl mb-6" />
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-64 rounded-xl" />
                        ))}
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
                        <CardTitle>{locale === 'ar' ? 'حدث خطأ' : 'Error'}</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => window.location.reload()}>
                            <RefreshCw className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const activeFiltersCount = [
        filters.skills.length > 0,
        filters.locations.length > 0,
        filters.availabilityStatus.length > 0,
        filters.noticePeriod.length > 0,
        filters.minExperience !== undefined,
        filters.maxExperience !== undefined,
        filters.minSalary !== undefined,
        filters.maxSalary !== undefined,
    ].filter(Boolean).length;

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent px-6 py-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <Search className="h-6 w-6 text-white" />
                            </div>
                            {locale === 'ar' ? 'صائد المواهب' : 'Talent Hunter'}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {locale === 'ar'
                                ? 'ابحث عن أفضل المواهب في مجموعة المرشحين'
                                : 'Find the best talent from the candidate pool'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Saved Searches */}
                        {savedSearches.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Bookmark className="h-4 w-4 me-2" />
                                        {locale === 'ar' ? 'البحث المحفوظ' : 'Saved Searches'}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                    {savedSearches.map((search) => (
                                        <DropdownMenuItem
                                            key={search.id}
                                            className="flex items-center justify-between"
                                        >
                                            <span
                                                className="cursor-pointer flex-1 truncate"
                                                onClick={() => loadSavedSearch(search)}
                                            >
                                                {search.name}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSavedSearch(search.id);
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Shortlists Link */}
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard/talent-hunter/shortlists">
                                <Users className="h-4 w-4 me-2" />
                                {locale === 'ar' ? 'القوائم المختصرة' : 'Shortlists'}
                                {shortlists.length > 0 && (
                                    <Badge variant="secondary" className="ms-2">
                                        {shortlists.length}
                                    </Badge>
                                )}
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6">
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.totalCandidates}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {locale === 'ar' ? 'إجمالي المرشحين' : 'Total Candidates'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.activelyLooking}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {locale === 'ar' ? 'يبحثون بنشاط' : 'Actively Looking'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Star className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.openToOffers}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {locale === 'ar' ? 'منفتحون للعروض' : 'Open to Offers'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{shortlists.reduce((a, s) => a + s._count.candidates, 0)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {locale === 'ar' ? 'في قوائمك' : 'In Your Lists'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Search Bar & Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder={locale === 'ar' ? 'ابحث عن مهارات، مناصب، شركات...' : 'Search skills, titles, companies...'}
                            value={filters.query}
                            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                            className="ps-10 h-12"
                        />
                        {isSearching && (
                            <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                        )}
                    </div>

                    <div className="flex gap-2">
                        {/* Sort */}
                        <Select
                            value={filters.sortBy}
                            onValueChange={(v) => setFilters((f) => ({ ...f, sortBy: v as any }))}
                        >
                            <SelectTrigger className="w-[160px] h-12">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="relevance">
                                    {locale === 'ar' ? 'الأكثر صلة' : 'Most Relevant'}
                                </SelectItem>
                                <SelectItem value="experience">
                                    {locale === 'ar' ? 'الأكثر خبرة' : 'Most Experience'}
                                </SelectItem>
                                <SelectItem value="recent">
                                    {locale === 'ar' ? 'الأحدث' : 'Most Recent'}
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Filters Sheet */}
                        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="h-12 relative">
                                    <SlidersHorizontal className="h-5 w-5 me-2" />
                                    {locale === 'ar' ? 'فلاتر' : 'Filters'}
                                    {activeFiltersCount > 0 && (
                                        <Badge className="absolute -top-2 -end-2 h-5 w-5 p-0 flex items-center justify-center">
                                            {activeFiltersCount}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>{locale === 'ar' ? 'تصفية النتائج' : 'Filter Results'}</SheetTitle>
                                    <SheetDescription>
                                        {locale === 'ar' ? 'حدد معايير البحث' : 'Set your search criteria'}
                                    </SheetDescription>
                                </SheetHeader>

                                <div className="space-y-6 py-6">
                                    {/* Skills */}
                                    <div className="space-y-3">
                                        <Label>{locale === 'ar' ? 'المهارات' : 'Skills'}</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {topSkills.slice(0, 15).map((s) => (
                                                <Badge
                                                    key={s.skill}
                                                    variant={filters.skills.includes(s.skill) ? 'default' : 'outline'}
                                                    className="cursor-pointer"
                                                    onClick={() => {
                                                        setFilters((f) => ({
                                                            ...f,
                                                            skills: f.skills.includes(s.skill)
                                                                ? f.skills.filter((sk) => sk !== s.skill)
                                                                : [...f.skills, s.skill],
                                                        }));
                                                    }}
                                                >
                                                    {s.skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Locations */}
                                    <div className="space-y-3">
                                        <Label>{locale === 'ar' ? 'المواقع' : 'Locations'}</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {GCC_LOCATIONS.map((loc) => (
                                                <Badge
                                                    key={loc}
                                                    variant={filters.locations.includes(loc) ? 'default' : 'outline'}
                                                    className="cursor-pointer"
                                                    onClick={() => {
                                                        setFilters((f) => ({
                                                            ...f,
                                                            locations: f.locations.includes(loc)
                                                                ? f.locations.filter((l) => l !== loc)
                                                                : [...f.locations, loc],
                                                        }));
                                                    }}
                                                >
                                                    {loc}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Availability */}
                                    <div className="space-y-3">
                                        <Label>{locale === 'ar' ? 'الحالة' : 'Availability'}</Label>
                                        <div className="space-y-2">
                                            {AVAILABILITY_OPTIONS.map((opt) => (
                                                <div key={opt.value} className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={opt.value}
                                                        checked={filters.availabilityStatus.includes(opt.value)}
                                                        onCheckedChange={(checked) => {
                                                            setFilters((f) => ({
                                                                ...f,
                                                                availabilityStatus: checked
                                                                    ? [...f.availabilityStatus, opt.value]
                                                                    : f.availabilityStatus.filter((s) => s !== opt.value),
                                                            }));
                                                        }}
                                                    />
                                                    <label htmlFor={opt.value} className="text-sm flex items-center gap-2 cursor-pointer">
                                                        <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                                                        {locale === 'ar' ? opt.labelAr : opt.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Experience Range */}
                                    <div className="space-y-3">
                                        <Label>{locale === 'ar' ? 'سنوات الخبرة' : 'Years of Experience'}</Label>
                                        <div className="flex gap-4">
                                            <Input
                                                type="number"
                                                placeholder={locale === 'ar' ? 'من' : 'Min'}
                                                value={filters.minExperience ?? ''}
                                                onChange={(e) => setFilters((f) => ({
                                                    ...f,
                                                    minExperience: e.target.value ? parseInt(e.target.value) : undefined,
                                                }))}
                                                min={0}
                                            />
                                            <Input
                                                type="number"
                                                placeholder={locale === 'ar' ? 'إلى' : 'Max'}
                                                value={filters.maxExperience ?? ''}
                                                onChange={(e) => setFilters((f) => ({
                                                    ...f,
                                                    maxExperience: e.target.value ? parseInt(e.target.value) : undefined,
                                                }))}
                                                min={0}
                                            />
                                        </div>
                                    </div>

                                    {/* Salary Range */}
                                    <div className="space-y-3">
                                        <Label>{locale === 'ar' ? 'نطاق الراتب (ريال/شهر)' : 'Salary Range (SAR/month)'}</Label>
                                        <div className="flex gap-4">
                                            <Input
                                                type="number"
                                                placeholder={locale === 'ar' ? 'من' : 'Min'}
                                                value={filters.minSalary ?? ''}
                                                onChange={(e) => setFilters((f) => ({
                                                    ...f,
                                                    minSalary: e.target.value ? parseInt(e.target.value) : undefined,
                                                }))}
                                                min={0}
                                                step={1000}
                                            />
                                            <Input
                                                type="number"
                                                placeholder={locale === 'ar' ? 'إلى' : 'Max'}
                                                value={filters.maxSalary ?? ''}
                                                onChange={(e) => setFilters((f) => ({
                                                    ...f,
                                                    maxSalary: e.target.value ? parseInt(e.target.value) : undefined,
                                                }))}
                                                min={0}
                                                step={1000}
                                            />
                                        </div>
                                    </div>

                                    {/* Notice Period */}
                                    <div className="space-y-3">
                                        <Label>{locale === 'ar' ? 'فترة الإشعار' : 'Notice Period'}</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {NOTICE_PERIODS.map((np) => (
                                                <Badge
                                                    key={np.value}
                                                    variant={filters.noticePeriod.includes(np.value) ? 'default' : 'outline'}
                                                    className="cursor-pointer"
                                                    onClick={() => {
                                                        setFilters((f) => ({
                                                            ...f,
                                                            noticePeriod: f.noticePeriod.includes(np.value)
                                                                ? f.noticePeriod.filter((n) => n !== np.value)
                                                                : [...f.noticePeriod, np.value],
                                                        }));
                                                    }}
                                                >
                                                    {locale === 'ar' ? np.labelAr : np.label}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t">
                                    <Button variant="outline" onClick={clearFilters} className="flex-1">
                                        {locale === 'ar' ? 'مسح الكل' : 'Clear All'}
                                    </Button>
                                    <Dialog open={isSaveSearchOpen} onOpenChange={setIsSaveSearchOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="flex-1">
                                                <Save className="h-4 w-4 me-2" />
                                                {locale === 'ar' ? 'حفظ البحث' : 'Save Search'}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>{locale === 'ar' ? 'حفظ البحث' : 'Save Search'}</DialogTitle>
                                                <DialogDescription>
                                                    {locale === 'ar' ? 'احفظ معايير البحث للاستخدام لاحقاً' : 'Save these filters for later use'}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>{locale === 'ar' ? 'اسم البحث' : 'Search Name'}</Label>
                                                    <Input
                                                        placeholder={locale === 'ar' ? 'مثال: مطورين React في الرياض' : 'e.g., React Developers in Riyadh'}
                                                        value={saveSearchName}
                                                        onChange={(e) => setSaveSearchName(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsSaveSearchOpen(false)}>
                                                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                                                </Button>
                                                <Button onClick={saveCurrentSearch}>
                                                    {locale === 'ar' ? 'حفظ' : 'Save'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>

                {/* Active Filters */}
                {activeFiltersCount > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="text-sm text-muted-foreground">
                            {locale === 'ar' ? 'الفلاتر النشطة:' : 'Active filters:'}
                        </span>
                        {filters.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="gap-1">
                                {skill}
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => setFilters((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }))}
                                />
                            </Badge>
                        ))}
                        {filters.locations.map((loc) => (
                            <Badge key={loc} variant="secondary" className="gap-1">
                                <MapPin className="h-3 w-3" />
                                {loc}
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => setFilters((f) => ({ ...f, locations: f.locations.filter((l) => l !== loc) }))}
                                />
                            </Badge>
                        ))}
                        {filters.availabilityStatus.map((status) => (
                            <Badge key={status} variant="secondary" className="gap-1">
                                {AVAILABILITY_OPTIONS.find((o) => o.value === status)?.[locale === 'ar' ? 'labelAr' : 'label']}
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => setFilters((f) => ({ ...f, availabilityStatus: f.availabilityStatus.filter((s) => s !== status) }))}
                                />
                            </Badge>
                        ))}
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            {locale === 'ar' ? 'مسح الكل' : 'Clear all'}
                        </Button>
                    </div>
                )}

                {/* Results Count */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                        {locale === 'ar'
                            ? `عرض ${candidates.length} من ${totalResults} مرشح`
                            : `Showing ${candidates.length} of ${totalResults} candidates`}
                    </p>
                </div>

                {/* Candidates Grid */}
                {candidates.length === 0 ? (
                    <Card className="py-12">
                        <CardContent className="text-center">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                {locale === 'ar' ? 'لا توجد نتائج' : 'No candidates found'}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {locale === 'ar'
                                    ? 'جرب تعديل معايير البحث'
                                    : 'Try adjusting your search criteria'}
                            </p>
                            <Button variant="outline" onClick={clearFilters}>
                                {locale === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {candidates.map((candidate) => (
                            <CandidateCard
                                key={candidate.id}
                                candidate={candidate}
                                locale={locale}
                                shortlists={shortlists}
                                onAddToShortlist={addToShortlist}
                                onCreateShortlist={() => setIsNewShortlistOpen(true)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <Button
                            variant="outline"
                            disabled={page <= 1}
                            onClick={() => searchCandidates(page - 1)}
                        >
                            {locale === 'ar' ? 'السابق' : 'Previous'}
                        </Button>
                        <span className="flex items-center px-4 text-sm">
                            {locale === 'ar' ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                        </span>
                        <Button
                            variant="outline"
                            disabled={page >= totalPages}
                            onClick={() => searchCandidates(page + 1)}
                        >
                            {locale === 'ar' ? 'التالي' : 'Next'}
                        </Button>
                    </div>
                )}
            </div>

            {/* New Shortlist Dialog */}
            <Dialog open={isNewShortlistOpen} onOpenChange={setIsNewShortlistOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{locale === 'ar' ? 'إنشاء قائمة جديدة' : 'Create New Shortlist'}</DialogTitle>
                        <DialogDescription>
                            {locale === 'ar' ? 'أنشئ قائمة لتنظيم المرشحين المفضلين' : 'Create a list to organize your favorite candidates'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{locale === 'ar' ? 'اسم القائمة' : 'List Name'}</Label>
                            <Input
                                placeholder={locale === 'ar' ? 'مثال: مرشحو فريق التطوير' : 'e.g., Development Team Candidates'}
                                value={newShortlistName}
                                onChange={(e) => setNewShortlistName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{locale === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'}</Label>
                            <Textarea
                                placeholder={locale === 'ar' ? 'وصف مختصر للقائمة' : 'Brief description of this list'}
                                value={newShortlistDesc}
                                onChange={(e) => setNewShortlistDesc(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewShortlistOpen(false)}>
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button onClick={createShortlist}>
                            <FolderPlus className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'إنشاء' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Candidate Card Component
function CandidateCard({
    candidate,
    locale,
    shortlists,
    onAddToShortlist,
    onCreateShortlist,
}: {
    candidate: Candidate;
    locale: string;
    shortlists: Shortlist[];
    onAddToShortlist: (candidateId: string, shortlistId: string) => void;
    onCreateShortlist: () => void;
}) {
    const getAvailabilityBadge = () => {
        switch (candidate.availabilityStatus) {
            case 'actively_looking':
                return (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Zap className="h-3 w-3 me-1" />
                        {locale === 'ar' ? 'يبحث بنشاط' : 'Actively Looking'}
                    </Badge>
                );
            case 'open_to_offers':
                return (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {locale === 'ar' ? 'منفتح للعروض' : 'Open to Offers'}
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary">
                        {locale === 'ar' ? 'غير متاح' : 'Not Looking'}
                    </Badge>
                );
        }
    };

    const getNoticePeriodLabel = () => {
        const np = NOTICE_PERIODS.find((n) => n.value === candidate.noticePeriod);
        return np ? (locale === 'ar' ? np.labelAr : np.label) : null;
    };

    return (
        <Card className="hover:shadow-lg transition-shadow group">
            <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
                        {candidate.displayName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h3 className="font-semibold truncate">{candidate.displayName}</h3>
                                <p className="text-sm text-muted-foreground truncate">
                                    {candidate.currentTitle || (locale === 'ar' ? 'باحث عن عمل' : 'Job Seeker')}
                                </p>
                            </div>
                            {getAvailabilityBadge()}
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                    {candidate.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{candidate.location}</span>
                        </div>
                    )}
                    {candidate.yearsExperience !== null && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Briefcase className="h-4 w-4" />
                            <span>
                                {candidate.yearsExperience} {locale === 'ar' ? 'سنوات خبرة' : 'years exp.'}
                            </span>
                        </div>
                    )}
                    {candidate.noticePeriod && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{getNoticePeriodLabel()}</span>
                        </div>
                    )}
                    {(candidate.desiredSalaryMin || candidate.desiredSalaryMax) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span>
                                {candidate.desiredSalaryMin && candidate.desiredSalaryMax
                                    ? `${candidate.desiredSalaryMin.toLocaleString()} - ${candidate.desiredSalaryMax.toLocaleString()} SAR`
                                    : candidate.desiredSalaryMin
                                        ? `${candidate.desiredSalaryMin.toLocaleString()}+ SAR`
                                        : `≤${candidate.desiredSalaryMax?.toLocaleString()} SAR`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Skills */}
                {candidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {candidate.skills.slice(0, 4).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                                {skill}
                            </Badge>
                        ))}
                        {candidate.skills.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                                +{candidate.skills.length - 4}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Summary Preview */}
                {candidate.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {candidate.summary}
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                    <Button asChild className="flex-1" size="sm">
                        <Link href={`/dashboard/talent-hunter/candidates/${candidate.id}`}>
                            <Eye className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'عرض الملف' : 'View Profile'}
                        </Link>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <BookmarkPlus className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {shortlists.length > 0 ? (
                                <>
                                    {shortlists.map((list) => (
                                        <DropdownMenuItem
                                            key={list.id}
                                            onClick={() => onAddToShortlist(candidate.id, list.id)}
                                        >
                                            <Users className="h-4 w-4 me-2" />
                                            {list.name}
                                            <Badge variant="secondary" className="ms-auto">
                                                {list._count.candidates}
                                            </Badge>
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                </>
                            ) : null}
                            <DropdownMenuItem onClick={onCreateShortlist}>
                                <FolderPlus className="h-4 w-4 me-2" />
                                {locale === 'ar' ? 'إنشاء قائمة جديدة' : 'Create New List'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
}
