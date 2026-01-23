"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { RecruiterShell } from "@/components/recruiter/recruiter-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Shortlist = {
    id: string;
    name: string;
    description?: string | null;
    candidates: Array<{
        id: string;
        note?: string | null;
        talentProfile: {
            id: string;
            displayName: string;
            currentTitle?: string | null;
            location?: string | null;
        };
    }>;
};

export default function RecruiterShortlistsPage() {
    const [shortlists, setShortlists] = useState<Shortlist[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                    shortlists.map((shortlist) => (
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
                            <CardContent className="space-y-3">
                                {shortlist.candidates.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No candidates yet.</p>
                                ) : (
                                    shortlist.candidates.map((candidate) => (
                                        <div
                                            key={candidate.id}
                                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                                        >
                                            <div>
                                                <p className="font-medium">{candidate.talentProfile.displayName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {candidate.talentProfile.currentTitle || "Role not specified"} ·{" "}
                                                    {candidate.talentProfile.location || "Location flexible"}
                                                </p>
                                                {candidate.note && (
                                                    <p className="text-sm text-muted-foreground">Note: {candidate.note}</p>
                                                )}
                                            </div>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/recruiters/candidates/${candidate.talentProfile.id}`}>
                                                    View CV
                                                </Link>
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </section>
        </RecruiterShell>
    );
}
