'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, PlusCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { RecruiterShell } from '@/components/recruiter/recruiter-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type Job = {
    id: string;
    title: string;
    location?: string | null;
    remoteAllowed: boolean;
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    analyses?: { id: string; createdAt: string }[];
    _count?: { recommendations: number };
};

export default function RecruiterJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: '',
        location: '',
        remoteAllowed: false,
        employmentType: '',
        seniority: '',
        salaryMin: '',
        salaryMax: '',
        jdText: '',
    });

    const loadJobs = async () => {
        const res = await fetch('/api/recruiters/jobs');
        if (!res.ok) return;
        const data = await res.json();
        setJobs(data.jobs || []);
    };

    useEffect(() => {
        loadJobs().catch(() => null);
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/recruiters/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    location: form.location || null,
                    remoteAllowed: form.remoteAllowed,
                    employmentType: form.employmentType || null,
                    seniority: form.seniority || null,
                    salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
                    salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
                    jdText: form.jdText,
                    status: 'ACTIVE',
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error || 'Failed to create job');
                return;
            }
            toast.success('Job created');
            setForm({
                title: '',
                location: '',
                remoteAllowed: false,
                employmentType: '',
                seniority: '',
                salaryMin: '',
                salaryMax: '',
                jdText: '',
            });
            await loadJobs();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <RecruiterShell>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PlusCircle className="h-5 w-5" />
                        Create a new job
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4" onSubmit={handleSubmit}>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Job title</Label>
                                <Input
                                    id="title"
                                    value={form.title}
                                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                                    placeholder="Senior Product Designer"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={form.location}
                                    onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                                    placeholder="Riyadh, Saudi Arabia"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="employmentType">Employment type</Label>
                                <Input
                                    id="employmentType"
                                    value={form.employmentType}
                                    onChange={(event) => setForm((prev) => ({ ...prev, employmentType: event.target.value }))}
                                    placeholder="Full-time"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="seniority">Seniority</Label>
                                <Input
                                    id="seniority"
                                    value={form.seniority}
                                    onChange={(event) => setForm((prev) => ({ ...prev, seniority: event.target.value }))}
                                    placeholder="Mid / Senior"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-6">
                                <Switch
                                    id="remoteAllowed"
                                    checked={form.remoteAllowed}
                                    onCheckedChange={(value) => setForm((prev) => ({ ...prev, remoteAllowed: value }))}
                                />
                                <Label htmlFor="remoteAllowed">Remote allowed</Label>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="salaryMin">Salary min (SAR)</Label>
                                <Input
                                    id="salaryMin"
                                    type="number"
                                    value={form.salaryMin}
                                    onChange={(event) => setForm((prev) => ({ ...prev, salaryMin: event.target.value }))}
                                    placeholder="12000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="salaryMax">Salary max (SAR)</Label>
                                <Input
                                    id="salaryMax"
                                    type="number"
                                    value={form.salaryMax}
                                    onChange={(event) => setForm((prev) => ({ ...prev, salaryMax: event.target.value }))}
                                    placeholder="18000"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jdText">Job description</Label>
                            <Textarea
                                id="jdText"
                                value={form.jdText}
                                onChange={(event) => setForm((prev) => ({ ...prev, jdText: event.target.value }))}
                                placeholder="Paste the job description or hiring notes here..."
                                rows={6}
                                required
                            />
                        </div>

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create job'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <section className="grid gap-4">
                {jobs.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            Create your first job to start matching candidates.
                        </CardContent>
                    </Card>
                ) : (
                    jobs.map((job) => (
                        <Card key={job.id}>
                            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        <h3 className="text-lg font-semibold">{job.title}</h3>
                                        <Badge variant="secondary">{job.status}</Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {job.location || 'Location flexible'}
                                        </span>
                                        {job.remoteAllowed && <Badge variant="outline">Remote</Badge>}
                                        <span className="flex items-center gap-1">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            {job._count?.recommendations || 0} matches
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button asChild variant="outline">
                                        <Link href={`/recruiters/jobs/${job.id}`}>Open</Link>
                                    </Button>
                                    <Button asChild>
                                        <Link href={`/recruiters/jobs/${job.id}`}>Run analysis</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </section>
        </RecruiterShell>
    );
}
