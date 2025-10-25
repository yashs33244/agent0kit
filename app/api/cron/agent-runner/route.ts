import { NextRequest, NextResponse } from 'next/server';
import { stepCountIs, streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { ANTHROPIC_MODEL } from '@/lib/config';
import { allTools } from '@/lib/ai/tools';
import { aiConfig } from '@/lib/ai/client';

/**
 * Cron Job API Route for Automated Agent Execution
 * 
 * This endpoint runs agents on a schedule (e.g., via Vercel Cron Jobs)
 * Can be triggered manually or via cron expression
 * 
 * Setup Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/agent-runner",
 *     "schedule": "0 9,17 * * *"
 *   }]
 * }
 */

interface AgentTask {
    id: string;
    type: 'linkedin' | 'twitter' | 'github' | 'web';
    prompt: string;
    notifyOn: 'success' | 'failure' | 'always' | 'never';
}

const defaultTasks: AgentTask[] = [
    {
        id: 'linkedin-morning',
        type: 'linkedin',
        prompt: 'Search LinkedIn for HR posts hiring 2026 passouts and SDE openings. Look for internships and full-time opportunities.',
        notifyOn: 'success'
    },
    {
        id: 'twitter-tech-trends',
        type: 'twitter',
        prompt: 'Generate and post a tweet about the latest tech trends in 2025. Make it engaging and informative.',
        notifyOn: 'failure'
    },
    {
        id: 'github-trending',
        type: 'github',
        prompt: 'Check trending repositories on GitHub and identify interesting projects for learning.',
        notifyOn: 'success'
    }
];

async function runAgent(task: AgentTask) {
    try {
        console.log(`🚀 Running agent: ${task.id}`);

        const result = await streamText({
            model: anthropic(ANTHROPIC_MODEL),
            system: `You are an AI agent running automatically to help the user. 
            Execute the task efficiently and provide actionable results.
            Be concise and focus on the most important findings.`,
            messages: [{
                role: 'user',
                content: task.prompt
            }],
            tools: allTools,
            stopWhen: stepCountIs(aiConfig.maxSteps as number),
            temperature: aiConfig.temperature as number,
        });

        // Collect the full response
        let fullText = '';
        let toolResults: any[] = [];

        for await (const chunk of result.fullStream) {
            if (chunk.type === 'text-delta') {
                fullText += chunk.text;
            } else if (chunk.type === 'tool-result') {
                toolResults.push({
                    toolName: chunk.toolName,
                    result: chunk.output.text || chunk.output.json || chunk.output.object || chunk.output.array || chunk.output.number || chunk.output.boolean || chunk.output.null
                });
            }
        }

        return {
            success: true,
            taskId: task.id,
            type: task.type,
            response: fullText,
            toolResults,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error(`❌ Agent ${task.id} failed:`, error);
        return {
            success: false,
            taskId: task.id,
            type: task.type,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
}

async function sendNotification(result: any, task: AgentTask) {
    // Check if we should notify
    if (task.notifyOn === 'never') return;
    if (task.notifyOn === 'success' && !result.success) return;
    if (task.notifyOn === 'failure' && result.success) return;

    console.log(`📬 Sending notification for ${task.id}:`, result);

    // TODO: Implement actual notification sending
    // This is where you would integrate with Slack, WhatsApp, email, etc.

    const notificationData = {
        slack: {
            enabled: !!process.env.SLACK_WEBHOOK_URL,
            message: formatSlackMessage(result, task)
        },
        whatsapp: {
            enabled: !!process.env.WHATSAPP_API_KEY,
            message: formatWhatsAppMessage(result, task)
        },
        email: {
            enabled: !!process.env.SENDGRID_API_KEY,
            subject: `Agent ${task.id} ${result.success ? 'completed successfully' : 'failed'}`,
            body: formatEmailMessage(result, task)
        }
    };

    // Simulate notification
    if (notificationData.slack.enabled) {
        console.log('📤 Slack notification:', notificationData.slack.message);
    }
    if (notificationData.whatsapp.enabled) {
        console.log('📱 WhatsApp notification:', notificationData.whatsapp.message);
    }
    if (notificationData.email.enabled) {
        console.log('📧 Email notification:', notificationData.email);
    }

    return notificationData;
}

function formatSlackMessage(result: any, task: AgentTask): string {
    const emoji = result.success ? '✅' : '❌';
    const status = result.success ? 'Success' : 'Failed';

    return `${emoji} *Agent ${task.id}* - ${status}\n\n` +
        `*Type:* ${task.type}\n` +
        `*Time:* ${new Date(result.timestamp).toLocaleString()}\n` +
        (result.success ?
            `*Result:* ${result.response?.substring(0, 200)}...` :
            `*Error:* ${result.error}`);
}

function formatWhatsAppMessage(result: any, task: AgentTask): string {
    const emoji = result.success ? '✅' : '❌';
    return `${emoji} Agent ${task.id}\n` +
        `Status: ${result.success ? 'Success' : 'Failed'}\n` +
        `Time: ${new Date(result.timestamp).toLocaleTimeString()}\n` +
        (result.success ? result.response?.substring(0, 100) : result.error);
}

function formatEmailMessage(result: any, task: AgentTask): string {
    return `
        <h2>Agent Execution Report</h2>
        <p><strong>Agent ID:</strong> ${task.id}</p>
        <p><strong>Type:</strong> ${task.type}</p>
        <p><strong>Status:</strong> ${result.success ? 'Success ✅' : 'Failed ❌'}</p>
        <p><strong>Timestamp:</strong> ${new Date(result.timestamp).toLocaleString()}</p>
        ${result.success ?
            `<h3>Results:</h3><p>${result.response}</p>` :
            `<h3>Error:</h3><p>${result.error}</p>`
        }
        ${result.toolResults?.length > 0 ?
            `<h3>Tool Results:</h3><pre>${JSON.stringify(result.toolResults, null, 2)}</pre>` :
            ''
        }
    `;
}

export async function GET(req: NextRequest) {
    try {
        // Verify cron secret (optional security measure)
        const authHeader = req.headers.get('authorization');
        const expectedToken = process.env.CRON_SECRET;

        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('🕐 Cron job triggered at:', new Date().toISOString());

        // Run all agents in parallel
        const results = await Promise.allSettled(
            defaultTasks.map(task => runAgent(task))
        );

        // Send notifications for completed tasks
        const notifications = await Promise.allSettled(
            results.map((result, index) => {
                if (result.status === 'fulfilled') {
                    return sendNotification(result.value, defaultTasks[index]);
                }
                return Promise.resolve(null);
            })
        );

        // Prepare response
        const successfulRuns = results.filter(r => r.status === 'fulfilled').length;
        const failedRuns = results.filter(r => r.status === 'rejected').length;

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            summary: {
                total: defaultTasks.length,
                successful: successfulRuns,
                failed: failedRuns
            },
            results: results.map((result, index) => ({
                taskId: defaultTasks[index].id,
                status: result.status,
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason : null
            })),
            notificationsSent: notifications.filter(n => n.status === 'fulfilled').length
        });

    } catch (error) {
        console.error('❌ Cron job failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

// Allow manual triggering via POST
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const tasks = body.tasks || defaultTasks;

        const results = await Promise.allSettled(
            tasks.map((task: AgentTask) => runAgent(task))
        );

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results: results.map((result, index) => ({
                taskId: tasks[index].id,
                status: result.status,
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason : null
            }))
        });

    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

