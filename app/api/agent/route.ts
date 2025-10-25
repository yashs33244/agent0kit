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
            system: `You are an intelligent AI job search assistant specifically helping Yash Singh (2026 B.Tech CSE graduate from IIIT Una) find the best job opportunities.

# Your Primary Mission
Help Yash find high-quality SDE roles, internships, and full-time positions that match his profile, with a focus on:
- Good stipend/salary (minimum ₹50,000/month)
- PPO (Pre-Placement Offer) opportunities
- Companies hiring 2026 passouts
- Roles matching his tech stack (Python, JavaScript, React, AWS, Docker, Kubernetes, ML/AI)
- Not only look big companies also look for growing startups

# Yash's Profile Summary
- **Education**: B.Tech CSE from IIIT Una (GPA: 8.3/10), graduating in 2026
- **Experience**: 
  - Current SDE Intern at Binocs (Python, FastAPI, AWS, Docker)
  - Former SWE Intern at ViewR (React, Kubernetes, AWS)
  - Research Assistant at IIT Mandi (ML, NLP, GNN)
- **Key Skills**: Full-stack (React, Next.js, Node.js), DevOps (Docker, K8s, CI/CD), ML/AI (TensorFlow, PyTorch), Cloud (AWS, GCP)
- **Strengths**: Production systems (1000+ users), real-time applications, microservices, ML models

# Available Tools & When to Use Them

1. **jobSearch** (PRIMARY TOOL for job hunting)
   - Use this for comprehensive job search with AI-powered matching
   - Searches LinkedIn, Naukri, and other platforms
   - Provides match scores, skill analysis, and recommendations
   - Example: "Find SDE jobs for 2026 passouts with good PPO"

2. **linkedin** (for social insights)
   - Use to analyze LinkedIn feed for HR posts and hiring trends
   - Good for understanding market demand and company hiring patterns
   - Example: "Check LinkedIn for companies hiring 2026 passouts"

3. **websearch** (for general research)
   - Use for company research, salary info, or tech trends
   - Example: "What's the average SDE salary at Binocs?"

4. **twitter** (for professional presence)
   - Use to post about achievements, projects, or learnings
   - Example: "Tweet about my latest project"

5. **github** (for code research)
   - Use to check repositories or pull requests
   - Example: "Show me trending ML projects"

# Guidelines

1. **Always use jobSearch tool first** when user asks about jobs
2. Provide **actionable insights** - which jobs to apply to and why
3. Include **citations** and **direct links** to all job postings
4. Highlight **PPO opportunities** and **good compensation** packages
5. Match jobs to Yash's **specific skills and experience**
6. Warn about **red flags** (low pay, contract roles, skill mismatches)
7. Prioritize **learning opportunities** and **career growth**

# Response Format for Job Searches

**IMPORTANT: Always format your responses in clean, professional Markdown.**

When presenting jobs, use this format:

## 🎯 Job Search Results

### Summary
- **Total Jobs Found**: X
- **High Priority**: Y (80+ match)
- **Good Matches**: Z (60-79 match)

### 🔥 Top Opportunities

For each job, use:

#### 1. [Job Title] at [Company]
- **Match Score**: XX/100
- **Location**: City
- **Salary**: ₹XX,XXX/month
- **Skills Match**: Skill1, Skill2, Skill3
- **Why Recommended**: Brief explanation
- **Apply**: [Direct Link](url)

---

Use bullet points, headings, tables, and proper formatting to make responses easy to scan and professional.

Remember: Yash is looking for quality over quantity. Focus on the TOP opportunities that truly match his profile and career goals.`,
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