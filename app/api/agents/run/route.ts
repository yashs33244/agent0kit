import { NextRequest, NextResponse } from 'next/server';
import { streamText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { ANTHROPIC_MODEL } from '@/lib/config';
import { allTools } from '@/lib/ai/tools';
import { aiConfig } from '@/lib/ai/client';
import { prisma, createAgentRun, updateAgentRun } from '@/lib/prisma';
import { notifyAgentRun, notifyJobOpportunities } from '@/lib/telegram';
import { trackAPIUsage } from '@/lib/cost-tracker';

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
    'ai-job-search': 'Find the best SDE jobs and internships for 2026 passouts with good PPO opportunities and competitive compensation (minimum ₹50,000/month). Focus on roles matching my tech stack: Python, JavaScript, React, AWS, Docker, Kubernetes, ML/AI. Provide match scores, skill analysis, and direct application links.',
    'twitter-tech-poster': 'Generate and post a tweet about the latest tech trends in 2025. Make it engaging and informative for developers.',
    'github-trending': 'Check trending repositories on GitHub related to AI, ML, and DevOps that would be interesting for a 2026 CSE graduate.',
    'web-research': 'Search for the latest tech news about AI, cloud computing, and software engineering careers for 2026 graduates.'
};

export async function POST(req: NextRequest) {
    let agentRunId: string | undefined;

    try {
        const { agentId, prompt }: RunAgentRequest = await req.json();

        if (!agentId) {
            return NextResponse.json(
                { error: 'Agent ID is required' },
                { status: 400 }
            );
        }

        // Create agent run record
        const agentRun = await createAgentRun(agentId, 'manual', 'dashboard');
        agentRunId = agentRun.id;

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
        const toolsUsed: string[] = [];

        for await (const chunk of result.fullStream) {
            if (chunk.type === 'text-delta') {
                fullText += chunk.text;
            } else if (chunk.type === 'tool-call') {
                console.log(`🔧 Tool called: ${chunk.toolName}`);
                if (!toolsUsed.includes(chunk.toolName)) {
                    toolsUsed.push(chunk.toolName);
                }
            } else if (chunk.type === 'tool-result') {
                toolResults.push({
                    toolName: chunk.toolName,
                    toolCallId: chunk.toolCallId,
                    result: chunk.output
                });
            }
        }

        const duration = Date.now() - startTime;

        // Track API costs
        if (result.usage) {
            trackAPIUsage({
                service: 'anthropic',
                model: ANTHROPIC_MODEL,
                operation: `agent_run_${agentId}`,
                inputTokens: result.usage.promptTokens,
                outputTokens: result.usage.completionTokens,
            });
        }

        // Update agent run record
        await updateAgentRun(agentRunId, {
            status: 'success',
            response: fullText,
            toolsUsed,
            toolResults,
            duration,
        });

        // Send Telegram notification for job agent
        if (agentId === 'ai-job-search' && toolResults.length > 0) {
            const jobResults = toolResults.find(t => t.toolName === 'jobSearch');
            if (jobResults?.result?.success) {
                const allJobs = [
                    ...(jobResults.result.highMatchJobs || []),
                    ...(jobResults.result.mediumMatchJobs || []),
                ];

                if (allJobs.length > 0) {
                    await notifyJobOpportunities(
                        allJobs.map((job: any) => ({
                            title: job.title,
                            company: job.company,
                            location: job.location,
                            salary: job.salary,
                            matchScore: job.matchScore,
                            matchedSkills: job.matchedSkills,
                            url: job.url,
                            relevanceFactors: job.relevanceFactors || [],
                        })),
                        jobResults.result.csvData // Pass CSV data
                    );
                }
            }
        }

        // Notify agent run completion
        const agentType = agentId.includes('job') ? 'job' :
            agentId.includes('twitter') ? 'twitter' :
                agentId.includes('github') ? 'github' : 'web';

        await notifyAgentRun(agentType as any, {
            agentName: agentId,
            status: 'success',
            summary: `Completed successfully with ${toolsUsed.length} tools`,
            duration: `${(duration / 1000).toFixed(2)}s`,
        });

        console.log(`✅ Agent ${agentId} completed in ${duration}ms`);

        return NextResponse.json({
            success: true,
            agentId,
            runId: agentRunId,
            timestamp: new Date().toISOString(),
            duration,
            response: fullText,
            toolResults,
            summary: {
                toolsUsed: toolsUsed.length,
                executionTime: `${(duration / 1000).toFixed(2)}s`,
                responseLength: fullText.length
            }
        });

    } catch (error) {
        console.error('❌ Agent run failed:', error);

        // Update agent run with error
        if (agentRunId) {
            await updateAgentRun(agentRunId, {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }

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

