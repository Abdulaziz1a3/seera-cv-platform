"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/components/providers/locale-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Gift, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type GiftPayload = {
    plan: 'PRO' | 'ENTERPRISE';
    interval: 'MONTHLY' | 'YEARLY';
    status: 'PENDING' | 'REDEEMED' | 'EXPIRED' | 'CANCELED';
    message?: string | null;
    expiresAt?: string | null;
    redeemedAt?: string | null;
    createdAt?: string | null;
    senderName?: string | null;
    recipientEmailHint?: string | null;
    requiresEmailMatch?: boolean;
};

export default function GiftClaimPage({ params }: { params: { token: string } }) {
    const { data: session } = useSession();
    const { t } = useLocale();
    const token = params.token;

    const [gift, setGift] = useState<GiftPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const planLabel = useMemo(() => {
        if (!gift) return '';
        return gift.plan === 'ENTERPRISE' ? 'Enterprise' : 'Pro';
    }, [gift]);

    const intervalLabel = useMemo(() => {
        if (!gift) return '';
        return gift.interval === 'YEARLY' ? '1 year' : '1 month';
    }, [gift]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        fetch(`/api/gifts/${token}`)
            .then(async (res) => {
                const payload = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(payload?.error || t.errors.generic);
                }
                return payload;
            })
            .then((payload) => {
                if (!mounted) return;
                setGift(payload.gift || null);
            })
            .catch((err: Error) => {
                if (!mounted) return;
                setError(err.message || t.errors.generic);
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [token]);

    const handleClaim = async () => {
        setClaiming(true);
        try {
            const res = await fetch('/api/gifts/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(payload?.error || t.errors.generic);
            }
            toast.success(t.gift.claimSuccess);
            const refreshed = await fetch(`/api/gifts/${token}`).then((r) => r.json());
            setGift(refreshed.gift || null);
        } catch (err) {
            const message = err instanceof Error ? err.message : t.errors.generic;
            toast.error(message);
        } finally {
            setClaiming(false);
        }
    };

    const statusBadge = () => {
        if (!gift) return null;
        if (gift.status === 'PENDING') return <Badge className="bg-emerald-500 text-white">{t.gift.ready}</Badge>;
        if (gift.status === 'REDEEMED') return <Badge variant="secondary">{t.gift.claimed}</Badge>;
        if (gift.status === 'EXPIRED') return <Badge variant="destructive">{t.gift.expired}</Badge>;
        return <Badge variant="outline">{t.gift.inactive}</Badge>;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Gift className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{t.gift.title}</CardTitle>
                    <CardDescription>{t.gift.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t.gift.loading}
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {!loading && !error && gift && (
                        <>
                            <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    {statusBadge()}
                                    <Badge variant="outline">{planLabel} Plan</Badge>
                                    <Badge variant="outline">{intervalLabel}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {gift.senderName ? `${gift.senderName} sent you this gift.` : 'A Seera AI gift is waiting for you.'}
                                </p>
                                {gift.recipientEmailHint && gift.requiresEmailMatch && (
                                    <p className="text-xs text-muted-foreground">
                                        {t.gift.reservedFor} {gift.recipientEmailHint}.
                                    </p>
                                )}
                                {gift.message && (
                                    <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
                                        {gift.message}
                                    </div>
                                )}
                            </div>

                            {gift.status === 'REDEEMED' && (
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {t.gift.claimSuccess}
                                </div>
                            )}

                            {gift.status === 'PENDING' && (
                                <>
                                    {!session?.user ? (
                                        <Button asChild className="w-full">
                                            <Link href={`/auth/login?next=/gift/${token}`}>{t.gift.signIn}</Link>
                                        </Button>
                                    ) : (
                                        <Button className="w-full" onClick={handleClaim} disabled={claiming}>
                                            {claiming && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                                            {t.gift.claim}
                                        </Button>
                                    )}
                                </>
                            )}

                            {gift.status === 'EXPIRED' && (
                                <div className="text-sm text-muted-foreground">
                                    {t.gift.expiredNote}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
