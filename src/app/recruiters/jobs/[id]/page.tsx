'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    Sparkles,
    MapPin,
    BadgeCheck,
    Loader2,
    Star,
    Lock,
    ArrowUpRight,
    Filter,
    Plus,
    X,
} from 'lucide-react';
import { RecruiterShell } from '@/components/recruiter/recruiter-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { normalizeFieldOfStudy } from '@/lib/education-utils';

type JobResponse = {
    job: {
        id: string;
        title: string;
        location?: string | null;
        remoteAllowed: boolean;
        status: string;
        jdText: string;
        analyses?: Array<{
            id: string;
            createdAt: string;
            mustHaveSkills: string[];
            niceToHaveSkills: string[];
            roleKeywords: string[];
            yearsExpMin: number | null;
            yearsExpMax: number | null;
            languages: string[];
            responsibilities: string[];
            summary: string | null;
            requiredDegreeLevel?: "DIPLOMA" | "BACHELOR" | "MASTER" | "PHD" | null;
            preferredDegreeLevels?: Array<"DIPLOMA" | "BACHELOR" | "MASTER" | "PHD">;
            requiredFieldsOfStudy?: string[];
            preferredFieldsOfStudy?: string[];
        }>;
    };
};

type Recommendation = {
    id: string;
    matchScore: number;
    reasons: string[];
    gaps: string[];
    isPriority: boolean;
    unlocked: boolean;
    candidate: {
        id: string;
        displayName: string;
        currentTitle?: string | null;
        currentCompany?: string | null;
        location?: string | null;
        yearsExperience?: number | null;
        skills: string[];
        summary?: string | null;
        highestDegreeLevel?: "DIPLOMA" | "BACHELOR" | "MASTER" | "PHD" | null;
        primaryFieldOfStudy?: string | null;
        normalizedFieldOfStudy?: string | null;
        graduationYear?: number | null;
        graduationDate?: string | null;
        experienceBand?: "STUDENT_FRESH" | "JUNIOR" | "MID" | "SENIOR" | null;
        internshipCount?: number | null;
        projectCount?: number | null;
        freelanceCount?: number | null;
        trainingFlag?: boolean | null;
    };
};

const DEGREE_LABELS: Record<string, string> = {
    DIPLOMA: "Diploma",
    BACHELOR: "Bachelor",
    MASTER: "Master",
    PHD: "PhD",
};

const EXPERIENCE_LABELS: Record<string, string> = {
    STUDENT_FRESH: "Student / Fresh Graduate",
    JUNIOR: "Junior",
    MID: "Mid-Level",
    SENIOR: "Senior",
};

const DEGREE_OPTIONS = Object.entries(DEGREE_LABELS).map(([value, label]) => ({ value, label }));
const EXPERIENCE_OPTIONS = Object.entries(EXPERIENCE_LABELS).map(([value, label]) => ({ value, label }));

const FIELD_SUGGESTIONS = [
    "Computer Science",
    "Software Engineering",
    "Information Systems",
    "Information Technology",
    "Business Administration",
    "Business",
    "Economics",
    "Engineering",
    "Data Science",
    "Artificial Intelligence",
    "Machine Learning",
    "Cyber Security",
];

