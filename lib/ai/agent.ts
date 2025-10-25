import { LanguageModel, stepCountIs, streamText } from 'ai';
import { anthropicClient, aiConfig } from './client';
import { allTools } from './tools';

/**
 * Main AI Agent using streamText from AI SDK 6 Beta
 * 
 * This agent encapsulates:
 * - Model configuration (Anthropic Claude)
 * - Available tools (GitHub, Web Search, etc.)
 * - System prompt and behavior
 * - Loop control and execution settings
 * 
 * Reference: https://v6.ai-sdk.dev/docs/agents/building-agents
 */
export async function generateAgentResponse(messages: any[]) {
    return streamText({
        model: anthropicClient as unknown as LanguageModel,

        // Instructions define the agent's behavior and personality
        system: `You are an intelligent AI assistant with access to various tools.

Your capabilities:
- Search the web for current information and news
- Access GitHub repositories to get pull requests and code information
- Provide thoughtful, well-researched answers

Guidelines:
1. Always use the most appropriate tool for the task
2. When searching the web, formulate clear and specific queries
3. Provide sources and citations when presenting information
4. If you're unsure, be honest and explain your limitations
5. Be concise but thorough in your responses
6. Think step-by-step for complex queries

Remember: You have access to real-time information through web search, so leverage it when needed.`,

        messages,

        // Tools available to the agent
        tools: allTools,

        // Loop control - allow up to 20 steps (each step is one generation or tool call)
        stopWhen: stepCountIs(aiConfig.maxSteps),

        // Model settings
        temperature: aiConfig.temperature,

        // Tool choice strategy (auto = let the model decide when to use tools)
        toolChoice: 'auto',
    });
}

