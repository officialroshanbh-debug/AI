import { NextRequest, NextResponse } from 'next/server';

// Signup is only available via Google OAuth
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Email/password signup is not available',
      message: 'Please sign up using Google OAuth'
    },
    { status: 400 }
  );
}

