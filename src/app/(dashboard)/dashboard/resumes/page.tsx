'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { useResumes } from '@/components/providers/resume-provider';
import { mapResumeRecordToResumeData } from '@/lib/resume-normalizer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    FileText,
    Plus,
    Search,
    Grid3X3,
    List,
    MoreVertical,
    Edit,
    Copy,
    Download,
    Trash2,
    Clock,
    Target,
    CheckCircle2,
    AlertCircle,
    Filter,
    ArrowUpDown,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function ResumesPage() {
    const { t, locale } = useLocale();
    const { resumes, isLoading, deleteResume, duplicateResume } = useResumes();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const resumesWithScores = resumes.map((resume) => ({
        ...resume,
        atsScore: resume.atsScore ?? 0,
        targetRole: resume.targetRole || (locale === 'ar' ? 'بدون مسمى وظيفي' : 'No target role'),
    }));

    const filteredResumes = resumesWithScores.filter(
        (resume) => {
            const targetRole = resume.targetRole || '';
            return (
                resume.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                targetRole.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
    );

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return locale === 'ar' ? 'غير محدد' : 'Unknown';
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return locale === 'ar' ? 'غير محدد' : 'Unknown';
        return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // Action handlers
    const handleDuplicate = async (id: string) => {
        try {
            const newId = await duplicateResume(id);
            if (!newId) {
                throw new Error('Failed to duplicate');
            }
        } catch (error) {
            console.error('Duplicate failed:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(locale === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete this resume?')) {
            try {
                await deleteResume(id);
            } catch (error) {
                console.error('Delete failed:', error);
            }
        }
    };

    const handleDownload = async (id: string) => {
        try {
            const response = await fetch(`/api/resumes/${id}`);
            if (!response.ok) {
                throw new Error('Failed to load resume');
            }
            const resume = await response.json();
            const exportResume = mapResumeRecordToResumeData(resume);
            const { downloadPDF } = await import('@/lib/templates/renderer');
            await downloadPDF(exportResume);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">{locale === 'ar' ? 'جار التحميل...' : 'Loading...'}</p>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-500/10';
        if (score >= 60) return 'bg-amber-500/10';
        return 'bg-red-500/10';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{t.nav.myResumes}</h1>
                    <p className="text-muted-foreground">
                        {locale === 'ar'
                            ? `${resumes.length} سيرة ذاتية`
                            : `${resumes.length} resumes`}
                    </p>
                </div>
                <Button asChild size="lg" className="shadow-lg">
                    <Link href="/dashboard/resumes/new">
                        <Plus className="h-5 w-5 me-2" />
                        {t.dashboard.newResume}
                    </Link>
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={locale === 'ar' ? 'البحث في السير الذاتية...' : 'Search resumes...'}
                        className="ps-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    <div className="flex border rounded-lg overflow-hidden">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="icon"
                            className="rounded-none"
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="icon"
                            className="rounded-none"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Resumes Grid/List */}
            {filteredResumes.length === 0 ? (
                <EmptyState
                    title={{
                        en: "Create your first Masterpiece",
                        ar: "أنشئ تحفتك الفنية الأولى"
                    }}
                    description={searchQuery
                        ? {
                            en: "We couldn't find any resumes matching your search. Try different keywords.",
                            ar: "لم نعثر على أي سير ذاتية تطابق بحثك. جرب كلمات مفتاحية مختلفة."
                        }
                        : {
                            en: "Your career journey begins here. Create a professional resume that stands out in seconds.",
                            ar: "رحلتك المهنية تبدأ هنا. صمم سيرة ذاتية احترافية ومميزة في ثوانٍ."
                        }
                    }
                    action={!searchQuery ? {
                        label: { en: t.dashboard.newResume, ar: t.dashboard.newResume },
                        href: "/dashboard/resumes/new"
                    } : undefined}
                    icon={FileText}
                />
            ) : viewMode === 'grid' ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredResumes.map((resume) => (
                        <Card
                            key={resume.id}
                            className="group overflow-hidden hover:shadow-lg transition-all duration-300"
                        >
                            {/* Preview Header */}
                            <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <div className="w-3/4 h-4/5 bg-white rounded-lg shadow-xl p-4 transform group-hover:scale-105 transition-transform">
                                    <div className="h-full flex flex-col gap-2">
                                        <div className="h-3 w-1/2 bg-gray-200 rounded" />
                                        <div className="h-2 w-3/4 bg-gray-100 rounded" />
                                        <div className="h-px bg-gray-200 my-2" />
                                        <div className="space-y-1 flex-1">
                                            {[...Array(4)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="h-1.5 bg-gray-100 rounded"
                                                    style={{ width: `${60 + Math.random() * 40}%` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ATS Score Badge */}
                                <div
                                    className={`absolute top-3 end-3 px-3 py-1 rounded-full ${getScoreBg(
                                        resume.atsScore
                                    )} flex items-center gap-1`}
                                >
                                    {resume.atsScore >= 80 ? (
                                        <CheckCircle2 className={`h-4 w-4 ${getScoreColor(resume.atsScore)}`} />
                                    ) : (
                                        <AlertCircle className={`h-4 w-4 ${getScoreColor(resume.atsScore)}`} />
                                    )}
                                    <span className={`font-semibold ${getScoreColor(resume.atsScore)}`}>
                                        {resume.atsScore}%
                                    </span>
                                </div>

                                {/* Actions Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-3 start-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/resumes/${resume.id}/edit`}>
                                                <Edit className="h-4 w-4 me-2" />
                                                {t.common.edit}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDuplicate(resume.id)}>
                                            <Copy className="h-4 w-4 me-2" />
                                            {locale === 'ar' ? 'نسخ' : 'Duplicate'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDownload(resume.id)}>
                                            <Download className="h-4 w-4 me-2" />
                                            {t.common.download}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => handleDelete(resume.id)}
                                        >
                                            <Trash2 className="h-4 w-4 me-2" />
                                            {t.common.delete}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Info */}
                            <CardContent className="p-4">
                                <Link
                                    href={`/dashboard/resumes/${resume.id}/edit`}
                                    className="block group-hover:text-primary transition-colors"
                                >
                                    <h3 className="font-semibold truncate">{resume.title}</h3>
                                </Link>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <Target className="h-3 w-3" />
                                    <span className="truncate">{resume.targetRole}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(resume.updatedAt)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredResumes.map((resume) => (
                        <Card key={resume.id} className="group hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-7 w-7 text-primary-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/dashboard/resumes/${resume.id}/edit`}
                                            className="font-semibold hover:text-primary transition-colors"
                                        >
                                            {resume.title}
                                        </Link>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Target className="h-3 w-3" />
                                                {resume.targetRole}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(resume.updatedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        className={`px-3 py-1 rounded-full ${getScoreBg(
                                            resume.atsScore
                                        )} flex items-center gap-1`}
                                    >
                                        <span className={`font-semibold ${getScoreColor(resume.atsScore)}`}>
                                            {resume.atsScore}%
                                        </span>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/resumes/${resume.id}/edit`}>
                                                    <Edit className="h-4 w-4 me-2" />
                                                    {t.common.edit}
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Copy className="h-4 w-4 me-2" />
                                                {locale === 'ar' ? 'نسخ' : 'Duplicate'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Download className="h-4 w-4 me-2" />
                                                {t.common.download}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive">
                                                <Trash2 className="h-4 w-4 me-2" />
                                                {t.common.delete}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
