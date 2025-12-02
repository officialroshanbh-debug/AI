import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { HimalayaTrainingInterface } from '@/components/admin/himalaya/training-interface';

export default async function HimalayaAdminPage() {
    try {
        await requireAdmin();
    } catch {
        redirect('/');
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Himalaya Training Center</h1>
                <p className="text-muted-foreground">
                    Train and enhance the Himalaya AI model with custom knowledge and behaviors
                </p>
            </div>

            <HimalayaTrainingInterface />
        </div>
    );
}
