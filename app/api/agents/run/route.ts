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

    'twitter-tech-poster': 'Generate and post a tweet about the latest tech trends, coding tips, or AI insights. Make it engaging, informative, and relevant for developers. Keep it under 280 characters. Include 2-3 relevant hashtags. Make sure it\'s original and valuable content.',
    'tech-news-research': `Research and compile today's most important tech news and updates. Focus on:

1. **AI Companies Updates:**
   - OpenAI: Latest GPT models, API updates, new features
   - Anthropic: Claude updates, new capabilities, announcements
   - Google: Gemini developments, AI research
   - Meta AI: LLaMA updates, research papers
   
2. **Tech Giants Research:**
   - NVIDIA: AI chip announcements, CUDA updates
   - Apple Research: ML papers, on-device AI
   - Spotify: Engineering blog, ML in music

3. **AI Agents & Frameworks:**
   - New agent frameworks and toolkits
   - LangChain, AutoGPT, BabyAGI updates
   - Agent building platforms

4. **Developer Tools:**
   - Best new coding tools launched
   - AI coding assistants updates
   - DevOps tools and platforms

5. **Job Market Insights:**
   - Tech hiring trends
   - In-demand skills
   - Salary trends for developers

6. **Learning Resources:**
   - New courses or tutorials
   - Research papers worth reading
   - Technical blogs and articles

Format your response in clean markdown with:
- Clear sections with ## headings
- Bullet points for each update
- **Direct links** to sources
- Brief summaries (2-3 sentences each)
- Highlight the most important news at the top

Make it actionable and easy to scan. Include at least 10-15 quality updates with links.`,

    'github-trending': 'Check trending repositories on GitHub related to AI, ML, DevOps, and full-stack development that would be interesting for a 2026 CSE graduate. Include star counts, descriptions, and why they\'re relevant.',

    'web-research': 'Research and provide information on the latest tech trends, industry news, or any specific topic requested. Include credible sources and direct links.',

    'binocs-sales-agent': `You are a sales intelligence agent for Binocs.co. Your mission is to find ideal clients and their contact information.

**About Binocs.co:**
- Product: CDD (Commercial Due Diligence) reports, investment memos, due diligence reports, market intelligence
- Target: Private equity firms, venture capital funds, family offices, private companies
- Value Prop: Data-driven investment intelligence using best-in-class tools

**Your Task - EXECUTE IN PARALLEL FOR SPEED:**

1. **Search for Target Companies** (use 5+ parallel web searches simultaneously):
   IMPORTANT: Execute ALL these searches AT THE SAME TIME (parallel execution)
   
   Search for:
   - "private equity firms partners emails 2025"
   - "venture capital firms managing directors contact"
   - "family offices investment team"
   - "PE firms raising new funds 2025"
   - "VC firms actively investing 2025"
   - "investment firms due diligence services"

2. **Contact Enrichment** (use Lusha when available, AI fallback when rate limited):
   For each company found:
   - Try Lusha tool first for company domain
   - If Lusha rate limited or fails: Use web search to find contact emails/LinkedIn
   - Extract: Decision makers, emails, phones, LinkedIn profiles
   - Focus on: Partners, Managing Directors, Investment Directors, Principals

3. **MANDATORY CSV Generation:**
   You MUST create a structured data table with ALL contacts found in this format:
   
   | Name | Title | Company | Email | Phone | LinkedIn | Website | Notes |
   |------|-------|---------|-------|-------|----------|---------|-------|
   | ... | ... | ... | ... | ... | ... | ... | ... |

4. **Output Format:**
   
   ## 🎯 Qualified Leads for Binocs.co
   
   ### Top Priority Prospects
   
   #### 1. [Company Name]
   - **Website:** [URL]
   - **Focus:** [Investment thesis]
   - **Why Binocs:** [Specific reason]
   - **Recent Activity:** [Deal/announcement]
   - **Decision Makers:**
     - **[Name 1]**, [Title]
       - Email: [email@company.com]
       - Phone: [number if available]
       - LinkedIn: [profile URL]
     - **[Name 2]**, [Title]
       - Email: [email@company.com]
       - LinkedIn: [profile URL]
   
   [Continue for each lead...]
   
   ### 📋 Complete Contact List (CSV Format)
   
   \`\`\`csv
   Name,Title,Company,Email,Phone,LinkedIn,Website,Notes
   John Doe,Managing Partner,Acme Capital,john@acme.com,+1-555-0100,linkedin.com/in/johndoe,acme.com,Actively investing in SaaS
   Jane Smith,Investment Director,Beta Ventures,jane@beta.vc,,linkedin.com/in/janesmith,beta.vc,Looking for DD services
   [... all contacts as CSV rows ...]
   \`\`\`
   
   ### Summary
   - Total companies found: X
   - Contacts with emails: Y
   - Contacts with phones: Z
   - Next steps: [Recommended actions]

**CRITICAL NOTES:**
- Execute all searches SIMULTANEOUSLY for speed (not one by one)
- If Lusha hits rate limit, use websearch to find company contact pages and extract emails
- ALWAYS generate the CSV table - this is mandatory for the user
- Prioritize quality contacts with verified emails over quantity
- The CSV data will be automatically saved to a file`
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

        console.log(`📋 Agent prompt length: ${agentPrompt.length} chars`);
        console.log(`🔧 Tools available: ${Object.keys(allTools).join(', ')}`);

        const result: any = await streamText({
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

        console.log(`📊 Stream result status: ${result ? 'OK' : 'NULL'}`);

        // Wait for completion and get the full text
        const fullText = await result.text;
        console.log(`✅ Response text length: ${fullText.length}`);

        // Get tool calls and results from the response
        const toolResults: any[] = [];
        const toolsUsed: string[] = [];

        // Access response messages to get tool information
        const responseMessages = await result.response.then((r: any) => r.messages);
        for (const msg of responseMessages) {
            if (msg.role === 'assistant' && msg.content) {
                for (const part of msg.content) {
                    if (part.type === 'tool-use') {
                        console.log(`🔧 Tool used: ${part.name}`);
                        if (!toolsUsed.includes(part.name)) {
                            toolsUsed.push(part.name);
                        }
                    }
                }
            }
        }

        const duration = Date.now() - startTime;

        // Track API costs
        if (result.usage) {
            trackAPIUsage({
                service: 'anthropic',
                model: ANTHROPIC_MODEL,
                operation: `agent_run_${agentId}`,
                inputTokens: result.usage.inputTokens,
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

        // Extract and save CSV from Binocs agent response
        let csvFilePath: string | undefined;
        if (agentId === 'binocs-sales-agent') {
            try {
                const { extractContactsFromText, saveContactsCSV } = await import('@/lib/contact-enrichment');

                // Extract CSV from markdown code blocks
                const csvMatch = fullText.match(/```csv\n([\s\S]*?)\n```/);
                if (csvMatch && csvMatch[1]) {
                    console.log('📋 Found CSV in response, parsing...');

                    // Parse CSV content
                    const csvContent = csvMatch[1];
                    const lines = csvContent.split('\n').filter((line: string) => line.trim());

                    if (lines.length > 1) { // At least header + 1 data row
                        const contacts: any[] = [];
                        const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());

                        for (let i = 1; i < lines.length; i++) {
                            const values = lines[i].split(',').map((v: string) => v.trim());
                            const contact: any = {};

                            headers.forEach((header: string, idx: number) => {
                                if (values[idx]) {
                                    contact[header] = values[idx];
                                }
                            });

                            if (contact.name || contact.email || contact.company) {
                                contacts.push(contact);
                            }
                        }

                        if (contacts.length > 0) {
                            csvFilePath = await saveContactsCSV(
                                contacts,
                                `binocs_leads_${Date.now()}.csv`
                            );
                            console.log(`✅ Saved ${contacts.length} contacts to ${csvFilePath}`);
                        }
                    }
                } else {
                    // Fallback: Try to extract contacts from text using AI
                    console.log('📋 No CSV found, attempting AI extraction...');
                    const contacts = await extractContactsFromText(fullText);
                    if (contacts.length > 0) {
                        csvFilePath = await saveContactsCSV(
                            contacts,
                            `binocs_leads_extracted_${Date.now()}.csv`
                        );
                        console.log(`✅ Extracted and saved ${contacts.length} contacts to ${csvFilePath}`);
                    }
                }
            } catch (error) {
                console.error('⚠️ Failed to extract/save CSV:', error);
            }
        }

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
            csvFilePath, // Include CSV file path if generated
            summary: {
                toolsUsed: toolsUsed.length,
                executionTime: `${(duration / 1000).toFixed(2)}s`,
                responseLength: fullText.length,
                ...(csvFilePath && { csvGenerated: true })
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

