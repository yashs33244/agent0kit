/**
 * API Cost Tracking System
 * Track usage and costs for Anthropic, OpenAI, Tavily, etc.
 */

import { prisma } from './prisma';

// Pricing (as of 2025)
const PRICING = {
    anthropic: {
        'claude-sonnet-4-5-20250929': {
            input: 3.00 / 1_000_000,  // $3 per 1M input tokens
            output: 15.00 / 1_000_000,  // $15 per 1M output tokens
        },
    },
    openai: {
        'text-embedding-3-small': {
            input: 0.02 / 1_000_000,  // $0.02 per 1M tokens
        },
    },
    tavily: {
        search: 0.005,  // $0.005 per search
    },
    twitter: {
        post: 0,  // Free tier
    },
};

interface APIUsage {
    service: 'anthropic' | 'openai' | 'tavily' | 'twitter';
    model?: string;
    operation: string;
    inputTokens?: number;
    outputTokens?: number;
    requests?: number;
    estimatedCost: number;
    metadata?: any;
}

// In-memory cost tracking (can be moved to database)
let costLog: APIUsage[] = [];

export function trackAPIUsage(usage: Omit<APIUsage, 'estimatedCost'>): number {
    let cost = 0;

    if (usage.service === 'anthropic' && usage.model) {
        const pricing = PRICING.anthropic[usage.model as keyof typeof PRICING.anthropic];
        if (pricing) {
            cost = (usage.inputTokens || 0) * pricing.input + (usage.outputTokens || 0) * pricing.output;
        }
    } else if (usage.service === 'openai' && usage.model) {
        const pricing = PRICING.openai[usage.model as keyof typeof PRICING.openai];
        if (pricing) {
            cost = (usage.inputTokens || 0) * pricing.input;
        }
    } else if (usage.service === 'tavily') {
        cost = (usage.requests || 1) * PRICING.tavily.search;
    }

    costLog.push({ ...usage, estimatedCost: cost });

    return cost;
}

export function getCostSummary(): {
    total: number;
    byService: Record<string, number>;
    byOperation: Record<string, number>;
    requestCount: number;
} {
    const total = costLog.reduce((sum, log) => sum + log.estimatedCost, 0);

    const byService: Record<string, number> = {};
    const byOperation: Record<string, number> = {};

    costLog.forEach(log => {
        byService[log.service] = (byService[log.service] || 0) + log.estimatedCost;
        byOperation[log.operation] = (byOperation[log.operation] || 0) + log.estimatedCost;
    });

    return {
        total,
        byService,
        byOperation,
        requestCount: costLog.length,
    };
}

export function getDetailedCostReport(): {
    summary: ReturnType<typeof getCostSummary>;
    logs: APIUsage[];
    recommendations: string[];
} {
    const summary = getCostSummary();
    const recommendations: string[] = [];

    // Generate cost-saving recommendations
    if (summary.total > 10) {
        recommendations.push('💰 High API costs detected. Consider caching more aggressively.');
    }

    const anthropicCost = summary.byService.anthropic || 0;
    if (anthropicCost > 5) {
        recommendations.push('🤖 Anthropic usage is high. Review prompt lengths and reduce unnecessary tokens.');
    }

    const embedCost = summary.byService.openai || 0;
    if (embedCost > 1) {
        recommendations.push('🔍 Embedding costs are accumulating. Consider batching or reducing vector storage.');
    }

    return {
        summary,
        logs: costLog,
        recommendations,
    };
}

export function resetCostTracking() {
    costLog = [];
}

// Format cost for display
export function formatCost(cost: number): string {
    if (cost < 0.001) return '$0.00';
    if (cost < 1) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
}

// Get cost report string
export function getCostReport(): string {
    const report = getDetailedCostReport();

    let output = '\n💰 API Cost Report\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    output += `Total Cost: ${formatCost(report.summary.total)}\n`;
    output += `Total Requests: ${report.summary.requestCount}\n\n`;

    output += 'By Service:\n';
    Object.entries(report.summary.byService).forEach(([service, cost]) => {
        output += `  ${service}: ${formatCost(cost)}\n`;
    });

    output += '\nBy Operation:\n';
    Object.entries(report.summary.byOperation).forEach(([op, cost]) => {
        output += `  ${op}: ${formatCost(cost)}\n`;
    });

    if (report.recommendations.length > 0) {
        output += '\n📊 Recommendations:\n';
        report.recommendations.forEach(rec => {
            output += `  ${rec}\n`;
        });
    }

    output += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

    return output;
}

// Export middleware to track costs automatically
export function withCostTracking<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    service: APIUsage['service'],
    operation: string
): T {
    return (async (...args: any[]) => {
        const start = Date.now();
        try {
            const result = await fn(...args);

            // Track cost if token info is available
            if (result?.usage) {
                trackAPIUsage({
                    service,
                    operation,
                    inputTokens: result.usage.prompt_tokens || result.usage.input_tokens,
                    outputTokens: result.usage.completion_tokens || result.usage.output_tokens,
                    metadata: { duration: Date.now() - start },
                });
            }

            return result;
        } catch (error) {
            throw error;
        }
    }) as T;
}

