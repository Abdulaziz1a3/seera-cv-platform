'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Search,
    Users,
    Filter,
    Unlock,
    Lock,
    Download,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    GraduationCap,
    Clock,
    Star,
    Sparkles,
    CreditCard,
    Building2,
    CheckCircle2,
    ChevronDown,
    Crown,
    Eye,
    MessageSquare,
    Folder,
    Settings,
    TrendingUp,
    DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    CREDIT_PACKAGES,
    SUBSCRIPTION_PLANS,
    GCC_LOCATIONS,
    INDUSTRIES,
} from '@/lib/talent-marketplace';

export default function RecruiterPortalPage() {
    // Company state (mock)
    const [credits, setCredits] = useState(45);
    const [plan] = useState('professional');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [selectedIndustry, setSelectedIndustry] = useState<string>('');
    const [minExperience, setMinExperience] = useState<string>('');
    const [maxExperience, setMaxExperience] = useState<string>('');
    const [candidates, setCandidates] = useState<any[]>([]);
    const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
    const [isEnterprise, setIsEnterprise] = useState(true);
    const [shortlists, setShortlists] = useState<any[]>([]);
    const [selectedShortlistId, setSelectedShortlistId] = useState<string>('');
    const [newShortlistName, setNewShortlistName] = useState('');
    const [shortlistDialogOpen, setShortlistDialogOpen] = useState(false);

    // UI state
    const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<string>('pack-25');

    // Statistics
    const stats = {
        totalSearches: 234,
        totalUnlocks: 67,
        responseRate: 73,
        hires: 4,
    };

    // Handle unlock
    const handleUnlock = (candidateId: string) => {
        if (credits < 1) {
            toast.error('Not enough credits. Please purchase more.');
            setBuyCreditsOpen(true);
            return;
        }

        setCandidates(prev =>
            prev.map(c =>
                c.id === candidateId ? { ...c, isUnlocked: true } : c
            )
        );
        setCredits(prev => prev - 1);
        toast.success('CV unlocked! Contact information is now visible.');
    };

    useEffect(() => {
        const loadStatusAndShortlists = async () => {
            try {
                const statusRes = await fetch('/api/billing/status');
                const statusData = statusRes.ok ? await statusRes.json() : null;
                if (statusData) {
                    setIsEnterprise(statusData.isActive && statusData.plan === 'ENTERPRISE');
                }

                const shortlistRes = await fetch('/api/recruiters/shortlists');
                if (shortlistRes.ok) {
                    const shortlistData = await shortlistRes.json();
                    setShortlists(shortlistData.shortlists || []);
                }
            } catch (error) {
                console.error('Failed to load recruiter data', error);
            }
        };
        loadStatusAndShortlists();
    }, []);

    // Handle search
    const handleSearch = async () => {
        setIsLoadingCandidates(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('query', searchQuery);
            if (selectedLocation) params.set('location', selectedLocation);
            if (selectedIndustry) params.set('industry', selectedIndustry);
            if (minExperience) params.set('minExp', minExperience);
            if (maxExperience) params.set('maxExp', maxExperience);

            const res = await fetch(`/api/recruiters/candidates?${params.toString()}`);
            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.error || 'Search failed');
                return;
            }
            const data = await res.json();
            setCandidates(data.results || []);
            toast.success(`Found ${data.results?.length || 0} matching candidates`);
        } catch (error) {
            console.error('Search error', error);
            toast.error('Search failed');
        } finally {
            setIsLoadingCandidates(false);
        }
    };

    const handleCreateShortlist = async () => {
        if (!newShortlistName.trim()) return;
        const res = await fetch('/api/recruiters/shortlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newShortlistName.trim() }),
        });
        if (!res.ok) {
            toast.error('Failed to create shortlist');
            return;
        }
        const data = await res.json();
        setShortlists((prev) => [data.shortlist, ...prev]);
        setSelectedShortlistId(data.shortlist.id);
        setNewShortlistName('');
        setShortlistDialogOpen(false);
        toast.success('Shortlist created');
    };

    const handleAddToShortlist = async (talentProfileId: string) => {
        if (!selectedShortlistId) {
            toast.error('Select a shortlist first');
            return;
        }
        const res = await fetch(`/api/recruiters/shortlists/${selectedShortlistId}/candidates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ talentProfileId }),
        });
        if (!res.ok) {
            toast.error('Failed to add to shortlist');
            return;
        }
        toast.success('Added to shortlist');
    };

    // Get availability color
    const getAvailabilityColor = (status: string) => {
        switch (status) {
            case 'actively_looking': return 'bg-green-500';
            case 'open_to_offers': return 'bg-amber-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Nav */}
            <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Seera AI for Recruiters</h1>
                            <p className="text-xs text-muted-foreground">Find top Saudi talent</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Dialog open={buyCreditsOpen} onOpenChange={setBuyCreditsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span className="font-bold">{credits}</span> Credits
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Buy Credits</DialogTitle>
                                    <DialogDescription>
                                        Each credit unlocks one candidate's full profile
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                    {CREDIT_PACKAGES.map((pkg) => (
                                        <Card
                                            key={pkg.id}
                                            className={`cursor-pointer transition-all ${selectedPackage === pkg.id
                                                ? 'border-primary ring-2 ring-primary'
                                                : 'hover:border-primary/50'
                                                }`}
                                            onClick={() => setSelectedPackage(pkg.id)}
                                        >
                                            <CardContent className="pt-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-semibold">{pkg.name}</h3>
                                                    {pkg.popular && (
                                                        <Badge className="bg-primary">Popular</Badge>
                                                    )}
                                                </div>
                                                <div className="text-3xl font-bold">
                                                    {pkg.credits} <span className="text-sm font-normal">CVs</span>
                                                </div>
                                                <div className="text-lg text-primary font-semibold mt-1">
                                                    {pkg.price} SAR
                                                </div>
                                                {pkg.savings && (
                                                    <Badge variant="secondary" className="mt-2">
                                                        Save {pkg.savings}%
                                                    </Badge>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                                <Button className="w-full mt-4">
                                    <CreditCard className="h-4 w-4 me-2" />
                                    Purchase Credits
                                </Button>
                            </DialogContent>
                        </Dialog>

                        <Badge variant="outline" className="px-3 py-1.5">
                            <CheckCircle2 className="h-4 w-4 me-1 text-green-500" />
                            Verified Company
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                <Card className="mb-6 border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/30">
                    <CardContent className="py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">Coming soon</Badge>
                                <span className="font-semibold">Recruiter portal is not live yet</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                We're polishing the recruiter experience. Access will open soon.
                            </p>
                        </div>
                        <Button variant="outline" disabled>
                            Notify me
                        </Button>
                    </CardContent>
                </Card>
                <div className="relative">
                    <div className={!isEnterprise ? 'pointer-events-none opacity-50' : undefined}>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { icon: Search, label: 'Searches', value: stats.totalSearches, color: 'text-blue-500' },
                        { icon: Unlock, label: 'Unlocked', value: stats.totalUnlocks, color: 'text-green-500' },
                        { icon: MessageSquare, label: 'Response Rate', value: `${stats.responseRate}%`, color: 'text-purple-500' },
                        { icon: CheckCircle2, label: 'Hires', value: stats.hires, color: 'text-amber-500' },
                    ].map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="pt-4 flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Recruiter Features */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-blue-500" />
                                Advanced Candidate Search
                            </CardTitle>
                            <CardDescription>
                                Precise filters to find the right talent fast.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>Skills, role, seniority, and years of experience</li>
                                <li>Location, relocation, notice period, and availability</li>
                                <li>Salary range and industry background</li>
                            </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-amber-500" />
                                Smart Shortlists
                            </CardTitle>
                            <CardDescription>
                                AI Fit Score and shortlist workflows built for teams.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>Compare candidates side by side with Fit Score</li>
                                <li>Save searches, auto-refresh alerts, and tags</li>
                                <li>Share shortlists with hiring managers</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Section */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Search Talent
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div className="md:col-span-2">
                                <Input
                                    placeholder="Job title, skills, or keywords..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GCC_LOCATIONS.map((loc) => (
                                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 mb-4">
                            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Industry" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INDUSTRIES.map((ind) => (
                                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                type="number"
                                placeholder="Min experience (years)"
                                value={minExperience}
                                onChange={(e) => setMinExperience(e.target.value)}
                            />

                            <Input
                                type="number"
                                placeholder="Max experience (years)"
                                value={maxExperience}
                                onChange={(e) => setMaxExperience(e.target.value)}
                            />

                            <Button className="h-10" onClick={handleSearch}>
                                <Search className="h-4 w-4 me-2" />
                                Search
                            </Button>
                        </div>

                        <Button variant="outline" size="sm" className="gap-2">
                            <Sparkles className="h-4 w-4" />
                            AI Match - Find Best 10
                            <Badge variant="secondary" className="text-xs">Pro</Badge>
                        </Button>
                    </CardContent>
                </Card>

                {/* Shortlists */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Folder className="h-5 w-5" />
                            Smart Shortlists
                        </CardTitle>
                        <CardDescription>
                            Save and share top candidates with your hiring team.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
                        <Select value={selectedShortlistId} onValueChange={setSelectedShortlistId}>
                            <SelectTrigger className="h-11 md:w-64">
                                <SelectValue placeholder="Select shortlist" />
                            </SelectTrigger>
                            <SelectContent>
                                {shortlists.map((shortlist) => (
                                    <SelectItem key={shortlist.id} value={shortlist.id}>
                                        {shortlist.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Dialog open={shortlistDialogOpen} onOpenChange={setShortlistDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-11">New Shortlist</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create shortlist</DialogTitle>
                                    <DialogDescription>
                                        Give your shortlist a name to start saving candidates.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3">
                                    <Input
                                        placeholder="e.g., Senior Engineers"
                                        value={newShortlistName}
                                        onChange={(e) => setNewShortlistName(e.target.value)}
                                    />
                                    <Button onClick={handleCreateShortlist}>Create</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {/* Results */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            {isLoadingCandidates ? 'Searching...' : `Found ${candidates.length} matching candidates`}
                        </h2>
                        <Select defaultValue="match">
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="match">Best Match</SelectItem>
                                <SelectItem value="experience">Experience</SelectItem>
                                <SelectItem value="recent">Recently Active</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {candidates.map((candidate) => (
                        <Card key={candidate.id} className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-start gap-6">
                                    {/* Avatar & Basic Info */}
                                    <div className="flex-shrink-0">
                                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                                            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                                {candidate.displayName}
                                            </h3>
                                                <p className="text-muted-foreground">{candidate.currentTitle}</p>
                                            </div>

                                            <div className="text-end">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                                    <span className="font-bold text-lg">{candidate.matchScore}%</span>
                                                    <span className="text-sm text-muted-foreground">match</span>
                                                </div>
                                                <Badge className={`${getAvailabilityColor(candidate.availabilityStatus)} text-white text-xs`}>
                                                    {candidate.availabilityStatus.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                {candidate.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="h-4 w-4" />
                                                {candidate.yearsExperience} years
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <GraduationCap className="h-4 w-4" />
                                                {candidate.education}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <DollarSign className="h-4 w-4" />
                                                {candidate.desiredSalary?.min != null && candidate.desiredSalary?.max != null
                                                    ? `${candidate.desiredSalary.min.toLocaleString()} - ${candidate.desiredSalary.max.toLocaleString()} SAR`
                                                    : 'Hidden'}
                                            </span>
                                        </div>

                                        {/* Skills */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {candidate.skills.map((skill: string) => (
                                                <Badge key={skill} variant="secondary">{skill}</Badge>
                                            ))}
                                        </div>

                                        {/* Summary */}
                                        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                                            {candidate.summary}
                                        </p>

                                        {/* Contact Info (only if unlocked) */}
                                        {candidate.isUnlocked && (
                                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                                                <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Contact Information
                                                </h4>
                                                <div className="flex flex-wrap gap-6 text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4" />
                                                        {candidate.email || 'Available after unlock'}
                                                    </span>
                                                    <span className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4" />
                                                        {candidate.phone || 'Available after unlock'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex md:flex-col gap-2 flex-shrink-0">
                                        {candidate.isUnlocked ? (
                                            <>
                                                <Button variant="outline" size="sm" className="gap-2">
                                                    <Download className="h-4 w-4" />
                                                    Download CV
                                                </Button>
                                                <Button size="sm" className="gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    Send Message
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => handleAddToShortlist(candidate.id)}
                                                >
                                                    <Folder className="h-4 w-4" />
                                                    Add to Shortlist
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
                                                    onClick={() => handleUnlock(candidate.id)}
                                                >
                                                    <Unlock className="h-4 w-4" />
                                                    Unlock - 1 Credit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => handleAddToShortlist(candidate.id)}
                                                >
                                                    <Folder className="h-4 w-4" />
                                                    Save
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                    </div>
                    {!isEnterprise && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="max-w-md w-full rounded-2xl border bg-card p-6 shadow-xl text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                                    <Crown className="h-6 w-6" />
                                </div>
                                <h2 className="text-xl font-semibold">Enterprise required</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Upgrade to Enterprise to access recruiter search and shortlists.
                                </p>
                                <Button
                                    className="mt-6 w-full"
                                    onClick={async () => {
                                        const res = await fetch('/api/billing/checkout', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ plan: 'enterprise', interval: 'monthly' }),
                                        });
                                        const data = await res.json();
                                        if (data?.url) window.location.href = data.url;
                                    }}
                                >
                                    Upgrade to Enterprise
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
