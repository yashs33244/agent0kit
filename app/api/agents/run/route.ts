import { NextRequest, NextResponse } from 'next/server';
import { streamText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { ANTHROPIC_MODEL } from '@/lib/config';
import { allTools } from '@/lib/ai/tools';
import { aiConfig } from '@/lib/ai/client';

/**
 * API Route for Running Agents On-Demand
 * 
 * This endpoint allows manual triggering of agents from the dashboard
 */

interface RunAgentRequest {
    agentId: string;
    prompt?: string;
}

const agentPrompts: Record<string, string> = {
    'linkedin-job-hunter': 'Search LinkedIn for HR posts hiring 2026 passouts and SDE openings. Look for internships and full-time opportunities for recent graduates.',
    'twitter-tech-poster': 'Generate and post a tweet about the latest tech trends in 2025. Make it engaging and informative for developers.',
    'github-trending': 'Check trending repositories on GitHub and identify interesting projects for learning and contributing.',
    'web-research': 'Search for the latest tech news and compile a brief digest of the most important updates.'
};

export async function POST(req: NextRequest) {
    try {
        const { agentId, prompt }: RunAgentRequest = await req.json();

        if (!agentId) {
            return NextResponse.json(
                { error: 'Agent ID is required' },
                { status: 400 }
            );
        }

        const agentPrompt = prompt || agentPrompts[agentId] || 'Execute your primary task';

        console.log(`🚀 Running agent: ${agentId} at ${new Date().toISOString()}`);

        // Start timing
        const startTime = Date.now();

        const result = await streamText({
            model: anthropic(ANTHROPIC_MODEL),
            system: `You are an AI agent running on-demand to help the user. 
            Execute the task efficiently and provide actionable results.
            Be concise and focus on the most important findings.`,
            messages: [{
                role: 'user',
                content: agentPrompt
            }],
            tools: allTools,
            stopWhen: stepCountIs(aiConfig.maxSteps as number),
            temperature: aiConfig.temperature as number,
        });

        // Collect the full response
        let fullText = '';
        const toolResults: any[] = [];

        for await (const chunk of result.fullStream) {
            if (chunk.type === 'text-delta') {
                fullText += chunk.text;
            } else if (chunk.type === 'tool-call') {
                console.log(`🔧 Tool called: ${chunk.toolName}`);
            } else if (chunk.type === 'tool-result') {
                toolResults.push({
                    toolName: chunk.toolName,
                    toolCallId: chunk.toolCallId,
                    result: chunk.output
                });
            }
        }

        const duration = Date.now() - startTime;

        console.log(`✅ Agent ${agentId} completed in ${duration}ms`);

        return NextResponse.json({
            success: true,
            agentId,
            timestamp: new Date().toISOString(),
            duration,
            response: fullText,
            toolResults,
            summary: {
                toolsUsed: toolResults.length,
                executionTime: `${(duration / 1000).toFixed(2)}s`,
                responseLength: fullText.length
            }
        });

    } catch (error) {
        console.error('❌ Agent run failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

