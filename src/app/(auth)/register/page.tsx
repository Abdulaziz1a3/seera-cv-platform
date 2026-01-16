'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, User, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/components/providers/locale-provider';

export default function RegisterPage() {
    const router = useRouter();
    const { t } = useLocale();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Password requirements
    const passwordRequirements = [
        { label: '8+ characters', test: (p: string) => p.length >= 8 },
        { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
        { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
        { label: 'Number', test: (p: string) => /\d/.test(p) },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error(t.errors.passwordMismatch);
            return;
        }

        if (!agreedToTerms) {
            toast.error('Please agree to the terms and conditions');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Registration failed');
            }

            toast.success('Account created! Please check your email to verify.');
            router.push('/login');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">{t.auth.register.title}</h1>
                <p className="text-muted-foreground">{t.auth.register.subtitle}</p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t.auth.register.name}</Label>
                    <div className="relative">
                        <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="John Doe"
                            className="ps-10 h-12"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">{t.auth.register.email}</Label>
                    <div className="relative">
                        <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            className="ps-10 h-12"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">{t.auth.register.password}</Label>
                    <div className="relative">
                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="ps-10 pe-10 h-12"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Password Requirements */}
                    {formData.password && (
                        <div className="grid grid-cols-2 gap-1 mt-2">
                            {passwordRequirements.map((req) => (
                                <div
                                    key={req.label}
                                    className={`flex items-center gap-1 text-xs ${req.test(formData.password) ? 'text-green-600' : 'text-muted-foreground'
                                        }`}
                                >
                                    {req.test(formData.password) ? (
                                        <Check className="h-3 w-3" />
                                    ) : (
                                        <X className="h-3 w-3" />
                                    )}
                                    {req.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t.auth.register.confirmPassword}</Label>
                    <div className="relative">
                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            className="ps-10 h-12"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Terms Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-muted-foreground">
                        {t.auth.register.agreeToTerms}{' '}
                        <Link href="/terms" className="text-primary hover:underline">
                            {t.auth.register.termsLink}
                        </Link>{' '}
                        {t.auth.register.andThe}{' '}
                        <Link href="/privacy" className="text-primary hover:underline">
                            {t.auth.register.privacyLink}
                        </Link>
                    </span>
                </label>

                <Button
                    type="submit"
                    className="w-full h-12 text-base"
                    disabled={isLoading || !agreedToTerms}
                >
                    {isLoading && <Loader2 className="h-5 w-5 me-2 animate-spin" />}
                    {t.auth.register.signUp}
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
                {t.auth.register.haveAccount}{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                    {t.auth.register.signInLink}
                </Link>
            </p>
        </div>
    );
}
