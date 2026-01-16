'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';
import { X, FileText, CheckCircle, Download } from 'lucide-react';

interface Notification {
    id: string;
    type: 'signup' | 'resume_created' | 'download';
    name: string;
    location: string;
    timeAgo: string;
}

// Sample notifications - in production, these could come from a real-time feed
const SAMPLE_NOTIFICATIONS: Notification[] = [
    { id: '1', type: 'signup', name: 'Ahmed', location: 'Riyadh', timeAgo: '2 min' },
    { id: '2', type: 'resume_created', name: 'Sara', location: 'Dubai', timeAgo: '5 min' },
    { id: '3', type: 'download', name: 'Mohammed', location: 'Jeddah', timeAgo: '8 min' },
    { id: '4', type: 'signup', name: 'Fatima', location: 'Cairo', timeAgo: '12 min' },
    { id: '5', type: 'resume_created', name: 'Omar', location: 'Abu Dhabi', timeAgo: '15 min' },
    { id: '6', type: 'download', name: 'Layla', location: 'Dammam', timeAgo: '18 min' },
    { id: '7', type: 'signup', name: 'Yusuf', location: 'Kuwait', timeAgo: '22 min' },
    { id: '8', type: 'resume_created', name: 'Noor', location: 'Doha', timeAgo: '25 min' },
];

const STORAGE_KEY = 'seera_social_proof_dismissed';

export function SocialProofNotification() {
    const { locale } = useLocale();
    const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissedSession, setIsDismissedSession] = useState(false);

    const showNotification = useCallback(() => {
        // Check if dismissed this session
        if (isDismissedSession) return;

        // Check if permanently dismissed
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (dismissed === 'permanent') return;

        // Pick a random notification
        const randomIndex = Math.floor(Math.random() * SAMPLE_NOTIFICATIONS.length);
        setCurrentNotification(SAMPLE_NOTIFICATIONS[randomIndex]);
        setIsVisible(true);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            setIsVisible(false);
        }, 5000);
    }, [isDismissedSession]);

    useEffect(() => {
        // Initial delay before first notification
        const initialDelay = setTimeout(() => {
            showNotification();
        }, 10000); // 10 seconds

        // Show notifications periodically
        const interval = setInterval(() => {
            showNotification();
        }, 30000); // Every 30 seconds

        return () => {
            clearTimeout(initialDelay);
            clearInterval(interval);
        };
    }, [showNotification]);

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissedSession(true);
    };

    const handlePermanentDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, 'permanent');
    };

    if (!currentNotification || !isVisible) return null;

    const getIcon = () => {
        switch (currentNotification.type) {
            case 'signup':
                return CheckCircle;
            case 'resume_created':
                return FileText;
            case 'download':
                return Download;
            default:
                return CheckCircle;
        }
    };

    const getMessage = () => {
        const { name, location, type } = currentNotification;
        if (locale === 'ar') {
            switch (type) {
                case 'signup':
                    return `${name} من ${location} انضم للتو`;
                case 'resume_created':
                    return `${name} من ${location} أنشأ سيرة ذاتية`;
                case 'download':
                    return `${name} من ${location} حمّل سيرته الذاتية`;
            }
        }
        switch (type) {
            case 'signup':
                return `${name} from ${location} just signed up`;
            case 'resume_created':
                return `${name} from ${location} created a resume`;
            case 'download':
                return `${name} from ${location} downloaded their resume`;
        }
    };

    const Icon = getIcon();

    return (
        <div
            className={cn(
                'fixed bottom-4 start-4 z-50 max-w-sm',
                'transform transition-all duration-300',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            )}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-3 p-4 bg-card border rounded-lg shadow-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{getMessage()}</p>
                    <p className="text-xs text-muted-foreground">
                        {locale === 'ar' ? `منذ ${currentNotification.timeAgo}` : `${currentNotification.timeAgo} ago`}
                    </p>
                </div>
                <button
                    onClick={handleDismiss}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                    aria-label={locale === 'ar' ? 'إغلاق' : 'Dismiss'}
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>
        </div>
    );
}
