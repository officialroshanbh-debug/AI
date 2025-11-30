/**
 * API Route for executing agent tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AgentOrchestrator, ResearcherAgent, WriterAgent, AnalystAgent, CoderAgent } from '@/lib/agents/task-agent';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const agentId = params.id;

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const body = await req.json();
    const { task, autoOrchestrate } = body;

    if (!task) {
      return NextResponse.json({ error: 'Task is required' }, { status: 400 });
    }

    // Create orchestrator and register agents
    const orchestrator = new AgentOrchestrator();
    
    // Register available agents based on role
    const agentInstances = {
      researcher: new ResearcherAgent(agent.id, agent.name),
      writer: new WriterAgent(agent.id, agent.name),
      analyst: new AnalystAgent(agent.id, agent.name),
      coder: new CoderAgent(agent.id, agent.name),
    };

    if (agentInstances[agent.role as keyof typeof agentInstances]) {
      orchestrator.registerAgent(agentInstances[agent.role as keyof typeof agentInstances]);
    }

    // Execute task
    let results;
    if (autoOrchestrate) {
      results = await orchestrator.autoOrchestrate(task);
    } else {
      const tasks = await agentInstances[agent.role as keyof typeof agentInstances].breakDown(task);
      results = await Promise.all(
        tasks.map(t => agentInstances[agent.role as keyof typeof agentInstances].execute(t))
      );
    }

    // Save task to database
    const agentTask = await prisma.agentTask.create({
      data: {
        agentId: agent.id,
        taskType: agent.role,
        status: results.every(r => r.status === 'completed') ? 'completed' : 'failed',
        input: task,
        output: results.map(r => r.output).join('\n\n'),
        metadata: { results },
      },
    });

    return NextResponse.json({ task: agentTask, results });
  } catch (error) {
    console.error('[Agent Execute API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute task' },
      { status: 500 }
    );
  }
}

