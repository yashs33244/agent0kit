/**
 * Telegram Notification Service
 * 
 * Supports multiple bot tokens for different agents
 */

interface TelegramMessage {
    text: string;
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disable_web_page_preview?: boolean;
}

interface JobNotification {
    title: string;
    company: string;
    location: string;
    salary?: string;
    matchScore: number;
    matchedSkills: string[];
    url: string;
    relevanceFactors: string[];
}

// Get bot token based on agent type
function getBotToken(agentType: 'job' | 'twitter' | 'github' | 'web'): string | undefined {
    const tokens = {
        job: process.env.TELEGRAM_JOB_AGENT_BOT_TOKEN,
        twitter: process.env.TELEGRAM_TWITTER_AGENT_BOT_TOKEN,
        github: process.env.TELEGRAM_GITHUB_AGENT_BOT_TOKEN,
        web: process.env.TELEGRAM_WEB_AGENT_BOT_TOKEN,
    };

    return tokens[agentType];
}

export async function sendTelegramMessage(
    agentType: 'job' | 'twitter' | 'github' | 'web',
    message: TelegramMessage
): Promise<{ success: boolean; error?: string }> {
    try {
        const botToken = getBotToken(agentType);
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken) {
            console.log(`⚠️ No Telegram bot token configured for ${agentType} agent`);
            return { success: false, error: `No bot token for ${agentType}` };
        }

        if (!chatId) {
            console.log('⚠️ TELEGRAM_CHAT_ID not configured');
            return { success: false, error: 'No chat ID configured' };
        }

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                ...message,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            console.error('❌ Telegram API error:', data);
            return { success: false, error: data.description || 'Unknown error' };
        }

        console.log(`✅ Telegram message sent via ${agentType} bot`);
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send Telegram message:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function sendTelegramDocument(
    agentType: 'job' | 'twitter' | 'github' | 'web',
    document: { filename: string; content: string },
    caption?: string
): Promise<{ success: boolean; error?: string }> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { default: FormData } = await import('form-data');
    const { default: nodeFetch } = await import('node-fetch');

    let tempFilePath: string | null = null;

    try {
        const botToken = getBotToken(agentType);
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.log(`⚠️ Telegram not configured for ${agentType}`);
            return { success: false, error: 'Not configured' };
        }

        // Create temp directory
        const tmpDir = path.join(process.cwd(), 'tmp');
        await fs.mkdir(tmpDir, { recursive: true });

        // Save CSV to temp file
        tempFilePath = path.join(tmpDir, document.filename);
        await fs.writeFile(tempFilePath, document.content, 'utf-8');
        console.log(`💾 Saved temp CSV: ${tempFilePath}`);

        const url = `https://api.telegram.org/bot${botToken}/sendDocument`;

        // Create proper form-data with file stream
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('document', await fs.readFile(tempFilePath), {
            filename: document.filename,
            contentType: 'text/csv',
        });

        if (caption) {
            formData.append('caption', caption);
            formData.append('parse_mode', 'HTML');
        }

        console.log(`📤 Uploading ${document.filename} to Telegram...`);

        // Use node-fetch with form-data
        const response = await nodeFetch(url, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
        });

        console.log(`📡 Telegram response status: ${response.status} ${response.statusText}`);

        const responseText = await response.text();

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            console.error('❌ Failed to parse Telegram response:', responseText.substring(0, 500));
            return {
                success: false,
                error: `Invalid response from Telegram: ${responseText.substring(0, 100)}`
            };
        }

        if (!response.ok || !data.ok) {
            console.error('❌ Telegram document send error:', data);
            return { success: false, error: data.description || 'Unknown error' };
        }

        console.log(`✅ Telegram document sent via ${agentType} bot: ${document.filename}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send Telegram document:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    } finally {
        // Clean up temporary file
        if (tempFilePath) {
            try {
                const fs = await import('fs/promises');
                await fs.unlink(tempFilePath);
                console.log(`🗑️ Deleted temp CSV: ${tempFilePath}`);
            } catch (cleanupError) {
                console.error('⚠️ Failed to delete temp CSV:', cleanupError);
            }
        }
    }
}

export async function notifyJobOpportunities(
    jobs: JobNotification[],
    csvData?: string
): Promise<void> {
    console.log(`📱 Sending Telegram notification for ${jobs.length} jobs...`);
    console.log(`📄 CSV Data available: ${csvData ? 'YES' : 'NO'}${csvData ? ` (${csvData.length} bytes)` : ''}`);

    if (jobs.length === 0) {
        console.log('⚠️ No jobs to notify about, skipping Telegram notification');
        return;
    }

    const highMatchJobs = jobs.filter(j => j.matchScore >= 80);
    const goodMatchJobs = jobs.filter(j => j.matchScore >= 60 && j.matchScore < 80);

    let message = `🎯 <b>Job Opportunities Found!</b>\n\n`;
    message += `📊 <b>Summary:</b>\n`;
    message += `   • Total: ${jobs.length} jobs\n`;
    message += `   • High Match (80+): ${highMatchJobs.length}\n`;
    message += `   • Good Match (60-79): ${goodMatchJobs.length}\n\n`;

    if (highMatchJobs.length > 0) {
        message += `🔥 <b>HIGH PRIORITY JOBS:</b>\n\n`;

        highMatchJobs.slice(0, 5).forEach((job, idx) => {
            message += `${idx + 1}. <b>${job.title}</b>\n`;
            message += `   🏢 ${job.company} • 📍 ${job.location}\n`;
            if (job.salary) message += `   💰 ${job.salary}\n`;
            message += `   🎯 Match: ${job.matchScore}/100\n`;
            message += `   ✅ Skills: ${job.matchedSkills.slice(0, 4).join(', ')}\n`;
            if (job.relevanceFactors.length > 0) {
                message += `   ${job.relevanceFactors[0]}\n`;
            }
            message += `   🔗 <a href="${job.url}">Apply Here</a>\n\n`;
        });
    }

    if (goodMatchJobs.length > 0 && highMatchJobs.length < 3) {
        message += `👍 <b>GOOD MATCHES:</b>\n\n`;

        goodMatchJobs.slice(0, 3).forEach((job, idx) => {
            message += `${idx + 1}. ${job.title} at ${job.company}\n`;
            message += `   Match: ${job.matchScore}/100 • <a href="${job.url}">Apply</a>\n\n`;
        });
    }

    if (csvData) {
        message += `\n📄 <i>Full details in attached CSV file</i>`;
    }

    message += `\n📈 <i>Keep applying! Your next opportunity is waiting.</i>`;

    // Send text message
    console.log('📤 Sending text message to Telegram...');
    const textResult = await sendTelegramMessage('job', {
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
    });
    console.log(`✅ Text message sent: ${textResult.success ? 'SUCCESS' : 'FAILED'}`);

    // Send CSV file if available
    if (csvData) {
        console.log('📤 Sending CSV file to Telegram...');
        const timestamp = new Date().toISOString().split('T')[0];
        const csvResult = await sendTelegramDocument(
            'job',
            {
                filename: `jobs_${timestamp}.csv`,
                content: csvData,
            },
            `📊 Complete job search results (${jobs.length} jobs)`
        );
        console.log(`✅ CSV file sent: ${csvResult.success ? 'SUCCESS' : 'FAILED'}${csvResult.error ? ` - ${csvResult.error}` : ''}`);
    } else {
        console.log('⚠️ No CSV data to send');
    }
}

export async function notifyAgentRun(
    agentType: 'job' | 'twitter' | 'github' | 'web',
    result: {
        agentName: string;
        status: 'success' | 'error';
        summary: string;
        duration?: string;
        error?: string;
    }
): Promise<void> {
    const emoji = result.status === 'success' ? '✅' : '❌';
    const statusText = result.status === 'success' ? 'SUCCESS' : 'FAILED';

    let message = `${emoji} <b>${result.agentName}</b> - ${statusText}\n\n`;
    message += `📝 <b>Summary:</b>\n${result.summary}\n\n`;

    if (result.duration) {
        message += `⏱️ Duration: ${result.duration}\n`;
    }

    if (result.error) {
        message += `\n❌ <b>Error:</b>\n<code>${result.error}</code>\n`;
    }

    message += `\n🕐 ${new Date().toLocaleString()}`;

    await sendTelegramMessage(agentType, {
        text: message,
        parse_mode: 'HTML',
    });
}

export async function notifyTweetPosted(
    tweetText: string,
    tweetUrl: string,
    engagement: number
): Promise<void> {
    const message =
        `🐦 <b>Tweet Posted Successfully!</b>

📝 <b>Content:</b>
${tweetText}

🎯 <b>Predicted Engagement:</b> ${engagement}/100
🔗 <b>View:</b> ${tweetUrl}

🕐 ${new Date().toLocaleString()}`;

    await sendTelegramMessage('twitter', {
        text: message,
        parse_mode: 'HTML',
    });
}

export async function notifyError(
    agentType: 'job' | 'twitter' | 'github' | 'web',
    errorMessage: string,
    context?: string
): Promise<void> {
    let message = `❌ <b>Agent Error</b>\n\n`;
    if (context) message += `📍 <b>Context:</b> ${context}\n\n`;
    message += `🐛 <b>Error:</b>\n<code>${errorMessage}</code>\n\n`;
    message += `🕐 ${new Date().toLocaleString()}`;

    await sendTelegramMessage(agentType, {
        text: message,
        parse_mode: 'HTML',
    });
}

// Test function to verify bot connection
export async function testTelegramBot(
    agentType: 'job' | 'twitter' | 'github' | 'web'
): Promise<{ success: boolean; botInfo?: any; error?: string }> {
    const botToken = getBotToken(agentType);

    if (!botToken) {
        return { success: false, error: `No bot token for ${agentType}` };
    }

    try {
        const url = `https://api.telegram.org/bot${botToken}/getMe`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || !data.ok) {
            return { success: false, error: data.description || 'Bot not found' };
        }

        return { success: true, botInfo: data.result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

