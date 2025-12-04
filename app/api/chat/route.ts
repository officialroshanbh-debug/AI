import { auth } from '@/auth';
import { modelRouter } from '@/lib/models/router';
import { rateLimiter } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { MODEL_CONFIGS, type ModelId } from '@/types/ai-models';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { WebResearchAgent } from '@/lib/agents/web-research-agent';

// Model mapping with fallbacks - using more universally available models
const OPENAI_MODEL_MAP: Record<string, string[]> = {
  'gpt-5.1': ['gpt-4', 'gpt-4o', 'gpt-4-turbo'],
  'gpt-4.1': ['gpt-4', 'gpt-4-turbo', 'gpt-4-turbo-preview'],
  'o3-mini': ['gpt-3.5-turbo-0125', 'gpt-3.5-turbo-1106', 'gpt-3.5-turbo'],
};

// Removed token limit capping - provider handles limits dynamically based on context window

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
      analysis: z.any().optional(),
    })
  ).optional(),
  userLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
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

    const { messages, modelId, chatId, temperature, maxTokens, attachments, userLocation } = validationResult.data;

    const model = (modelId || 'gpt-4.1') as ModelId;
    const config = MODEL_CONFIGS[model];
    if (!config) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
    }

    // Don't cap maxTokens - let the provider handle it dynamically
    // The provider will calculate available tokens based on input messages
    const finalMaxTokens = maxTokens || undefined; // Pass through if provided, otherwise let provider decide

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

    // Check if user is asking about weather
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const lastUserMessageLower = lastUserMessage.toLowerCase();
    const isWeatherQuery = /weather|temperature|rain|snow|forecast|climate|hot|cold|humidity|wind/.test(lastUserMessageLower);

    // Weather fetch moved inside stream for performance

    // WEB RESEARCH INTEGRATION
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullContent = '';
        const dbWritePromises: Promise<unknown>[] = [];

        try {
          // Start user message save in parallel (don't block on it)
          dbWritePromises.push(userMessagePromise);

          // WEB RESEARCH INTEGRATION (Inside stream for progress updates)
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

          // Parallelize research and weather fetch
          // const tasks: Promise<unknown>[] = []; // Removed blocking tasks array

          if (WebResearchAgent.detectIntent(lastUserMessage)) {
            // Start research but DON'T await - let it run in background
            WebResearchAgent.research(lastUserMessage, userLocation, (status) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status })}\n\n`));
            }).then(res => {
              researchData = res as ResearchData;
              // Send citations as soon as available
              if (res.citations.length > 0) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ citations: res.citations })}\n\n`)
                );
              }
              return res;
            });
          }

          if (isWeatherQuery && userLocation) {
            fetch(
              `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/weather?lat=${userLocation.latitude}&lon=${userLocation.longitude}&city=${userLocation.city || ''}`
            ).then(res => res.ok ? res.json() : null).then(data => weatherData = data as WeatherData).catch(err => console.error('Weather fetch failed:', err));
          }

          // Removed blocking await
          // if (tasks.length > 0) {
          //   await Promise.all(tasks);
          // }

          // Get provider
          const provider = modelRouter.getProvider(model);

          // Enhance messages with context
          const enhancedMessages = [...messages];

          // Add weather context
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

          // Add research context if available
          if (researchData && (researchData as ResearchData).context) {
            enhancedMessages.splice(-1, 0, {
              role: 'system',
              content: (researchData as ResearchData).context,
            });
          }

          // Process attachments if present
          if (attachments && attachments.length > 0) {
            // Check if model supports vision (GPT-4V, Claude with vision, etc.)
            const supportsVision = model.includes('gpt-4') || model.includes('gpt-5');

            if (supportsVision) {
              // For vision models, we need to format the last user message with images
              const lastUserIndex = enhancedMessages.length - 1;
              const imageAttachments = attachments.filter(a => a.type === 'image');

              if (imageAttachments.length > 0) {
                // Add image analysis context if available
                const analysisContext = imageAttachments
                  .filter(img => img.analysis?.description)
                  .map(img => `Image "${img.filename}": ${img.analysis.description}`)
                  .join('\n');

                if (analysisContext) {
                  // Prepend analysis to user's message
                  enhancedMessages[lastUserIndex] = {
                    ...enhancedMessages[lastUserIndex],
                    content: `${analysisContext}\n\nUser: ${enhancedMessages[lastUserIndex].content}`,
                  };
                }
              }
            }

            // For non-image attachments (PDFs, documents), add their content/analysis as context
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

          // Start streaming immediately
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
              }).catch(err => {
                console.error('Failed to log usage:', err);
                return null;
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
          // Fire and forget - don't await
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

