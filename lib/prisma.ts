import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper functions for common operations

export async function getOrCreateConversation(userId?: string): Promise<string> {
    const conversation = await prisma.conversation.create({
        data: {
            userId,
            title: `Chat ${new Date().toLocaleDateString()}`,
        },
    });
    return conversation.id;
}

export async function saveMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    toolCalls?: any,
    toolResults?: any
) {
    return prisma.message.create({
        data: {
            conversationId,
            role,
            content,
            toolCalls,
            toolResults,
        },
    });
}

export async function getConversationMessages(conversationId: string) {
    return prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
    });
}

export async function shouldSummarize(conversationId: string): Promise<boolean> {
    const count = await prisma.message.count({
        where: { conversationId },
    });

    const MAX_MESSAGES = parseInt(process.env.MAX_MESSAGES_BEFORE_SUMMARY || '50');
    return count > MAX_MESSAGES;
}

export async function saveConversationSummary(
    conversationId: string,
    summary: string,
    keyTopics: string[],
    messageCount: number
) {
    return prisma.conversationSummary.upsert({
        where: { conversationId },
        update: {
            summary,
            keyTopics,
            messageCount,
            lastUpdated: new Date(),
        },
        create: {
            conversationId,
            summary,
            keyTopics,
            messageCount,
        },
    });
}

export async function getAgentRuns(agentId: string, limit: number = 10) {
    return prisma.agentRun.findMany({
        where: { agentId },
        orderBy: { startedAt: 'desc' },
        take: limit,
        include: {
            notifications: true,
        },
    });
}

export async function createAgentRun(
    agentId: string,
    triggerType: 'cron' | 'manual' | 'api',
    triggeredBy?: string
) {
    return prisma.agentRun.create({
        data: {
            agentId,
            status: 'running',
            triggerType,
            triggeredBy,
        },
    });
}

export async function updateAgentRun(
    runId: string,
    data: {
        status?: string;
        response?: string;
        toolsUsed?: any;
        toolResults?: any;
        error?: string;
        duration?: number;
    }
) {
    return prisma.agentRun.update({
        where: { id: runId },
        data: {
            ...data,
            completedAt: data.status !== 'running' ? new Date() : undefined,
        },
    });
}

export async function saveJobSearchResult(job: {
    searchQuery: string;
    jobTitle: string;
    company: string;
    location: string;
    salary?: string;
    jobUrl: string;
    description: string;
    matchScore: number;
    matchedSkills: string[];
    relevance: any;
    source: string;
    postedDate?: string;
}) {
    return prisma.jobSearchResult.create({
        data: {
            ...job,
            matchedSkills: job.matchedSkills as any,
            relevance: job.relevance as any,
        },
    });
}

export async function getHighMatchJobs(minScore: number = 70, limit: number = 10) {
    return prisma.jobSearchResult.findMany({
        where: {
            matchScore: { gte: minScore },
            notified: false,
        },
        orderBy: { matchScore: 'desc' },
        take: limit,
    });
}

export async function markJobNotified(jobId: string) {
    return prisma.jobSearchResult.update({
        where: { id: jobId },
        data: { notified: true },
    });
}

