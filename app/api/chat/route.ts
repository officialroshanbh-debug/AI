
import { withTimeout } from '@/lib/timeout';
import * as Sentry from '@sentry/nextjs';
import { env } from '@/lib/env';
import { auth } from '@/auth';
import { modelRouter } from '@/lib/models/router';
import { rateLimiter } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { MODEL_CONFIGS, type ModelId } from '@/types/ai-models';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { WebResearchAgent } from '@/lib/agents/web-research-agent';
import { pusherServer } from '@/lib/pusher';
import { countMessageTokens } from '@/lib/token-counter';
import { summarizeMessages } from '@/lib/chat/summarizer';

// Model mapping with fallbacks - using more universally available models
const OPENAI_MODEL_MAP: Record<string, string[]> = {
  'gpt-5.1': ['gpt-4', 'gpt-4o', 'gpt-4-turbo'],
  'gpt-4.1': ['gpt-4', 'gpt-4-turbo', 'gpt-4-turbo-preview'],
  'o3-mini': ['gpt-3.5-turbo-0125', 'gpt-3.5-turbo-1106', 'gpt-3.5-turbo'],
};

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
  attachments: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['image', 'pdf', 'document', 'audio', 'video', 'screenshot']),
      url: z.string().url(),
      filename: z.string(),
      mimeType: z.string(),
      analysis: z.unknown().optional(),
    })
  ).optional(),
  userLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});


