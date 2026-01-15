import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export async function AdminServerGuard({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // Check if user is authenticated - redirect to admin login
    if (!session?.user) {
        redirect('/admin/login');
    }

    // Check if user has admin role
    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        redirect('/dashboard?error=unauthorized');
    }

    return <>{children}</>;
}
