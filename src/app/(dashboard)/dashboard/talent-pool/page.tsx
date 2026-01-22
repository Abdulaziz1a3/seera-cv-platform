'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { useResumes } from '@/components/providers/resume-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    Users,
    Eye,
    EyeOff,
    Shield,
    Briefcase,
    MapPin,
    Building2,
    CheckCircle2,
    TrendingUp,
    MessageSquare,
    Settings2,
    Sparkles,
    Loader2,
    LogOut,
    Crown,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { GCC_LOCATIONS } from '@/lib/talent-marketplace';

type TalentProfile = {
    id: string;
    resumeId: string;
    isVisible: boolean;
    availabilityStatus: string;
    hideCurrentEmployer: boolean;
    hideSalaryHistory: boolean;
    verifiedCompaniesOnly: boolean;
    desiredRoles: string[];
    desiredSalaryMin: number | null;
    desiredSalaryMax: number | null;
    noticePeriod: string | null;
    preferredLocations: string[];
    preferredIndustries: string[];
    resume?: { id: string; title: string } | null;
};

export default function TalentPoolPage() {
    const { locale } = useLocale();
    const { resumes, isLoading: resumesLoading } = useResumes();

    // State
    const [profile, setProfile] = useState<TalentProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [hasAccess, setHasAccess] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [selectedResumeId, setSelectedResumeId] = useState<string>('');
    const [isVisible, setIsVisible] = useState(true);
    const [availabilityStatus, setAvailabilityStatus] = useState<string>('open_to_offers');
    const [hideCurrentEmployer, setHideCurrentEmployer] = useState(false);
    const [hideSalaryHistory, setHideSalaryHistory] = useState(true);
    const [verifiedCompaniesOnly, setVerifiedCompaniesOnly] = useState(false);
    const [blockedCompanies, setBlockedCompanies] = useState<string>('');
    const [desiredRoles, setDesiredRoles] = useState<string>('');
    const [desiredSalaryMin, setDesiredSalaryMin] = useState<string>('');
    const [desiredSalaryMax, setDesiredSalaryMax] = useState<string>('');
    const [willingToRelocate, setWillingToRelocate] = useState(false);
    const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
    const [noticePeriod, setNoticePeriod] = useState<string>('2_weeks');
    const [preferredIndustries, setPreferredIndustries] = useState<string[]>([]);

    const isJoined = !!profile;

    // Load profile
    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/talent-pool/profile');

            // Handle 403 specifically (subscription required)
            if (res.status === 403) {
                setHasAccess(false);
                setIsLoading(false);
                return;
            }

            // Try to parse JSON response
            let data;
            try {
                data = await res.json();
            } catch {
                // If JSON parsing fails, set a generic error
                throw new Error(locale === 'ar' ? 'فشل في تحميل الملف الشخصي' : 'Failed to load profile');
            }

            if (!res.ok) {
                throw new Error(data?.error || (locale === 'ar' ? 'فشل في تحميل الملف الشخصي' : 'Failed to load profile'));
            }

            // Successfully loaded - update state with profile data
            if (data?.profile) {
                const p = data.profile;
                setProfile(p);
                setSelectedResumeId(p.resumeId || '');
                setIsVisible(Boolean(p.isVisible));
                setAvailabilityStatus(p.availabilityStatus || 'open_to_offers');
                setHideCurrentEmployer(Boolean(p.hideCurrentEmployer));
                setHideSalaryHistory(Boolean(p.hideSalaryHistory));
                setVerifiedCompaniesOnly(Boolean(p.verifiedCompaniesOnly));
                setDesiredRoles((p.desiredRoles || []).join(', '));
                setDesiredSalaryMin(p.desiredSalaryMin ? String(p.desiredSalaryMin) : '');
                setDesiredSalaryMax(p.desiredSalaryMax ? String(p.desiredSalaryMax) : '');
                setNoticePeriod(p.noticePeriod || '2_weeks');
                setPreferredLocations(p.preferredLocations || []);
                setPreferredIndustries(p.preferredIndustries || []);
            } else {
                // No profile yet - that's okay, user can create one
                setProfile(null);
            }
        } catch (err) {
            console.error('Talent pool load error:', err);
            const message = err instanceof Error ? err.message : (locale === 'ar' ? 'فشل في تحميل الملف الشخصي' : 'Failed to load profile');
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }, [locale]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // Join or update profile
    const handleSave = async () => {
        if (!selectedResumeId) {
            toast.error(locale === 'ar' ? 'يرجى اختيار سيرة ذاتية' : 'Please select a resume first');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/talent-pool/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeId: selectedResumeId,
                    isVisible,
                    availabilityStatus,
                    hideCurrentEmployer,
                    hideSalaryHistory,
                    verifiedCompaniesOnly,
                    desiredRoles: desiredRoles.split(',').map((r) => r.trim()).filter(Boolean),
                    desiredSalaryMin: desiredSalaryMin ? Number(desiredSalaryMin) : null,
                    desiredSalaryMax: desiredSalaryMax ? Number(desiredSalaryMax) : null,
                    noticePeriod: noticePeriod || null,
                    preferredLocations,
                    preferredIndustries,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || 'Failed to save');
            }

            setProfile(data.profile);
            toast.success(
                isJoined
                    ? (locale === 'ar' ? 'تم حفظ التغييرات' : 'Changes saved!')
                    : (locale === 'ar' ? 'تم الانضمام لمجموعة المواهب!' : 'Joined the Talent Pool!')
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    // Leave the pool
    const handleLeavePool = async () => {
        setIsLeaving(true);
        try {
            const res = await fetch('/api/talent-pool/profile', {
                method: 'DELETE',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || 'Failed to leave');
            }

            setProfile(null);
            setSelectedResumeId('');
            toast.success(locale === 'ar' ? 'غادرت مجموعة المواهب' : 'Left the Talent Pool');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to leave';
            toast.error(message);
        } finally {
            setIsLeaving(false);
        }
    };

    // No access - show upgrade prompt
    if (!hasAccess) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                            <Crown className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">
                            {locale === 'ar' ? 'ميزة للمشتركين' : 'Pro Feature'}
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                            {locale === 'ar'
                                ? 'مجموعة المواهب متاحة للمشتركين في الباقة الاحترافية. قم بالترقية لعرض ملفك للشركات.'
                                : 'Talent Pool is available for Pro subscribers. Upgrade to make your profile visible to companies.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg" className="w-full">
                            <Link href="/dashboard/billing">
                                <Sparkles className="h-5 w-5 me-2" />
                                {locale === 'ar' ? 'الترقية الآن' : 'Upgrade to Pro'}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Loading state
    if (isLoading || resumesLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col">
                <div className="border-b bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-transparent px-6 py-6">
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-5 w-72 mt-2" />
                </div>
                <div className="flex-1 p-6">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <Skeleton className="h-64 w-full rounded-xl" />
                        <Skeleton className="h-48 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !profile) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <CardTitle>{locale === 'ar' ? 'حدث خطأ' : 'Something went wrong'}</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={loadProfile} variant="outline">
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            {locale === 'ar' ? 'مجموعة المواهب' : 'Talent Pool'}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {locale === 'ar'
                                ? 'اجعل سيرتك الذاتية مرئية لأفضل الشركات في الخليج'
                                : 'Make your resume visible to top GCC companies'}
                        </p>
                    </div>

                    {isJoined && (
                        <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'عضو نشط' : 'Active Member'}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex-1 p-6">
                {!isJoined ? (
                    /* Onboarding - Not yet joined */
                    <div className="max-w-2xl mx-auto space-y-8">
                        <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-900">
                            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white">
                                <h2 className="text-2xl font-bold">
                                    {locale === 'ar' ? 'انضم لمجموعة المواهب' : 'Join the Talent Pool'}
                                </h2>
                                <p className="mt-2 opacity-90">
                                    {locale === 'ar'
                                        ? 'دع الشركات الكبرى تجدك وتتواصل معك مباشرة'
                                        : 'Let top companies find you and reach out directly'}
                                </p>
                            </div>
                            <CardContent className="p-6">
                                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                    {[
                                        { icon: Building2, title: locale === 'ar' ? '500+ شركة' : '500+ Companies', desc: locale === 'ar' ? 'تبحث عن مواهب' : 'Actively hiring' },
                                        { icon: Eye, title: locale === 'ar' ? 'ظهور للشركات' : 'Get Discovered', desc: locale === 'ar' ? 'بدون رسوم إضافية' : 'Included in Pro' },
                                        { icon: Shield, title: locale === 'ar' ? 'خصوصية تامة' : 'Full Privacy', desc: locale === 'ar' ? 'تحكم في ما يظهر' : 'Control what shows' },
                                        { icon: MessageSquare, title: locale === 'ar' ? 'تواصل مباشر' : 'Direct Messages', desc: locale === 'ar' ? 'من مسؤولي التوظيف' : 'From recruiters' },
                                    ].map((item) => (
                                        <div key={item.title} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                                            <item.icon className="h-5 w-5 text-purple-500" />
                                            <div>
                                                <p className="font-medium text-sm">{item.title}</p>
                                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {locale === 'ar' ? 'اختر السيرة الذاتية' : 'Select Resume to Share'}
                                        </label>
                                        <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={locale === 'ar' ? 'اختر سيرة ذاتية' : 'Choose a resume'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {resumes.map((resume) => (
                                                    <SelectItem key={resume.id} value={resume.id}>
                                                        {resume.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {resumes.length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                {locale === 'ar'
                                                    ? 'لا توجد سير ذاتية. أنشئ واحدة أولاً.'
                                                    : 'No resumes found. Create one first.'}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                                        onClick={handleSave}
                                        disabled={isSaving || !selectedResumeId}
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-5 w-5 me-2 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-5 w-5 me-2" />
                                        )}
                                        {locale === 'ar' ? 'انضم الآن' : 'Join Now'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* How it works */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{locale === 'ar' ? 'كيف تعمل؟' : 'How It Works'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[
                                        { step: 1, title: locale === 'ar' ? 'انضم' : 'Join', desc: locale === 'ar' ? 'شارك سيرتك الذاتية' : 'Share your resume' },
                                        { step: 2, title: locale === 'ar' ? 'اضبط' : 'Configure', desc: locale === 'ar' ? 'حدد إعدادات الخصوصية' : 'Set privacy preferences' },
                                        { step: 3, title: locale === 'ar' ? 'انتظر' : 'Get Found', desc: locale === 'ar' ? 'الشركات تجدك' : 'Companies discover you' },
                                        { step: 4, title: locale === 'ar' ? 'تواصل' : 'Connect', desc: locale === 'ar' ? 'استقبل العروض' : 'Receive offers' },
                                    ].map((item) => (
                                        <div key={item.step} className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center font-bold text-purple-600">
                                                {item.step}
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.title}</p>
                                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    /* Dashboard - Already joined */
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: Eye, label: locale === 'ar' ? 'مشاهدات الملف' : 'Profile Views', value: 0, color: 'text-blue-500' },
                                { icon: Users, label: locale === 'ar' ? 'فتح الملف' : 'Unlocks', value: 0, color: 'text-green-500' },
                                { icon: MessageSquare, label: locale === 'ar' ? 'رسائل' : 'Messages', value: 0, color: 'text-purple-500' },
                                { icon: TrendingUp, label: locale === 'ar' ? 'ظهور في البحث' : 'Search Appearances', value: 0, color: 'text-amber-500' },
                            ].map((stat) => (
                                <Card key={stat.label}>
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                                                <stat.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold">{stat.value}</p>
                                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {locale === 'ar'
                                ? 'ستظهر الإحصاءات بمجرد تفاعل الشركات مع ملفك.'
                                : 'Stats will appear once recruiters interact with your profile.'}
                        </p>

                        {/* Settings Tabs */}
                        <Tabs defaultValue="visibility">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="visibility">
                                    <Eye className="h-4 w-4 me-2" />
                                    {locale === 'ar' ? 'الظهور' : 'Visibility'}
                                </TabsTrigger>
                                <TabsTrigger value="privacy">
                                    <Shield className="h-4 w-4 me-2" />
                                    {locale === 'ar' ? 'الخصوصية' : 'Privacy'}
                                </TabsTrigger>
                                <TabsTrigger value="preferences">
                                    <Settings2 className="h-4 w-4 me-2" />
                                    {locale === 'ar' ? 'التفضيلات' : 'Preferences'}
                                </TabsTrigger>
                            </TabsList>

                            {/* Visibility Tab */}
                            <TabsContent value="visibility">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{locale === 'ar' ? 'إعدادات الظهور' : 'Visibility Settings'}</CardTitle>
                                        <CardDescription>
                                            {locale === 'ar' ? 'تحكم في كيفية ظهورك للشركات' : 'Control how you appear to companies'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Active Toggle */}
                                        <div className="flex items-center justify-between p-4 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                {isVisible ? (
                                                    <Eye className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                                                )}
                                                <div>
                                                    <p className="font-medium">
                                                        {locale === 'ar' ? 'ملفي مرئي للشركات' : 'My Profile is Visible'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {isVisible
                                                            ? (locale === 'ar' ? 'الشركات يمكنها رؤية ملفك' : 'Companies can see your profile')
                                                            : (locale === 'ar' ? 'ملفك مخفي حالياً' : 'Your profile is hidden')}
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
                                        </div>

                                        {/* Availability Status */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'حالة التوفر' : 'Availability Status'}
                                            </label>
                                            <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="actively_looking">
                                                        🟢 {locale === 'ar' ? 'أبحث عن عمل بشكل نشط' : 'Actively Looking'}
                                                    </SelectItem>
                                                    <SelectItem value="open_to_offers">
                                                        🟡 {locale === 'ar' ? 'منفتح على العروض' : 'Open to Offers'}
                                                    </SelectItem>
                                                    <SelectItem value="not_looking">
                                                        🔴 {locale === 'ar' ? 'غير متاح حالياً' : 'Not Looking'}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Resume Selection */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'السيرة الذاتية المعروضة' : 'Displayed Resume'}
                                            </label>
                                            <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {resumes.map((resume) => (
                                                        <SelectItem key={resume.id} value={resume.id}>
                                                            {resume.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button onClick={handleSave} disabled={isSaving}>
                                            {isSaving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                                            {locale === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Privacy Tab */}
                            <TabsContent value="privacy">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{locale === 'ar' ? 'إعدادات الخصوصية' : 'Privacy Settings'}</CardTitle>
                                        <CardDescription>
                                            {locale === 'ar' ? 'تحكم في المعلومات التي تظهر' : 'Control what information is visible'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                                <div>
                                                    <p className="font-medium">{locale === 'ar' ? 'إخفاء صاحب العمل الحالي' : 'Hide Current Employer'}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'لن يظهر اسم شركتك الحالية' : "Your current company name won't be shown"}
                                                    </p>
                                                </div>
                                                <Switch checked={hideCurrentEmployer} onCheckedChange={setHideCurrentEmployer} />
                                            </div>

                                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                                <div>
                                                    <p className="font-medium">{locale === 'ar' ? 'إخفاء سجل الراتب' : 'Hide Salary History'}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'لن تظهر رواتبك السابقة' : "Your previous salaries won't be shown"}
                                                    </p>
                                                </div>
                                                <Switch checked={hideSalaryHistory} onCheckedChange={setHideSalaryHistory} />
                                            </div>

                                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                                <div>
                                                    <p className="font-medium">{locale === 'ar' ? 'شركات موثقة فقط' : 'Verified Companies Only'}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'فقط الشركات الموثقة يمكنها رؤية ملفك' : 'Only verified companies can see your profile'}
                                                    </p>
                                                </div>
                                                <Switch checked={verifiedCompaniesOnly} onCheckedChange={setVerifiedCompaniesOnly} />
                                            </div>
                                        </div>

                                        {/* Blocked Companies */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'حظر شركات معينة' : 'Block Specific Companies'}
                                            </label>
                                            <Textarea
                                                placeholder={locale === 'ar' ? 'اكتب أسماء الشركات، واحدة في كل سطر' : 'Enter company names, one per line'}
                                                value={blockedCompanies}
                                                onChange={(e) => setBlockedCompanies(e.target.value)}
                                                rows={3}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {locale === 'ar' ? 'هذه الشركات لن ترى ملفك أبداً' : 'These companies will never see your profile'}
                                            </p>
                                        </div>

                                        <Button onClick={handleSave} disabled={isSaving}>
                                            {isSaving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                                            {locale === 'ar' ? 'حفظ إعدادات الخصوصية' : 'Save Privacy Settings'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Preferences Tab */}
                            <TabsContent value="preferences">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{locale === 'ar' ? 'تفضيلات العمل' : 'Job Preferences'}</CardTitle>
                                        <CardDescription>
                                            {locale === 'ar' ? 'ساعد الشركات على فهم ما تبحث عنه' : "Help companies understand what you're looking for"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Desired Roles */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'المناصب المطلوبة' : 'Desired Job Titles'}
                                            </label>
                                            <Input
                                                placeholder={locale === 'ar' ? 'مثال: مهندس برمجيات، مدير منتجات' : 'e.g., Software Engineer, Product Manager'}
                                                value={desiredRoles}
                                                onChange={(e) => setDesiredRoles(e.target.value)}
                                            />
                                        </div>

                                        {/* Salary Range */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'الراتب المتوقع (ريال شهرياً)' : 'Expected Salary (SAR/month)'}
                                            </label>
                                            <div className="flex gap-4">
                                                <Input
                                                    type="number"
                                                    placeholder={locale === 'ar' ? 'الحد الأدنى' : 'Minimum'}
                                                    value={desiredSalaryMin}
                                                    onChange={(e) => setDesiredSalaryMin(e.target.value)}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder={locale === 'ar' ? 'الحد الأقصى' : 'Maximum'}
                                                    value={desiredSalaryMax}
                                                    onChange={(e) => setDesiredSalaryMax(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Notice Period */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'فترة الإشعار' : 'Notice Period'}
                                            </label>
                                            <Select value={noticePeriod} onValueChange={setNoticePeriod}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="immediate">{locale === 'ar' ? 'فوري' : 'Immediate'}</SelectItem>
                                                    <SelectItem value="1_week">{locale === 'ar' ? 'أسبوع' : '1 Week'}</SelectItem>
                                                    <SelectItem value="2_weeks">{locale === 'ar' ? 'أسبوعين' : '2 Weeks'}</SelectItem>
                                                    <SelectItem value="1_month">{locale === 'ar' ? 'شهر' : '1 Month'}</SelectItem>
                                                    <SelectItem value="2_months">{locale === 'ar' ? 'شهرين' : '2 Months'}</SelectItem>
                                                    <SelectItem value="3_months">{locale === 'ar' ? '3 أشهر' : '3 Months'}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Relocation */}
                                        <div className="flex items-center justify-between p-4 rounded-lg border">
                                            <div>
                                                <p className="font-medium">{locale === 'ar' ? 'مستعد للانتقال' : 'Willing to Relocate'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {locale === 'ar' ? 'هل أنت مستعد للانتقال لمدينة أخرى؟' : 'Are you open to relocating to another city?'}
                                                </p>
                                            </div>
                                            <Switch checked={willingToRelocate} onCheckedChange={setWillingToRelocate} />
                                        </div>

                                        {/* Preferred Locations */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'المواقع المفضلة' : 'Preferred Locations'}
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {GCC_LOCATIONS.map((loc) => (
                                                    <Badge
                                                        key={loc}
                                                        variant={preferredLocations.includes(loc) ? 'default' : 'outline'}
                                                        className="cursor-pointer"
                                                        onClick={() => {
                                                            setPreferredLocations((prev) =>
                                                                prev.includes(loc)
                                                                    ? prev.filter((l) => l !== loc)
                                                                    : [...prev, loc]
                                                            );
                                                        }}
                                                    >
                                                        {loc}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <Button onClick={handleSave} disabled={isSaving}>
                                            {isSaving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                                            {locale === 'ar' ? 'حفظ التفضيلات' : 'Save Preferences'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        {/* Leave Pool Section */}
                        <Card className="border-red-200 dark:border-red-900">
                            <CardHeader>
                                <CardTitle className="text-red-600">
                                    {locale === 'ar' ? 'مغادرة مجموعة المواهب' : 'Leave Talent Pool'}
                                </CardTitle>
                                <CardDescription>
                                    {locale === 'ar'
                                        ? 'سيتم حذف ملفك من مجموعة المواهب ولن تكون مرئياً للشركات.'
                                        : 'Your profile will be removed and you will no longer be visible to companies.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={isLeaving}>
                                            {isLeaving ? (
                                                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                            ) : (
                                                <LogOut className="h-4 w-4 me-2" />
                                            )}
                                            {locale === 'ar' ? 'مغادرة المجموعة' : 'Leave Pool'}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                {locale === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {locale === 'ar'
                                                    ? 'سيتم حذف ملفك من مجموعة المواهب. يمكنك الانضمام مرة أخرى في أي وقت.'
                                                    : 'Your profile will be removed from the Talent Pool. You can rejoin anytime.'}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                                            </AlertDialogCancel>
                                            <AlertDialogAction onClick={handleLeavePool} className="bg-red-600 hover:bg-red-700">
                                                {locale === 'ar' ? 'نعم، غادر' : 'Yes, Leave'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
