'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Smartphone,
  Monitor,
  Loader2,
  Check,
  X,
  Plus,
  Trash2,
  GripVertical,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { ProfileMinimalTemplate } from './templates/minimal';
import { ProfileBoldTemplate } from './templates/bold';
import { themeDisplayNames, templateConfigs, statusBadgeOptions } from '@/lib/seera-link/themes';
import type { CreateProfileInput, HighlightInput, ExperienceInput, ProjectInput, CertificateInput } from '@/lib/seera-link/schemas';
import type { ProfileData } from './templates/types';

interface ProfileEditorProps {
  mode: 'create' | 'edit';
  initialData: Partial<CreateProfileInput>;
  profileId?: string;
  onCancel?: () => void;
}

const defaultFormData: CreateProfileInput = {
  slug: '',
  displayName: '',
  title: '',
  persona: 'JOBS',
  template: 'MINIMAL',
  visibility: 'PUBLIC',
  language: 'en',
  themeColor: 'sapphire',
  statusBadges: [],
  enabledCtas: ['WHATSAPP', 'EMAIL', 'LINKEDIN'],
  highlights: [],
  experiences: [],
  projects: [],
  certificates: [],
  noIndex: false,
  hidePhoneNumber: false,
  enableDownloadCv: false,
};

export function ProfileEditor({ mode, initialData, profileId, onCancel }: ProfileEditorProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateProfileInput>({
    ...defaultFormData,
    ...initialData,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState('hero');

  const debouncedSlug = useDebounce(formData.slug, 500);

  // Check slug availability
  useEffect(() => {
    if (!debouncedSlug || debouncedSlug.length < 3) {
      setSlugStatus('idle');
      return;
    }

    const checkSlug = async () => {
      setSlugStatus('checking');
      try {
        const url = profileId
          ? `/api/seera-link/check-slug?slug=${debouncedSlug}&profileId=${profileId}`
          : `/api/seera-link/check-slug?slug=${debouncedSlug}`;
        const response = await fetch(url);
        const data = await response.json();
        setSlugStatus(data.data?.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    };

    checkSlug();
  }, [debouncedSlug, profileId]);

  // Update form field
  const updateField = useCallback(<K extends keyof CreateProfileInput>(
    field: K,
    value: CreateProfileInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Add highlight
  const addHighlight = () => {
    updateField('highlights', [
      ...formData.highlights,
      { content: '', sortOrder: formData.highlights.length },
    ]);
  };

  // Remove highlight
  const removeHighlight = (index: number) => {
    updateField('highlights', formData.highlights.filter((_, i) => i !== index));
  };

  // Update highlight
  const updateHighlight = (index: number, content: string) => {
    const updated = [...formData.highlights];
    updated[index] = { ...updated[index], content };
    updateField('highlights', updated);
  };

  // Add experience
  const addExperience = () => {
    updateField('experiences', [
      ...formData.experiences,
      { company: '', role: '', sortOrder: formData.experiences.length },
    ]);
  };

  // Remove experience
  const removeExperience = (index: number) => {
    updateField('experiences', formData.experiences.filter((_, i) => i !== index));
  };

  // Update experience
  const updateExperience = (index: number, updates: Partial<ExperienceInput>) => {
    const updated = [...formData.experiences];
    updated[index] = { ...updated[index], ...updates };
    updateField('experiences', updated);
  };

  // Handle save
  const handleSave = async (publish = false) => {
    if (!formData.displayName || !formData.title || !formData.slug) {
      toast.error('Please fill in required fields (Name, Title, URL)');
      return;
    }

    if (slugStatus === 'taken') {
      toast.error('Please choose a different URL slug');
      return;
    }

    publish ? setIsPublishing(true) : setIsSaving(true);

    try {
      const url = mode === 'edit' ? `/api/seera-link/${profileId}` : '/api/seera-link';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to save profile');
      }

      const savedId = data.data?.id || profileId;

      // Publish if requested
      if (publish && savedId) {
        const publishResponse = await fetch(`/api/seera-link/${savedId}/publish`, {
          method: 'POST',
        });

        if (!publishResponse.ok) {
          const publishData = await publishResponse.json();
          throw new Error(publishData.error?.message || 'Failed to publish profile');
        }

        toast.success('Profile published successfully!');
      } else {
        toast.success(mode === 'create' ? 'Profile created!' : 'Profile saved!');
      }

      router.push('/dashboard/seera-link');
      router.refresh();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  // Generate preview data
  const previewData: ProfileData = {
    id: profileId || 'preview',
    displayName: formData.displayName || 'Your Name',
    title: formData.title || 'Your Title',
    location: formData.location || null,
    bio: formData.bio || null,
    avatarUrl: formData.avatarUrl || null,
    statusBadges: formData.statusBadges,
    language: formData.language as 'en' | 'ar',
    themeColor: formData.themeColor,
    template: formData.template,
    hidePhoneNumber: formData.hidePhoneNumber,
    enableDownloadCv: formData.enableDownloadCv,
    cvFileUrl: formData.cvFileUrl || null,
    ctaWhatsappNumber: formData.ctaWhatsappNumber || null,
    ctaWhatsappMessage: formData.ctaWhatsappMessage || null,
    ctaPhoneNumber: formData.ctaPhoneNumber || null,
    ctaEmail: formData.ctaEmail || null,
    ctaEmailSubject: formData.ctaEmailSubject || null,
    ctaEmailBody: formData.ctaEmailBody || null,
    ctaLinkedinUrl: formData.ctaLinkedinUrl || null,
    enabledCtas: formData.enabledCtas,
    highlights: formData.highlights.map((h, i) => ({
      id: `h-${i}`,
      content: h.content,
      icon: h.icon || null,
      sortOrder: i,
    })),
    experiences: formData.experiences.map((e, i) => ({
      id: `e-${i}`,
      company: e.company,
      role: e.role,
      location: e.location || null,
      startDate: e.startDate || null,
      endDate: e.endDate || null,
      description: e.description || null,
      isFeatured: e.isFeatured || false,
      sortOrder: i,
    })),
    projects: formData.projects.map((p, i) => ({
      id: `p-${i}`,
      title: p.title,
      description: p.description || null,
      url: p.url || null,
      imageUrl: p.imageUrl || null,
      tags: p.tags || [],
      sortOrder: i,
    })),
    certificates: formData.certificates.map((c, i) => ({
      id: `c-${i}`,
      name: c.name,
      issuer: c.issuer,
      date: c.date || null,
      url: c.url || null,
      sortOrder: i,
    })),
  };

  const PreviewComponent = formData.template === 'BOLD' ? ProfileBoldTemplate : ProfileMinimalTemplate;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] -mt-6 -mx-6">
      {/* Editor Panel */}
      <div className="w-full lg:w-1/2 xl:w-2/5 border-r overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onCancel || (() => router.back())}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="font-semibold">
              {mode === 'create' ? 'Create Profile' : 'Edit Profile'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={isSaving || isPublishing}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isSaving || isPublishing}
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Globe className="w-4 h-4 mr-1" />
              )}
              Publish
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="ctas">CTAs</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Hero Tab */}
            <TabsContent value="hero" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Senior Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Profile URL *</Label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground">
                    /p/
                  </span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="rounded-l-none"
                    placeholder="john-doe"
                  />
                </div>
                {slugStatus === 'checking' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                  </p>
                )}
                {slugStatus === 'available' && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> URL is available
                  </p>
                )}
                {slugStatus === 'taken' && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <X className="w-3 h-3" /> URL is already taken
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => updateField('location', e.target.value || null)}
                  placeholder="San Francisco, CA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ''}
                  onChange={(e) => updateField('bio', e.target.value || null)}
                  placeholder="A brief description about yourself..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {(formData.bio?.length || 0)}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  value={formData.avatarUrl || ''}
                  onChange={(e) => updateField('avatarUrl', e.target.value || null)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label>Status Badges</Label>
                <div className="flex flex-wrap gap-2">
                  {statusBadgeOptions.map((badge) => (
                    <Badge
                      key={badge.id}
                      variant={formData.statusBadges.includes(badge.label) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        if (formData.statusBadges.includes(badge.label)) {
                          updateField('statusBadges', formData.statusBadges.filter(b => b !== badge.label));
                        } else if (formData.statusBadges.length < 3) {
                          updateField('statusBadges', [...formData.statusBadges, badge.label]);
                        }
                      }}
                    >
                      {formData.language === 'ar' ? badge.labelAr : badge.label}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Select up to 3 badges</p>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-4">
              {/* Highlights */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-secondary rounded-lg">
                  <span className="font-medium">Highlights ({formData.highlights.length}/8)</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-2">
                  {formData.highlights.map((highlight, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={highlight.content}
                        onChange={(e) => updateHighlight(index, e.target.value)}
                        placeholder="Increased sales by 50% in Q3..."
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHighlight(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {formData.highlights.length < 8 && (
                    <Button variant="outline" size="sm" onClick={addHighlight}>
                      <Plus className="w-4 h-4 mr-1" /> Add Highlight
                    </Button>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Experiences */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-secondary rounded-lg">
                  <span className="font-medium">Experience ({formData.experiences.length}/10)</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-4">
                  {formData.experiences.map((exp, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input
                              value={exp.role}
                              onChange={(e) => updateExperience(index, { role: e.target.value })}
                              placeholder="Role"
                            />
                            <Input
                              value={exp.company}
                              onChange={(e) => updateExperience(index, { company: e.target.value })}
                              placeholder="Company"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExperience(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={exp.startDate || ''}
                            onChange={(e) => updateExperience(index, { startDate: e.target.value || null })}
                            placeholder="Start Date (e.g., Jan 2020)"
                          />
                          <Input
                            value={exp.endDate || ''}
                            onChange={(e) => updateExperience(index, { endDate: e.target.value || null })}
                            placeholder="End Date (or Present)"
                          />
                        </div>
                        <Textarea
                          value={exp.description || ''}
                          onChange={(e) => updateExperience(index, { description: e.target.value || null })}
                          placeholder="Brief description..."
                          rows={2}
                        />
                      </CardContent>
                    </Card>
                  ))}
                  {formData.experiences.length < 10 && (
                    <Button variant="outline" size="sm" onClick={addExperience}>
                      <Plus className="w-4 h-4 mr-1" /> Add Experience
                    </Button>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            {/* CTAs Tab */}
            <TabsContent value="ctas" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>WhatsApp</Label>
                    <Switch
                      checked={formData.enabledCtas.includes('WHATSAPP')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateField('enabledCtas', [...formData.enabledCtas, 'WHATSAPP']);
                        } else {
                          updateField('enabledCtas', formData.enabledCtas.filter(c => c !== 'WHATSAPP'));
                        }
                      }}
                    />
                  </div>
                  {formData.enabledCtas.includes('WHATSAPP') && (
                    <div className="space-y-2 pl-4 border-l-2">
                      <Input
                        value={formData.ctaWhatsappNumber || ''}
                        onChange={(e) => updateField('ctaWhatsappNumber', e.target.value || null)}
                        placeholder="Phone number (with country code)"
                      />
                      <Textarea
                        value={formData.ctaWhatsappMessage || ''}
                        onChange={(e) => updateField('ctaWhatsappMessage', e.target.value || null)}
                        placeholder="Pre-filled message..."
                        rows={2}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Email</Label>
                    <Switch
                      checked={formData.enabledCtas.includes('EMAIL')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateField('enabledCtas', [...formData.enabledCtas, 'EMAIL']);
                        } else {
                          updateField('enabledCtas', formData.enabledCtas.filter(c => c !== 'EMAIL'));
                        }
                      }}
                    />
                  </div>
                  {formData.enabledCtas.includes('EMAIL') && (
                    <div className="space-y-2 pl-4 border-l-2">
                      <Input
                        type="email"
                        value={formData.ctaEmail || ''}
                        onChange={(e) => updateField('ctaEmail', e.target.value || null)}
                        placeholder="your@email.com"
                      />
                      <Input
                        value={formData.ctaEmailSubject || ''}
                        onChange={(e) => updateField('ctaEmailSubject', e.target.value || null)}
                        placeholder="Email subject"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>LinkedIn</Label>
                    <Switch
                      checked={formData.enabledCtas.includes('LINKEDIN')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateField('enabledCtas', [...formData.enabledCtas, 'LINKEDIN']);
                        } else {
                          updateField('enabledCtas', formData.enabledCtas.filter(c => c !== 'LINKEDIN'));
                        }
                      }}
                    />
                  </div>
                  {formData.enabledCtas.includes('LINKEDIN') && (
                    <div className="pl-4 border-l-2">
                      <Input
                        value={formData.ctaLinkedinUrl || ''}
                        onChange={(e) => updateField('ctaLinkedinUrl', e.target.value || null)}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Phone Call</Label>
                    <Switch
                      checked={formData.enabledCtas.includes('PHONE')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateField('enabledCtas', [...formData.enabledCtas, 'PHONE']);
                        } else {
                          updateField('enabledCtas', formData.enabledCtas.filter(c => c !== 'PHONE'));
                        }
                      }}
                    />
                  </div>
                  {formData.enabledCtas.includes('PHONE') && (
                    <div className="pl-4 border-l-2">
                      <Input
                        value={formData.ctaPhoneNumber || ''}
                        onChange={(e) => updateField('ctaPhoneNumber', e.target.value || null)}
                        placeholder="Phone number"
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select
                  value={formData.template}
                  onValueChange={(v) => updateField('template', v as 'MINIMAL' | 'BOLD')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(templateConfigs).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.name} - {config.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Theme Color</Label>
                <Select
                  value={formData.themeColor}
                  onValueChange={(v) => updateField('themeColor', v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(themeDisplayNames).map(([key, name]) => (
                      <SelectItem key={key} value={key}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(v) => updateField('language', v as 'en' | 'ar')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(v) => updateField('visibility', v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Public
                      </div>
                    </SelectItem>
                    <SelectItem value="UNLISTED">
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4" /> Unlisted
                      </div>
                    </SelectItem>
                    <SelectItem value="PASSWORD_PROTECTED">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Password Protected
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.visibility === 'PASSWORD_PROTECTED' && (
                <div className="space-y-2">
                  <Label htmlFor="accessCode">Access Code</Label>
                  <Input
                    id="accessCode"
                    value={formData.accessCode || ''}
                    onChange={(e) => updateField('accessCode', e.target.value || null)}
                    placeholder="4-8 characters"
                    maxLength={8}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Hide from Search Engines</Label>
                  <p className="text-xs text-muted-foreground">Add noindex meta tag</p>
                </div>
                <Switch
                  checked={formData.noIndex}
                  onCheckedChange={(v) => updateField('noIndex', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Hide Phone Number</Label>
                  <p className="text-xs text-muted-foreground">Only show WhatsApp button</p>
                </div>
                <Switch
                  checked={formData.hidePhoneNumber}
                  onCheckedChange={(v) => updateField('hidePhoneNumber', v)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="hidden lg:flex flex-col flex-1 bg-secondary/30">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium">Preview</span>
          <div className="flex items-center gap-1">
            <Button
              variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 flex justify-center">
          <div
            className={`bg-background rounded-lg shadow-lg overflow-hidden transition-all ${
              previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-4xl'
            }`}
          >
            <PreviewComponent profile={previewData} />
          </div>
        </div>
      </div>
    </div>
  );
}
