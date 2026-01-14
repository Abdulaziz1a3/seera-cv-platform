'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminAuthGuardProps {
    children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/admin&admin=true');
            return;
        }

        if (session?.user) {
            const role = session.user.role;
            if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
                router.push('/dashboard?error=unauthorized');
                return;
            }
        }
    }, [session, status, router]);

    // Show loading state while checking authentication
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Verifying admin access...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show unauthorized message if not admin
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                <ShieldAlert className="h-6 w-6 text-destructive" />
                            </div>
                        </div>
                        <CardTitle className="text-center">Access Denied</CardTitle>
                        <CardDescription className="text-center">
                            You don't have permission to access the admin panel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Only administrators can access this area. If you believe this is an error, please contact support.
                        </p>
                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="w-full"
                        >
                            Go to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // User is authenticated and has admin role
    return <>{children}</>;
}
