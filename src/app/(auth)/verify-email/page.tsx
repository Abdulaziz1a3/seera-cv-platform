'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

type VerificationStatus = 'loading' | 'success' | 'already_verified' | 'error';

function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<VerificationStatus>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Verification link is invalid or missing.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (!response.ok) {
                    setStatus('error');
                    setErrorMessage(data.error || 'Verification failed');
                    return;
                }

                if (data.alreadyVerified) {
                    setStatus('already_verified');
                } else {
                    setStatus('success');
                }
            } catch {
                setStatus('error');
                setErrorMessage('Something went wrong. Please try again.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="space-y-6 text-center">
            {/* Logo */}
            <div className="flex items-center gap-2 justify-center mb-8">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Seera AI</span>
            </div>

            {/* Loading State */}
            {status === 'loading' && (
                <>
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Verifying your email...</h1>
                        <p className="text-muted-foreground mt-2">
                            Please wait while we verify your email address.
                        </p>
                    </div>
                </>
            )}

            {/* Success State */}
            {status === 'success' && (
                <>
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-success" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Email verified!</h1>
                        <p className="text-muted-foreground mt-2">
                            Your email has been verified successfully. You can now sign in to your account.
                        </p>
                    </div>
                    <Button asChild className="w-full">
                        <Link href="/login">Sign in to your account</Link>
                    </Button>
                </>
            )}

            {/* Already Verified State */}
            {status === 'already_verified' && (
                <>
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Already verified</h1>
                        <p className="text-muted-foreground mt-2">
                            Your email address has already been verified. You can sign in to your account.
                        </p>
                    </div>
                    <Button asChild className="w-full">
                        <Link href="/login">Sign in to your account</Link>
                    </Button>
                </>
            )}

            {/* Error State */}
            {status === 'error' && (
                <>
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                            <XCircle className="h-8 w-8 text-destructive" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Verification failed</h1>
                        <p className="text-muted-foreground mt-2">{errorMessage}</p>
                    </div>
                    <div className="space-y-3 pt-4">
                        <p className="text-sm text-muted-foreground">
                            The verification link may have expired. You can request a new one after signing in.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/login">Go to sign in</Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/register">Create a new account</Link>
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6 text-center">
                <div className="flex items-center gap-2 justify-center mb-8">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold">Seera AI</span>
                </div>
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                </div>
            </div>
        }>
            <VerifyEmailForm />
        </Suspense>
    );
}
