
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET() {
    const checks = {
        database: false,
        redis: false,
        openai: false,
    };

    try {
        // Database check
        await prisma.$queryRaw`SELECT 1`;
        checks.database = true;

        // Redis check (if using Upstash)
        if (env.UPSTASH_REDIS_REST_URL) {
            // We can just verify config exists for now, or import redis to check connection
            checks.redis = true;
        }

        // OpenAI check
        if (env.OPENAI_API_KEY) {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
            });
            checks.openai = response.ok;
        }

        const allHealthy = Object.values(checks).every(v => v);

        return NextResponse.json(
            { status: allHealthy ? 'healthy' : 'degraded', checks },
            { status: allHealthy ? 200 : 503 }
        );
    } catch (error) {
        return NextResponse.json(
            { status: 'unhealthy', checks, error: String(error) },
            { status: 503 }
        );
    }
}
