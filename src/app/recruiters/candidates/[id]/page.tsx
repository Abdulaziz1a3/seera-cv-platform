"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Mail, Phone, Globe, Linkedin, Lock } from "lucide-react";
import { RecruiterShell } from "@/components/recruiter/recruiter-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

function isRecentGraduate(date?: string | null) {
    if (!date) return false;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return false;
    return Date.now() - parsed.getTime() <= 1000 * 60 * 60 * 24 * 365;
}

type CandidateResponse = {
    unlocked: boolean;
    candidate: any;
};

export default function RecruiterCandidatePage() {
    const params = useParams();
    const candidateId = params?.id as string;
    const [candidate, setCandidate] = useState<CandidateResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadCandidate = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/recruiters/candidates/${candidateId}`);
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error || "Failed to load candidate");
                return;
            }
            setCandidate(data);
        } finally {
            setIsLoading(false);
        }
    };

    const unlockCv = async () => {
        const res = await fetch("/api/recruiters/cv/unlock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candidateId }),
        });
        const data = await res.json();
        if (!res.ok) {
            toast.error(data?.error || "Failed to unlock CV");
            return;
        }
        toast.success("CV unlocked");
        await loadCandidate();
    };

    useEffect(() => {
        if (!candidateId) return;
        loadCandidate().catch(() => null);
    }, [candidateId]);

    if (isLoading) {
        return (
            <RecruiterShell>
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Loading candidate...
                    </CardContent>
                </Card>
            </RecruiterShell>
        );
    }

    if (!candidate) {
        return (
            <RecruiterShell>
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Candidate not found.
                    </CardContent>
                </Card>
            </RecruiterShell>
        );
    }

    if (!candidate.unlocked) {
        return (
            <RecruiterShell>
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground space-y-4">
                        <p>This CV is locked. Unlock to view contact details and full resume.</p>
                        <Button onClick={unlockCv}>
                            <Lock className="h-4 w-4 me-2" />
                            Unlock CV
                        </Button>
                    </CardContent>
                </Card>
            </RecruiterShell>
        );
    }

    const details = candidate.candidate;
    const contact = details.contact;

    return (
        <RecruiterShell>
            <Card>
                <CardHeader>
                    <CardTitle>{details.displayName}</CardTitle>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span>{details.currentTitle || "Role not specified"}</span>
                        <Badge variant="secondary">{details.location || "Location flexible"}</Badge>
                        {details.experienceBand && (
                            <Badge variant="secondary">
                                {EXPERIENCE_LABELS[details.experienceBand]}
                            </Badge>
                        )}
                    </div>
                    {(details.highestDegreeLevel || details.primaryFieldOfStudy) && (
                        <p className="text-sm text-muted-foreground">
                            {[DEGREE_LABELS[details.highestDegreeLevel || ""], details.primaryFieldOfStudy]
                                .filter(Boolean)
                                .join(" - ")}
                        </p>
                    )}
                    {details.graduationYear && (
                        <p className="text-xs text-muted-foreground">
                            Graduated {details.graduationYear}
                            {isRecentGraduate(details.graduationDate) && (
                                <Badge className="ms-2" variant="secondary">Recent graduate</Badge>
                            )}
                        </p>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {contact && (
                        <div className="grid gap-3 md:grid-cols-2 text-sm">
                            {contact.email && (
                                <p className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {contact.email}
                                </p>
                            )}
                            {contact.phone && (
                                <p className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {contact.phone}
                                </p>
                            )}
                            {contact.website && (
                                <p className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    {contact.website}
                                </p>
                            )}
                            {contact.linkedin && (
                                <p className="flex items-center gap-2">
                                    <Linkedin className="h-4 w-4" />
                                    {contact.linkedin}
                                </p>
                            )}
                        </div>
                    )}

                    {(details.internshipCount || details.projectCount || details.freelanceCount || details.trainingFlag) && (
                        <p className="text-xs text-muted-foreground">
                            {[
                                details.internshipCount ? `Internships ${details.internshipCount}` : null,
                                details.projectCount ? `Projects ${details.projectCount}` : null,
                                details.freelanceCount ? `Freelance ${details.freelanceCount}` : null,
                                details.trainingFlag ? "Bootcamp/Training" : null,
                            ].filter(Boolean).join(" · ")}
                        </p>
                    )}

                    {details.summary && (
                        <div>
                            <h3 className="text-sm font-semibold">Summary</h3>
                            <p className="text-sm text-muted-foreground">{details.summary}</p>
                        </div>
                    )}

                    {details.resume?.experience?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold">Experience</h3>
                            <div className="space-y-3">
                                {details.resume.experience.map((exp: any, index: number) => (
                                    <div key={`${exp.company}-${index}`} className="rounded-lg border p-3">
                                        <p className="font-medium">{exp.position}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {exp.company} · {exp.startDate} - {exp.endDate}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </RecruiterShell>
    );
}
