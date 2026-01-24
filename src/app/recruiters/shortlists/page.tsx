
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    BookmarkPlus,
    Clock,
    FileText,
    Loader2,
    Mail,
    Phone,
    Trash2,
    Users,
} from "lucide-react";
import { toast } from "sonner";
import { RecruiterShell } from "@/components/recruiter/recruiter-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type ShortlistStatus = "NEW" | "CONTACTED" | "INTERVIEWED" | "REJECTED" | "OFFER";
type SortOption = "match_score" | "date_added" | "availability";

type ShortlistCandidate = {
    id: string;
    note?: string | null;
    addedAt: string;
    status: ShortlistStatus;
    statusUpdatedAt: string;
    talentProfileId: string;
    unlocked?: boolean;
    matchScore?: number | null;
    talentProfile: {
        id: string;
        displayName: string;
        currentTitle?: string | null;
        location?: string | null;
        yearsExperience?: number | null;
        noticePeriod?: string | null;
        availabilityStatus?: string | null;
        citizenship?: string | null;
        contact?: {
            email?: string | null;
            phone?: string | null;
        } | null;
    };
};

type Shortlist = {
    id: string;
    name: string;
    description?: string | null;
    candidates: ShortlistCandidate[];
};

const STATUS_OPTIONS: Array<{ value: ShortlistStatus; label: string }> = [
    { value: "NEW", label: "New" },
    { value: "CONTACTED", label: "Contacted" },
    { value: "INTERVIEWED", label: "Interviewed" },
    { value: "REJECTED", label: "Rejected" },
    { value: "OFFER", label: "Offer" },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
    { value: "match_score", label: "Seera Match Score" },
    { value: "date_added", label: "Date added" },
    { value: "availability", label: "Availability" },
];

const CITIZENSHIP_FLAGS: Record<string, string> = {
    SAUDI: "🇸🇦",
    UAE: "🇦🇪",
    QATAR: "🇶🇦",
    BAHRAIN: "🇧🇭",
    KUWAIT: "🇰🇼",
    OMAN: "🇴🇲",
};

const IDLE_DAYS = 7;
const IDLE_MS = IDLE_DAYS * 24 * 60 * 60 * 1000;

function getCitizenshipFlag(citizenship?: string | null) {
    if (!citizenship || citizenship === "PREFER_NOT_TO_SAY") return null;
    return CITIZENSHIP_FLAGS[citizenship] || null;
}

function getAvailabilityLabel(noticePeriod?: string | null) {
    if (!noticePeriod) return null;
    if (noticePeriod === "immediate" || noticePeriod === "1_week") return "Immediate";
    if (noticePeriod === "2_weeks" || noticePeriod === "1_month" || noticePeriod === "2_months") {
        return "1-3 months";
    }
    if (noticePeriod === "3_months") return "3+ months";
    return null;
}

function getAvailabilityRank(noticePeriod?: string | null) {
    if (!noticePeriod) return 99;
    if (noticePeriod === "immediate" || noticePeriod === "1_week") return 0;
    if (noticePeriod === "2_weeks" || noticePeriod === "1_month" || noticePeriod === "2_months") {
        return 1;
    }
    if (noticePeriod === "3_months") return 2;
    return 99;
}

function isIdleCandidate(candidate: ShortlistCandidate) {
    if (!["NEW", "CONTACTED"].includes(candidate.status)) return false;
    const lastUpdate = candidate.statusUpdatedAt || candidate.addedAt;
    const timestamp = Date.parse(lastUpdate);
    if (Number.isNaN(timestamp)) return false;
    return Date.now() - timestamp >= IDLE_MS;
}

function sortCandidates(candidates: ShortlistCandidate[], sortBy: SortOption) {
    return [...candidates].sort((a, b) => {
        if (sortBy === "match_score") {
            const aScore = typeof a.matchScore === "number" ? a.matchScore : -1;
            const bScore = typeof b.matchScore === "number" ? b.matchScore : -1;
            if (aScore !== bScore) return bScore - aScore;
        }
        if (sortBy === "availability") {
            const aRank = getAvailabilityRank(a.talentProfile.noticePeriod);
            const bRank = getAvailabilityRank(b.talentProfile.noticePeriod);
            if (aRank !== bRank) return aRank - bRank;
        }
        const aAdded = Date.parse(a.addedAt);
        const bAdded = Date.parse(b.addedAt);
        if (!Number.isNaN(aAdded) && !Number.isNaN(bAdded)) {
            return bAdded - aAdded;
        }
        return 0;
    });
}

