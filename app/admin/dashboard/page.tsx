import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminDashboard } from '@/components/admin/dashboard/admin-dashboard';

export default async function AdminDashboardPage() {
    try {
        await requireAdmin();
    } catch {
        redirect('/');
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Monitor platform analytics, user growth, and system health
                </p>
            </div>

            <AdminDashboard />
        </div>
    );
}
