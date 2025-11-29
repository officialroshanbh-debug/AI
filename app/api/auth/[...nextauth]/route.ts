import { handlers } from '@/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Wrap handlers with comprehensive error handling
async function handleRequest(
  handler: (req: NextRequest) => Promise<Response>,
  req: NextRequest
) {
  try {
    const response = await handler(req);
    return response;
  } catch (error) {
    // Log comprehensive error details
    console.error('[Auth Route] Error caught:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      url: req.url,
      method: req.method,
    });
    
    // Return error response instead of crashing
    return NextResponse.json(
      { 
        error: 'Authentication error',
        message: error instanceof Error ? error.message : 'Unknown error',
        // Don't expose stack trace in production
        ...(process.env.NODE_ENV === 'development' && error instanceof Error
          ? { stack: error.stack }
          : {}),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    return await handleRequest(handlers.GET, req);
  } catch (error) {
    // Fallback error handling
    console.error('[Auth Route] GET handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleRequest(handlers.POST, req);
  } catch (error) {
    // Fallback error handling
    console.error('[Auth Route] POST handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

