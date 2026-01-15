'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, Building2, MapPin, FileText } from 'lucide-react';

interface JobTargetSummary {
    id: string;
    title: string;
    company?: string | null;
    matchScore?: number | null;
    createdAt: string;
    resumes?: Array<{
        resume?: { id: string; title: string };
    }>;
}

export default function JobTargetsPage() {
    const { locale, t } = useLocale();
    const [jobTargets, setJobTargets] = useState<JobTargetSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadJobTargets = async () => {
            try {
                const response = await fetch('/api/job-targets');
                if (!response.ok) {
                    throw new Error('Failed to load job targets');
                }
                const data = await response.json();
                setJobTargets(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to load job targets:', error);
                setJobTargets([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadJobTargets();
    }, []);

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
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{t.nav.jobTargets}</h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === 'ar'
                            ? 'قم بتحليل فرص العمل وحفظ أهدافك'
                            : 'Analyze job descriptions and track your targets'}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/job-targets/new">
                        <Plus className="h-4 w-4 me-2" />
                        {locale === 'ar' ? 'استهداف وظيفة' : 'Target a Job'}
                    </Link>
                </Button>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">
                    {locale === 'ar' ? 'الأهداف المحفوظة' : 'Saved Job Targets'}
                </h2>

                {isLoading ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">
                                {locale === 'ar' ? 'جار التحميل...' : 'Loading...'}
                            </p>
                        </CardContent>
                    </Card>
                ) : jobTargets.length == 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium mb-2">
                                {locale === 'ar' ? 'لا توجد أهداف محفوظة بعد' : 'No job targets yet'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {locale === 'ar'
                                    ? 'ابدأ بتحليل وصف وظيفة لحفظه هنا'
                                    : 'Analyze a job description to save it here'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {jobTargets.map((job) => {
                            const appliedResume = job.resumes?.[0]?.resume?.title || null;
                            const score = job.matchScore ?? 0;
                            return (
                                <Card key={job.id} className="group hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{job.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{job.company || '-'}</p>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 rounded-full text-sm font-semibold ${getScoreBg(score)} ${getScoreColor(score)}`}>
                                                {score}%
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {locale === 'ar' ? 'غير محدد' : 'Not specified'}
                                            </span>
                                        </div>

                                        {appliedResume ? (
                                            <Badge variant="secondary" className="text-xs">
                                                <FileText className="h-3 w-3 me-1" />
                                                {appliedResume}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs">
                                                {locale === 'ar' ? 'لم يتم ربط سيرة' : 'No resume linked'}
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
