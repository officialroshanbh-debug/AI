import { auth } from '@/auth';
import { modelRouter } from '@/lib/models/router';
import { rateLimiter } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { MODEL_CONFIGS, type ModelId } from '@/types/ai-models';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Model mapping and actual API limits for OpenAI models
const OPENAI_MODEL_MAP: Record<string, string> = {
  'gpt-5.1': 'gpt-4o',
  'gpt-4.1': 'gpt-4-turbo-preview',
  'o3-mini': 'gpt-3.5-turbo',
};

const OPENAI_MODEL_LIMITS: Record<string, number> = {
  'gpt-4o': 16384,
  'gpt-4-turbo-preview': 8192,
  'gpt-3.5-turbo': 4096,
};

function getActualModelLimit(modelId: ModelId, config: { provider: string; maxTokens: number }): number {
  if (config.provider === 'openai') {
    const actualModelName = OPENAI_MODEL_MAP[modelId] || 'gpt-4o';
    return OPENAI_MODEL_LIMITS[actualModelName] || config.maxTokens;
  }
  return config.maxTokens;
}

export const maxDuration = 300;

// Zod schema for request validation
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ).min(1),
  modelId: z.string().optional(),
  chatId: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authentication - in NextAuth v5, auth() reads from cookies() automatically
    // But we need to ensure cookies are available in the request context
    const session = await auth();
    
    if (!session?.user) {
      const cookieHeader = req.headers.get('cookie');
      const cookieStore = await cookies();
      const sessionTokenName = process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token';
      const sessionToken = cookieStore.get(sessionTokenName);
      const allCookies = cookieStore.getAll();
      
      console.error('[Chat API] No session found', {
        hasCookieHeader: !!cookieHeader,
        cookieCount: allCookies.length,
        cookieNames: allCookies.map((c) => c.name),
        hasSessionToken: !!sessionToken,
        sessionTokenName,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      console.error('[Chat API] No user ID in session', { user: session.user });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const { success } = await rateLimiter.limit(userId);
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Validate request body with Zod
    const body = await req.json();
    const validationResult = chatRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { messages, modelId, chatId, temperature, maxTokens } = validationResult.data;

    const model = (modelId || 'gpt-4.1') as ModelId;
    const config = MODEL_CONFIGS[model];
    if (!config) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
    }

    // Get the actual API limit for this model (important for OpenAI models that map to different API models)
    const actualModelLimit = getActualModelLimit(model, config);

    // Ensure maxTokens doesn't exceed model's actual API limit
    const finalMaxTokens = maxTokens 
      ? Math.min(maxTokens, actualModelLimit)
      : actualModelLimit;

    // Debug logging for token limits
    if (config.provider === 'openai') {
      const actualModelName = OPENAI_MODEL_MAP[model] || 'gpt-4o';
      console.log('[Chat API] Model token limits:', {
        modelId: model,
        actualModelName,
        configMaxTokens: config.maxTokens,
        actualModelLimit,
        requestedMaxTokens: maxTokens,
        finalMaxTokens,
      });
    }

    // Get or create chat
    let chat;
    try {
      if (chatId) {
        chat = await prisma.chat.findUnique({
          where: { id: chatId, userId },
        });
      }

      if (!chat) {
        chat = await prisma.chat.create({
          data: {
            userId,
            title: messages[messages.length - 1]?.content?.slice(0, 50) || 'New Chat',
            modelId: model,
          },
        });
      }
    } catch (error) {
      // Check if it's a table not found error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2021') {
        console.error('[Chat API] Database schema error - tables not found. Please run migrations.');
        return NextResponse.json(
          { 
            error: 'Database not initialized',
            message: 'The database tables have not been created. Please ensure migrations have run.'
          },
          { status: 500 }
        );
      }
      throw error;
    }

    // Prepare user message save (but don't await yet - start streaming first)
    const lastMessage = messages[messages.length - 1];
    const userMessagePromise = lastMessage.role === 'user'
      ? prisma.message.create({
          data: {
            chatId: chat.id,
            role: 'user',
            content: lastMessage.content,
            modelId: model,
          },
        })
      : Promise.resolve(null);

    // Get provider and start streaming immediately (don't wait for user message save)
    const provider = modelRouter.getProvider(model);
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullContent = '';
        const dbWritePromises: Promise<unknown>[] = [];

        try {
          // Start user message save in parallel (don't block on it)
          dbWritePromises.push(userMessagePromise);

          // Start streaming immediately
          for await (const chunk of provider.streamModel({
            messages: messages.map((m) => ({
              role: m.role as 'user' | 'assistant' | 'system',
              content: m.content,
            })),
            model,
            temperature: temperature ?? config.defaultTemperature,
            maxTokens: finalMaxTokens,
            userId,
            chatId: chat.id,
          })) {
            if (chunk.content) {
              fullContent += chunk.content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
              );
            }

            if (chunk.done) {
              // Prepare database writes but don't await yet
              const assistantMessagePromise = prisma.message.create({
                data: {
                  chatId: chat.id,
                  role: 'assistant',
                  content: fullContent,
                  modelId: model,
                  tokens: Math.ceil(fullContent.length / 4),
                },
              });

              const usageLogPromise = prisma.usageLog.create({
                data: {
                  userId,
                  modelId: model,
                  tokens: Math.ceil(fullContent.length / 4),
                },
              });

              // Track promises to ensure they complete
              dbWritePromises.push(assistantMessagePromise, usageLogPromise);

              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        } finally {
          // Ensure all database writes complete even if client disconnects
          try {
            await Promise.allSettled(dbWritePromises);
          } catch (dbError) {
            console.error('Error completing database writes:', dbError);
            // Don't throw - we've already sent the response
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

