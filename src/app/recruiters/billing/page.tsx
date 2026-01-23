"use client";

import { useEffect, useState } from "react";
import { CreditCard, Calendar, Package } from "lucide-react";
import { toast } from "sonner";
import { RecruiterShell } from "@/components/recruiter/recruiter-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SubscriptionInfo = {
    plan: string;
    status: string;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
};

type CreditLedgerEntry = {
    id: string;
    type: string;
    amount: number;
    createdAt: string;
};

export default function RecruiterBillingPage() {
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [balance, setBalance] = useState(0);
    const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
    const [packs, setPacks] = useState<Record<string, { credits: number; amountSar: number }>>({});

    const loadBilling = async () => {
        const [subRes, creditsRes] = await Promise.all([
            fetch("/api/recruiters/billing/manage"),
            fetch("/api/recruiters/credits"),
        ]);

        const subData = subRes.ok ? await subRes.json() : null;
        const creditsData = creditsRes.ok ? await creditsRes.json() : null;

        setSubscription(subData?.subscription || null);
        setBalance(creditsData?.balance || 0);
        setLedger(creditsData?.ledger || []);
        setPacks(creditsData?.packs || {});
    };

    useEffect(() => {
        loadBilling().catch(() => null);
    }, []);

    const startSubscription = async () => {
        const res = await fetch("/api/recruiters/billing/checkout", { method: "POST" });
        const data = await res.json();
        if (!res.ok || !data?.url) {
            toast.error(data?.error || "Failed to start checkout");
            return;
        }
        window.location.href = data.url;
    };

    const buyPack = async (pack: string) => {
        const res = await fetch("/api/recruiters/credits/buy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pack }),
        });
        const data = await res.json();
        if (!res.ok || !data?.url) {
            toast.error(data?.error || "Failed to start purchase");
            return;
        }
        window.location.href = data.url;
    };

    return (
        <RecruiterShell>
            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Subscription status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="secondary">{subscription?.plan || "GROWTH"}</Badge>
                            <Badge>{subscription?.status || "UNPAID"}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Renewal date: {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "Not active"}
                        </div>
                        <Button onClick={startSubscription}>Manage subscription</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Credits balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold">{balance}</p>
                        <p className="text-sm text-muted-foreground">CV credits available</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Buy credits
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                    {Object.entries(packs).map(([key, pack]) => (
                        <Card key={key} className="border-dashed">
                            <CardContent className="space-y-2 p-4">
                                <p className="text-sm text-muted-foreground">{pack.credits} credits</p>
                                <p className="text-2xl font-semibold">{pack.amountSar} SAR</p>
                                <Button onClick={() => buyPack(key)} className="w-full">
                                    Buy pack
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Credit ledger</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    {ledger.length === 0 && <p>No credit activity yet.</p>}
                    {ledger.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between border-b pb-2">
                            <span>{entry.type.replace("_", " ")}</span>
                            <span>{entry.amount > 0 ? `+${entry.amount}` : entry.amount}</span>
                            <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </RecruiterShell>
    );
}
