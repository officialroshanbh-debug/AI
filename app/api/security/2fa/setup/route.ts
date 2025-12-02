import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generate2FASecret } from '@/lib/security/2fa';

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

    const { secret, qrCodeUrl } = await generate2FASecret(userId);

    return NextResponse.json({ secret, qrCodeUrl });
  } catch (error) {
    console.error('[2FA Setup] Error:', error);
    return NextResponse.json(
      { error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}

