import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { UserManagement } from '@/components/admin/dashboard/user-management';

export default async function AdminUsersPage() {
    try {
        await requireAdmin();
    } catch {
        redirect('/');
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">User Management</h1>
                <p className="text-muted-foreground">
                    View and manage all platform users
                </p>
            </div>

            <UserManagement />
        </div>
    );
}
