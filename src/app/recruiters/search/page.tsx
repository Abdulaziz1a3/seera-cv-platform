"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, Lock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { RecruiterShell } from "@/components/recruiter/recruiter-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const DEGREE_LEVELS = [
    { value: "DIPLOMA", label: "Diploma" },
    { value: "BACHELOR", label: "Bachelor" },
    { value: "MASTER", label: "Master" },
    { value: "PHD", label: "PhD" },
];

const EXPERIENCE_BANDS = [
    { value: "STUDENT_FRESH", label: "Student / Fresh Graduate" },
    { value: "JUNIOR", label: "Junior" },
    { value: "MID", label: "Mid-Level" },
    { value: "SENIOR", label: "Senior" },
];

const CITIZENSHIP_OPTIONS = [
    { value: "SAUDI", label: "Saudi" },
    { value: "UAE", label: "Emirati (UAE)" },
    { value: "QATAR", label: "Qatari" },
    { value: "BAHRAIN", label: "Bahraini" },
    { value: "KUWAIT", label: "Kuwaiti" },
    { value: "OMAN", label: "Omani" },
    { value: "OTHER", label: "Other" },
];

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

type Candidate = {
    id: string;
    displayName: string;
    currentTitle?: string | null;
    currentCompany?: string | null;
    location?: string | null;
    yearsExperience?: number | null;
    skills: string[];
    summary?: string | null;
    availabilityStatus?: string;
    desiredSalaryMin?: number | null;
    desiredSalaryMax?: number | null;
    noticePeriod?: string | null;
    preferredLocations?: string[] | null;
    desiredRoles?: string[] | null;
    citizenship?: string | null;
    matchScore?: number;
    unlocked?: boolean;
    highestDegreeLevel?: "DIPLOMA" | "BACHELOR" | "MASTER" | "PHD" | null;
    primaryFieldOfStudy?: string | null;
    normalizedFieldOfStudy?: string | null;
    graduationYear?: number | null;
    graduationDate?: string | null;
    graduatedWithin12Months?: boolean;
    experienceBand?: "STUDENT_FRESH" | "JUNIOR" | "MID" | "SENIOR" | null;
    internshipCount?: number | null;
    projectCount?: number | null;
    freelanceCount?: number | null;
    trainingFlag?: boolean | null;
};

type Shortlist = {
    id: string;
    name: string;
    candidates?: Array<{
        talentProfileId?: string;
        talentProfile?: { id: string };
    }>;
};

