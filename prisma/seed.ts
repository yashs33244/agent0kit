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
            description: 'Posts tweets about latest tech trends, coding tips, and DevOps insights automatically.',
            icon: '🐦',
            category: 'Social Media',
            status: 'paused',
            schedule: process.env.CRON_TWITTER || '0 8,14,20 * * *',
            envVars: {
                telegramBotToken: 'TELEGRAM_TWITTER_AGENT_BOT_TOKEN',
                tools: ['twitter', 'websearch'],
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
            name: '📰 Tech News Aggregator',
            description: 'Searches for latest tech news and compiles a daily digest of important updates.',
            icon: '📰',
            category: 'Research',
            status: 'paused',
            schedule: process.env.CRON_WEB_RESEARCH || '0 7 * * *',
            envVars: {
                telegramBotToken: 'TELEGRAM_WEB_AGENT_BOT_TOKEN',
                tools: ['websearch'],
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

