import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export async function AdminServerGuard({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user) {
        redirect('/login?callbackUrl=/admin&admin=true');
    }

    // Check if user has admin role
    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        redirect('/dashboard?error=unauthorized');
    }

    return <>{children}</>;
}
