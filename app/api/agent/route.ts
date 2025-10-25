import { streamText, convertToModelMessages, UIMessage, LanguageModel, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { NextRequest } from 'next/server';
import { ANTHROPIC_MODEL } from '@/lib/config';
import { allTools } from '@/lib/ai/tools';
import { aiConfig } from '@/lib/ai/client';

/**
 * AI Agent API Route (AI SDK 6 Beta)
 * 
 * This endpoint handles chat interactions using streamText with tools.
 * It automatically manages the agent loop, tool execution, and streaming.
 * 
 * Reference: https://v6.ai-sdk.dev/docs/agents/building-agents
 */
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
    try {
        const { messages }: { messages: UIMessage[] } = await req.json();

        // Validate messages
        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: 'Invalid request: messages array required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Debug: Log available tools
        console.log('Available tools:', Object.keys(allTools));

        // Create streaming response using streamText
        const response = await streamText({
            model: anthropic(ANTHROPIC_MODEL),
            system: `You are an intelligent AI assistant specializing in helping students find job opportunities.

Your capabilities:
- Search the web for current information and news
- Analyze LinkedIn posts for HR hiring announcements and job openings
- Help find internships and SDE positions for 2026 passouts

Guidelines:
1. Always use the most appropriate tool for the task
2. When searching for jobs, use specific keywords like "2026 passout", "intern", "SDE", "hiring"
3. For LinkedIn analysis, focus on HR posts, job openings, and opportunities for recent graduates
4. Provide sources and citations when presenting information
5. Be helpful and accurate in your responses

IMPORTANT: When users ask about LinkedIn, HR posts, or job opportunities, you MUST use the linkedin tool. Do not just provide general advice.

LinkedIn Tool Usage:
- Use 'hr_posts' to find HR announcements and hiring posts
- Use 'sde_openings' to find software engineering positions
- Use '2026_passouts' to specifically look for opportunities for 2026 graduates
- Use 'all' to get a comprehensive analysis

Remember: You have access to real-time information through web search and LinkedIn analysis.`,
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.parts?.find(p => p.type === 'text')?.text || 'Hello'
            })),
            tools: allTools,
            stopWhen: stepCountIs(aiConfig.maxSteps),
            temperature: 0.7,
            toolChoice: 'auto',
        });

        return response.toUIMessageStreamResponse();
    } catch (error) {
        console.error('Agent API Error:', error);
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}