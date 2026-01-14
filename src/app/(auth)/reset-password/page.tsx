'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { FileText, Loader2, CheckCircle2, XCircle, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type PageStatus = 'validating' | 'ready' | 'submitting' | 'success' | 'error';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<PageStatus>('validating');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const password = watch('password', '');

    // Password strength indicators
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Reset link is invalid or missing.');
            return;
        }

        const validateToken = async () => {
            try {
                const response = await fetch(`/api/auth/reset-password?token=${token}`);
                const data = await response.json();

                if (!data.valid) {
                    setStatus('error');
                    setErrorMessage(data.error || 'Reset link is invalid or expired.');
                    return;
                }

                setStatus('ready');
            } catch {
                setStatus('error');
                setErrorMessage('Failed to validate reset link.');
            }
        };

        validateToken();
    }, [token]);

    const onSubmit = async (data: ResetPasswordFormData) => {
        setStatus('submitting');

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password: data.password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to reset password');
            }

            setStatus('success');
            toast.success('Password reset successfully!');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login?reset=success');
            }, 2000);
        } catch (error) {
            setStatus('ready');
            toast.error(error instanceof Error ? error.message : 'Failed to reset password');
        }
    };

    return (
        <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-2 justify-center mb-8">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Seera AI</span>
            </div>

            {/* Validating State */}
            {status === 'validating' && (
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Validating reset link...</h1>
                        <p className="text-muted-foreground mt-2">
                            Please wait while we verify your reset link.
                        </p>
                    </div>
                </div>
            )}

            {/* Ready State - Show Form */}
            {(status === 'ready' || status === 'submitting') && (
                <>
                    <div>
                        <h1 className="text-2xl font-bold">Create new password</h1>
                        <p className="text-muted-foreground mt-1">
                            Enter your new password below
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter new password"
                                    className="pl-10 pr-10"
                                    {...register('password')}
                                    error={errors.password?.message}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            {/* Password Requirements */}
                            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                <div className={`flex items-center gap-1 ${hasMinLength ? 'text-success' : 'text-muted-foreground'}`}>
                                    <CheckCircle2 className="h-3 w-3" />
                                    8+ characters
                                </div>
                                <div className={`flex items-center gap-1 ${hasUppercase ? 'text-success' : 'text-muted-foreground'}`}>
                                    <CheckCircle2 className="h-3 w-3" />
                                    Uppercase letter
                                </div>
                                <div className={`flex items-center gap-1 ${hasLowercase ? 'text-success' : 'text-muted-foreground'}`}>
                                    <CheckCircle2 className="h-3 w-3" />
                                    Lowercase letter
                                </div>
                                <div className={`flex items-center gap-1 ${hasNumber ? 'text-success' : 'text-muted-foreground'}`}>
                                    <CheckCircle2 className="h-3 w-3" />
                                    Number
                                </div>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm new password"
                                    className="pl-10 pr-10"
                                    {...register('confirmPassword')}
                                    error={errors.confirmPassword?.message}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={status === 'submitting'}
                        >
                            {status === 'submitting' && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Reset Password
                        </Button>
                    </form>

                    <Button variant="outline" asChild className="w-full">
                        <Link href="/login">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to sign in
                        </Link>
                    </Button>
                </>
            )}

            {/* Success State */}
            {status === 'success' && (
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-success" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Password reset successful!</h1>
                        <p className="text-muted-foreground mt-2">
                            Your password has been reset. Redirecting you to sign in...
                        </p>
                    </div>
                    <Button asChild className="w-full">
                        <Link href="/login">Sign in now</Link>
                    </Button>
                </div>
            )}

            {/* Error State */}
            {status === 'error' && (
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                            <XCircle className="h-8 w-8 text-destructive" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Reset link expired</h1>
                        <p className="text-muted-foreground mt-2">{errorMessage}</p>
                    </div>
                    <div className="space-y-3 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Password reset links expire after 1 hour for security reasons.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/forgot-password">Request new reset link</Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/login">Back to sign in</Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6">
                <div className="flex items-center gap-2 justify-center mb-8">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold">Seera AI</span>
                </div>
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                    </div>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
