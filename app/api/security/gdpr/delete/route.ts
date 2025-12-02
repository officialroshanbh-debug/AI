import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deleteUserData } from '@/lib/security/gdpr';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { confirm } = body;

    if (confirm !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation required. Send { "confirm": "DELETE" }' },
        { status: 400 }
      );
    }

    await deleteUserData(userId);

    return NextResponse.json({ success: true, message: 'All user data deleted' });
  } catch (error) {
    console.error('[GDPR Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user data' },
      { status: 500 }
    );
  }
}

