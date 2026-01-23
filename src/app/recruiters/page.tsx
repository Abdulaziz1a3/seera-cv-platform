'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    CreditCard,
    Briefcase,
    Sparkles,
    Users,
    ArrowUpRight,
    PlusCircle,
    Search,
} from 'lucide-react';
import { RecruiterShell } from '@/components/recruiter/recruiter-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type DashboardStats = {
    credits: number;
    activeJobs: number;
    matches: number;
    shortlists: number;
};

export default function RecruiterPortalPage() {
    const [stats, setStats] = useState<DashboardStats>({
        credits: 0,
        activeJobs: 0,
        matches: 0,
        shortlists: 0,
    });

    useEffect(() => {
        let mounted = true;

        async function loadStats() {
            const [creditsRes, jobsRes, shortlistsRes] = await Promise.all([
                fetch('/api/recruiters/credits'),
                fetch('/api/recruiters/jobs'),
                fetch('/api/recruiters/shortlists'),
            ]);

            const creditsData = creditsRes.ok ? await creditsRes.json() : null;
            const jobsData = jobsRes.ok ? await jobsRes.json() : null;
            const shortlistsData = shortlistsRes.ok ? await shortlistsRes.json() : null;

            if (!mounted) return;

            const jobs = jobsData?.jobs || [];
            const matches = jobs.reduce((sum: number, job: any) => sum + (job._count?.recommendations || 0), 0);

            setStats({
                credits: creditsData?.balance ?? 0,
                activeJobs: jobs.filter((job: any) => job.status === 'ACTIVE').length,
                matches,
                shortlists: shortlistsData?.shortlists?.length ?? 0,
            });
        }

        loadStats().catch(() => null);
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <RecruiterShell>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        title: 'Credits remaining',
                        value: stats.credits,
                        icon: CreditCard,
                        accent: 'bg-emerald-500/10 text-emerald-600',
                    },
                    {
                        title: 'Active jobs',
                        value: stats.activeJobs,
                        icon: Briefcase,
                        accent: 'bg-blue-500/10 text-blue-600',
                    },
                    {
                        title: 'New matches',
                        value: stats.matches,
                        icon: Sparkles,
                        accent: 'bg-purple-500/10 text-purple-600',
                    },
                    {
                        title: 'Shortlisted',
                        value: stats.shortlists,
                        icon: Users,
                        accent: 'bg-orange-500/10 text-orange-600',
                    },
                ].map((card) => (
                    <Card key={card.title} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.title}
                            </CardTitle>
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center ${card.accent}`}>
                                <card.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold">{card.value}</div>
                            <Badge variant="secondary" className="mt-3">
                                Updated live
                            </Badge>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Quick actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-3">
                        <Button asChild className="justify-between">
                            <Link href="/recruiters/jobs">
                                Create job
                                <PlusCircle className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="justify-between">
                            <Link href="/recruiters/search">
                                Search talent
                                <Search className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="justify-between">
                            <Link href="/recruiters/billing">
                                Buy credits
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                    <CardHeader>
                    <CardTitle>Talent Hunter - Growth</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p>Up to 240 CV credits per year with AI matching and priority candidates.</p>
                        <Button asChild variant="secondary" className="w-full">
                            <Link href="/recruiters/billing">Manage subscription</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </RecruiterShell>
    );
}
