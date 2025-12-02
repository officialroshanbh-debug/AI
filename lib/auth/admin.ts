/**
 * Admin utility functions for role-based access control
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
    const session = await auth();
    const userRole = (session?.user as { role?: string } | null)?.role;

    if (!session?.user || userRole !== 'admin') {
        redirect('/');
    }

    return {
        user: session.user,
        userId: (session.user as { id?: string }).id!,
    };
}

export async function isAdmin(): Promise<boolean> {
    try {
        const session = await auth();
        const userRole = (session?.user as { role?: string } | null)?.role;
        return userRole === 'admin';
    } catch {
        return false;
    }
}

export async function getUserRole(): Promise<'admin' | 'user' | null> {
    try {
        const session = await auth();
        if (!session?.user) return null;
        const userRole = (session.user as { role?: string } | null)?.role;
        return (userRole as 'admin' | 'user') || 'user';
    } catch {
        return null;
    }
}