export default function RecruiterSearchPage() {
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");
    const [citizenship, setCitizenship] = useState("");
    const [skills, setSkills] = useState("");
    const [minExperience, setMinExperience] = useState("");
    const [maxExperience, setMaxExperience] = useState("");
    const [useAi, setUseAi] = useState(true);
    const [educationFiltersEnabled, setEducationFiltersEnabled] = useState(false);
    const [degreeLevels, setDegreeLevels] = useState<string[]>([]);
    const [fieldsOfStudy, setFieldsOfStudy] = useState<string[]>([]);
    const [fieldInput, setFieldInput] = useState("");
    const [graduationYearMin, setGraduationYearMin] = useState("");
    const [graduationYearMax, setGraduationYearMax] = useState("");
    const [experienceBands, setExperienceBands] = useState<string[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [shortlists, setShortlists] = useState<Shortlist[]>([]);
    const [selectedShortlistId, setSelectedShortlistId] = useState("");
    const [addingCandidateId, setAddingCandidateId] = useState<string | null>(null);

    const toggleListValue = (
        value: string,
        list: string[],
        setter: (value: string[]) => void
    ) => {
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

    const formatDegree = (value?: string | null) => {
        const entry = DEGREE_LEVELS.find((item) => item.value === value);
        return entry?.label;
    };

    const formatExperienceBand = (value?: string | null) => {
        const entry = EXPERIENCE_BANDS.find((item) => item.value === value);
        return entry?.label;
    };

    const formatAvailability = (value?: string | null) => {
        if (!value) return null;
        const labels: Record<string, string> = {
            actively_looking: "Actively looking",
            open_to_offers: "Open to offers",
            not_looking: "Not looking",
        };
        return labels[value] || value;
    };

    const formatSalaryRange = (min?: number | null, max?: number | null) => {
        if (!min && !max) return null;
        return `${min || "N/A"} - ${max || "N/A"} SAR`;
    };

    const formatCitizenship = (value?: string | null) => {
        if (!value) return null;
        if (value === "PREFER_NOT_TO_SAY") return null;
        const entry = CITIZENSHIP_OPTIONS.find((item) => item.value === value);
        return entry?.label || value;
    };

    const getCompleteness = (candidate: Candidate) => {
        const checks = [
            Boolean(candidate.summary),
            (candidate.skills || []).length > 0,
            Boolean(candidate.currentTitle),
            Boolean(candidate.location),
            typeof candidate.yearsExperience === "number",
            Boolean(candidate.highestDegreeLevel || candidate.primaryFieldOfStudy),
        ];
        const completed = checks.filter(Boolean).length;
        return Math.round((completed / checks.length) * 100);
    };

    const isRecentGraduate = (candidate: Candidate) => {
        if (candidate.graduatedWithin12Months !== undefined) {
            return candidate.graduatedWithin12Months;
        }
        if (!candidate.graduationDate) return false;
        const date = new Date(candidate.graduationDate);
        if (Number.isNaN(date.getTime())) return false;
        return Date.now() - date.getTime() <= 1000 * 60 * 60 * 24 * 365;
    };

    const runSearch = async () => {
        setIsSearching(true);
        try {
            const res = await fetch("/api/recruiters/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: query || undefined,
                    locations: location ? [location] : undefined,
                    citizenship: citizenship || undefined,
                    skills: skills ? skills.split(",").map((skill) => skill.trim()).filter(Boolean) : undefined,
                    minExperience: minExperience ? Number(minExperience) : undefined,
                    maxExperience: maxExperience ? Number(maxExperience) : undefined,
                    degreeLevels: educationFiltersEnabled && degreeLevels.length ? degreeLevels : undefined,
                    fieldsOfStudy: educationFiltersEnabled && fieldsOfStudy.length ? fieldsOfStudy : undefined,
                    graduationYearMin: educationFiltersEnabled && graduationYearMin ? Number(graduationYearMin) : undefined,
                    graduationYearMax: educationFiltersEnabled && graduationYearMax ? Number(graduationYearMax) : undefined,
                    experienceBands: educationFiltersEnabled && experienceBands.length ? experienceBands : undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error || "Search failed");
                return;
            }
            setCandidates(data.candidates || []);
        } finally {
            setIsSearching(false);
        }
    };

    const loadShortlists = async () => {
        const res = await fetch("/api/recruiters/shortlists");
        if (!res.ok) return;
        const data = await res.json();
        const list = data.shortlists || [];
        setShortlists(list);
        if (!selectedShortlistId && list.length > 0) {
            setSelectedShortlistId(list[0].id);
        }
    };

    useEffect(() => {
        loadShortlists().catch(() => null);
    }, []);

    const isCandidateShortlisted = (candidateId: string, shortlistId?: string) => {
        const shortlist = shortlists.find((list) => list.id === shortlistId);
        if (!shortlist?.candidates?.length) return false;
        return shortlist.candidates.some(
            (entry) =>
                entry.talentProfileId === candidateId ||
                entry.talentProfile?.id === candidateId
        );
    };

    const addToShortlist = async (candidateId: string) => {
        if (!selectedShortlistId) {
            toast.error("Select a shortlist first");
            return;
        }
        setAddingCandidateId(candidateId);
        try {
            const res = await fetch(`/api/recruiters/shortlists/${selectedShortlistId}/candidates`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ talentProfileId: candidateId }),
            });
            let data: any = null;
            try {
                data = await res.json();
            } catch {
                data = null;
            }
            if (!res.ok) {
                toast.error(data?.error || "Failed to add to shortlist");
                return;
            }
            toast.success("Added to shortlist");
            await loadShortlists();
        } finally {
            setAddingCandidateId(null);
        }
    };

    const unlockCv = async (candidateId: string) => {
        const confirmed = window.confirm("Unlock this CV for 1 credit?");
        if (!confirmed) return;

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
        setCandidates((prev) =>
            prev.map((candidate) =>
                candidate.id === candidateId ? { ...candidate, unlocked: true } : candidate
            )
        );
    };

    return (
        <RecruiterShell>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Talent pool search
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="query">Search</Label>
                            <Input
                                id="query"
                                placeholder="Role, skill, or keyword"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                placeholder="Riyadh"
                                value={location}
                                onChange={(event) => setLocation(event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="citizenship">Citizenship</Label>
                            <Select
                                value={citizenship || "ANY"}
                                onValueChange={(value) => setCitizenship(value === "ANY" ? "" : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ANY">Any</SelectItem>
                                    {CITIZENSHIP_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="skills">Skills</Label>
                            <Input
                                id="skills"
                                placeholder="Python, SQL, Product"
                                value={skills}
                                onChange={(event) => setSkills(event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minExperience">Min experience</Label>
                            <Input
                                id="minExperience"
                                type="number"
                                placeholder="2"
                                value={minExperience}
                                onChange={(event) => setMinExperience(event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxExperience">Max experience</Label>
                            <Input
                                id="maxExperience"
                                type="number"
                                placeholder="8"
                                value={maxExperience}
                                onChange={(event) => setMaxExperience(event.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch id="useAi" checked={useAi} onCheckedChange={setUseAi} />
                        <Label htmlFor="useAi">AI matching</Label>
                        <Badge variant="secondary">Beta</Badge>
                    </div>

                    <div className="space-y-3 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="educationFilters">Education filters</Label>
                                <p className="text-xs text-muted-foreground">Off by default to avoid excluding talent.</p>
                            </div>
                            <Switch
                                id="educationFilters"
                                checked={educationFiltersEnabled}
                                onCheckedChange={setEducationFiltersEnabled}
                            />
                        </div>

                        {educationFiltersEnabled && (
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <p className="text-sm font-medium">Degree level</p>
                                    <div className="flex flex-wrap gap-4">
                                        {DEGREE_LEVELS.map((degree) => (
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
                                            list="field-suggestions"
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
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => addFieldOfStudy(fieldInput)}
                                        >
                                            <Plus className="h-4 w-4 me-2" />
                                            Add
                                        </Button>
                                    </div>
                                    <datalist id="field-suggestions">
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
                                        <Label htmlFor="gradYearMin">Graduation year (min)</Label>
                                        <Input
                                            id="gradYearMin"
                                            type="number"
                                            placeholder="2020"
                                            value={graduationYearMin}
                                            onChange={(event) => setGraduationYearMin(event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gradYearMax">Graduation year (max)</Label>
                                        <Input
                                            id="gradYearMax"
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
                                        {EXPERIENCE_BANDS.map((band) => (
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
                    </div>

                    <Button onClick={runSearch} disabled={isSearching}>
                        <Filter className="h-4 w-4 me-2" />
                        {isSearching ? "Searching..." : "Search candidates"}
                    </Button>
                </CardContent>
            </Card>

            <section className="grid gap-4">
                <Card>
                    <CardContent className="flex flex-wrap items-center gap-3 py-4">
                        <p className="text-sm font-semibold">Shortlist</p>
                        {shortlists.length === 0 ? (
                            <Button asChild variant="outline" size="sm">
                                <Link href="/recruiters/shortlists">Create shortlist</Link>
                            </Button>
                        ) : (
                            <div className="min-w-[220px]">
                                <Select value={selectedShortlistId} onValueChange={setSelectedShortlistId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select shortlist" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {shortlists.map((list) => (
                                            <SelectItem key={list.id} value={list.id}>
                                                {list.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Add only unlocked candidates.
                        </p>
                    </CardContent>
                </Card>
                {candidates.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            Run a search to see matched candidates.
                        </CardContent>
                    </Card>
                ) : (
                    candidates.map((candidate) => (
                        <Card key={candidate.id}>
                            <CardContent className="space-y-3 p-6">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-lg font-semibold">{candidate.displayName}</h3>
                                    {candidate.matchScore && (
                                        <Badge variant="outline">Match {candidate.matchScore}%</Badge>
                                    )}
                                    <Badge variant="secondary">Profile {getCompleteness(candidate)}%</Badge>
                                    {typeof candidate.yearsExperience === "number" && (
                                        <Badge variant="secondary">{candidate.yearsExperience} yrs</Badge>
                                    )}
                                    {candidate.availabilityStatus && (
                                        <Badge variant="secondary">{formatAvailability(candidate.availabilityStatus)}</Badge>
                                    )}
                                    {candidate.experienceBand && (
                                        <Badge variant="secondary">
                                            {formatExperienceBand(candidate.experienceBand)}
                                        </Badge>
                                    )}
                                    {formatCitizenship(candidate.citizenship) && (
                                        <Badge variant="secondary">
                                            {formatCitizenship(candidate.citizenship)}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {candidate.currentTitle || "Role not specified"}
                                    {candidate.currentCompany ? ` · ${candidate.currentCompany}` : ""}
                                    {" · "}{candidate.location || "Location flexible"}
                                </p>
                                {(candidate.highestDegreeLevel || candidate.primaryFieldOfStudy) && (
                                    <p className="text-sm text-muted-foreground">
                                        {[formatDegree(candidate.highestDegreeLevel), candidate.primaryFieldOfStudy]
                                            .filter(Boolean)
                                            .join(" - ")}
                                    </p>
                                )}
                                {candidate.graduationYear && (
                                    <p className="text-xs text-muted-foreground">
                                        Graduated {candidate.graduationYear}
                                        {isRecentGraduate(candidate) && (
                                            <Badge className="ms-2" variant="secondary">Recent graduate</Badge>
                                        )}
                                    </p>
                                )}
                                {candidate.summary && (
                                    <p className="text-sm text-muted-foreground">
                                        {candidate.summary.length > 180
                                            ? `${candidate.summary.slice(0, 177)}...`
                                            : candidate.summary}
                                    </p>
                                )}
                                {(candidate.desiredRoles?.length || candidate.preferredLocations?.length || candidate.noticePeriod) && (
                                    <p className="text-xs text-muted-foreground">
                                        {candidate.desiredRoles?.length ? `Desired roles: ${candidate.desiredRoles.join(", ")}` : null}
                                        {candidate.preferredLocations?.length ? ` · Preferred: ${candidate.preferredLocations.join(", ")}` : null}
                                        {candidate.noticePeriod ? ` · Notice: ${candidate.noticePeriod}` : null}
                                    </p>
                                )}
                                {formatSalaryRange(candidate.desiredSalaryMin, candidate.desiredSalaryMax) && (
                                    <p className="text-xs text-muted-foreground">
                                        Expected salary: {formatSalaryRange(candidate.desiredSalaryMin, candidate.desiredSalaryMax)}
                                    </p>
                                )}
                                {(candidate.internshipCount || candidate.projectCount || candidate.freelanceCount || candidate.trainingFlag) && (
                                    <p className="text-xs text-muted-foreground">
                                        {[
                                            candidate.internshipCount ? `Internships ${candidate.internshipCount}` : null,
                                            candidate.projectCount ? `Projects ${candidate.projectCount}` : null,
                                            candidate.freelanceCount ? `Freelance ${candidate.freelanceCount}` : null,
                                            candidate.trainingFlag ? "Bootcamp/Training" : null,
                                        ].filter(Boolean).join(" · ")}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {candidate.skills.slice(0, 6).map((skill) => (
                                        <Badge key={skill} variant="secondary">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.unlocked ? (
                                        <>
                                            <Button asChild variant="outline">
                                                <Link href={`/recruiters/candidates/${candidate.id}`}>View full CV</Link>
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => addToShortlist(candidate.id)}
                                                disabled={
                                                    !selectedShortlistId ||
                                                    isCandidateShortlisted(candidate.id, selectedShortlistId) ||
                                                    addingCandidateId === candidate.id
                                                }
                                            >
                                                {isCandidateShortlisted(candidate.id, selectedShortlistId)
                                                    ? "Already in shortlist"
                                                    : addingCandidateId === candidate.id
                                                        ? "Adding..."
                                                        : "Add to shortlist"}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button onClick={() => unlockCv(candidate.id)}>
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
