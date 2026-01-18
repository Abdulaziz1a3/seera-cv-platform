'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';
import { useResumes } from '@/components/providers/resume-provider';
import { handleAICreditsResponse } from '@/lib/ai-credits-client';
import { mapResumeRecordToResumeData } from '@/lib/resume-normalizer';
import { generateAtsPlainText } from '@/lib/ats-plain-text';
import { lintResume } from '@/lib/ats-linter';
import type { ResumeRecord } from '@/lib/resume-data';
import type { Resume } from '@/lib/resume-schema';
import { LivePreview } from '@/components/resume-editor/live-preview';
import { ATSScorePanel } from '@/components/resume-editor/ats-score-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
    AlertTriangle,
    CheckCircle2,
    FileText,
    Loader2,
    Search,
    Target,
    XCircle,
} from 'lucide-react';

type MatchAnalysis = {
    matchScore: number;
    matchingKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
};

const QUANTIFICATION_PATTERNS = [
    /\d+%/,
    /\$[\d,]+/,
    /[\d,]+\+?/,
    /\d+x/,
];

export default function AtsSimulatorPage() {
    const { locale, t } = useLocale();
    const { resumes, isLoading: isLoadingResumes } = useResumes();
    const [selectedResumeId, setSelectedResumeId] = useState('');
    const [resume, setResume] = useState<ResumeRecord | null>(null);
    const [isLoadingResume, setIsLoadingResume] = useState(false);
    const [jobDescription, setJobDescription] = useState('');
    const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const resumeLanguage = resume?.language === 'ar' ? 'ar' : 'en';
    const previewResume = useMemo(
        () => (resume ? mapResumeRecordToResumeData(resume) : null),
        [resume]
    );

    const skillsList = useMemo(() => {
        const categories = resume?.skills?.categories || [];
        const simpleList = resume?.skills?.simpleList || [];
        const categorySkills = categories.flatMap((category) => category.skills || []);
        return [...simpleList, ...categorySkills].filter((skill) => skill && skill.trim().length > 0);
    }, [resume]);

    const experienceItems = resume?.experience?.items || [];
    const educationItems = resume?.education?.items || [];
    const bulletTexts = useMemo(() => {
        return experienceItems.flatMap((item) => {
            const bullets = item.bullets || [];
            return bullets
                .map((bullet) => (typeof bullet === 'string' ? bullet : bullet.content))
                .filter((text) => text && text.trim().length > 0);
        });
    }, [experienceItems]);

    const quantifiedBullets = useMemo(() => {
        return bulletTexts.filter((bullet) => QUANTIFICATION_PATTERNS.some((pattern) => pattern.test(bullet)));
    }, [bulletTexts]);

    const lintResult = useMemo(() => {
        if (!resume) return null;
        return lintResume(resume as Resume, resumeLanguage);
    }, [resume, resumeLanguage]);

    const plainTextLabels = useMemo(() => ({
        summary: t.dashboard.atsSimulator.plainText.summary,
        experience: t.dashboard.atsSimulator.plainText.experience,
        education: t.dashboard.atsSimulator.plainText.education,
        skills: t.dashboard.atsSimulator.plainText.skills,
        certifications: t.dashboard.atsSimulator.plainText.certifications,
        projects: t.dashboard.atsSimulator.plainText.projects,
        languages: t.dashboard.atsSimulator.plainText.languages,
        present: t.dashboard.atsSimulator.plainText.present,
    }), [t]);

    const parsedText = useMemo(() => {
        if (!resume) return '';
        return generateAtsPlainText(resume as Resume, plainTextLabels);
    }, [resume, plainTextLabels]);

    const parseCoverage = useMemo(() => {
        if (!resume) return 0;
        const fields = [
            resume.contact?.fullName,
            resume.contact?.email,
            resume.contact?.phone,
            resume.contact?.location,
            resume.targetRole,
            resume.summary?.content,
            experienceItems.length > 0 ? 'experience' : '',
            educationItems.length > 0 ? 'education' : '',
            skillsList.length > 0 ? 'skills' : '',
        ];
        const filled = fields.filter((field) => field && String(field).trim().length > 0).length;
        return Math.round((filled / fields.length) * 100);
    }, [resume, experienceItems.length, educationItems.length, skillsList.length]);

    const hasResumes = resumes.length > 0;
    const hasSelectedResume = Boolean(selectedResumeId);
    const canAnalyze = hasSelectedResume && jobDescription.trim().length >= 20 && !isAnalyzing;
    useEffect(() => {
        if (!selectedResumeId) {
            setResume(null);
            return;
        }

        let isMounted = true;
        setIsLoadingResume(true);
        fetch(`/api/resumes/${selectedResumeId}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to load resume');
                }
                return response.json();
            })
            .then((data) => {
                if (!isMounted) return;
                setResume(data);
            })
            .catch(() => {
                if (!isMounted) return;
                toast.error(t.dashboard.atsSimulator.errors.resumeLoad);
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoadingResume(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [selectedResumeId, locale]);

    useEffect(() => {
        setAnalysis(null);
    }, [selectedResumeId, jobDescription]);

    const handleAnalyze = async () => {
        if (!jobDescription.trim()) {
            toast.error(t.dashboard.atsSimulator.errors.addJobDescription);
            return;
        }
        if (!selectedResumeId) {
            toast.error(t.dashboard.atsSimulator.errors.selectResume);
            return;
        }

        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/ai/analyze-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobDescription,
                    resumeId: selectedResumeId,
                }),
            });

            if (await handleAICreditsResponse(response)) {
                return;
            }

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const result = await response.json();
            setAnalysis(result);
        } catch {
            toast.error(t.dashboard.atsSimulator.errors.analysisFailed);
        } finally {
            setIsAnalyzing(false);
        }
    };
    const getCategoryStatus = (category: string) => {
        if (!lintResult) return 'pass';
        const issues = lintResult.issues.filter((issue) => issue.category === category);
        if (issues.some((issue) => issue.severity === 'error')) return 'fail';
        if (issues.some((issue) => issue.severity === 'warning')) return 'review';
        if (issues.some((issue) => issue.severity === 'info')) return 'review';
        return 'pass';
    };

    const statusIcon = (status: string) => {
        if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        if (status === 'review') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
        return <XCircle className="h-4 w-4 text-destructive" />;
    };

    const statusLabel = (status: string) => {
        if (status === 'pass') return t.dashboard.atsSimulator.gates.status.pass;
        if (status === 'review') return t.dashboard.atsSimulator.gates.status.review;
        return t.dashboard.atsSimulator.gates.status.fail;
    };

    const matchBadgeVariant = (score: number) => {
        if (score >= 80) return 'default';
        if (score >= 60) return 'secondary';
        return 'outline';
    };

    const mostRecentRole = experienceItems[0]
        ? `${experienceItems[0].position || ''}${experienceItems[0].company ? ` | ${experienceItems[0].company}` : ''}`.trim()
        : '';

    const summaryContent = resume?.summary?.content || '';
    const parsedFields = [
        { label: t.dashboard.atsSimulator.parsedFields.fullName, value: resume?.contact?.fullName || '-' },
        { label: t.dashboard.atsSimulator.parsedFields.email, value: resume?.contact?.email || '-' },
        { label: t.dashboard.atsSimulator.parsedFields.phone, value: resume?.contact?.phone || '-' },
        { label: t.dashboard.atsSimulator.parsedFields.location, value: resume?.contact?.location || '-' },
        { label: t.dashboard.atsSimulator.parsedFields.role, value: resume?.targetRole || '-' },
        {
            label: t.dashboard.atsSimulator.parsedFields.summary,
            value: summaryContent
                ? `${summaryContent.slice(0, 120)}${summaryContent.length > 120 ? '...' : ''}`
                : '-',
        },
        {
            label: t.dashboard.atsSimulator.parsedFields.experience,
            value: experienceItems.length ? `${experienceItems.length}` : '-',
        },
        {
            label: t.dashboard.atsSimulator.parsedFields.education,
            value: educationItems.length ? `${educationItems.length}` : '-',
        },
        {
            label: t.dashboard.atsSimulator.parsedFields.skills,
            value: skillsList.length ? `${skillsList.length}` : '-',
        },
    ];

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">{t.dashboard.atsSimulator.title}</h1>
                <p className="text-muted-foreground max-w-2xl">{t.dashboard.atsSimulator.subtitle}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t.dashboard.atsSimulator.resume.title}</CardTitle>
                        <CardDescription>{t.dashboard.atsSimulator.resume.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingResumes ? (
                            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
                        ) : hasResumes ? (
                            <div className="space-y-3">
                                <Label htmlFor="resume-select">{t.dashboard.atsSimulator.resume.label}</Label>
                                <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                                    <SelectTrigger id="resume-select">
                                        <SelectValue placeholder={t.dashboard.atsSimulator.resume.placeholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {resumes.map((resumeItem) => (
                                            <SelectItem key={resumeItem.id} value={resumeItem.id}>
                                                {resumeItem.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {isLoadingResume ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {t.dashboard.atsSimulator.resume.loading}
                                    </div>
                                ) : resume ? (
                                    <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">
                                                {t.dashboard.atsSimulator.resume.selected}
                                            </span>
                                            {resume.atsScore !== null && resume.atsScore !== undefined && (
                                                <Badge variant="secondary">{resume.atsScore}% ATS</Badge>
                                            )}
                                        </div>
                                        <div className="font-medium">{resume.title}</div>
                                        {resume.targetRole && (
                                            <div className="text-muted-foreground">{resume.targetRole}</div>
                                        )}
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/resumes/${selectedResumeId}/edit`}>
                                                <FileText className="h-4 w-4 me-2" />
                                                {t.dashboard.atsSimulator.resume.edit}
                                            </Link>
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed p-6 text-center">
                                <p className="text-sm text-muted-foreground">
                                    {t.dashboard.atsSimulator.resume.empty}
                                </p>
                                <Button className="mt-4" asChild>
                                    <Link href="/dashboard/resumes/new">
                                        {t.dashboard.newResume}
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t.dashboard.atsSimulator.job.title}</CardTitle>
                        <CardDescription>{t.dashboard.atsSimulator.job.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="job-description">{t.dashboard.atsSimulator.job.label}</Label>
                            <Textarea
                                id="job-description"
                                value={jobDescription}
                                onChange={(event) => setJobDescription(event.target.value)}
                                placeholder={t.dashboard.atsSimulator.job.placeholder}
                                className="min-h-[200px]"
                            />
                            <p className="text-xs text-muted-foreground">
                                {t.dashboard.atsSimulator.job.helper}
                            </p>
                        </div>
                        <Button onClick={handleAnalyze} disabled={!canAnalyze}>
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                    {t.dashboard.atsSimulator.match.analyzing}
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4 me-2" />
                                    {t.dashboard.atsSimulator.match.analyze}
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{t.dashboard.atsSimulator.views.title}</CardTitle>
                        <CardDescription>{t.dashboard.atsSimulator.views.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="recruiter" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="recruiter">
                                    {t.dashboard.atsSimulator.views.recruiter}
                                </TabsTrigger>
                                <TabsTrigger value="ats">
                                    {t.dashboard.atsSimulator.views.ats}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="recruiter" className="space-y-4">
                                {!resume ? (
                                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                        {t.dashboard.atsSimulator.views.empty}
                                    </div>
                                ) : (
                                    <div className="grid gap-4 xl:grid-cols-3">
                                        <div className="rounded-lg border p-4 space-y-4">
                                            <div className="space-y-1">
                                                <h3 className="font-semibold">
                                                    {t.dashboard.atsSimulator.recruiter.snapshotTitle}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {t.dashboard.atsSimulator.recruiter.snapshotSubtitle}
                                                </p>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-muted-foreground">
                                                        {t.dashboard.atsSimulator.recruiter.metrics.recentRole}
                                                    </span>
                                                    <span className="font-medium text-end">{mostRecentRole || '-'}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-muted-foreground">
                                                        {t.dashboard.atsSimulator.recruiter.metrics.experience}
                                                    </span>
                                                    <span className="font-medium">{experienceItems.length}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-muted-foreground">
                                                        {t.dashboard.atsSimulator.recruiter.metrics.quantified}
                                                    </span>
                                                    <span className="font-medium">
                                                        {quantifiedBullets.length}/{bulletTexts.length || 0}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-muted-foreground">
                                                        {t.dashboard.atsSimulator.recruiter.metrics.skills}
                                                    </span>
                                                    <span className="font-medium">{skillsList.length}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-muted-foreground">
                                                        {t.dashboard.atsSimulator.recruiter.metrics.education}
                                                    </span>
                                                    <span className="font-medium">{educationItems.length}</span>
                                                </div>
                                            </div>
                                            {skillsList.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="text-xs font-medium text-muted-foreground">
                                                        {t.dashboard.atsSimulator.recruiter.topSkills}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {skillsList.slice(0, 8).map((skill) => (
                                                            <Badge key={skill} variant="secondary">
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-lg border bg-muted/30 p-4 xl:col-span-2">
                                            {previewResume ? (
                                                <div className="flex justify-center overflow-auto">
                                                    <LivePreview resume={previewResume} scale={0.6} />
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground">
                                                    {t.dashboard.atsSimulator.views.previewEmpty}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="ats" className="space-y-4">
                                {!resume ? (
                                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                        {t.dashboard.atsSimulator.views.empty}
                                    </div>
                                ) : (
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <div className="rounded-lg border p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold">
                                                        {t.dashboard.atsSimulator.atsParse.fieldsTitle}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t.dashboard.atsSimulator.atsParse.fieldsSubtitle}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary">
                                                    {parseCoverage}% {t.dashboard.atsSimulator.atsParse.coverage}
                                                </Badge>
                                            </div>
                                            <Table>
                                                <TableBody>
                                                    {parsedFields.map((field) => (
                                                        <TableRow key={field.label}>
                                                            <TableCell className="text-xs text-muted-foreground">
                                                                {field.label}
                                                            </TableCell>
                                                            <TableCell className="text-xs font-medium">
                                                                {field.value}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        <div className="rounded-lg border p-4 space-y-3">
                                            <div>
                                                <h3 className="font-semibold">
                                                    {t.dashboard.atsSimulator.atsParse.textTitle}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {t.dashboard.atsSimulator.atsParse.textSubtitle}
                                                </p>
                                            </div>
                                            <div className="max-h-[360px] overflow-auto rounded-md bg-muted/40 p-3">
                                                <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                                                    {parsedText || t.dashboard.atsSimulator.atsParse.textEmpty}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t.dashboard.atsSimulator.gates.title}</CardTitle>
                            <CardDescription>{t.dashboard.atsSimulator.gates.subtitle}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {resume ? (
                                [
                                    { key: 'Contact', label: t.dashboard.atsSimulator.gates.items.contact },
                                    { key: 'Summary', label: t.dashboard.atsSimulator.gates.items.summary },
                                    { key: 'Experience', label: t.dashboard.atsSimulator.gates.items.experience },
                                    { key: 'Education', label: t.dashboard.atsSimulator.gates.items.education },
                                    { key: 'Skills', label: t.dashboard.atsSimulator.gates.items.skills },
                                ].map((gate) => {
                                    const status = getCategoryStatus(gate.key);
                                    return (
                                        <div key={gate.key} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                {statusIcon(status)}
                                                <span>{gate.label}</span>
                                            </div>
                                            <Badge variant="outline">{statusLabel(status)}</Badge>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    {t.dashboard.atsSimulator.gates.empty}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {resume ? (
                        <ATSScorePanel resume={resume as Resume} score={resume.atsScore ?? null} />
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t.dashboard.atsSimulator.score.title}</CardTitle>
                                <CardDescription>{t.dashboard.atsSimulator.score.subtitle}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                {t.dashboard.atsSimulator.score.empty}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t.dashboard.atsSimulator.match.title}</CardTitle>
                    <CardDescription>{t.dashboard.atsSimulator.match.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!analysis ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                            {t.dashboard.atsSimulator.match.empty}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">
                                        {t.dashboard.atsSimulator.match.scoreLabel}
                                    </div>
                                    <div className="text-3xl font-bold">{analysis.matchScore}%</div>
                                </div>
                                <Badge variant={matchBadgeVariant(analysis.matchScore)}>
                                    {analysis.matchScore >= 80
                                        ? t.dashboard.atsSimulator.match.strong
                                        : analysis.matchScore >= 60
                                            ? t.dashboard.atsSimulator.match.fair
                                            : t.dashboard.atsSimulator.match.weak}
                                </Badge>
                            </div>
                            <Progress value={analysis.matchScore} className="h-3" />

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-lg border p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="font-medium">
                                            {t.dashboard.atsSimulator.match.matching}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.matchingKeywords.length > 0 ? (
                                            analysis.matchingKeywords.map((keyword) => (
                                                <Badge key={keyword} className="bg-green-500 text-white">
                                                    {keyword}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                {t.dashboard.atsSimulator.match.matchingEmpty}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-lg border p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="font-medium">
                                            {t.dashboard.atsSimulator.match.missing}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.missingKeywords.length > 0 ? (
                                            analysis.missingKeywords.map((keyword) => (
                                                <Badge key={keyword} variant="outline" className="border-amber-500 text-amber-600">
                                                    + {keyword}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                {t.dashboard.atsSimulator.match.missingEmpty}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-primary" />
                                    <span className="font-medium">
                                        {t.dashboard.atsSimulator.match.suggestions}
                                    </span>
                                </div>
                                {analysis.suggestions.length > 0 ? (
                                    <ul className="space-y-2 text-sm">
                                        {analysis.suggestions.map((suggestion, index) => (
                                            <li key={index} className="flex gap-2">
                                                <span className="text-primary font-semibold">{index + 1}.</span>
                                                <span>{suggestion}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {t.dashboard.atsSimulator.match.suggestionsEmpty}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
