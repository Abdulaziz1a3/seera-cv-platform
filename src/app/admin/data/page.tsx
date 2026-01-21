'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    Search,
    Download,
    Filter,
    MoreVertical,
    Eye,
    Mail,
    MapPin,
    Briefcase,
    GraduationCap,
    Clock,
    ChevronLeft,
    ChevronRight,
    Users,
    FileText,
    TrendingUp,
    Building2,
    X,
    RefreshCw,
    Database,
    Target,
    Globe,
    Linkedin,
    ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface UserData {
    id: string;
    name: string;
    email: string;
    image?: string;
    phone: string;
    location: string;
    currentTitle: string;
    currentCompany: string;
    yearsExperience: number | null;
    skills: string[];
    education: string;
    languages: string[];
    industries: string[];
    desiredRoles: string[];
    availabilityStatus: string;
    salaryRange: string;
    noticePeriod: string;
    plan: string;
    subscriptionStatus: string;
    resumeCount: number;
    interviewCount: number;
    hasResume: boolean;
    hasTalentProfile: boolean;
    hasSeeraProfile: boolean;
    createdAt: string;
    linkedinUrl: string;
    website: string;
}

interface FilterOptions {
    locations: string[];
    skills: string[];
    industries: string[];
    educationLevels: string[];
    titles: string[];
    availabilityStatuses: string[];
    plans: string[];
}

interface Stats {
    totalUsers: number;
    usersWithProfiles: number;
    usersWithResumes: number;
    planDistribution: { plan: string; count: number }[];
    locationDistribution: { location: string; count: number }[];
    experienceDistribution: { years: number; count: number }[];
    topSkills: { skill: string; count: number }[];
}

