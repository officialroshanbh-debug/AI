import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verify2FA, enable2FA } from '@/lib/security/2fa';

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
    const { token, enable } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const verified = await verify2FA(userId, token);
    
    if (!verified) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    if (enable) {
      const enabled = await enable2FA(userId, token);
      if (!enabled) {
        return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 });
      }
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error('[2FA Verify] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA' },
      { status: 500 }
    );
  }
}

