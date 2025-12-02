/**
 * REST API v1 - Chat Endpoint
 * External API for programmatic access
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { modelRouter } from '@/lib/models/router';
import { rateLimiter } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { MODEL_CONFIGS, type ModelId } from '@/types/ai-models';
import { z } from 'zod';

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ).min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
  stream: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Get API key from header
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Provide Authorization: Bearer <key>' },
        { status: 401 }
      );
    }

    // Validate API key
    const keyHash = await hashApiKey(apiKey);
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });

    if (!apiKeyRecord || apiKeyRecord.revoked) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Check expiration
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: 'API key expired' }, { status: 401 });
    }

    const userId = apiKeyRecord.userId;

    // Rate limiting
    const { success } = await rateLimiter.limit(userId);
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Parse request
    const body = await req.json();
    const validationResult = chatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { messages, model, temperature, max_tokens, stream } = validationResult.data;

    const modelId = (model || 'gpt-4.1') as ModelId;
    const config = MODEL_CONFIGS[modelId];
    if (!config) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
    }

    // Update API key usage
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // Log usage
    await prisma.apiKeyUsageLog.create({
      data: {
        apiKeyId: apiKeyRecord.id,
        endpoint: '/api/v1/chat',
        method: 'POST',
        statusCode: 200,
      },
    });

    // Handle streaming
    if (stream) {
      const provider = modelRouter.getProvider(modelId);
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of provider.streamModel({
              messages: messages.map((m) => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content,
              })),
              model: modelId,
              temperature: temperature ?? config.defaultTemperature,
              maxTokens: max_tokens,
              userId,
            })) {
              if (chunk.content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
                );
              }
              if (chunk.done) {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
              }
            }
          } catch (error) {
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
    }

    // Non-streaming response
    const provider = modelRouter.getProvider(modelId);
    const response = await provider.callModel({
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      model: modelId,
      temperature: temperature ?? config.defaultTemperature,
      maxTokens: max_tokens,
      userId,
    });

    return NextResponse.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: modelId,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: response.content,
          },
          finish_reason: response.finishReason || 'stop',
        },
      ],
      usage: {
        prompt_tokens: response.tokens || 0,
        completion_tokens: response.tokens || 0,
        total_tokens: response.tokens || 0,
      },
    });
  } catch (error) {
    console.error('[API v1 Chat] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

