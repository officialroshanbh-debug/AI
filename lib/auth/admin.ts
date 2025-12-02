/**
 * Admin utility functions for role-based access control
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';

// Admin emails with full access
const ADMIN_EMAILS = ['officialroshanb@gmail.com'];

export async function requireAdmin() {
    const session = await auth();
    const userRole = (session?.user as { role?: string } | null)?.role;
    const userEmail = session?.user?.email;

    // Check both role and email
    if (!session?.user || (userRole !== 'admin' && !ADMIN_EMAILS.includes(userEmail || ''))) {
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
        const userEmail = session?.user?.email;

        // Check both role and email
        return userRole === 'admin' || ADMIN_EMAILS.includes(userEmail || '');
    } catch {
        return false;
    }
}

export async function getUserRole(): Promise<'admin' | 'user' | null> {
    try {
        const session = await auth();
        if (!session?.user) return null;

        const userRole = (session.user as { role?: string } | null)?.role;
        const userEmail = session?.user?.email;

        // Return admin if either role is admin OR email is in admin list
        if (userRole === 'admin' || ADMIN_EMAILS.includes(userEmail || '')) {
            return 'admin';
        }

        return 'user';
    } catch {
        return null;
    }
}
