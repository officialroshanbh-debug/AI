import { auth } from '@/auth';
import { modelRouter } from '@/lib/models/router';
import { rateLimiter } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { MODEL_CONFIGS, type ModelId } from '@/types/ai-models';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const identifier = session.user.id;
    const { success } = await rateLimiter.limit(identifier);
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { messages, modelId, chatId, temperature, maxTokens } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const model = (modelId || 'gpt-4.1') as ModelId;
    const config = MODEL_CONFIGS[model];
    if (!config) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
    }

    // Get or create chat
    let chat;
    if (chatId) {
      chat = await prisma.chat.findUnique({
        where: { id: chatId, userId: session.user.id },
      });
    }

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          userId: session.user.id,
          title: messages[messages.length - 1]?.content?.slice(0, 50) || 'New Chat',
          modelId: model,
        },
      });
    }

    // Save user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      await prisma.message.create({
        data: {
          chatId: chat.id,
          role: 'user',
          content: lastMessage.content,
          modelId: model,
        },
      });
    }

    // Get provider and stream response
    const provider = modelRouter.getProvider(model);
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullContent = '';

        try {
          for await (const chunk of provider.streamModel({
            messages: messages.map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant' | 'system',
              content: m.content,
            })),
            model,
            temperature: temperature ?? config.defaultTemperature,
            maxTokens: maxTokens ?? config.maxTokens,
            userId: session.user.id,
            chatId: chat.id,
          })) {
            if (chunk.content) {
              fullContent += chunk.content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
              );
            }

            if (chunk.done) {
              // Save assistant message
              await prisma.message.create({
                data: {
                  chatId: chat.id,
                  role: 'assistant',
                  content: fullContent,
                  modelId: model,
                  tokens: fullContent.length / 4, // Rough estimate
                },
              });

              // Log usage
              await prisma.usageLog.create({
                data: {
                  userId: session.user.id,
                  modelId: model,
                  tokens: Math.ceil(fullContent.length / 4),
                },
              });

              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
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

