import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get usage logs
    const usageLogs = await prisma.usageLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get messages for response time calculation
    const messages = await prisma.message.findMany({
      where: {
        chat: { userId },
        createdAt: { gte: startDate },
        role: 'assistant',
      },
      select: {
        createdAt: true,
        tokens: true,
        modelId: true,
      },
    });

    // Calculate stats
    const totalMessages = messages.length;
    const totalTokens = usageLogs.reduce((sum, log) => sum + log.tokens, 0);
    const totalCost = usageLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

    // Model breakdown
    const modelMap = new Map<string, { count: number; tokens: number; cost: number }>();
    messages.forEach((msg) => {
      const modelId = msg.modelId || 'unknown';
      const existing = modelMap.get(modelId) || { count: 0, tokens: 0, cost: 0 };
      modelMap.set(modelId, {
        count: existing.count + 1,
        tokens: existing.tokens + (msg.tokens || 0),
        cost: existing.cost,
      });
    });

    // Add cost from usage logs
    usageLogs.forEach((log) => {
      const modelId = log.modelId || 'unknown';
      const existing = modelMap.get(modelId) || { count: 0, tokens: 0, cost: 0 };
      modelMap.set(modelId, {
        ...existing,
        cost: existing.cost + (log.cost || 0),
      });
    });

    const modelBreakdown = Array.from(modelMap.entries()).map(([modelId, data]) => ({
      modelId,
      ...data,
    }));

    // Daily usage
    const dailyMap = new Map<string, { messages: number; tokens: number; cost: number }>();
    messages.forEach((msg) => {
      const date = msg.createdAt.toISOString().split('T')[0]!;
      const existing = dailyMap.get(date) || { messages: 0, tokens: 0, cost: 0 };
      dailyMap.set(date, {
        messages: existing.messages + 1,
        tokens: existing.tokens + (msg.tokens || 0),
        cost: existing.cost,
      });
    });

    usageLogs.forEach((log) => {
      const date = log.createdAt.toISOString().split('T')[0]!;
      const existing = dailyMap.get(date) || { messages: 0, tokens: 0, cost: 0 };
      dailyMap.set(date, {
        ...existing,
        cost: existing.cost + (log.cost || 0),
      });
    });

    const dailyUsage = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Average response time (placeholder - would need actual timing data)
    const averageResponseTime = 1200; // ms

    return NextResponse.json({
      totalMessages,
      totalTokens,
      totalCost,
      averageResponseTime,
      modelBreakdown,
      dailyUsage,
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