// Basic types for chat handling
interface Attachment {
  type: 'image' | 'file';
  url: string;
  filename: string;
  analysis?: {
    description?: string;
    summary?: string;
    text?: string;
    tags?: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      const cookieHeader = req.headers.get('cookie');
      const cookieStore = await cookies();


      const sessionTokenName = env.NODE_ENV === 'production'
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
    const userRole = (session.user as any).role || 'user';
    const tier = userRole === 'admin' ? 'enterprise' : 'free';

    const { success, limit, reset, remaining } = await rateLimiter.limit(userId, tier);

    if (!success) {
      return NextResponse.json(
        { error: 'Too Many Requests', retryAfter: Math.ceil((reset - Date.now()) / 1000) },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
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

    const { messages, modelId, chatId, temperature, maxTokens, userLocation } = validationResult.data;
    const attachments = validationResult.data.attachments as Attachment[] | undefined;

    const model = (modelId || 'gpt-4.1') as ModelId;
    const config = MODEL_CONFIGS[model];
    if (!config) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
    }

    const finalMaxTokens = maxTokens || undefined;

    // SMART CONTEXT WINDOW MANAGEMENT
    let processedMessages = [...messages];
    const TOKEN_THRESHOLD = 4000; // Trigger summarization at 4000 tokens of history

    try {
      const totalTokens = countMessageTokens(processedMessages as any);

      if (totalTokens > TOKEN_THRESHOLD) {
        console.log(`[Smart Context] Token count ${totalTokens} exceeds threshold ${TOKEN_THRESHOLD}. Summarizing...`);

        // Strategy: Keep last 5 messages intact, summarize the rest
        const recentMessagesCount = 5;
        if (processedMessages.length > recentMessagesCount + 1) { // Need at least 2 messages to summarize
          const messagesToSummarize = processedMessages.slice(0, processedMessages.length - recentMessagesCount);
          const recentMessages = processedMessages.slice(processedMessages.length - recentMessagesCount);

          const summary = await summarizeMessages(messagesToSummarize as any);

          if (summary) {
            processedMessages = [
              { role: 'system', content: `Previous conversation summary: ${summary}` },
              ...recentMessages
            ];
            console.log('[Smart Context] Summarization complete. History compressed.');
          }
        }
      }
    } catch (tokenError) {
      console.error('[Smart Context] Token counting/summarization failed:', tokenError);
    }

    // Debug logging for token limits
    if (config.provider === 'openai') {
      const actualModelName = OPENAI_MODEL_MAP[model]?.[0] || 'gpt-4';
      console.log('[Chat API] Model token configuration:', {
        modelId: model,
        actualModelName,
        requestedMaxTokens: maxTokens,
        finalMaxTokens: finalMaxTokens || 'auto (calculated by provider)',
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

    // Save user message sequentially
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      const savedMessage = await prisma.message.create({
        data: {
          chatId: chat.id,
          role: 'user',
          content: lastMessage.content,
          modelId: model,
        },
      });

      if (pusherServer) {
        await pusherServer.trigger(`chat-${chat.id}`, 'new-message', savedMessage);
      }
    }

    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const lastUserMessageLower = lastUserMessage.toLowerCase();
    const isWeatherQuery = /weather|temperature|rain|snow|forecast|climate|hot|cold|humidity|wind/.test(lastUserMessageLower);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullContent = '';
        const dbWritePromises: Promise<unknown>[] = [];

        try {
          interface ResearchData {
            citations: any[];
            context: string;
          }


          interface WeatherData {
            location: { name: string; country: string };
            current: {
              temp: number;
              feels_like: number;
              humidity: number;
              wind_speed: number;
              pressure: number;
              weather: { description: string }[];
            };
          }

          let researchData: ResearchData | null = null;
          let weatherData: WeatherData | null = null;
          const tasks: Promise<unknown>[] = [];

          if (WebResearchAgent.detectIntent(lastUserMessage)) {
            tasks.push(withTimeout(
              WebResearchAgent.research(lastUserMessage, userLocation, (status) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status })}\n\n`));
              }),
              60000,
              'Research timed out'
            ).then(res => {
              researchData = res as ResearchData;
              if (res.citations.length > 0) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ citations: res.citations })}\n\n`)
                );
              }
              return res;
            }).catch(err => {
              console.error('Research failed or timed out:', err);
              return null;
            }));
          }

          if (isWeatherQuery && userLocation) {
            tasks.push(withTimeout(
              fetch(
                `${env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/weather?lat=${userLocation.latitude}&lon=${userLocation.longitude}&city=${userLocation.city || ''}`
              ).then(res => res.ok ? res.json() : null),
              10000,
              'Weather fetch timed out'
            ).then(data => weatherData = data as WeatherData).catch(err => console.error('Weather fetch failed:', err)));
          }

          if (tasks.length > 0) {
            await Promise.all(tasks);
          }

          const streamTimeout = setTimeout(() => {
            controller.error(new Error('Request timeout: Generation took too long'));
          }, 290000);

          const provider = modelRouter.getProvider(model);

          // Enhance messages with context - USING PROCESSED MESSAGES (summarized)
          const enhancedMessages = [...processedMessages];

          if (weatherData && isWeatherQuery) {
            const data = weatherData as WeatherData;
            const weatherContext = `Current weather in ${data.location.name}, ${data.location.country}:
      - Temperature: ${data.current.temp}°C (feels like ${data.current.feels_like}°C)
      - Condition: ${data.current.weather[0]?.description || 'Unknown'}
      - Humidity: ${data.current.humidity}%
      - Wind Speed: ${data.current.wind_speed} km/h
      - Pressure: ${data.current.pressure} hPa`;

            enhancedMessages.splice(-1, 0, {
              role: 'system',
              content: weatherContext,
            });
          }

          if (researchData && (researchData as ResearchData).context) {
            enhancedMessages.splice(-1, 0, {
              role: 'system',
              content: (researchData as ResearchData).context,
            });
          }

          if (attachments && attachments.length > 0) {
            const supportsVision = model.includes('gpt-4') || model.includes('gpt-5');

            if (supportsVision) {
              const lastUserIndex = enhancedMessages.length - 1;
              const imageAttachments = attachments.filter(a => a.type === 'image');

              if (imageAttachments.length > 0) {
                const analysisContext = imageAttachments
                  .filter(img => img.analysis?.description)
                  .map(img => `Image "${img.filename}": ${img.analysis.description}`)
                  .join('\n');

                if (analysisContext) {
                  enhancedMessages[lastUserIndex] = {
                    ...enhancedMessages[lastUserIndex],
                    content: `${analysisContext}\n\nUser: ${enhancedMessages[lastUserIndex].content}`,
                  };
                }
              }
            }

            const documentAttachments = attachments.filter(a => a.type === 'pdf' || a.type === 'document');
            if (documentAttachments.length > 0) {
              const docContext = documentAttachments
                .map(doc => {
                  const analysis = doc.analysis as { content?: string; summary?: string } | undefined;
                  return `Document "${doc.filename}":\n${analysis?.summary || analysis?.content || 'Content unavailable'}`;
                })
                .join('\n\n');

              if (docContext) {
                enhancedMessages.splice(-1, 0, {
                  role: 'system',
                  content: `The user has attached the following documents:\n\n${docContext}`,
                });
              }
            }
          }

          for await (const chunk of provider.streamModel({
            messages: enhancedMessages.map((m) => ({
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
              clearTimeout(streamTimeout);

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
              }).catch(err => {
                console.error('Failed to log usage:', err);
                return null;
              });

              dbWritePromises.push(assistantMessagePromise, usageLogPromise);

              if (pusherServer) {
                dbWritePromises.push(
                  pusherServer.trigger(`chat-${chat.id}`, 'new-message', {
                    id: 'temp-id-' + Date.now(),
                    chatId: chat.id,
                    role: 'assistant',
                    content: fullContent,
                    modelId: model,
                    createdAt: new Date(),
                  })
                );
              }

              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        } finally {
          Promise.allSettled(dbWritePromises).catch(dbError => {
            console.error('Database write error (non-blocking):', dbError);
          });
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
    Sentry.captureException(error, {
      tags: { route: 'chat-api' },
      extra: { userId: (await auth())?.user?.id },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
