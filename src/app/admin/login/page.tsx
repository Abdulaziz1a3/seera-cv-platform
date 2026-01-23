'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function AdminLoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/admin';
    const error = searchParams.get('error');

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [attempts, setAttempts] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (attempts >= 5) {
            toast.error('Too many failed attempts. Please try again later.');
            return;
        }

        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
                portal: 'admin',
            });

            if (result?.error) {
                setAttempts(prev => prev + 1);
                if (result.error === 'ADMIN_PORTAL_ONLY') {
                    toast.error('Access denied. Admin privileges required.');
                } else if (result.error === 'CredentialsSignin') {
                    toast.error('Invalid admin credentials');
                } else {
                    toast.error('Authentication failed. Please try again.');
                }
            } else if (result?.ok) {
                toast.success('Welcome back, Admin!');
                router.push(callbackUrl);
                router.refresh();
            } else {
                toast.error('Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            toast.error('Unable to sign in. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4">
                        <Shield className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                    <p className="text-slate-400 mt-1">Seera AI Administration</p>
                </div>

                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl text-white">Sign in</CardTitle>
                        <CardDescription className="text-slate-400">
                            Enter your admin credentials to continue
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200 flex gap-2 items-start">
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    {error === 'AccessDenied'
                                        ? 'Access denied. Admin privileges required.'
                                        : 'Authentication failed. Please try again.'}
                                </div>
                            </div>
                        )}

                        {attempts >= 3 && attempts < 5 && (
                            <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 flex gap-2 items-start">
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-400" />
                                <div>{5 - attempts} attempts remaining before lockout.</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-200">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@example.com"
                                        className="pl-10 h-12 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading || attempts >= 5}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-200">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10 h-12 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading || attempts >= 5}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-medium"
                                disabled={isLoading || attempts >= 5}
                            >
                                {isLoading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                                {attempts >= 5 ? 'Account Locked' : 'Sign in to Admin'}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-700">
                            <p className="text-xs text-slate-500 text-center">
                                This is a restricted area. Unauthorized access attempts are logged and monitored.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-slate-500 mt-6">
                    &copy; {new Date().getFullYear()} Seera AI. All rights reserved.
                </p>
            </div>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <AdminLoginForm />
        </Suspense>
    );
}
