'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Plus,
    Settings,
    Search,
    HelpCircle,
    Home,
    Target,
    Brain,
    Compass,
    X,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
    id: string;
    title: string;
    titleAr?: string;
    icon: React.ElementType;
    action: () => void;
    keywords?: string[];
    shortcut?: string;
    group: 'navigation' | 'actions' | 'settings';
}

interface CommandPaletteProps {
    locale?: 'en' | 'ar';
}

export function CommandPalette({ locale = 'en' }: CommandPaletteProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const router = useRouter();

    const commands: CommandItem[] = React.useMemo(() => [
        // Navigation
        {
            id: 'dashboard',
            title: 'Go to Dashboard',
            titleAr: 'الذهاب للوحة التحكم',
            icon: Home,
            action: () => router.push('/dashboard'),
            keywords: ['home', 'main', 'لوحة'],
            group: 'navigation',
        },
        {
            id: 'resumes',
            title: 'Go to Resumes',
            titleAr: 'الذهاب للسير الذاتية',
            icon: FileText,
            action: () => router.push('/dashboard/resumes'),
            keywords: ['cv', 'resume', 'سيرة'],
            group: 'navigation',
        },
        {
            id: 'career-gps',
            title: 'Go to Career GPS',
            titleAr: 'الذهاب لـ GPS المهني',
            icon: Compass,
            action: () => router.push('/dashboard/career'),
            keywords: ['career', 'path', 'مهني'],
            group: 'navigation',
        },
        {
            id: 'interview',
            title: 'Go to Interview Prep',
            titleAr: 'الذهاب لتحضير المقابلة',
            icon: Brain,
            action: () => router.push('/dashboard/interview'),
            keywords: ['practice', 'ai', 'مقابلة'],
            group: 'navigation',
        },
        // Actions
        {
            id: 'new-resume',
            title: 'Create New Resume',
            titleAr: 'إنشاء سيرة ذاتية جديدة',
            icon: Plus,
            action: () => router.push('/dashboard/resumes/new'),
            keywords: ['create', 'new', 'جديد'],
            shortcut: 'N',
            group: 'actions',
        },
        {
            id: 'new-job-target',
            title: 'Add Job Target',
            titleAr: 'إضافة هدف وظيفي',
            icon: Target,
            action: () => router.push('/dashboard/job-targets/new'),
            keywords: ['target', 'goal', 'هدف'],
            group: 'actions',
        },
        // Settings
        {
            id: 'settings',
            title: 'Open Settings',
            titleAr: 'فتح الإعدادات',
            icon: Settings,
            action: () => router.push('/dashboard/settings'),
            keywords: ['preferences', 'account', 'إعدادات'],
            shortcut: ',',
            group: 'settings',
        },
        {
            id: 'help',
            title: 'Get Help',
            titleAr: 'الحصول على المساعدة',
            icon: HelpCircle,
            action: () => router.push('/dashboard/help'),
            keywords: ['support', 'faq', 'مساعدة'],
            shortcut: '?',
            group: 'settings',
        },
    ], [router]);

    const filteredCommands = React.useMemo(() => {
        if (!search) return commands;
        const query = search.toLowerCase();
        return commands.filter((cmd) => {
            const title = locale === 'ar' && cmd.titleAr ? cmd.titleAr : cmd.title;
            return (
                title.toLowerCase().includes(query) ||
                cmd.keywords?.some((k) => k.toLowerCase().includes(query))
            );
        });
    }, [commands, search, locale]);

    const groupedCommands = React.useMemo(() => {
        const groups: Record<string, CommandItem[]> = {
            navigation: [],
            actions: [],
            settings: [],
        };
        filteredCommands.forEach((cmd) => {
            groups[cmd.group].push(cmd);
        });
        return groups;
    }, [filteredCommands]);

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Open with Ctrl+K or Cmd+K
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            // Close with Escape
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    React.useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setSearch('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                filteredCommands[selectedIndex].action();
                setIsOpen(false);
            }
        }
    };

    const groupLabels = {
        navigation: locale === 'ar' ? 'التنقل' : 'Navigation',
        actions: locale === 'ar' ? 'إجراءات' : 'Actions',
        settings: locale === 'ar' ? 'الإعدادات' : 'Settings',
    };

    let flatIndex = 0;

    return (
        <>
            {/* Trigger hint - shown in header */}
            <button
                onClick={() => setIsOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg border bg-muted/50 hover:bg-muted"
            >
                <Search className="h-4 w-4" />
                <span>{locale === 'ar' ? 'بحث سريع...' : 'Quick search...'}</span>
                <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Command Palette */}
                        <motion.div
                            className="fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2"
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.15 }}
                        >
                            <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
                                {/* Search Input */}
                                <div className="flex items-center border-b px-4">
                                    <Search className="h-5 w-5 text-muted-foreground" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setSelectedIndex(0);
                                        }}
                                        onKeyDown={handleKeyDown}
                                        placeholder={locale === 'ar' ? 'اكتب أمراً أو ابحث...' : 'Type a command or search...'}
                                        className="flex-1 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-muted-foreground"
                                    />
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 rounded hover:bg-muted transition-colors"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                </div>

                                {/* Commands List */}
                                <div className="max-h-[300px] overflow-y-auto py-2">
                                    {filteredCommands.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-muted-foreground">
                                            {locale === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                                        </div>
                                    ) : (
                                        Object.entries(groupedCommands).map(([group, items]) => {
                                            if (items.length === 0) return null;
                                            return (
                                                <div key={group}>
                                                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                                                        {groupLabels[group as keyof typeof groupLabels]}
                                                    </div>
                                                    {items.map((cmd) => {
                                                        const itemIndex = flatIndex++;
                                                        const title = locale === 'ar' && cmd.titleAr ? cmd.titleAr : cmd.title;
                                                        return (
                                                            <button
                                                                key={cmd.id}
                                                                onClick={() => {
                                                                    cmd.action();
                                                                    setIsOpen(false);
                                                                }}
                                                                className={cn(
                                                                    'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                                                                    itemIndex === selectedIndex
                                                                        ? 'bg-accent text-accent-foreground'
                                                                        : 'hover:bg-muted'
                                                                )}
                                                            >
                                                                <cmd.icon className="h-4 w-4 text-muted-foreground" />
                                                                <span className="flex-1 text-start">{title}</span>
                                                                {cmd.shortcut && (
                                                                    <kbd className="hidden md:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]">
                                                                        {cmd.shortcut}
                                                                    </kbd>
                                                                )}
                                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]">↑↓</kbd>
                                        <span>{locale === 'ar' ? 'للتنقل' : 'to navigate'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]">↵</kbd>
                                        <span>{locale === 'ar' ? 'للتحديد' : 'to select'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]">esc</kbd>
                                        <span>{locale === 'ar' ? 'للإغلاق' : 'to close'}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// Hook for programmatic opening
export function useCommandPalette() {
    const [isOpen, setIsOpen] = React.useState(false);

    const open = React.useCallback(() => setIsOpen(true), []);
    const close = React.useCallback(() => setIsOpen(false), []);
    const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

    return { isOpen, open, close, toggle };
}
