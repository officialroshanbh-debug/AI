/**
 * AI Agents & Multi-Agent System
 * Task-oriented AI agents that can break down complex requests
 */

import { modelRouter } from '@/lib/models/router';
import type { ModelId } from '@/types/ai-models';

export type AgentRole = 'researcher' | 'writer' | 'analyst' | 'coder' | 'orchestrator';

export interface Task {
  id: string;
  type: string;
  input: string;
  context?: Record<string, unknown>;
  dependencies?: string[]; // IDs of tasks that must complete first
  priority?: number;
}

export interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed' | 'partial';
  output: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  memory?: Record<string, unknown>;
}

export interface AgentConfig {
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: string[]; // Available tools for this agent
}

/**
 * Base Agent class that all specialized agents extend
 */
export abstract class BaseAgent {
  constructor(
    public id: string,
    public role: AgentRole,
    public name: string,
    public config: AgentConfig = {}
  ) {}

  /**
   * Execute a task and return the result
   */
  abstract execute(task: Task): Promise<TaskResult>;

  /**
   * Break down a complex request into subtasks
   */
  abstract breakDown(request: string): Promise<Task[]>;

  /**
   * Update agent memory with new information
   */
  async updateMemory(_key: string, _value: unknown): Promise<void> {
    // This would typically persist to database
    // For now, it's a placeholder
  }

  /**
   * Retrieve relevant memory for context
   */
  async getMemory(_key: string): Promise<unknown> {
    // This would typically retrieve from database
    return null;
  }
}

/**
 * Researcher Agent - Specialized in research tasks
 */
export class ResearcherAgent extends BaseAgent {
  constructor(id: string, name: string, config?: AgentConfig) {
    super(id, 'researcher', name, {
      systemPrompt: `You are a research assistant. Your role is to:
- Gather comprehensive information on topics
- Verify facts and sources
- Provide well-structured research summaries
- Cite sources when available`,
      ...config,
    });
  }

