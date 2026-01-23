'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Check,
    Users,
    Search,
    Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { isCompanyEmail } from '@/lib/company-email';

export default function RecruiterLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const isComingSoon = false;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isComingSoon) {
            toast.info('Recruiter portal is coming soon.');
            return;
        }
        if (!isCompanyEmail(email)) {
            toast.error('Please use your company email address.');
            return;
        }
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
                portal: 'recruiter',
            });
            if (result?.error) {
                if (result.error === 'JOBSEEKER_PORTAL_ONLY') {
                    toast.error('This email is registered as a job seeker. Please use job seeker login.');
                } else {
                    toast.error('Invalid credentials');
                }
                return;
            }
            toast.success('Welcome back!');
            router.push('/recruiters');
        } catch (error) {
            console.error('Recruiter login error', error);
            toast.error('Sign in failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <Link href="/" className="flex items-center gap-2 mb-8">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">Seera AI for Recruiters</span>
                        </Link>

                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold">Welcome Back</h1>
                        {isComingSoon && <Badge variant="secondary">Coming soon</Badge>}
                        </div>
                        <p className="text-muted-foreground">
                            {isComingSoon
                                ? 'Recruiter access is not available yet.'
                                : 'Sign in to access your recruiter dashboard'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Work Email</label>
                            <div className="relative">
                                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="you@company.com"
                                    className="ps-10 h-12"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isComingSoon || isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="********"
                                    className="ps-10 pe-10 h-12"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isComingSoon || isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    disabled={isComingSoon || isLoading}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="rounded" disabled={isComingSoon || isLoading} />
                                <span>Remember me</span>
                            </label>
                            <Link href="/recruiters/forgot-password" className="text-primary hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600"
                            disabled={isComingSoon || isLoading}
                        >
                            {isComingSoon ? 'Coming soon' : isLoading ? 'Signing in...' : 'Sign In'}
                            <ArrowRight className="h-4 w-4 ms-2" />
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link href="/recruiters/register" className="text-primary hover:underline">
                            Create recruiter account
                        </Link>
                    </p>

                    <div className="mt-8 pt-8 border-t">
                        <p className="text-sm text-muted-foreground text-center">
                            Looking to create a resume?{' '}
                            <Link href="/login" className="text-primary hover:underline">
                                Job seeker login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Branding */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 p-12 items-center justify-center text-white">
                <div className="max-w-md">
                    <h2 className="text-4xl font-bold mb-6">
                        Find Your Next Great Hire
                    </h2>
                    <p className="text-xl text-white/90 mb-8">
                        Access 50,000+ verified professionals in Saudi Arabia.
                        Smart search, AI matching, and pay-per-CV pricing.
                    </p>

                    <div className="space-y-4">
                        {[
                            { icon: Users, text: '50,000+ active CVs in our talent pool' },
                            { icon: Search, text: 'Smart filters by role, skills, and location' },
                            { icon: Zap, text: 'AI matching finds best candidates instantly' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur">
                        <p className="text-white/90 mb-4">
                            "We hired 5 engineers in just 2 weeks. The quality of candidates is exceptional."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                                MR
                            </div>
                            <div>
                                <p className="font-semibold">Mohammed Al-Rashid</p>
                                <p className="text-sm text-white/70">HR Director, Tech Company</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