export default function RecruiterShortlistsPage() {
    const [shortlists, setShortlists] = useState<Shortlist[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sortByShortlist, setSortByShortlist] = useState<Record<string, SortOption>>({});
    const [statusFilterByShortlist, setStatusFilterByShortlist] = useState<
        Record<string, ShortlistStatus | "ALL">
    >({});
    const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({});
    const [removing, setRemoving] = useState<Record<string, boolean>>({});
    const [bulkUpdatingShortlistId, setBulkUpdatingShortlistId] = useState<string | null>(null);

    const loadShortlists = async () => {
        const res = await fetch("/api/recruiters/shortlists");
        if (!res.ok) return;
        const data = await res.json();
        setShortlists(data.shortlists || []);
    };

    useEffect(() => {
        loadShortlists().catch(() => null);
    }, []);

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/recruiters/shortlists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
            });
            let data: any = null;
            try {
                data = await res.json();
            } catch {
                data = null;
            }
            if (!res.ok) {
                toast.error(data?.error || "Failed to create shortlist");
                return;
            }
            toast.success("Shortlist created");
            setName("");
            setDescription("");
            await loadShortlists();
        } catch {
            toast.error("Failed to create shortlist");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSortBy = (shortlistId: string) => sortByShortlist[shortlistId] || "date_added";
    const getStatusFilter = (shortlistId: string) => statusFilterByShortlist[shortlistId] || "ALL";

    const updateCandidateStatus = async (
        shortlistId: string,
        talentProfileId: string,
        status: ShortlistStatus
    ) => {
        const key = `${shortlistId}:${talentProfileId}`;
        setStatusUpdating((prev) => ({ ...prev, [key]: true }));
        setShortlists((prev) =>
            prev.map((shortlist) =>
                shortlist.id === shortlistId
                    ? {
                          ...shortlist,
                          candidates: shortlist.candidates.map((candidate) =>
                              candidate.talentProfileId === talentProfileId
                                  ? {
                                        ...candidate,
                                        status,
                                        statusUpdatedAt: new Date().toISOString(),
                                    }
                                  : candidate
                          ),
                      }
                    : shortlist
            )
        );

        try {
            const res = await fetch(`/api/recruiters/shortlists/${shortlistId}/candidates`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ talentProfileId, status }),
            });
            let data: any = null;
            try {
                data = await res.json();
            } catch {
                data = null;
            }
            if (!res.ok) {
                toast.error(data?.error || "Failed to update status");
                await loadShortlists();
                return;
            }
        } catch {
            toast.error("Failed to update status");
            await loadShortlists();
        } finally {
            setStatusUpdating((prev) => ({ ...prev, [key]: false }));
        }
    };
    const removeCandidate = async (shortlistId: string, talentProfileId: string) => {
        const key = `${shortlistId}:${talentProfileId}`;
        setRemoving((prev) => ({ ...prev, [key]: true }));
        setShortlists((prev) =>
            prev.map((shortlist) =>
                shortlist.id === shortlistId
                    ? {
                          ...shortlist,
                          candidates: shortlist.candidates.filter(
                              (candidate) => candidate.talentProfileId !== talentProfileId
                          ),
                      }
                    : shortlist
            )
        );

        try {
            const res = await fetch(
                `/api/recruiters/shortlists/${shortlistId}/candidates?talentProfileId=${talentProfileId}`,
                { method: "DELETE" }
            );
            let data: any = null;
            try {
                data = await res.json();
            } catch {
                data = null;
            }
            if (!res.ok) {
                toast.error(data?.error || "Failed to remove candidate");
                await loadShortlists();
                return;
            }
        } catch {
            toast.error("Failed to remove candidate");
            await loadShortlists();
        } finally {
            setRemoving((prev) => ({ ...prev, [key]: false }));
        }
    };

    const markIdleAsContacted = async (shortlistId: string, candidates: ShortlistCandidate[]) => {
        const idleNewCandidates = candidates.filter(
            (candidate) => candidate.status === "NEW" && isIdleCandidate(candidate)
        );
        if (idleNewCandidates.length === 0) return;

        setBulkUpdatingShortlistId(shortlistId);
        setShortlists((prev) =>
            prev.map((shortlist) =>
                shortlist.id === shortlistId
                    ? {
                          ...shortlist,
                          candidates: shortlist.candidates.map((candidate) =>
                              idleNewCandidates.some(
                                  (idleCandidate) => idleCandidate.talentProfileId === candidate.talentProfileId
                              )
                                  ? {
                                        ...candidate,
                                        status: "CONTACTED",
                                        statusUpdatedAt: new Date().toISOString(),
                                    }
                                  : candidate
                          ),
                      }
                    : shortlist
            )
        );

        try {
            for (const candidate of idleNewCandidates) {
                const res = await fetch(`/api/recruiters/shortlists/${shortlistId}/candidates`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ talentProfileId: candidate.talentProfileId, status: "CONTACTED" }),
                });
                if (!res.ok) {
                    throw new Error("Failed to update status");
                }
            }
            toast.success("Marked as contacted");
        } catch {
            toast.error("Failed to update some candidates");
            await loadShortlists();
        } finally {
            setBulkUpdatingShortlistId(null);
        }
    };

    return (
        <RecruiterShell>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookmarkPlus className="h-5 w-5" />
                        Create a shortlist
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-3 md:grid-cols-3" onSubmit={handleCreate}>
                        <Input
                            placeholder="Shortlist name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                            minLength={2}
                        />
                        <Input
                            placeholder="Description (optional)"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <section className="grid gap-4">
                {shortlists.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            Create a shortlist to organize promising candidates.
                        </CardContent>
                    </Card>
                ) : (
                    shortlists.map((shortlist) => {
                        const sortBy = getSortBy(shortlist.id);
                        const statusFilter = getStatusFilter(shortlist.id);
                        const idleCandidates = shortlist.candidates.filter(isIdleCandidate);
                        const idleNewCount = idleCandidates.filter(
                            (candidate) => candidate.status === "NEW"
                        ).length;
                        const statusCounts = STATUS_OPTIONS.reduce<Record<ShortlistStatus, number>>(
                            (acc, option) => {
                                acc[option.value] = shortlist.candidates.filter(
                                    (candidate) => candidate.status === option.value
                                ).length;
                                return acc;
                            },
                            {
                                NEW: 0,
                                CONTACTED: 0,
                                INTERVIEWED: 0,
                                REJECTED: 0,
                                OFFER: 0,
                            }
                        );
                        const interviewReadyCount = 0;
                        const filteredCandidates =
                            statusFilter === "ALL"
                                ? shortlist.candidates
                                : shortlist.candidates.filter((candidate) => candidate.status === statusFilter);
                        const sortedCandidates = sortCandidates(filteredCandidates, sortBy);

                        return (
                            <Card key={shortlist.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>{shortlist.name}</span>
                                        <Badge variant="secondary">
                                            <Users className="h-3.5 w-3.5 me-1" />
                                            {shortlist.candidates.length} candidates
                                        </Badge>
                                    </CardTitle>
                                    {shortlist.description && (
                                        <p className="text-sm text-muted-foreground">{shortlist.description}</p>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {shortlist.candidates.length === 0 ? (
                                        <div className="rounded-lg border p-6 text-center text-muted-foreground space-y-3">
                                            <p>Add candidates from Talent Pool or Jobs &amp; Matching.</p>
                                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                                <Button asChild variant="outline">
                                                    <Link href="/recruiters/search">Go to Talent Pool</Link>
                                                </Button>
                                                <Button asChild variant="outline">
                                                    <Link href="/recruiters/jobs">Go to Jobs &amp; Matching</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div className="rounded-lg border p-4 space-y-2">
                                                    <p className="text-sm font-semibold">Insights</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        <span className="font-medium">{interviewReadyCount}</span>{" "}
                                                        candidates are interview-ready
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Likely to accept offer: —
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-semibold">Sort by</p>
                                                        <div className="min-w-[200px]">
                                                            <Select
                                                                value={sortBy}
                                                                onValueChange={(value: SortOption) =>
                                                                    setSortByShortlist((prev) => ({
                                                                        ...prev,
                                                                        [shortlist.id]: value,
                                                                    }))
                                                                }
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {SORT_OPTIONS.map((option) => (
                                                                        <SelectItem key={option.value} value={option.value}>
                                                                            {option.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant={statusFilter === "ALL" ? "default" : "outline"}
                                                            onClick={() =>
                                                                setStatusFilterByShortlist((prev) => ({
                                                                    ...prev,
                                                                    [shortlist.id]: "ALL",
                                                                }))
                                                            }
                                                        >
                                                            All ({shortlist.candidates.length})
                                                        </Button>
                                                        {STATUS_OPTIONS.map((option) => (
                                                            <Button
                                                                key={option.value}
                                                                type="button"
                                                                size="sm"
                                                                variant={
                                                                    statusFilter === option.value ? "default" : "outline"
                                                                }
                                                                onClick={() =>
                                                                    setStatusFilterByShortlist((prev) => ({
                                                                        ...prev,
                                                                        [shortlist.id]: option.value,
                                                                    }))
                                                                }
                                                            >
                                                                {option.label} ({statusCounts[option.value]})
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {idleCandidates.length > 0 && (
                                                <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        <span>
                                                            You haven't contacted {idleCandidates.length} candidates yet.
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-amber-300 text-amber-700"
                                                            onClick={() =>
                                                                markIdleAsContacted(shortlist.id, idleCandidates)
                                                            }
                                                            disabled={
                                                                bulkUpdatingShortlistId === shortlist.id || idleNewCount === 0
                                                            }
                                                            title={
                                                                idleNewCount === 0
                                                                    ? "No new candidates to update"
                                                                    : undefined
                                                            }
                                                        >
                                                            {bulkUpdatingShortlistId === shortlist.id && (
                                                                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                                            )}
                                                            Mark as contacted
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                {sortedCandidates.map((candidate) => {
                                                    const flag = getCitizenshipFlag(
                                                        candidate.talentProfile.citizenship
                                                    );
                                                    const availability =
                                                        getAvailabilityLabel(candidate.talentProfile.noticePeriod) || "—";
                                                    const yearsExperience =
                                                        typeof candidate.talentProfile.yearsExperience === "number"
                                                            ? `${candidate.talentProfile.yearsExperience} yrs`
                                                            : "—";
                                                    const matchScore =
                                                        typeof candidate.matchScore === "number"
                                                            ? `${candidate.matchScore}%`
                                                            : "—";
                                                    const email = candidate.talentProfile.contact?.email || null;
                                                    const phone = candidate.talentProfile.contact?.phone || null;
                                                    const canEmail = Boolean(candidate.unlocked && email);
                                                    const canPhone = Boolean(candidate.unlocked && phone);
                                                    const statusKey = `${shortlist.id}:${candidate.talentProfileId}`;
                                                    const isUpdating = Boolean(statusUpdating[statusKey]);
                                                    const isRemoving = Boolean(removing[statusKey]);
                                                    const whatsappNumber = phone
                                                        ? phone.replace(/[^\d]/g, "")
                                                        : null;

                                                    return (
                                                        <div
                                                            key={candidate.id}
                                                            className="rounded-lg border p-4 space-y-3"
                                                        >
                                                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-semibold">
                                                                            {candidate.talentProfile.displayName}
                                                                        </p>
                                                                        {flag && (
                                                                            <span
                                                                                title={candidate.talentProfile.citizenship || ""}
                                                                            >
                                                                                {flag}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {candidate.talentProfile.currentTitle ||
                                                                            "Role not specified"}{" "}·{" "}
                                                                        {candidate.talentProfile.location || "Location flexible"}
                                                                    </p>
                                                                    {candidate.note && (
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            Note: {candidate.note}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <Badge variant="outline">Seera Match {matchScore}</Badge>
                                                                    <Badge variant="secondary">{yearsExperience}</Badge>
                                                                    <Badge variant="secondary">
                                                                        Availability {availability}
                                                                    </Badge>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                                <div className="min-w-[180px]">
                                                                    <Select
                                                                        value={candidate.status}
                                                                        onValueChange={(value: ShortlistStatus) =>
                                                                            updateCandidateStatus(
                                                                                shortlist.id,
                                                                                candidate.talentProfileId,
                                                                                value
                                                                            )
                                                                        }
                                                                        disabled={isUpdating}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {STATUS_OPTIONS.map((option) => (
                                                                                <SelectItem key={option.value} value={option.value}>
                                                                                    {option.label}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    <Button asChild variant="outline" size="sm">
                                                                        <Link href={`/recruiters/candidates/${candidate.talentProfile.id}`}>
                                                                            <FileText className="h-4 w-4 me-2" />
                                                                            View CV
                                                                        </Link>
                                                                    </Button>
                                                                    {canEmail ? (
                                                                        <Button asChild variant="outline" size="sm">
                                                                            <a href={`mailto:${email}`}>
                                                                                <Mail className="h-4 w-4 me-2" />
                                                                                Send Email
                                                                            </a>
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            disabled
                                                                            title="Candidate contact not available"
                                                                        >
                                                                            <Mail className="h-4 w-4 me-2" />
                                                                            Send Email
                                                                        </Button>
                                                                    )}
                                                                    {canPhone && whatsappNumber ? (
                                                                        <Button asChild variant="outline" size="sm">
                                                                            <a
                                                                                href={`https://wa.me/${whatsappNumber}`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                            >
                                                                                <Phone className="h-4 w-4 me-2" />
                                                                                WhatsApp
                                                                            </a>
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            disabled
                                                                            title="Candidate contact not available"
                                                                        >
                                                                            <Phone className="h-4 w-4 me-2" />
                                                                            WhatsApp
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            removeCandidate(shortlist.id, candidate.talentProfileId)
                                                                        }
                                                                        disabled={isRemoving}
                                                                    >
                                                                        {isRemoving ? (
                                                                            <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="h-4 w-4 me-2" />
                                                                        )}
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </section>
        </RecruiterShell>
    );
}