export default function AdminDataPage() {
    const { locale } = useLocale();
    const isArabic = locale === 'ar';

    // State
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

    // Selection state
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

    // Filter state
    const [search, setSearch] = useState('');
    const [location, setLocation] = useState('');
    const [minExperience, setMinExperience] = useState('');
    const [maxExperience, setMaxExperience] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [education, setEducation] = useState('');
    const [currentTitle, setCurrentTitle] = useState('');
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
    const [availabilityStatus, setAvailabilityStatus] = useState('');
    const [plan, setPlan] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Detail modal
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Fetch filter options
    useEffect(() => {
        async function fetchFilterOptions() {
            try {
                const res = await fetch('/api/admin/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_filter_options' })
                });
                if (res.ok) {
                    const data = await res.json();
                    setFilterOptions(data);
                }
            } catch (error) {
                console.error('Failed to fetch filter options:', error);
            }
        }
        fetchFilterOptions();
    }, []);

    // Fetch stats
    useEffect(() => {
        async function fetchStats() {
            setStatsLoading(true);
            try {
                const res = await fetch('/api/admin/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_stats' })
                });
                const data = await res.json();
                if (res.ok) {
                    setStats(data);
                } else {
                    console.error('Stats API error:', data.error);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setStatsLoading(false);
            }
        }
        fetchStats();
    }, []);

    // Fetch users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', pagination.page.toString());
            params.set('limit', pagination.limit.toString());

            if (search) params.set('search', search);
            if (location) params.set('location', location);
            if (minExperience) params.set('minExperience', minExperience);
            if (maxExperience) params.set('maxExperience', maxExperience);
            if (education) params.set('education', education);
            if (currentTitle) params.set('currentTitle', currentTitle);
            if (availabilityStatus) params.set('availabilityStatus', availabilityStatus);
            if (plan) params.set('plan', plan);
            selectedSkills.forEach(skill => params.append('skills', skill));
            selectedIndustries.forEach(ind => params.append('industries', ind));

            const res = await fetch(`/api/admin/data?${params.toString()}`);
            const data = await res.json();

            if (res.ok) {
                setUsers(data.users || []);
                setPagination(prev => ({ ...prev, ...data.pagination }));
            } else {
                console.error('API error:', data.error || 'Unknown error');
                toast.error(data.error || (isArabic ? 'فشل في تحميل البيانات' : 'Failed to load data'));
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error(isArabic ? 'فشل في تحميل البيانات' : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, location, minExperience, maxExperience, selectedSkills, education, currentTitle, selectedIndustries, availabilityStatus, plan, isArabic]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(debounce);
    }, [fetchUsers]);

    // Export function
    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            params.set('export', 'csv');
            params.set('limit', '10000');

            if (search) params.set('search', search);
            if (location) params.set('location', location);
            if (minExperience) params.set('minExperience', minExperience);
            if (maxExperience) params.set('maxExperience', maxExperience);
            if (education) params.set('education', education);
            if (currentTitle) params.set('currentTitle', currentTitle);
            if (availabilityStatus) params.set('availabilityStatus', availabilityStatus);
            if (plan) params.set('plan', plan);
            selectedSkills.forEach(skill => params.append('skills', skill));
            selectedIndustries.forEach(ind => params.append('industries', ind));

            const res = await fetch(`/api/admin/data?${params.toString()}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success(isArabic ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully');
            }
        } catch (error) {
            console.error('Export failed:', error);
            toast.error(isArabic ? 'فشل في تصدير البيانات' : 'Failed to export data');
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setSearch('');
        setLocation('');
        setMinExperience('');
        setMaxExperience('');
        setSelectedSkills([]);
        setEducation('');
        setCurrentTitle('');
        setSelectedIndustries([]);
        setAvailabilityStatus('');
        setPlan('');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedUsers.size === users.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(users.map(u => u.id)));
        }
    };

    const toggleSelectUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    // Availability status label
    const getAvailabilityLabel = (status: string) => {
        const labels: Record<string, { en: string; ar: string }> = {
            'open_to_offers': { en: 'Open to Offers', ar: 'مفتوح للعروض' },
            'actively_looking': { en: 'Actively Looking', ar: 'يبحث بنشاط' },
            'passive': { en: 'Passive', ar: 'سلبي' },
            'not_looking': { en: 'Not Looking', ar: 'لا يبحث' },
            'unknown': { en: 'Unknown', ar: 'غير معروف' },
        };
        return labels[status]?.[isArabic ? 'ar' : 'en'] || status;
    };

    const getAvailabilityColor = (status: string) => {
        switch (status) {
            case 'actively_looking': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'open_to_offers': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'passive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'not_looking': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const hasActiveFilters = search || location || minExperience || maxExperience || selectedSkills.length > 0 || education || currentTitle || selectedIndustries.length > 0 || availabilityStatus || plan;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {isArabic ? 'بيانات المستخدمين' : 'User Data'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isArabic
                            ? 'استعرض وصدّر بيانات المستخدمين الشاملة للعروض التجارية'
                            : 'Browse and export comprehensive user data for B2B offerings'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => fetchUsers()}>
                        <RefreshCw className="h-4 w-4 me-2" />
                        {isArabic ? 'تحديث' : 'Refresh'}
                    </Button>
                    <Button onClick={handleExport}>
                        <Download className="h-4 w-4 me-2" />
                        {isArabic ? 'تصدير CSV' : 'Export CSV'}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {isArabic ? 'إجمالي المستخدمين' : 'Total Users'}
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {isArabic ? 'لديهم ملفات موهبة' : 'With Talent Profiles'}
                        </CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <div className="text-2xl font-bold">{stats?.usersWithProfiles?.toLocaleString() || 0}</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {isArabic ? 'لديهم سير ذاتية' : 'With Resumes'}
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <div className="text-2xl font-bold">{stats?.usersWithResumes?.toLocaleString() || 0}</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {isArabic ? 'نتائج الفلترة' : 'Filtered Results'}
                        </CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pagination.total.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Skills & Locations */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                {isArabic ? 'أعلى المهارات' : 'Top Skills'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {stats.topSkills.slice(0, 10).map((item, i) => (
                                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => {
                                        if (!selectedSkills.includes(item.skill)) {
                                            setSelectedSkills([...selectedSkills, item.skill]);
                                        }
                                    }}>
                                        {item.skill} ({item.count})
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                {isArabic ? 'أعلى المواقع' : 'Top Locations'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {stats.locationDistribution.slice(0, 10).map((item, i) => (
                                    <Badge key={i} variant="outline" className="cursor-pointer" onClick={() => setLocation(item.location || '')}>
                                        <MapPin className="h-3 w-3 me-1" />
                                        {item.location} ({item.count})
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search & Filters */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={isArabic ? 'بحث بالاسم، البريد، الموقع، المسمى...' : 'Search by name, email, location, title...'}
                                className="ps-10"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={showFilters ? 'default' : 'outline'}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="h-4 w-4 me-2" />
                                {isArabic ? 'الفلاتر' : 'Filters'}
                                {hasActiveFilters && (
                                    <Badge variant="secondary" className="ms-2">
                                        {[location, minExperience || maxExperience, selectedSkills.length > 0, education, currentTitle, selectedIndustries.length > 0, availabilityStatus, plan].filter(Boolean).length}
                                    </Badge>
                                )}
                            </Button>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    <X className="h-4 w-4 me-1" />
                                    {isArabic ? 'مسح' : 'Clear'}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                {/* Expanded Filters */}
                {showFilters && (
                    <CardContent className="border-t">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-4">
                            {/* Location */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{isArabic ? 'الموقع' : 'Location'}</label>
                                <Select value={location} onValueChange={setLocation}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={isArabic ? 'اختر موقع' : 'Select location'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">{isArabic ? 'الكل' : 'All'}</SelectItem>
                                        {filterOptions?.locations.map((loc) => (
                                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Experience Range */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{isArabic ? 'سنوات الخبرة' : 'Years of Experience'}</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder={isArabic ? 'من' : 'Min'}
                                        value={minExperience}
                                        onChange={(e) => setMinExperience(e.target.value)}
                                        min="0"
                                        className="w-full"
                                    />
                                    <Input
                                        type="number"
                                        placeholder={isArabic ? 'إلى' : 'Max'}
                                        value={maxExperience}
                                        onChange={(e) => setMaxExperience(e.target.value)}
                                        min="0"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Education */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{isArabic ? 'التعليم' : 'Education'}</label>
                                <Select value={education} onValueChange={setEducation}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={isArabic ? 'اختر مستوى' : 'Select level'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">{isArabic ? 'الكل' : 'All'}</SelectItem>
                                        {filterOptions?.educationLevels.map((edu) => (
                                            <SelectItem key={edu} value={edu}>{edu}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Plan */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{isArabic ? 'الخطة' : 'Plan'}</label>
                                <Select value={plan} onValueChange={setPlan}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={isArabic ? 'اختر خطة' : 'Select plan'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">{isArabic ? 'الكل' : 'All'}</SelectItem>
                                        <SelectItem value="FREE">{isArabic ? 'مجاني' : 'Free'}</SelectItem>
                                        <SelectItem value="PRO">{isArabic ? 'برو' : 'Pro'}</SelectItem>
                                        <SelectItem value="ENTERPRISE">{isArabic ? 'المؤسسات' : 'Enterprise'}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Current Title */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{isArabic ? 'المسمى الوظيفي' : 'Job Title'}</label>
                                <Select value={currentTitle} onValueChange={setCurrentTitle}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={isArabic ? 'اختر مسمى' : 'Select title'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">{isArabic ? 'الكل' : 'All'}</SelectItem>
                                        {filterOptions?.titles.slice(0, 50).map((title) => (
                                            <SelectItem key={title} value={title}>{title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Availability */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{isArabic ? 'التوفر' : 'Availability'}</label>
                                <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={isArabic ? 'اختر حالة' : 'Select status'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">{isArabic ? 'الكل' : 'All'}</SelectItem>
                                        {filterOptions?.availabilityStatuses.map((status) => (
                                            <SelectItem key={status} value={status}>{getAvailabilityLabel(status)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Skills Multi-select */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">{isArabic ? 'المهارات' : 'Skills'}</label>
                                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                                    {selectedSkills.map((skill) => (
                                        <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}>
                                            {skill}
                                            <X className="h-3 w-3 ms-1" />
                                        </Badge>
                                    ))}
                                    <Select onValueChange={(skill) => {
                                        if (skill && !selectedSkills.includes(skill)) {
                                            setSelectedSkills([...selectedSkills, skill]);
                                        }
                                    }}>
                                        <SelectTrigger className="w-auto border-0 shadow-none h-6 px-2">
                                            <span className="text-muted-foreground text-sm">+ {isArabic ? 'إضافة مهارة' : 'Add skill'}</span>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filterOptions?.skills.filter(s => !selectedSkills.includes(s)).slice(0, 30).map((skill) => (
                                                <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Data Table */}
            <Card>
                <CardContent className="p-0">
                    {/* Bulk Actions Bar */}
                    {selectedUsers.size > 0 && (
                        <div className="bg-muted/50 p-3 border-b flex items-center justify-between">
                            <span className="text-sm">
                                {isArabic
                                    ? `تم تحديد ${selectedUsers.size} مستخدم`
                                    : `${selectedUsers.size} users selected`}
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setSelectedUsers(new Set())}>
                                    {isArabic ? 'إلغاء التحديد' : 'Clear selection'}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={users.length > 0 && selectedUsers.size === users.length}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>{isArabic ? 'المستخدم' : 'User'}</TableHead>
                                    <TableHead>{isArabic ? 'المسمى / الشركة' : 'Title / Company'}</TableHead>
                                    <TableHead>{isArabic ? 'الموقع' : 'Location'}</TableHead>
                                    <TableHead>{isArabic ? 'الخبرة' : 'Experience'}</TableHead>
                                    <TableHead>{isArabic ? 'المهارات' : 'Skills'}</TableHead>
                                    <TableHead>{isArabic ? 'التوفر' : 'Availability'}</TableHead>
                                    <TableHead>{isArabic ? 'الخطة' : 'Plan'}</TableHead>
                                    <TableHead>{isArabic ? 'انضم' : 'Joined'}</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 10 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                            <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                                            {isArabic ? 'لا توجد نتائج مطابقة للفلاتر' : 'No results match your filters'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                                            setSelectedUser(user);
                                            setShowDetailModal(true);
                                        }}>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedUsers.has(user.id)}
                                                    onCheckedChange={() => toggleSelectUser(user.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
                                                        {user.image ? (
                                                            <img src={user.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                                                        ) : (
                                                            user.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium truncate">{user.name}</div>
                                                        <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="min-w-0">
                                                    <div className="truncate">{user.currentTitle || '-'}</div>
                                                    {user.currentCompany && (
                                                        <div className="text-sm text-muted-foreground truncate">{user.currentCompany}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {user.location ? (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        <span className="truncate">{user.location}</span>
                                                    </div>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {user.yearsExperience !== null ? (
                                                    <span>{user.yearsExperience} {isArabic ? 'سنة' : 'yrs'}</span>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {user.skills.slice(0, 3).map((skill, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                    {user.skills.length > 3 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            +{user.skills.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getAvailabilityColor(user.availabilityStatus)}>
                                                    {getAvailabilityLabel(user.availabilityStatus)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.plan === 'PRO' ? 'default' : user.plan === 'ENTERPRISE' ? 'default' : 'secondary'}>
                                                    {user.plan}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(new Date(user.createdAt), 'MMM d, yyyy', { locale: isArabic ? ar : enUS })}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowDetailModal(true);
                                                        }}>
                                                            <Eye className="h-4 w-4 me-2" />
                                                            {isArabic ? 'عرض التفاصيل' : 'View Details'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => window.open(`mailto:${user.email}`)}>
                                                            <Mail className="h-4 w-4 me-2" />
                                                            {isArabic ? 'إرسال بريد' : 'Send Email'}
                                                        </DropdownMenuItem>
                                                        {user.linkedinUrl && (
                                                            <DropdownMenuItem onClick={() => window.open(user.linkedinUrl, '_blank')}>
                                                                <Linkedin className="h-4 w-4 me-2" />
                                                                LinkedIn
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
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            {isArabic
                                ? `عرض ${((pagination.page - 1) * pagination.limit) + 1} إلى ${Math.min(pagination.page * pagination.limit, pagination.total)} من ${pagination.total}`
                                : `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                                {isArabic
                                    ? `صفحة ${pagination.page} من ${pagination.totalPages}`
                                    : `Page ${pagination.page} of ${pagination.totalPages}`}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* User Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedUser && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-lg font-medium text-white">
                                        {selectedUser.image ? (
                                            <img src={selectedUser.image} alt="" className="h-12 w-12 rounded-full object-cover" />
                                        ) : (
                                            selectedUser.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div>{selectedUser.name}</div>
                                        <div className="text-sm font-normal text-muted-foreground">{selectedUser.email}</div>
                                    </div>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                                {/* Quick Actions */}
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${selectedUser.email}`)}>
                                        <Mail className="h-4 w-4 me-2" />
                                        {isArabic ? 'بريد إلكتروني' : 'Email'}
                                    </Button>
                                    {selectedUser.phone && (
                                        <Button variant="outline" size="sm" onClick={() => window.open(`tel:${selectedUser.phone}`)}>
                                            {isArabic ? 'اتصال' : 'Call'}
                                        </Button>
                                    )}
                                    {selectedUser.linkedinUrl && (
                                        <Button variant="outline" size="sm" onClick={() => window.open(selectedUser.linkedinUrl, '_blank')}>
                                            <Linkedin className="h-4 w-4 me-2" />
                                            LinkedIn
                                        </Button>
                                    )}
                                    {selectedUser.website && (
                                        <Button variant="outline" size="sm" onClick={() => window.open(selectedUser.website, '_blank')}>
                                            <Globe className="h-4 w-4 me-2" />
                                            {isArabic ? 'الموقع' : 'Website'}
                                        </Button>
                                    )}
                                </div>

                                {/* Profile Info */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Briefcase className="h-4 w-4" />
                                            {isArabic ? 'المسمى الوظيفي' : 'Job Title'}
                                        </div>
                                        <div className="font-medium">{selectedUser.currentTitle || '-'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Building2 className="h-4 w-4" />
                                            {isArabic ? 'الشركة' : 'Company'}
                                        </div>
                                        <div className="font-medium">{selectedUser.currentCompany || '-'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {isArabic ? 'الموقع' : 'Location'}
                                        </div>
                                        <div className="font-medium">{selectedUser.location || '-'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {isArabic ? 'الخبرة' : 'Experience'}
                                        </div>
                                        <div className="font-medium">
                                            {selectedUser.yearsExperience !== null
                                                ? `${selectedUser.yearsExperience} ${isArabic ? 'سنة' : 'years'}`
                                                : '-'}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <GraduationCap className="h-4 w-4" />
                                            {isArabic ? 'التعليم' : 'Education'}
                                        </div>
                                        <div className="font-medium">{selectedUser.education || '-'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-muted-foreground">
                                            {isArabic ? 'التوفر' : 'Availability'}
                                        </div>
                                        <Badge className={getAvailabilityColor(selectedUser.availabilityStatus)}>
                                            {getAvailabilityLabel(selectedUser.availabilityStatus)}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Salary & Notice */}
                                {(selectedUser.salaryRange || selectedUser.noticePeriod) && (
                                    <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                                        {selectedUser.salaryRange && (
                                            <div className="space-y-1">
                                                <div className="text-sm text-muted-foreground">
                                                    {isArabic ? 'نطاق الراتب المتوقع' : 'Expected Salary Range'}
                                                </div>
                                                <div className="font-medium">{selectedUser.salaryRange}</div>
                                            </div>
                                        )}
                                        {selectedUser.noticePeriod && (
                                            <div className="space-y-1">
                                                <div className="text-sm text-muted-foreground">
                                                    {isArabic ? 'فترة الإشعار' : 'Notice Period'}
                                                </div>
                                                <div className="font-medium">{selectedUser.noticePeriod}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Skills */}
                                {selectedUser.skills.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t">
                                        <div className="text-sm text-muted-foreground">{isArabic ? 'المهارات' : 'Skills'}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUser.skills.map((skill, i) => (
                                                <Badge key={i} variant="secondary">{skill}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Languages */}
                                {selectedUser.languages.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t">
                                        <div className="text-sm text-muted-foreground">{isArabic ? 'اللغات' : 'Languages'}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUser.languages.map((lang, i) => (
                                                <Badge key={i} variant="outline">{lang}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Industries & Desired Roles */}
                                {(selectedUser.industries.length > 0 || selectedUser.desiredRoles.length > 0) && (
                                    <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                                        {selectedUser.industries.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-sm text-muted-foreground">{isArabic ? 'الصناعات المفضلة' : 'Preferred Industries'}</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedUser.industries.map((ind, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">{ind}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {selectedUser.desiredRoles.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-sm text-muted-foreground">{isArabic ? 'الأدوار المطلوبة' : 'Desired Roles'}</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedUser.desiredRoles.map((role, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">{role}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Account Info */}
                                <div className="grid gap-4 md:grid-cols-3 pt-2 border-t">
                                    <div className="space-y-1">
                                        <div className="text-sm text-muted-foreground">{isArabic ? 'الخطة' : 'Plan'}</div>
                                        <Badge variant={selectedUser.plan === 'PRO' ? 'default' : 'secondary'}>
                                            {selectedUser.plan}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-muted-foreground">{isArabic ? 'السير الذاتية' : 'Resumes'}</div>
                                        <div className="font-medium">{selectedUser.resumeCount}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-muted-foreground">{isArabic ? 'المقابلات' : 'Interviews'}</div>
                                        <div className="font-medium">{selectedUser.interviewCount}</div>
                                    </div>
                                </div>

                                {/* Joined */}
                                <div className="text-sm text-muted-foreground pt-2 border-t">
                                    {isArabic ? 'انضم في' : 'Joined'}: {format(new Date(selectedUser.createdAt), 'PPP', { locale: isArabic ? ar : enUS })}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
