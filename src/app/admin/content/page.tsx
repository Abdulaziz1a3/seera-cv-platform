'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    FileText,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    BookOpen,
    HelpCircle,
    Newspaper,
    RefreshCw,
    CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminServerGuard } from '../_components/admin-server-guard';

type ContentTab = 'blog' | 'faq' | 'help';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    category: string | null;
    tags: string[];
    coverImage: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

interface KnowledgeBaseArticle {
    id: string;
    title: string;
    slug: string;
    content: string;
    category: string;
    order: number;
    isPublished: boolean;
    helpfulCount: number;
    notHelpfulCount: number;
    createdAt: string;
    updatedAt: string;
}

interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const defaultBlogForm = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    coverImage: '',
    metaTitle: '',
    metaDescription: '',
    status: 'DRAFT' as BlogPost['status'],
};

const defaultKbForm = {
    title: '',
    slug: '',
    content: '',
    category: '',
    order: 0,
    isPublished: true,
};

function AdminContentPageInner() {
    const { locale } = useLocale();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<ContentTab>('blog');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [blogData, setBlogData] = useState<PaginatedResponse<BlogPost> | null>(null);
    const [kbData, setKbData] = useState<PaginatedResponse<KnowledgeBaseArticle> | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [blogForm, setBlogForm] = useState(defaultBlogForm);
    const [kbForm, setKbForm] = useState(defaultKbForm);

    const formType = activeTab;

    const formattedDate = (date: string) =>
        new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

    const fetchContent = async (tab: ContentTab) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                type: tab,
                search: searchQuery,
                page: '1',
                limit: '50',
            });
            const res = await fetch(`/api/admin/content?${params}`);
            if (!res.ok) throw new Error('Failed to fetch content');
            const json = await res.json();
            if (tab === 'blog') {
                setBlogData(json);
            } else {
                setKbData(json);
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load content');
            toast.error(locale === 'ar' ? 'فشل تحميل المحتوى' : 'Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchContent(activeTab);
        }, 250);
        return () => clearTimeout(debounce);
    }, [activeTab, searchQuery]);

    const resetForm = () => {
        setEditingId(null);
        setBlogForm(defaultBlogForm);
        setKbForm(defaultKbForm);
    };

    const openCreate = () => {
        resetForm();
        setDialogOpen(true);
    };

    const openEditBlog = (post: BlogPost) => {
        setEditingId(post.id);
        setBlogForm({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || '',
            content: post.content,
            category: post.category || '',
            tags: post.tags.join(', '),
            coverImage: post.coverImage || '',
            metaTitle: post.metaTitle || '',
            metaDescription: post.metaDescription || '',
            status: post.status,
        });
        setDialogOpen(true);
    };

    const openEditKb = (article: KnowledgeBaseArticle) => {
        setEditingId(article.id);
        setKbForm({
            title: article.title,
            slug: article.slug,
            content: article.content,
            category: article.category,
            order: article.order,
            isPublished: article.isPublished,
        });
        setDialogOpen(true);
    };

    const saveContent = async () => {
        try {
            const isEditing = Boolean(editingId);
            const payload = formType === 'blog'
                ? {
                    type: 'blog',
                    id: editingId,
                    data: {
                        title: blogForm.title,
                        slug: blogForm.slug,
                        excerpt: blogForm.excerpt,
                        content: blogForm.content,
                        category: blogForm.category || null,
                        tags: blogForm.tags
                            .split(',')
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        coverImage: blogForm.coverImage || null,
                        metaTitle: blogForm.metaTitle || null,
                        metaDescription: blogForm.metaDescription || null,
                        status: blogForm.status,
                    },
                }
                : {
                    type: formType,
                    id: editingId,
                    data: {
                        title: kbForm.title,
                        slug: kbForm.slug,
                        content: kbForm.content,
                        category: formType === 'faq' ? 'FAQ' : kbForm.category || 'General',
                        order: kbForm.order,
                        isPublished: kbForm.isPublished,
                    },
                };

            const res = await fetch('/api/admin/content', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save content');
            }

            toast.success(locale === 'ar' ? 'تم حفظ المحتوى' : 'Content saved');
            setDialogOpen(false);
            resetForm();
            fetchContent(activeTab);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save content');
        }
    };

    const deleteContent = async (type: ContentTab, id: string) => {
        if (!confirm(locale === 'ar' ? 'هل تريد حذف هذا المحتوى؟' : 'Delete this content?')) {
            return;
        }
        try {
            const res = await fetch('/api/admin/content', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id }),
            });
            if (!res.ok) throw new Error('Failed to delete content');
            toast.success(locale === 'ar' ? 'تم الحذف' : 'Deleted');
            fetchContent(activeTab);
        } catch {
            toast.error(locale === 'ar' ? 'فشل الحذف' : 'Delete failed');
        }
    };

    const togglePublish = async (type: ContentTab, item: BlogPost | KnowledgeBaseArticle) => {
        try {
            const isBlog = type === 'blog';
            const res = await fetch('/api/admin/content', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    id: item.id,
                    data: isBlog
                        ? { status: (item as BlogPost).status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }
                        : { isPublished: !(item as KnowledgeBaseArticle).isPublished },
                }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            fetchContent(activeTab);
        } catch {
            toast.error(locale === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status');
        }
    };

    const activeBlogItems = blogData?.items || [];
    const activeKbItems = kbData?.items || [];

    const currentListCount = useMemo(() => {
        return activeTab === 'blog'
            ? blogData?.pagination.total || 0
            : kbData?.pagination.total || 0;
    }, [activeTab, blogData, kbData]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {locale === 'ar' ? 'إدارة المحتوى' : 'Content Management'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === 'ar'
                            ? `${currentListCount} عنصر في هذا القسم`
                            : `${currentListCount} items in this section`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchContent(activeTab)} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
                        {locale === 'ar' ? 'تحديث' : 'Refresh'}
                    </Button>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4 me-2" />
                        {locale === 'ar' ? 'إضافة محتوى' : 'Create Content'}
                    </Button>
                </div>
            </div>

            {error && (
                <Card>
                    <CardContent className="py-6 text-center text-muted-foreground">
                        {error}
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentTab)}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="blog" className="gap-2">
                            <Newspaper className="h-4 w-4" />
                            {locale === 'ar' ? 'المدونة' : 'Blog'}
                        </TabsTrigger>
                        <TabsTrigger value="faq" className="gap-2">
                            <HelpCircle className="h-4 w-4" />
                            {locale === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}
                        </TabsTrigger>
                        <TabsTrigger value="help" className="gap-2">
                            <BookOpen className="h-4 w-4" />
                            {locale === 'ar' ? 'مركز المساعدة' : 'Help'}
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                            className="ps-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Blog Posts */}
                <TabsContent value="blog">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{locale === 'ar' ? 'العنوان' : 'Title'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'الفئة' : 'Category'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'آخر تحديث' : 'Updated'}</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeBlogItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                {locale === 'ar' ? 'لا توجد مقالات' : 'No blog posts found'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activeBlogItems.map((post) => (
                                            <TableRow key={post.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                                        <div>
                                                            <span className="font-medium">{post.title}</span>
                                                            <p className="text-xs text-muted-foreground">/{post.slug}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                                                        {post.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{post.category || '-'}</TableCell>
                                                <TableCell>{formattedDate(post.updatedAt)}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openEditBlog(post)}>
                                                                <Edit className="h-4 w-4 me-2" />
                                                                {locale === 'ar' ? 'تعديل' : 'Edit'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => togglePublish('blog', post)}>
                                                                <CheckCircle2 className="h-4 w-4 me-2" />
                                                                {post.status === 'PUBLISHED'
                                                                    ? locale === 'ar' ? 'إلغاء النشر' : 'Unpublish'
                                                                    : locale === 'ar' ? 'نشر' : 'Publish'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => deleteContent('blog', post.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 me-2" />
                                                                {locale === 'ar' ? 'حذف' : 'Delete'}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FAQ */}
                <TabsContent value="faq">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{locale === 'ar' ? 'السؤال' : 'Question'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'الفئة' : 'Category'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'آخر تحديث' : 'Updated'}</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeKbItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                {locale === 'ar' ? 'لا توجد أسئلة' : 'No FAQ entries found'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activeKbItems.map((faq) => (
                                            <TableRow key={faq.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <HelpCircle className="h-5 w-5 text-muted-foreground" />
                                                        <div>
                                                            <span className="font-medium">{faq.title}</span>
                                                            <p className="text-xs text-muted-foreground">/{faq.slug}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{faq.category}</TableCell>
                                                <TableCell>
                                                    <Badge variant={faq.isPublished ? 'default' : 'secondary'}>
                                                        {faq.isPublished ? (locale === 'ar' ? 'منشور' : 'Published') : (locale === 'ar' ? 'مسودة' : 'Draft')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formattedDate(faq.updatedAt)}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openEditKb(faq)}>
                                                                <Edit className="h-4 w-4 me-2" />
                                                                {locale === 'ar' ? 'تعديل' : 'Edit'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => togglePublish('faq', faq)}>
                                                                <CheckCircle2 className="h-4 w-4 me-2" />
                                                                {faq.isPublished
                                                                    ? locale === 'ar' ? 'إلغاء النشر' : 'Unpublish'
                                                                    : locale === 'ar' ? 'نشر' : 'Publish'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => deleteContent('faq', faq.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 me-2" />
                                                                {locale === 'ar' ? 'حذف' : 'Delete'}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Help Articles */}
                <TabsContent value="help">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{locale === 'ar' ? 'المقال' : 'Article'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'الفئة' : 'Category'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                                        <TableHead>{locale === 'ar' ? 'آخر تحديث' : 'Updated'}</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeKbItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                {locale === 'ar' ? 'لا توجد مقالات' : 'No help articles found'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activeKbItems.map((article) => (
                                            <TableRow key={article.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                                                        <div>
                                                            <span className="font-medium">{article.title}</span>
                                                            <p className="text-xs text-muted-foreground">/{article.slug}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{article.category}</TableCell>
                                                <TableCell>
                                                    <Badge variant={article.isPublished ? 'default' : 'secondary'}>
                                                        {article.isPublished ? (locale === 'ar' ? 'منشور' : 'Published') : (locale === 'ar' ? 'مسودة' : 'Draft')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formattedDate(article.updatedAt)}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openEditKb(article)}>
                                                                <Edit className="h-4 w-4 me-2" />
                                                                {locale === 'ar' ? 'تعديل' : 'Edit'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => togglePublish('help', article)}>
                                                                <CheckCircle2 className="h-4 w-4 me-2" />
                                                                {article.isPublished
                                                                    ? locale === 'ar' ? 'إلغاء النشر' : 'Unpublish'
                                                                    : locale === 'ar' ? 'نشر' : 'Publish'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => deleteContent('help', article.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 me-2" />
                                                                {locale === 'ar' ? 'حذف' : 'Delete'}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId
                                ? (locale === 'ar' ? 'تعديل المحتوى' : 'Edit Content')
                                : (locale === 'ar' ? 'إضافة محتوى' : 'Create Content')}
                        </DialogTitle>
                        <DialogDescription>
                            {formType === 'blog'
                                ? (locale === 'ar' ? 'تحكم في مقالات المدونة والمحتوى التسويقي.' : 'Manage blog posts and marketing content.')
                                : (locale === 'ar' ? 'تحكم في قاعدة المعرفة والأسئلة الشائعة.' : 'Manage knowledge base and FAQ content.')}
                        </DialogDescription>
                    </DialogHeader>

                    {formType === 'blog' ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <Label>{locale === 'ar' ? 'العنوان' : 'Title'}</Label>
                                <Input value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} />
                            </div>
                            <div>
                                <Label>{locale === 'ar' ? 'المسار' : 'Slug'}</Label>
                                <Input value={blogForm.slug} onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })} />
                            </div>
                            <div>
                                <Label>{locale === 'ar' ? 'الفئة' : 'Category'}</Label>
                                <Input value={blogForm.category} onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })} />
                            </div>
                            <div>
                                <Label>{locale === 'ar' ? 'الوسوم' : 'Tags (comma separated)'}</Label>
                                <Input value={blogForm.tags} onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })} />
                            </div>
                            <div>
                                <Label>{locale === 'ar' ? 'الحالة' : 'Status'}</Label>
                                <Input value={blogForm.status} onChange={(e) => setBlogForm({ ...blogForm, status: e.target.value as BlogPost['status'] })} />
                            </div>
                            <div className="md:col-span-2">
                                <Label>{locale === 'ar' ? 'الوصف المختصر' : 'Excerpt'}</Label>
                                <Textarea value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <Label>{locale === 'ar' ? 'المحتوى' : 'Content'}</Label>
                                <Textarea className="min-h-[200px]" value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} />
                            </div>
                            <div>
                                <Label>{locale === 'ar' ? 'رابط الغلاف' : 'Cover Image URL'}</Label>
                                <Input value={blogForm.coverImage} onChange={(e) => setBlogForm({ ...blogForm, coverImage: e.target.value })} />
                            </div>
                            <div>
                                <Label>{locale === 'ar' ? 'عنوان الميتا' : 'Meta Title'}</Label>
                                <Input value={blogForm.metaTitle} onChange={(e) => setBlogForm({ ...blogForm, metaTitle: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <Label>{locale === 'ar' ? 'وصف الميتا' : 'Meta Description'}</Label>
                                <Textarea value={blogForm.metaDescription} onChange={(e) => setBlogForm({ ...blogForm, metaDescription: e.target.value })} />
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <Label>{formType === 'faq' ? (locale === 'ar' ? 'السؤال' : 'Question') : (locale === 'ar' ? 'العنوان' : 'Title')}</Label>
                                <Input value={kbForm.title} onChange={(e) => setKbForm({ ...kbForm, title: e.target.value })} />
                            </div>
                            <div>
                                <Label>{locale === 'ar' ? 'المسار' : 'Slug'}</Label>
                                <Input value={kbForm.slug} onChange={(e) => setKbForm({ ...kbForm, slug: e.target.value })} />
                            </div>
                            <div>
                                <Label>{locale === 'ar' ? 'الفئة' : 'Category'}</Label>
                                <Input
                                    value={formType === 'faq' ? 'FAQ' : kbForm.category}
                                    disabled={formType === 'faq'}
                                    onChange={(e) => setKbForm({ ...kbForm, category: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>{locale === 'ar' ? 'الترتيب' : 'Order'}</Label>
                                <Input
                                    type="number"
                                    value={kbForm.order}
                                    onChange={(e) => setKbForm({ ...kbForm, order: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={kbForm.isPublished}
                                    onCheckedChange={(value) => setKbForm({ ...kbForm, isPublished: value })}
                                />
                                <span className="text-sm">
                                    {kbForm.isPublished ? (locale === 'ar' ? 'منشور' : 'Published') : (locale === 'ar' ? 'مسودة' : 'Draft')}
                                </span>
                            </div>
                            <div className="md:col-span-2">
                                <Label>{locale === 'ar' ? 'المحتوى' : 'Content'}</Label>
                                <Textarea className="min-h-[200px]" value={kbForm.content} onChange={(e) => setKbForm({ ...kbForm, content: e.target.value })} />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button onClick={saveContent}>
                            {locale === 'ar' ? 'حفظ' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function AdminContentPage() {
    return (
        <AdminServerGuard>
            <AdminContentPageInner />
        </AdminServerGuard>
    );
}
