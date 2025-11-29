import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// This endpoint can be called to manually sync the database schema
// WARNING: Only use this in development or with proper authentication
export async function POST(req: NextRequest) {
  try {
    // In production, you should add authentication here
    // For now, we'll allow it but log a warning
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Admin] Database sync called in production - ensure this is protected!');
    }

    // Try to run prisma db push
    try {
      const { stdout, stderr } = await execAsync('npx prisma db push --skip-generate');
      return NextResponse.json({
        success: true,
        message: 'Database schema synced successfully',
        output: stdout,
        error: stderr || null,
      });
    } catch (error) {
      console.error('Database sync error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Admin endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

