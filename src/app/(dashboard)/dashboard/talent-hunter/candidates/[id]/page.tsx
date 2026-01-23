'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    ArrowLeft,
    MapPin,
    Briefcase,
    GraduationCap,
    Clock,
    DollarSign,
    Building2,
    Zap,
    Star,
    BookmarkPlus,
    Eye,
    Mail,
    Phone,
    Globe,
    Linkedin,
    Users,
    FolderPlus,
    Calendar,
    Award,
    Code,
    Languages,
    ExternalLink,
    Loader2,
    AlertCircle,
    Crown,
    ChevronRight,
    Share2,
    MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

type CandidateDetail = {
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
    preferredIndustries: string[];
    desiredRoles: string[];
    createdAt: string;
    updatedAt: string;
    resume: {
        contact: {
            fullName: string;
            email: string;
            phone: string;
            location: string;
            linkedin: string;
            website: string;
        };
        summary: string;
        experience: Array<{
            company: string;
            position: string;
            location: string;
            startDate: string;
            endDate: string;
            description: string;
            highlights: string[];
        }>;
        education: Array<{
            institution: string;
            degree: string;
            field: string;
            graduationDate: string;
            gpa: string;
        }>;
        skills: string[];
        certifications: Array<{
            name: string;
            issuer: string;
            date: string;
            url: string;
        }>;
        projects: Array<{
            name: string;
            description: string;
            url: string;
            technologies: string[];
        }>;
        languages: Array<{
            language: string;
            proficiency: string;
        }>;
    } | null;
};

type Shortlist = {
    id: string;
    name: string;
    _count: { candidates: number };
};

const NOTICE_PERIODS: Record<string, { en: string; ar: string }> = {
    immediate: { en: 'Immediate', ar: 'فوري' },
    '1_week': { en: '1 Week', ar: 'أسبوع' },
    '2_weeks': { en: '2 Weeks', ar: 'أسبوعين' },
    '1_month': { en: '1 Month', ar: 'شهر' },
    '2_months': { en: '2 Months', ar: 'شهرين' },
    '3_months': { en: '3 Months', ar: '3 أشهر' },
};

