import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clear existing agents
    await prisma.agent.deleteMany();

    // Create default agents
    const agents = [
        {
            agentId: 'ai-job-search',
            name: '🎯 AI-Powered Job Matcher',
            description: 'Intelligent job search with resume matching, skill analysis, and PPO detection. Searches LinkedIn, Naukri, and more.',
            icon: '🤖',
            category: 'Job Search',
            status: 'paused', // Default stopped
            schedule: process.env.CRON_JOB_SEARCH || '0 8,12,18 * * *',
            envVars: {
                telegramBotToken: 'TELEGRAM_JOB_AGENT_BOT_TOKEN',
                tools: ['jobSearch', 'websearch'],
            },
        },
        {
            agentId: 'twitter-tech-poster',
            name: '🐦 Twitter Tech Poster',
            description: 'Posts tweets about tech trends, coding tips, and AI insights. Optimized for Twitter v2 API free tier (500 posts/month).',
            icon: '🐦',
            category: 'Social Media',
            status: 'paused',
            // 500 posts/month = ~16 posts/day. Schedule: Every 90 minutes (16 times/day)
            schedule: process.env.CRON_TWITTER || '0 */90 * * *',
            envVars: {
                telegramBotToken: 'TELEGRAM_TWITTER_AGENT_BOT_TOKEN',
                tools: ['twitter', 'websearch'],
                postsPerMonth: 500,
                note: 'Twitter v2 API free tier - 500 posts/month limit',
            },
        },
        {
            agentId: 'tech-news-research',
            name: '📰 AI & Tech News Intelligence',
            description: 'Deep tech research covering OpenAI, Anthropic, Gemini, Meta AI, NVIDIA, Apple Research, Spotify. Includes AI agents, tools, coding resources, and job market insights.',
            icon: '🔬',
            category: 'Research',
            status: 'paused',
            schedule: process.env.CRON_TECH_NEWS || '0 7,19 * * *', // Twice daily
            envVars: {
                telegramBotToken: 'TELEGRAM_NEWS_AGENT_BOT_TOKEN',
                tools: ['websearch'],
                topics: ['AI agents', 'OpenAI updates', 'Anthropic Claude', 'Google Gemini', 'Meta AI', 'NVIDIA AI', 'Apple Research', 'Spotify tech', 'coding tools', 'job market', 'agent frameworks'],
            },
        },
        {
            agentId: 'github-trending',
            name: '⭐ GitHub Trending Tracker',
            description: 'Monitors trending repositories and notifies about relevant projects for learning.',
            icon: '⭐',
            category: 'Development',
            status: 'paused',
            schedule: process.env.CRON_GITHUB || '0 10 * * *',
            envVars: {
                telegramBotToken: 'TELEGRAM_GITHUB_AGENT_BOT_TOKEN',
                tools: ['github', 'websearch'],
            },
        },
        {
            agentId: 'web-research',
            name: '📡 General Web Research',
            description: 'Performs general web research on any topic you specify. Useful for quick information gathering and fact-checking.',
            icon: '🔍',
            category: 'Research',
            status: 'paused',
            schedule: process.env.CRON_WEB_RESEARCH || '0 */6 * * *', // Every 6 hours
            envVars: {
                telegramBotToken: 'TELEGRAM_WEB_AGENT_BOT_TOKEN',
                tools: ['websearch'],
            },
        },
        {
            agentId: 'binocs-sales-agent',
            name: '💼 Binocs.co Sales Intelligence',
            description: 'AI sales agent for Binocs.co - finds ideal clients for CDD, investment reports, and memos. Uses parallel searches (Claude, Tavily, OpenAI) + Lusha for contact enrichment.',
            icon: '🎯',
            category: 'Sales',
            status: 'paused',
            schedule: process.env.CRON_SALES || '0 9 * * 1,3,5', // Mon, Wed, Fri at 9 AM
            envVars: {
                telegramBotToken: 'TELEGRAM_SALES_AGENT_BOT_TOKEN',
                tools: ['websearch', 'lusha'],
                targetMarket: 'Private equity firms, venture capital, family offices, private companies seeking due diligence and investment intelligence',
                productOffering: 'CDD reports, investment memos, due diligence reports, market intelligence',
            },
        },
    ];

    for (const agent of agents) {
        const created = await prisma.agent.create({
            data: agent,
        });
        console.log(`✅ Created agent: ${created.name}`);
    }

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