  async execute(task: Task): Promise<TaskResult> {
    try {
      const modelId = (this.config.modelId || 'gpt-4.1') as ModelId;
      const provider = modelRouter.getProvider(modelId);
      
      const systemPrompt = this.config.systemPrompt || 'You are a research assistant.';
      const userPrompt = `Research Task: ${task.input}\n\nContext: ${JSON.stringify(task.context || {})}`;

      const response = await provider.callModel({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: modelId,
        temperature: this.config.temperature || 0.7,
        maxTokens: this.config.maxTokens,
      });

      return {
        taskId: task.id,
        status: 'completed',
        output: response.content,
        metadata: {
          modelId,
          tokens: response.tokens,
          sources: [],
        },
      };
    } catch (error) {
      return {
        taskId: task.id,
        status: 'failed',
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async breakDown(request: string): Promise<Task[]> {
    // Break down research request into subtasks
    return [
      {
        id: `${this.id}-task-1`,
        type: 'research',
        input: request,
        priority: 1,
      },
    ];
  }
}

/**
 * Writer Agent - Specialized in writing tasks
 */
export class WriterAgent extends BaseAgent {
  constructor(id: string, name: string, config?: AgentConfig) {
    super(id, 'writer', name, {
      systemPrompt: `You are a professional writer. Your role is to:
- Create well-structured, engaging content
- Adapt tone and style to the audience
- Ensure clarity and coherence
- Follow best practices for the content type`,
      ...config,
    });
  }

  async execute(task: Task): Promise<TaskResult> {
    try {
      const modelId = (this.config.modelId || 'gpt-4.1') as ModelId;
      const provider = modelRouter.getProvider(modelId);
      
      const systemPrompt = this.config.systemPrompt || 'You are a professional writer.';
      const userPrompt = `Writing Task: ${task.input}\n\nContext: ${JSON.stringify(task.context || {})}`;

      const response = await provider.callModel({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: modelId,
        temperature: this.config.temperature || 0.7,
        maxTokens: this.config.maxTokens,
      });

      return {
        taskId: task.id,
        status: 'completed',
        output: response.content,
        metadata: {
          modelId,
          tokens: response.tokens,
        },
      };
    } catch (error) {
      return {
        taskId: task.id,
        status: 'failed',
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async breakDown(request: string): Promise<Task[]> {
    return [
      {
        id: `${this.id}-task-1`,
        type: 'write',
        input: request,
        priority: 1,
      },
    ];
  }
}

/**
 * Analyst Agent - Specialized in data analysis
 */
export class AnalystAgent extends BaseAgent {
  constructor(id: string, name: string, config?: AgentConfig) {
    super(id, 'analyst', name, {
      systemPrompt: `You are a data analyst. Your role is to:
- Analyze data and identify patterns
- Create visualizations and summaries
- Provide actionable insights
- Present findings clearly`,
      ...config,
    });
  }

  async execute(task: Task): Promise<TaskResult> {
    try {
      const modelId = (this.config.modelId || 'gpt-4.1') as ModelId;
      const provider = modelRouter.getProvider(modelId);
      
      const systemPrompt = this.config.systemPrompt || 'You are a data analyst.';
      const userPrompt = `Analysis Task: ${task.input}\n\nContext: ${JSON.stringify(task.context || {})}`;

      const response = await provider.callModel({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: modelId,
        temperature: this.config.temperature || 0.5,
        maxTokens: this.config.maxTokens,
      });

      return {
        taskId: task.id,
        status: 'completed',
        output: response.content,
        metadata: {
          modelId,
          tokens: response.tokens,
          insights: [],
        },
      };
    } catch (error) {
      return {
        taskId: task.id,
        status: 'failed',
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async breakDown(request: string): Promise<Task[]> {
    return [
      {
        id: `${this.id}-task-1`,
        type: 'analyze',
        input: request,
        priority: 1,
      },
    ];
  }
}

/**
 * Coder Agent - Specialized in coding tasks
 */
export class CoderAgent extends BaseAgent {
  constructor(id: string, name: string, config?: AgentConfig) {
    super(id, 'coder', name, {
      systemPrompt: `You are a software engineer. Your role is to:
- Write clean, efficient code
- Follow best practices and patterns
- Debug and fix issues
- Write tests and documentation`,
      ...config,
    });
  }

  async execute(task: Task): Promise<TaskResult> {
    try {
      const modelId = (this.config.modelId || 'gpt-4.1') as ModelId;
      const provider = modelRouter.getProvider(modelId);
      
      const systemPrompt = this.config.systemPrompt || 'You are a software engineer.';
      const userPrompt = `Coding Task: ${task.input}\n\nContext: ${JSON.stringify(task.context || {})}`;

      const response = await provider.callModel({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: modelId,
        temperature: this.config.temperature || 0.3,
        maxTokens: this.config.maxTokens,
      });

      return {
        taskId: task.id,
        status: 'completed',
        output: response.content,
        metadata: {
          modelId,
          tokens: response.tokens,
          language: 'typescript',
        },
      };
    } catch (error) {
      return {
        taskId: task.id,
        status: 'failed',
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async breakDown(request: string): Promise<Task[]> {
    return [
      {
        id: `${this.id}-task-1`,
        type: 'code',
        input: request,
        priority: 1,
      },
    ];
  }
}

/**
 * Agent Orchestrator - Coordinates multiple agents for complex workflows
 */
export class AgentOrchestrator {
  private agents: Map<AgentRole, BaseAgent[]> = new Map();
  private communicationLog: Array<{ from: string; to: string; message: string; timestamp: Date }> = [];

  /**
   * Register an agent
   */
  registerAgent(agent: BaseAgent): void {
    if (!this.agents.has(agent.role)) {
      this.agents.set(agent.role, []);
    }
    this.agents.get(agent.role)!.push(agent);
  }

  /**
   * Send a message from one agent to another
   */
  sendMessage(fromAgentId: string, toAgentId: string, message: string): void {
    this.communicationLog.push({
      from: fromAgentId,
      to: toAgentId,
      message,
      timestamp: new Date(),
    });
  }

  /**
   * Get messages for an agent
   */
  getMessages(agentId: string): Array<{ from: string; message: string; timestamp: Date }> {
    return this.communicationLog
      .filter((log) => log.to === agentId)
      .map((log) => ({
        from: log.from,
        message: log.message,
        timestamp: log.timestamp,
      }));
  }

  /**
   * Find an agent by ID
   */
  findAgent(agentId: string): BaseAgent | null {
    for (const agents of this.agents.values()) {
      const agent = agents.find((a) => a.id === agentId);
      if (agent) return agent;
    }
    return null;
  }

  /**
   * Execute a multi-step workflow using multiple agents with communication
   */
  async executeWorkflow(
    request: string,
    workflow: Array<{ role: AgentRole; task: string }>
  ): Promise<TaskResult[]> {
    const results: TaskResult[] = [];
    let previousResult: TaskResult | null = null;

    for (const step of workflow) {
      const agents = this.agents.get(step.role);
      if (!agents || agents.length === 0) {
        results.push({
          taskId: `workflow-${step.role}`,
          status: 'failed',
          output: '',
          error: `No agent available for role: ${step.role}`,
        });
        continue;
      }

      const agent = agents[0]; // Use first available agent
      
      // Include previous agent's output as context if available
      const taskInput = previousResult
        ? `${step.task}\n\nPrevious agent output: ${previousResult.output}`
        : step.task;

      const tasks = await agent.breakDown(taskInput);

      for (const task of tasks) {
        // Add context from previous results
        if (previousResult) {
          task.context = {
            ...task.context,
            previousAgentOutput: previousResult.output,
            previousAgentId: previousResult.taskId,
          };
        }

        const result = await agent.execute(task);
        results.push(result);
        previousResult = result;

        // Agent-to-agent communication: notify next agent if workflow continues
        if (workflow.length > 1) {
          const nextStep = workflow[workflow.indexOf(step) + 1];
          if (nextStep) {
            const nextAgents = this.agents.get(nextStep.role);
            if (nextAgents && nextAgents.length > 0) {
              this.sendMessage(
                agent.id,
                nextAgents[0]!.id,
                `Task completed: ${task.input}. Result: ${result.output.slice(0, 200)}...`
              );
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Automatically break down a complex request and assign to appropriate agents
   */
  async autoOrchestrate(request: string): Promise<TaskResult[]> {
    // Analyze request to determine which agents are needed
    // For now, use a simple heuristic
    const needsResearch = request.toLowerCase().includes('research') || 
                         request.toLowerCase().includes('find') ||
                         request.toLowerCase().includes('analyze');
    const needsWriting = request.toLowerCase().includes('write') ||
                         request.toLowerCase().includes('create') ||
                         request.toLowerCase().includes('draft');
    const needsCoding = request.toLowerCase().includes('code') ||
                        request.toLowerCase().includes('program') ||
                        request.toLowerCase().includes('function');

    const workflow: Array<{ role: AgentRole; task: string }> = [];

    if (needsResearch) {
      workflow.push({ role: 'researcher', task: request });
    }
    if (needsWriting) {
      workflow.push({ role: 'writer', task: request });
    }
    if (needsCoding) {
      workflow.push({ role: 'coder', task: request });
    }

    if (workflow.length === 0) {
      // Default to analyst if no specific role detected
      workflow.push({ role: 'analyst', task: request });
    }

    return this.executeWorkflow(request, workflow);
  }
}

