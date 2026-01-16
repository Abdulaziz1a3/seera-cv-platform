'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Link2,
  Eye,
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  QrCode,
  BarChart3,
  Globe,
  Lock,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';
import { getProfileUrl } from '@/lib/seera-link/utils';
import { QrCodeDialog } from '@/components/seera-link/qr-code-dialog';

interface Profile {
  id: string;
  slug: string;
  displayName: string;
  title: string;
  avatarUrl: string | null;
  persona: string;
  template: string;
  status: string;
  visibility: string;
  language: string;
  themeColor: string;
  viewsLast7Days: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

const translations = {
  en: {
    title: 'Seera Link',
    description: 'Create shareable profile pages to showcase your career',
    createProfile: 'Create Profile',
    noProfiles: 'No profiles yet',
    noProfilesDescription: 'Create your first Seera Link profile to get a shareable career page.',
    draft: 'Draft',
    published: 'Published',
    public: 'Public',
    unlisted: 'Unlisted',
    protected: 'Protected',
    views: 'views (7d)',
    edit: 'Edit',
    viewProfile: 'View Profile',
    copyLink: 'Copy Link',
    qrCode: 'QR Code',
    analytics: 'Analytics',
    delete: 'Delete',
    deleteTitle: 'Delete Profile?',
    deleteDescription: 'This will permanently delete this profile. This action cannot be undone.',
    cancel: 'Cancel',
    confirm: 'Delete',
    linkCopied: 'Link copied to clipboard',
    profileDeleted: 'Profile deleted',
    loading: 'Loading profiles...',
  },
  ar: {
    title: 'رابط سيرا',
    description: 'أنشئ صفحات ملفات قابلة للمشاركة لعرض مسيرتك المهنية',
    createProfile: 'إنشاء ملف',
    noProfiles: 'لا توجد ملفات حتى الآن',
    noProfilesDescription: 'أنشئ أول ملف سيرا لينك للحصول على صفحة مهنية قابلة للمشاركة.',
    draft: 'مسودة',
    published: 'منشور',
    public: 'عام',
    unlisted: 'غير مدرج',
    protected: 'محمي',
    views: 'مشاهدة (٧ أيام)',
    edit: 'تعديل',
    viewProfile: 'عرض الملف',
    copyLink: 'نسخ الرابط',
    qrCode: 'رمز QR',
    analytics: 'التحليلات',
    delete: 'حذف',
    deleteTitle: 'حذف الملف؟',
    deleteDescription: 'سيتم حذف هذا الملف نهائياً. لا يمكن التراجع عن هذا الإجراء.',
    cancel: 'إلغاء',
    confirm: 'حذف',
    linkCopied: 'تم نسخ الرابط',
    profileDeleted: 'تم حذف الملف',
    loading: 'جاري تحميل الملفات...',
  },
};

export default function SeeraLinkPage() {
  const { locale } = useLocale();
  const t = translations[locale as keyof typeof translations] || translations.en;

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrProfile, setQrProfile] = useState<Profile | null>(null);

  // Fetch profiles
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/seera-link');
      const data = await response.json();
      if (data.success) {
        setProfiles(data.data);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (slug: string) => {
    const url = getProfileUrl(slug);
    await navigator.clipboard.writeText(url);
    toast.success(t.linkCopied);
  };

  const handleDelete = async () => {
    if (!profileToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/seera-link/${profileToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProfiles(profiles.filter((p) => p.id !== profileToDelete.id));
        toast.success(t.profileDeleted);
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return <Globe className="w-3 h-3" />;
      case 'UNLISTED':
        return <EyeOff className="w-3 h-3" />;
      case 'PASSWORD_PROTECTED':
        return <Lock className="w-3 h-3" />;
      default:
        return <Globe className="w-3 h-3" />;
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return t.public;
      case 'UNLISTED':
        return t.unlisted;
      case 'PASSWORD_PROTECTED':
        return t.protected;
      default:
        return visibility;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Link2 className="w-6 h-6 text-primary" />
            {t.title}
          </h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/seera-link/new">
            <Plus className="w-4 h-4 mr-2" />
            {t.createProfile}
          </Link>
        </Button>
      </div>

      {/* Profiles Grid */}
      {profiles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Link2 className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">{t.noProfiles}</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t.noProfilesDescription}
            </p>
            <Button asChild>
              <Link href="/dashboard/seera-link/new">
                <Plus className="w-4 h-4 mr-2" />
                {t.createProfile}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Card key={profile.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {profile.displayName}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {profile.title}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/seera-link/${profile.id}`}>
                          <Pencil className="w-4 h-4 mr-2" />
                          {t.edit}
                        </Link>
                      </DropdownMenuItem>
                      {profile.status === 'PUBLISHED' && (
                        <DropdownMenuItem asChild>
                          <a
                            href={getProfileUrl(profile.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {t.viewProfile}
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleCopyLink(profile.slug)}>
                        <Copy className="w-4 h-4 mr-2" />
                        {t.copyLink}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setQrProfile(profile);
                          setQrDialogOpen(true);
                        }}
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        {t.qrCode}
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/seera-link/${profile.id}/analytics`}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          {t.analytics}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setProfileToDelete(profile);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Status & Visibility */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant={profile.status === 'PUBLISHED' ? 'default' : 'secondary'}
                  >
                    {profile.status === 'PUBLISHED' ? t.published : t.draft}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getVisibilityIcon(profile.visibility)}
                    {getVisibilityLabel(profile.visibility)}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{profile.viewsLast7Days} {t.views}</span>
                  </div>
                </div>

                {/* URL Preview */}
                <div className="mt-3 p-2 bg-secondary/50 rounded text-xs font-mono text-muted-foreground truncate">
                  /p/{profile.slug}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      {qrProfile && (
        <QrCodeDialog
          open={qrDialogOpen}
          onOpenChange={setQrDialogOpen}
          url={getProfileUrl(qrProfile.slug)}
          title={qrProfile.displayName}
        />
      )}
    </div>
  );
}
