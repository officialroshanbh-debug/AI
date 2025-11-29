import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Admin endpoint to sync database schema
// This should only be accessible in development or with proper authentication
export async function POST(req: NextRequest) {
  // Simple security check - in production, add proper authentication
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.ADMIN_SYNC_TOKEN || 'dev-only';
  
  if (authHeader !== `Bearer ${expectedToken}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Try to query a table to see if it exists
    await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`;
    
    return NextResponse.json({ 
      success: true,
      message: 'Database tables exist'
    });
  } catch (error) {
    // If tables don't exist, try to sync schema
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2021') {
      try {
        // Try to run prisma db push
        const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss --skip-generate', {
          env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
          timeout: 30000
        });
        
        return NextResponse.json({
          success: true,
          message: 'Database schema synced successfully',
          output: stdout,
          error: stderr
        });
      } catch (syncError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to sync database',
          message: syncError instanceof Error ? syncError.message : 'Unknown error',
          instructions: [
            '1. Connect to your database',
            '2. Run: npx prisma db push --accept-data-loss',
            '3. Check DATABASE_URL environment variable'
          ]
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Database connection error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