function formatFieldLabel(value: string) {
    return value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isRecentGraduate(date?: string | null) {
    if (!date) return false;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return false;
    return Date.now() - parsed.getTime() <= 1000 * 60 * 60 * 24 * 365;
}

export default function RecruiterJobDetailPage() {
    const params = useParams();
    const jobId = params?.id as string;
    const [job, setJob] = useState<JobResponse['job'] | null>(null);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [filtersEnabled, setFiltersEnabled] = useState(false);
    const [degreeLevels, setDegreeLevels] = useState<string[]>([]);
    const [fieldsOfStudy, setFieldsOfStudy] = useState<string[]>([]);
    const [fieldInput, setFieldInput] = useState("");
    const [graduationYearMin, setGraduationYearMin] = useState("");
    const [graduationYearMax, setGraduationYearMax] = useState("");
    const [experienceBands, setExperienceBands] = useState<string[]>([]);

    const analysis = useMemo(() => job?.analyses?.[0] || null, [job]);
    const normalizedFieldFilters = useMemo(
        () =>
            fieldsOfStudy
                .map((field) => normalizeFieldOfStudy(field))
                .filter((field): field is string => Boolean(field)),
        [fieldsOfStudy]
    );

    const filteredRecommendations = useMemo(() => {
        if (!filtersEnabled) return recommendations;
        return recommendations.filter((rec) => {
            const candidate = rec.candidate;
            if (degreeLevels.length && (!candidate.highestDegreeLevel || !degreeLevels.includes(candidate.highestDegreeLevel))) {
                return false;
            }
            if (experienceBands.length && (!candidate.experienceBand || !experienceBands.includes(candidate.experienceBand))) {
                return false;
            }
            if (graduationYearMin && (!candidate.graduationYear || candidate.graduationYear < Number(graduationYearMin))) {
                return false;
            }
            if (graduationYearMax && (!candidate.graduationYear || candidate.graduationYear > Number(graduationYearMax))) {
                return false;
            }
            if (normalizedFieldFilters.length) {
                const candidateField = candidate.normalizedFieldOfStudy || normalizeFieldOfStudy(candidate.primaryFieldOfStudy || '');
                if (!candidateField) return false;
                const matched = normalizedFieldFilters.some((field) =>
                    candidateField.includes(field) || field.includes(candidateField)
                );
                if (!matched) return false;
            }
            return true;
        });
    }, [
        recommendations,
        filtersEnabled,
        degreeLevels,
        experienceBands,
        graduationYearMin,
        graduationYearMax,
        normalizedFieldFilters,
    ]);

    const toggleListValue = (value: string, list: string[], setter: (value: string[]) => void) => {
        if (list.includes(value)) {
            setter(list.filter((item) => item !== value));
        } else {
            setter([...list, value]);
        }
    };

    const addFieldOfStudy = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        if (!fieldsOfStudy.includes(trimmed)) {
            setFieldsOfStudy((prev) => [...prev, trimmed]);
        }
        setFieldInput("");
    };

    const removeFieldOfStudy = (value: string) => {
        setFieldsOfStudy((prev) => prev.filter((item) => item !== value));
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [jobRes, recRes] = await Promise.all([
                fetch(`/api/recruiters/jobs/${jobId}`),
                fetch(`/api/recruiters/jobs/${jobId}/recommendations`),
            ]);

            if (jobRes.ok) {
                const data = (await jobRes.json()) as JobResponse;
                setJob(data.job);
            }

            if (recRes.ok) {
                const data = await recRes.json();
                setRecommendations(data.recommendations || []);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!jobId) return;
        loadData().catch(() => null);
    }, [jobId]);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const res = await fetch(`/api/recruiters/jobs/${jobId}/analyze`, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.error || 'Failed to run analysis');
                return;
            }
            toast.success('Analysis completed');
            await loadData();
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUnlock = async (candidateId: string) => {
        const confirmed = window.confirm('Unlock this CV for 1 credit?');
        if (!confirmed) return;

        const res = await fetch('/api/recruiters/cv/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateId }),
        });
        const data = await res.json();
        if (!res.ok) {
            toast.error(data?.error || 'Failed to unlock CV');
            return;
        }

        toast.success('CV unlocked');
        setRecommendations((prev) =>
            prev.map((rec) =>
                rec.candidate.id === candidateId ? { ...rec, unlocked: true } : rec
            )
        );
    };

    if (isLoading) {
        return (
            <RecruiterShell>
                <Card>
                    <CardContent className="flex items-center justify-center py-20 text-muted-foreground">
                        Loading job...
                    </CardContent>
                </Card>
            </RecruiterShell>
        );
    }

    if (!job) {
        return (
            <RecruiterShell>
                <Card>
                    <CardContent className="flex items-center justify-center py-20 text-muted-foreground">
                        Job not found.
                    </CardContent>
                </Card>
            </RecruiterShell>
        );
    }

    return (
        <RecruiterShell>
            <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <CardTitle className="text-2xl">{job.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location || 'Location flexible'}
                            </span>
                            {job.remoteAllowed && <Badge variant="outline">Remote</Badge>}
                            <Badge variant="secondary">{job.status}</Badge>
                        </div>
                    </div>
                    <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin me-2" />
                                Running analysis
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 me-2" />
                                Run AI matching
                            </>
                        )}
                    </Button>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">AI analysis highlights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {analysis ? (
                        <>
                            <div className="flex flex-wrap gap-2">
                                {analysis.mustHaveSkills.map((skill) => (
                                    <Badge key={skill}>{skill}</Badge>
                                ))}
                                {analysis.niceToHaveSkills.map((skill) => (
                                    <Badge key={skill} variant="secondary">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                            {(analysis.requiredDegreeLevel || (analysis.preferredFieldsOfStudy && analysis.preferredFieldsOfStudy.length > 0)) && (
                                <div className="text-sm text-muted-foreground">
                                    Education signals:{" "}
                                    {analysis.requiredDegreeLevel && (
                                        <span className="me-2">
                                            Required {DEGREE_LABELS[analysis.requiredDegreeLevel]}
                                        </span>
                                    )}
                                    {analysis.preferredFieldsOfStudy?.length ? (
                                        <span>Preferred {analysis.preferredFieldsOfStudy.map(formatFieldLabel).join(", ")}</span>
                                    ) : null}
                                </div>
                            )}
                            <div className="text-sm text-muted-foreground">
                                {analysis.summary || 'Analysis ready. Re-run for updated insights.'}
                            </div>
                        </>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            Run AI matching to generate structured insights and recommendations.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Filter className="h-4 w-4" />
                        Recommendation filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="recommendationFilters">Education filters</Label>
                            <p className="text-xs text-muted-foreground">Off by default to avoid excluding talent.</p>
                        </div>
                        <Switch
                            id="recommendationFilters"
                            checked={filtersEnabled}
                            onCheckedChange={setFiltersEnabled}
                        />
                    </div>

                    {filtersEnabled && (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <p className="text-sm font-medium">Degree level</p>
                                <div className="flex flex-wrap gap-4">
                                    {DEGREE_OPTIONS.map((degree) => (
                                        <label key={degree.value} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={degreeLevels.includes(degree.value)}
                                                onCheckedChange={() =>
                                                    toggleListValue(degree.value, degreeLevels, setDegreeLevels)
                                                }
                                            />
                                            {degree.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <p className="text-sm font-medium">Field of study</p>
                                <div className="flex flex-wrap gap-2">
                                    <Input
                                        list="recommendation-field-suggestions"
                                        placeholder="Type and press Enter"
                                        value={fieldInput}
                                        onChange={(event) => setFieldInput(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                event.preventDefault();
                                                addFieldOfStudy(fieldInput);
                                            }
                                        }}
                                    />
                                    <Button type="button" variant="secondary" onClick={() => addFieldOfStudy(fieldInput)}>
                                        <Plus className="h-4 w-4 me-2" />
                                        Add
                                    </Button>
                                </div>
                                <datalist id="recommendation-field-suggestions">
                                    {FIELD_SUGGESTIONS.map((field) => (
                                        <option key={field} value={field} />
                                    ))}
                                </datalist>
                                {fieldsOfStudy.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {fieldsOfStudy.map((field) => (
                                            <Badge key={field} variant="secondary" className="gap-2">
                                                {field}
                                                <button
                                                    type="button"
                                                    aria-label={`Remove ${field}`}
                                                    onClick={() => removeFieldOfStudy(field)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="recGradMin">Graduation year (min)</Label>
                                    <Input
                                        id="recGradMin"
                                        type="number"
                                        placeholder="2020"
                                        value={graduationYearMin}
                                        onChange={(event) => setGraduationYearMin(event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recGradMax">Graduation year (max)</Label>
                                    <Input
                                        id="recGradMax"
                                        type="number"
                                        placeholder="2024"
                                        value={graduationYearMax}
                                        onChange={(event) => setGraduationYearMax(event.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <p className="text-sm font-medium">Experience band</p>
                                <div className="flex flex-wrap gap-4">
                                    {EXPERIENCE_OPTIONS.map((band) => (
                                        <label key={band.value} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={experienceBands.includes(band.value)}
                                                onCheckedChange={() =>
                                                    toggleListValue(band.value, experienceBands, setExperienceBands)
                                                }
                                            />
                                            {band.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <section className="grid gap-4">
                {filteredRecommendations.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            {recommendations.length === 0
                                ? 'No recommendations yet. Run analysis to see matched candidates.'
                                : 'No candidates match the selected filters.'}
                        </CardContent>
                    </Card>
                ) : (
                    filteredRecommendations.map((rec) => (
                        <Card key={rec.id}>
                            <CardContent className="space-y-4 p-6">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-lg font-semibold">{rec.candidate.displayName}</h3>
                                    {rec.isPriority && (
                                        <Badge className="bg-amber-500 text-white">
                                            <Star className="h-3.5 w-3.5 me-1" />
                                            Priority
                                        </Badge>
                                    )}
                                    <Badge variant="outline">
                                        <BadgeCheck className="h-3.5 w-3.5 me-1" />
                                        Match {rec.matchScore}%
                                    </Badge>
                                    {rec.candidate.experienceBand && (
                                        <Badge variant="secondary">
                                            {EXPERIENCE_LABELS[rec.candidate.experienceBand]}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {rec.candidate.currentTitle || 'Role not specified'} · {rec.candidate.location || 'Location flexible'}
                                </p>
                                {(rec.candidate.highestDegreeLevel || rec.candidate.primaryFieldOfStudy) && (
                                    <p className="text-sm text-muted-foreground">
                                        {[DEGREE_LABELS[rec.candidate.highestDegreeLevel || ''], rec.candidate.primaryFieldOfStudy]
                                            .filter(Boolean)
                                            .join(' - ')}
                                    </p>
                                )}
                                {rec.candidate.graduationYear && (
                                    <p className="text-xs text-muted-foreground">
                                        Graduated {rec.candidate.graduationYear}
                                        {isRecentGraduate(rec.candidate.graduationDate) && (
                                            <Badge className="ms-2" variant="secondary">Recent graduate</Badge>
                                        )}
                                    </p>
                                )}
                                {(rec.candidate.internshipCount || rec.candidate.projectCount || rec.candidate.freelanceCount || rec.candidate.trainingFlag) && (
                                    <p className="text-xs text-muted-foreground">
                                        {[
                                            rec.candidate.internshipCount ? `Internships ${rec.candidate.internshipCount}` : null,
                                            rec.candidate.projectCount ? `Projects ${rec.candidate.projectCount}` : null,
                                            rec.candidate.freelanceCount ? `Freelance ${rec.candidate.freelanceCount}` : null,
                                            rec.candidate.trainingFlag ? 'Bootcamp/Training' : null,
                                        ].filter(Boolean).join(' · ')}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {rec.candidate.skills.slice(0, 6).map((skill) => (
                                        <Badge key={skill} variant="secondary">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="grid gap-3 md:grid-cols-2 text-sm">
                                    <div>
                                        <p className="font-medium">Why this candidate</p>
                                        <ul className="text-muted-foreground">
                                            {rec.reasons.slice(0, 4).map((reason) => (
                                                <li key={reason}>• {reason}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-medium">Gaps to verify</p>
                                        <ul className="text-muted-foreground">
                                            {rec.gaps.length === 0 && <li>• No major gaps detected</li>}
                                            {rec.gaps.slice(0, 4).map((gap) => (
                                                <li key={gap}>• {gap}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {rec.unlocked ? (
                                        <Button asChild variant="outline">
                                            <Link href={`/recruiters/candidates/${rec.candidate.id}`}>
                                                View full CV
                                                <ArrowUpRight className="h-4 w-4 ms-2" />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button onClick={() => handleUnlock(rec.candidate.id)}>
                                            <Lock className="h-4 w-4 me-2" />
                                            Unlock CV
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </section>
        </RecruiterShell>
    );
}
