import { NextResponse } from 'next/server';
import { testTelegramBot, notifyJobOpportunities } from '@/lib/telegram';

export async function GET() {
    try {
        console.log('🧪 Testing Telegram Bot Configuration...');

        // Test all bot tokens
        const results = {
            job: await testTelegramBot('job'),
            twitter: await testTelegramBot('twitter'),
            github: await testTelegramBot('github'),
            web: await testTelegramBot('web'),
        };

        // Send test notification for job bot if configured
        if (results.job.success) {
            console.log('📨 Sending test job notification...');
            await notifyJobOpportunities([
                {
                    title: 'SDE Intern - Test',
                    company: 'Test Company',
                    location: 'Remote',
                    salary: '₹50,000/month',
                    matchScore: 85,
                    matchedSkills: ['Python', 'React', 'AWS'],
                    url: 'https://example.com',
                    relevanceFactors: ['💰 Good stipend', '🎯 2026 batch', '✅ PPO opportunity'],
                },
            ]);
        }

        return NextResponse.json({
            success: true,
            results,
            environment: {
                TELEGRAM_JOB_AGENT_BOT_TOKEN: !!process.env.TELEGRAM_JOB_AGENT_BOT_TOKEN,
                TELEGRAM_TWITTER_AGENT_BOT_TOKEN: !!process.env.TELEGRAM_TWITTER_AGENT_BOT_TOKEN,
                TELEGRAM_CHAT_ID: !!process.env.TELEGRAM_CHAT_ID,
            },
        });
    } catch (error) {
        console.error('❌ Test failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

