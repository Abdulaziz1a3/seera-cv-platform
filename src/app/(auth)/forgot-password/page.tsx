'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, FileText, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to send reset email');
            }

            setSubmittedEmail(data.email);
            setIsSubmitted(true);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="space-y-6 text-center">
                {/* Logo */}
                <div className="flex items-center gap-2 justify-center mb-8">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold">Seera AI</span>
                </div>

                {/* Success Icon */}
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-success" />
                    </div>
                </div>

                {/* Success Message */}
                <div>
                    <h1 className="text-2xl font-bold">Check your email</h1>
                    <p className="text-muted-foreground mt-2">
                        We've sent a password reset link to{' '}
                        <span className="font-medium text-foreground">{submittedEmail}</span>
                    </p>
                </div>

                <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                        Didn't receive the email? Check your spam folder or{' '}
                        <button
                            onClick={() => setIsSubmitted(false)}
                            className="text-primary hover:underline font-medium"
                        >
                            try again
                        </button>
                    </p>

                    <Button variant="outline" asChild className="w-full">
                        <Link href="/login">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to sign in
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Seera AI</span>
            </div>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Forgot your password?</h1>
                <p className="text-muted-foreground mt-1">
                    Enter your email and we'll send you a reset link
                </p>
            </div>

            {/* Forgot Password Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            className="pl-10"
                            {...register('email')}
                            error={errors.email?.message}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                </Button>
            </form>

            {/* Back to Sign In */}
            <Button variant="outline" asChild className="w-full">
                <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign in
                </Link>
            </Button>
        </div>
    );
}