export default function CandidateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { locale } = useLocale();
    const candidateId = params.id as string;

    const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
    const [shortlists, setShortlists] = useState<Shortlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog states
    const [isNewShortlistOpen, setIsNewShortlistOpen] = useState(false);
    const [newShortlistName, setNewShortlistName] = useState('');
    const [newShortlistDesc, setNewShortlistDesc] = useState('');

    const loadCandidate = useCallback(async () => {
        try {
            const res = await fetch(`/api/talent-hunter/candidates/${candidateId}`);

            if (res.status === 403) {
                setHasAccess(false);
                return;
            }

            if (res.status === 404) {
                setError(locale === 'ar' ? 'المرشح غير موجود' : 'Candidate not found');
                return;
            }

            if (!res.ok) throw new Error('Failed to load');

            const data = await res.json();
            setCandidate(data.candidate);

            // Load shortlists
            const shortlistsRes = await fetch('/api/talent-hunter/shortlists');
            if (shortlistsRes.ok) {
                const shortlistsData = await shortlistsRes.json();
                setShortlists(shortlistsData.shortlists || []);
            }
        } catch (err) {
            console.error('Load error:', err);
            setError(locale === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load candidate');
        } finally {
            setIsLoading(false);
        }
    }, [candidateId, locale]);

    useEffect(() => {
        loadCandidate();
    }, [loadCandidate]);

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
    const addToShortlist = async (shortlistId: string) => {
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
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'رجوع' : 'Go Back'}
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
                <div className="max-w-4xl mx-auto">
                    <Skeleton className="h-8 w-32 mb-6" />
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex gap-6">
                                <Skeleton className="h-24 w-24 rounded-2xl" />
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-8 w-64" />
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-5 w-32" />
                                </div>
                            </div>
                            <div className="mt-6 space-y-4">
                                <Skeleton className="h-40 w-full" />
                                <Skeleton className="h-60 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !candidate) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <CardTitle>{locale === 'ar' ? 'خطأ' : 'Error'}</CardTitle>
                        <CardDescription>{error || 'Something went wrong'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'رجوع' : 'Go Back'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getAvailabilityBadge = () => {
        switch (candidate.availabilityStatus) {
            case 'actively_looking':
                return (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1">
                        <Zap className="h-4 w-4 me-1" />
                        {locale === 'ar' ? 'يبحث بنشاط' : 'Actively Looking'}
                    </Badge>
                );
            case 'open_to_offers':
                return (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1">
                        {locale === 'ar' ? 'منفتح للعروض' : 'Open to Offers'}
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary" className="px-3 py-1">
                        {locale === 'ar' ? 'غير متاح' : 'Not Looking'}
                    </Badge>
                );
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] p-6">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 me-2" />
                    {locale === 'ar' ? 'العودة للبحث' : 'Back to Search'}
                </Button>

                {/* Main Profile Card */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Avatar */}
                            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold shrink-0 shadow-lg">
                                {candidate.displayName[0].toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div>
                                        <h1 className="text-2xl font-bold">{candidate.displayName}</h1>
                                        <p className="text-lg text-muted-foreground mt-1">
                                            {candidate.currentTitle || (locale === 'ar' ? 'باحث عن عمل' : 'Job Seeker')}
                                            {candidate.currentCompany && (
                                                <span className="text-muted-foreground/70">
                                                    {' '}{locale === 'ar' ? 'في' : 'at'} {candidate.currentCompany}
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                                            {getAvailabilityBadge()}
                                            {candidate.location && (
                                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <MapPin className="h-4 w-4" />
                                                    {candidate.location}
                                                </span>
                                            )}
                                            {candidate.yearsExperience !== null && (
                                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Briefcase className="h-4 w-4" />
                                                    {candidate.yearsExperience} {locale === 'ar' ? 'سنوات خبرة' : 'years exp.'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button>
                                                    <BookmarkPlus className="h-4 w-4 me-2" />
                                                    {locale === 'ar' ? 'إضافة للقائمة' : 'Add to List'}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {shortlists.length > 0 ? (
                                                    <>
                                                        {shortlists.map((list) => (
                                                            <DropdownMenuItem
                                                                key={list.id}
                                                                onClick={() => addToShortlist(list.id)}
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
                                                <DropdownMenuItem onClick={() => setIsNewShortlistOpen(true)}>
                                                    <FolderPlus className="h-4 w-4 me-2" />
                                                    {locale === 'ar' ? 'إنشاء قائمة جديدة' : 'Create New List'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Info Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            {candidate.noticePeriod && (
                                <div className="p-3 rounded-lg bg-muted">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <Clock className="h-4 w-4" />
                                        {locale === 'ar' ? 'فترة الإشعار' : 'Notice Period'}
                                    </div>
                                    <p className="font-semibold">
                                        {NOTICE_PERIODS[candidate.noticePeriod]?.[locale === 'ar' ? 'ar' : 'en'] || candidate.noticePeriod}
                                    </p>
                                </div>
                            )}
                            {(candidate.desiredSalaryMin || candidate.desiredSalaryMax) && (
                                <div className="p-3 rounded-lg bg-muted">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <DollarSign className="h-4 w-4" />
                                        {locale === 'ar' ? 'الراتب المتوقع' : 'Expected Salary'}
                                    </div>
                                    <p className="font-semibold">
                                        {candidate.desiredSalaryMin && candidate.desiredSalaryMax
                                            ? `${candidate.desiredSalaryMin.toLocaleString()} - ${candidate.desiredSalaryMax.toLocaleString()}`
                                            : candidate.desiredSalaryMin
                                                ? `${candidate.desiredSalaryMin.toLocaleString()}+`
                                                : `≤${candidate.desiredSalaryMax?.toLocaleString()}`}
                                        {' SAR'}
                                    </p>
                                </div>
                            )}
                            {candidate.education && (
                                <div className="p-3 rounded-lg bg-muted">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <GraduationCap className="h-4 w-4" />
                                        {locale === 'ar' ? 'التعليم' : 'Education'}
                                    </div>
                                    <p className="font-semibold truncate">{candidate.education}</p>
                                </div>
                            )}
                            {candidate.preferredLocations.length > 0 && (
                                <div className="p-3 rounded-lg bg-muted">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <MapPin className="h-4 w-4" />
                                        {locale === 'ar' ? 'المواقع المفضلة' : 'Preferred Locations'}
                                    </div>
                                    <p className="font-semibold truncate">{candidate.preferredLocations.slice(0, 2).join(', ')}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs Content */}
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">
                            {locale === 'ar' ? 'نظرة عامة' : 'Overview'}
                        </TabsTrigger>
                        <TabsTrigger value="experience">
                            {locale === 'ar' ? 'الخبرات' : 'Experience'}
                        </TabsTrigger>
                        <TabsTrigger value="education">
                            {locale === 'ar' ? 'التعليم' : 'Education'}
                        </TabsTrigger>
                        <TabsTrigger value="contact">
                            {locale === 'ar' ? 'التواصل' : 'Contact'}
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview">
                        <div className="grid gap-4">
                            {/* Summary */}
                            {candidate.summary && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            {locale === 'ar' ? 'الملخص' : 'Summary'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground whitespace-pre-wrap">
                                            {candidate.summary}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Skills */}
                            {candidate.skills.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            {locale === 'ar' ? 'المهارات' : 'Skills'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {candidate.skills.map((skill, idx) => (
                                                <Badge key={idx} variant="secondary" className="px-3 py-1">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Desired Roles */}
                            {candidate.desiredRoles.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            {locale === 'ar' ? 'المناصب المطلوبة' : 'Looking For'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {candidate.desiredRoles.map((role, idx) => (
                                                <Badge key={idx} variant="outline" className="px-3 py-1">
                                                    <Star className="h-3 w-3 me-1" />
                                                    {role}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Languages */}
                            {candidate.resume?.languages && candidate.resume.languages.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            {locale === 'ar' ? 'اللغات' : 'Languages'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-4">
                                            {candidate.resume.languages.map((lang, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <Languages className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{lang.language}</span>
                                                    {lang.proficiency && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {lang.proficiency}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Experience Tab */}
                    <TabsContent value="experience">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {locale === 'ar' ? 'الخبرات المهنية' : 'Work Experience'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {candidate.resume?.experience && candidate.resume.experience.length > 0 ? (
                                    <div className="space-y-6">
                                        {candidate.resume.experience.map((exp, idx) => (
                                            <div key={idx} className="relative ps-6 pb-6 border-s-2 border-muted last:pb-0">
                                                <div className="absolute -start-2 top-0 h-4 w-4 rounded-full bg-primary" />
                                                <div className="mb-2">
                                                    <h4 className="font-semibold">{exp.position}</h4>
                                                    <p className="text-muted-foreground flex items-center gap-2">
                                                        <Building2 className="h-4 w-4" />
                                                        {exp.company}
                                                        {exp.location && (
                                                            <>
                                                                <span className="text-muted-foreground/50">•</span>
                                                                {exp.location}
                                                            </>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                        <Calendar className="h-4 w-4" />
                                                        {exp.startDate} - {exp.endDate || (locale === 'ar' ? 'الحالي' : 'Present')}
                                                    </p>
                                                </div>
                                                {exp.description && (
                                                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                                                        {exp.description}
                                                    </p>
                                                )}
                                                {exp.highlights && exp.highlights.length > 0 && (
                                                    <ul className="mt-2 space-y-1">
                                                        {exp.highlights.map((h, i) => (
                                                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                                <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                                                                {h}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">
                                        {locale === 'ar' ? 'لا توجد خبرات مسجلة' : 'No experience listed'}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Certifications */}
                        {candidate.resume?.certifications && candidate.resume.certifications.length > 0 && (
                            <Card className="mt-4">
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        {locale === 'ar' ? 'الشهادات' : 'Certifications'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {candidate.resume.certifications.map((cert, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <Award className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-medium">{cert.name}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {cert.issuer}
                                                        {cert.date && ` • ${cert.date}`}
                                                    </p>
                                                    {cert.url && (
                                                        <a
                                                            href={cert.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-primary flex items-center gap-1 hover:underline mt-1"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            {locale === 'ar' ? 'عرض الشهادة' : 'View credential'}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Projects */}
                        {candidate.resume?.projects && candidate.resume.projects.length > 0 && (
                            <Card className="mt-4">
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        {locale === 'ar' ? 'المشاريع' : 'Projects'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {candidate.resume.projects.map((project, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <Code className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-medium">{project.name}</h4>
                                                    {project.description && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {project.description}
                                                        </p>
                                                    )}
                                                    {project.technologies && project.technologies.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {project.technologies.map((tech, i) => (
                                                                <Badge key={i} variant="outline" className="text-xs">
                                                                    {tech}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {project.url && (
                                                        <a
                                                            href={project.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-primary flex items-center gap-1 hover:underline mt-2"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            {locale === 'ar' ? 'عرض المشروع' : 'View project'}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Education Tab */}
                    <TabsContent value="education">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {locale === 'ar' ? 'التعليم' : 'Education'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {candidate.resume?.education && candidate.resume.education.length > 0 ? (
                                    <div className="space-y-6">
                                        {candidate.resume.education.map((edu, idx) => (
                                            <div key={idx} className="flex items-start gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                                    <GraduationCap className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold">{edu.institution}</h4>
                                                    <p className="text-muted-foreground">
                                                        {edu.degree}
                                                        {edu.field && ` in ${edu.field}`}
                                                    </p>
                                                    {edu.graduationDate && (
                                                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                            <Calendar className="h-4 w-4" />
                                                            {edu.graduationDate}
                                                        </p>
                                                    )}
                                                    {edu.gpa && (
                                                        <Badge variant="outline" className="mt-2">
                                                            GPA: {edu.gpa}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">
                                        {locale === 'ar' ? 'لا توجد معلومات تعليمية' : 'No education listed'}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Contact Tab */}
                    <TabsContent value="contact">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {locale === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {candidate.resume?.contact ? (
                                    <div className="space-y-4">
                                        {candidate.resume.contact.email && (
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                                                <Mail className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                                                    </p>
                                                    <a
                                                        href={`mailto:${candidate.resume.contact.email}`}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {candidate.resume.contact.email}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {candidate.resume.contact.phone && (
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                                                <Phone className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'الهاتف' : 'Phone'}
                                                    </p>
                                                    <a
                                                        href={`tel:${candidate.resume.contact.phone}`}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {candidate.resume.contact.phone}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {candidate.resume.contact.linkedin && (
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                                                <Linkedin className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">LinkedIn</p>
                                                    <a
                                                        href={candidate.resume.contact.linkedin}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-medium hover:underline flex items-center gap-1"
                                                    >
                                                        {locale === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {candidate.resume.contact.website && (
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                                                <Globe className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'الموقع الشخصي' : 'Website'}
                                                    </p>
                                                    <a
                                                        href={candidate.resume.contact.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-medium hover:underline flex items-center gap-1"
                                                    >
                                                        {candidate.resume.contact.website}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">
                                        {locale === 'ar' ? 'لا توجد معلومات تواصل' : 'No contact information available'}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
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
