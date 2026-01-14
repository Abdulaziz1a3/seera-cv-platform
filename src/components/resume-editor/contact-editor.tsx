'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type Contact } from '@/lib/resume-schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, MapPin, Linkedin, Globe, Github } from 'lucide-react';

interface ContactEditorProps {
    data: Contact;
    onChange: (data: Contact) => void;
}

export function ContactEditor({ data, onChange }: ContactEditorProps) {
    const {
        register,
        formState: { errors },
        watch,
    } = useForm<Contact>({
        resolver: zodResolver(contactSchema),
        defaultValues: data,
    });

    // Watch all fields and trigger onChange
    const watchedFields = watch();

    const handleFieldChange = (field: keyof Contact, value: string) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Contact Information</h2>
                <p className="text-muted-foreground mt-1">
                    Your contact details help employers reach you. Include accurate and professional information.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                    <CardDescription>Your name and primary contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" required>Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="fullName"
                                    placeholder="John Doe"
                                    className="pl-10"
                                    defaultValue={data.fullName}
                                    onChange={(e) => handleFieldChange('fullName', e.target.value)}
                                    error={errors.fullName?.message}
                                />
                            </div>
                        </div>

                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="email" required>Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    className="pl-10"
                                    defaultValue={data.email}
                                    onChange={(e) => handleFieldChange('email', e.target.value)}
                                    error={errors.email?.message}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+1 (555) 123-4567"
                                    className="pl-10"
                                    defaultValue={data.phone || ''}
                                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="location"
                                placeholder="New York, NY"
                                className="pl-10"
                                defaultValue={data.location || ''}
                                onChange={(e) => handleFieldChange('location', e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            City and state/country is usually sufficient. No need for full address.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Online Presence</CardTitle>
                    <CardDescription>Add links to your professional profiles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn URL</Label>
                        <div className="relative">
                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="linkedin"
                                type="url"
                                placeholder="https://linkedin.com/in/johndoe"
                                className="pl-10"
                                defaultValue={data.linkedin || ''}
                                onChange={(e) => handleFieldChange('linkedin', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website">Personal Website</Label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="website"
                                type="url"
                                placeholder="https://johndoe.com"
                                className="pl-10"
                                defaultValue={data.website || ''}
                                onChange={(e) => handleFieldChange('website', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="github">GitHub URL</Label>
                        <div className="relative">
                            <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="github"
                                type="url"
                                placeholder="https://github.com/johndoe"
                                className="pl-10"
                                defaultValue={data.github || ''}
                                onChange={(e) => handleFieldChange('github', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
