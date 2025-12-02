/**
 * OpenAI Fine-Tuning integration for Himalaya model
 */

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface TrainingExample {
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
}

/**
 * Format training data as JSONL for OpenAI fine-tuning
 */
export function formatAsJSONL(examples: TrainingExample[]): string {
    return examples.map((example) => JSON.stringify(example)).join('\n');
}

/**
 * Upload training file to OpenAI
 */
export async function uploadTrainingFile(
    jsonlContent: string
): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    const file = await openai.files.create({
        file: new File([jsonlContent], 'training.jsonl', {
            type: 'application/jsonl',
        }),
        purpose: 'fine-tune',
    });

    return file.id;
}

/**
 * Create a fine-tune job
 */
export async function createFineTuneJob(params: {
    trainingFileId: string;
    validationFileId?: string;
    model?: string;
    hyperparameters?: {
        n_epochs?: number;
        batch_size?: number;
        learning_rate_multiplier?: number;
    };
    userId: string;
}): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    // Create fine-tune job in OpenAI
    const fineTune = await openai.fineTuning.jobs.create({
        training_file: params.trainingFileId,
        validation_file: params.validationFileId,
        model: params.model || 'gpt-4o-2024-08-06', // Latest fine-tunable model
        hyperparameters: params.hyperparameters,
    });

    // Store in database
    await prisma.himalayaFineTune.create({
        data: {
            openaiJobId: fineTune.id,
            status: fineTune.status,
            trainingFile: params.trainingFileId,
            validationFile: params.validationFileId,
            hyperparameters: params.hyperparameters || {},
            createdBy: params.userId,
        },
    });

    return fineTune.id;
}

/**
 * Check fine-tune job status
 */
export async function getFineTuneStatus(jobId: string) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    const job = await openai.fineTuning.jobs.retrieve(jobId);

    // Update database
    await prisma.himalayaFineTune.updateMany({
        where: { openaiJobId: jobId },
        data: {
            status: job.status,
            modelId: job.fine_tuned_model || undefined,
            resultFiles: job.result_files as unknown as Record<string, unknown>,
            trainedTokens: job.trained_tokens || undefined,
            completedAt: job.finished_at ? new Date(job.finished_at * 1000) : null,
            errorMessage: job.error?.message || null,
        },
    });

    return job;
}

/**
 * Cancel a fine-tune job
 */
export async function cancelFineTuneJob(jobId: string) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    const job = await openai.fineTuning.jobs.cancel(jobId);

    await prisma.himalayaFineTune.updateMany({
        where: { openaiJobId: jobId },
        data: {
            status: 'cancelled',
        },
    });

    return job;
}

/**
 * Get the latest fine-tuned model ID
 */
export async function getLatestFineTunedModel(): Promise<string | null> {
    const latestJob = await prisma.himalayaFineTune.findFirst({
        where: {
            status: 'succeeded',
            modelId: { not: null },
        },
        orderBy: {
            completedAt: 'desc',
        },
    });

    return latestJob?.modelId || null;
}
