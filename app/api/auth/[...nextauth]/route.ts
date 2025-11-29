import { handlers } from '@/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Wrap handlers with error handling
async function handleRequest(
  handler: (req: NextRequest) => Promise<Response>,
  req: NextRequest
) {
  try {
    return await handler(req);
  } catch (error) {
    console.error('[Auth Route] Error:', error);
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('[Auth Route] Error stack:', error.stack);
    }
    // Return error response instead of crashing
    return NextResponse.json(
      { 
        error: 'Authentication error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(handlers.GET, req);
}

export async function POST(req: NextRequest) {
  return handleRequest(handlers.POST, req);
}

