'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/components/providers/locale-provider';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    const { t } = useLocale();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                // Show friendly error message based on error type
                if (result.error === 'CredentialsSignin') {
                    toast.error('Invalid email or password');
                } else if (result.error.includes('verify your email')) {
                    toast.error('Please verify your email before signing in');
                } else if (result.error.includes('deleted')) {
                    toast.error('This account has been deleted');
                } else {
                    toast.error('Invalid email or password');
                }
            } else if (result?.ok) {
                toast.success('Login successful! Redirecting...');
                // Use hard redirect instead of router.push
                window.location.href = callbackUrl;
            } else {
                toast.error('Something went wrong. Please try again.');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            toast.error('Unable to sign in. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">{t.auth.login.title}</h1>
                <p className="text-muted-foreground">{t.auth.login.subtitle}</p>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">{t.auth.login.email}</Label>
                    <div className="relative">
                        <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            className="ps-10 h-12"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t.auth.login.password}</Label>
                        <Link
                            href="/forgot-password"
                            className="text-sm text-primary hover:underline"
                        >
                            {t.auth.login.forgotPassword}
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="ps-10 pe-10 h-12"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-5 w-5 me-2 animate-spin" />}
                    {t.auth.login.signIn}
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
                {t.auth.login.noAccount}{' '}
                <Link href="/register" className="text-primary hover:underline font-medium">
                    {t.auth.login.signUpLink}
                </Link>
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="w-full max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Loading...</h1>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
