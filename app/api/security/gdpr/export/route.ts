import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { exportUserData } from '@/lib/security/gdpr';

export async function GET(_req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await exportUserData(userId);

    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('[GDPR Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}

