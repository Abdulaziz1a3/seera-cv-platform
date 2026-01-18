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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Building2,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Check,
    Users,
    User,
    Globe,
    Phone,
    Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { INDUSTRIES } from '@/lib/talent-marketplace';
import { isCompanyEmail } from '@/lib/company-email';

export default function RecruiterRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        // Step 1 - Personal
        fullName: '',
        email: '',
        phone: '',
        password: '',
        // Step 2 - Company
        companyName: '',
        companyWebsite: '',
        industry: '',
        companySize: '',
        jobTitle: '',
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            if (!isCompanyEmail(formData.email)) {
                toast.error('Please use your company email address.');
                return;
            }
            setStep(2);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/recruiters/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    companyName: formData.companyName,
                    companyWebsite: formData.companyWebsite,
                    industry: formData.industry,
                    companySize: formData.companySize,
                    jobTitle: formData.jobTitle,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                toast.error(result?.error || 'Registration failed');
                setIsLoading(false);
                return;
            }

            const login = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (login?.error) {
                toast.success('Account created. Please sign in.');
                router.push('/recruiters/login');
                return;
            }

            toast.success('Account created! Welcome to Seera AI for Recruiters.');
            router.push('/recruiters');
        } catch (error) {
            console.error('Recruiter registration error', error);
            toast.error('Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const companySizes = [
        { value: 'startup', label: '1-10 employees' },
        { value: 'small', label: '11-50 employees' },
        { value: 'medium', label: '51-200 employees' },
        { value: 'large', label: '201-1000 employees' },
        { value: 'enterprise', label: '1000+ employees' },
    ];

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

                        <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
                        <p className="text-muted-foreground">
                            Join 500+ companies hiring top Saudi talent.
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary text-white' : 'bg-muted'
                                }`}>
                                {step > 1 ? <Check className="h-4 w-4" /> : '1'}
                            </div>
                            <span className="text-sm font-medium">Your Info</span>
                        </div>
                        <div className="flex-1 h-px bg-muted" />
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary text-white' : 'bg-muted'
                                }`}>
                                2
                            </div>
                            <span className="text-sm font-medium">Company</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {step === 1 && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Your full name"
                                            className="ps-10 h-12"
                                            value={formData.fullName}
                                            onChange={(e) => updateField('fullName', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Work Email</label>
                                    <div className="relative">
                                        <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="email"
                                            placeholder="you@company.com"
                                            className="ps-10 h-12"
                                            value={formData.email}
                                            onChange={(e) => updateField('email', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="tel"
                                            placeholder="+966 5XX XXX XXXX"
                                            className="ps-10 h-12"
                                            value={formData.phone}
                                            onChange={(e) => updateField('phone', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Create a password"
                                            className="ps-10 pe-10 h-12"
                                            value={formData.password}
                                            onChange={(e) => updateField('password', e.target.value)}
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Company Name</label>
                                    <div className="relative">
                                        <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Your company name"
                                            className="ps-10 h-12"
                                            value={formData.companyName}
                                            onChange={(e) => updateField('companyName', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Company Website</label>
                                    <div className="relative">
                                        <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="url"
                                            placeholder="https://company.com"
                                            className="ps-10 h-12"
                                            value={formData.companyWebsite}
                                            onChange={(e) => updateField('companyWebsite', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Industry</label>
                                    <Select value={formData.industry} onValueChange={(v) => updateField('industry', v)}>
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select industry" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {INDUSTRIES.map((ind) => (
                                                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Company Size</label>
                                    <Select value={formData.companySize} onValueChange={(v) => updateField('companySize', v)}>
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select company size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companySizes.map((size) => (
                                                <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Your Job Title</label>
                                    <div className="relative">
                                        <Briefcase className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="e.g., HR Manager, Recruiter"
                                            className="ps-10 h-12"
                                            value={formData.jobTitle}
                                            onChange={(e) => updateField('jobTitle', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex gap-3">
                            {step === 2 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-12"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </Button>
                            )}
                            <Button
                                type="submit"
                                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating account...' : step === 1 ? 'Continue' : 'Create Account'}
                                <ArrowRight className="h-4 w-4 ms-2" />
                            </Button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/recruiters/login" className="text-primary font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>

                    <div className="mt-8 pt-8 border-t">
                        <p className="text-sm text-muted-foreground text-center">
                            Looking to create a resume?{' '}
                            <Link href="/register" className="text-primary hover:underline">
                                Job seeker signup
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Branding */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 p-12 items-center justify-center text-white">
                <div className="max-w-md">
                    <Badge className="bg-white/20 text-white mb-6">
                        🏢 Trusted by 500+ Companies
                    </Badge>

                    <h2 className="text-4xl font-bold mb-6">
                        Start Hiring Today
                    </h2>
                    <p className="text-xl text-white/90 mb-8">
                        Join 500+ companies using Seera AI to find
                        top talent in Saudi Arabia.
                    </p>

                    <div className="space-y-4 mb-12">
                        {[
                            'Access 50,000+ verified professionals',
                            'Smart search by skills and experience',
                            'AI-powered candidate matching',
                            'Verified company badge after review',
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Check className="h-5 w-5 text-green-400" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { value: '50,000+', label: 'Active CVs' },
                            { value: '73%', label: 'Response Rate' },
                            { value: '2 Days', label: 'Avg. Time to Hire' },
                            { value: '4.9/5', label: 'Customer Rating' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white/10 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-sm text-white/70">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
