import { AdminServerGuard } from './_components/admin-server-guard';
import { AdminDashboardClient } from './_components/admin-dashboard-client';

export default function AdminDashboardPage() {
    return (
        <AdminServerGuard>
            <AdminDashboardClient />
        </AdminServerGuard>
    );
}
