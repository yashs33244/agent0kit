import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

import { trackAPIUsage } from './cost-tracker';
import { ANTHROPIC_MODEL } from './config';

export async function summarizeConversation(messages: Array<{ role: string; content: string }>): Promise<{
    summary: string;
    keyTopics: string[];
}> {
    try {
        const conversationText = messages
            .map(m => `${m.role}: ${m.content}`)
            .join('\n\n');

        const prompt = `Analyze this conversation and provide:
1. A concise summary (2-3 sentences)
2. Key topics discussed (max 5)

Conversation:
${conversationText}

Respond in JSON format:
{
  "summary": "...",
  "keyTopics": ["topic1", "topic2", ...]
}`;

        const result = await generateText({
            model: anthropic(ANTHROPIC_MODEL),
            prompt,
            temperature: 0.3,
        });

        // Track cost
        if (result.usage) {
            trackAPIUsage({
                service: 'anthropic',
                model: ANTHROPIC_MODEL,
                operation: 'summarize_conversation',
                inputTokens: result.usage.inputTokens,
                outputTokens: result.usage.outputTokens,
            });
        }

        const parsed = JSON.parse(result.text);
        return {
            summary: parsed.summary || '',
            keyTopics: parsed.keyTopics || [],
        };
    } catch (error) {
        console.error('❌ Failed to summarize conversation:', error);
        return {
            summary: 'Failed to generate summary',
            keyTopics: [],
        };
    }
}

export async function shouldTriggerSummary(conversationId: string): Promise<boolean> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
        const messageCount = await prisma.message.count({
            where: { conversationId },
        });

        const summary = await prisma.conversationSummary.findUnique({
            where: { conversationId },
        });

        const lastSummaryCount = summary?.messageCount || 0;
        const threshold = parseInt(process.env.SUMMARY_THRESHOLD || '30');

        return messageCount - lastSummaryCount >= threshold;
    } finally {
        await prisma.$disconnect();
    }
}

