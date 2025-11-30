/**
 * API Route for Prompt Templates
 */

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
    const category = searchParams.get('category');
    const publicOnly = searchParams.get('public') === 'true';

    const templates = await prisma.promptTemplate.findMany({
      where: {
        ...(publicOnly
          ? { isPublic: true }
          : {
              OR: [{ userId }, { isPublic: true }],
            }),
        ...(category ? { category } : {}),
      },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('[Prompts API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, category, template, variables, isPublic } = body;

    if (!name || !template) {
      return NextResponse.json(
        { error: 'Name and template are required' },
        { status: 400 }
      );
    }

    const promptTemplate = await prisma.promptTemplate.create({
      data: {
        userId,
        name,
        description,
        category: category || 'general',
        template,
        variables: variables || [],
        isPublic: isPublic || false,
      },
    });

    return NextResponse.json({ template: promptTemplate });
  } catch (error) {
    console.error('[Prompts API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

