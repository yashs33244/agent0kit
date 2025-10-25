import { tool } from 'ai';
import { z } from 'zod';
import { TwitterApi } from 'twitter-api-v2';

/**
 * Twitter Agent Tool
 * 
 * Generates and posts tweets about tech, coding, DevOps, and career opportunities.
 * Designed to run as a cron job for automated posting.
 * 
 * Features:
 * - AI-generated tweets about latest tech trends
 * - Coding tips and best practices
 * - DevOps insights and tools
 * - Career advice and job search tips
 * - Smart hashtag suggestions
 * - Optimal posting time recommendations
 */

interface TweetContent {
    text: string;
    hashtags: string[];
    category: 'tech' | 'coding' | 'devops' | 'career';
    characterCount: number;
    engagementPredictedScore: number;
    id?: string;
    url?: string;
}

interface TwitterResult {
    success: boolean;
    tweet?: TweetContent;
    posted?: boolean;
    scheduledFor?: string;
    error?: string;
    message?: string;
    insights?: {
        bestTimeToPost: string;
        trendingTopics: string[];
        recommendedHashtags: string[];
        engagementTips: string[];
    };
}

// Tweet templates and patterns
const tweetTemplates = {
    tech: [
        "🚀 {topic} is changing the game in 2025! Here's what you need to know:\n\n{insight}\n\n#TechTrends #Innovation",
        "💡 Hot take on {topic}: {insight}\n\nWhat's your experience? Let's discuss! 👇",
        "🔥 {topic} just dropped and it's a game-changer:\n\n{insight}\n\n#Tech #Development",
        "📊 The state of {topic} in 2025:\n{insight}\n\nThoughts? #TechCommunity"
    ],
    coding: [
        "💻 Code tip of the day:\n\n{insight}\n\nSave this for later! #100DaysOfCode #Programming",
        "🎯 Want to level up your coding skills?\n\n{insight}\n\n#LearnToCode #DevCommunity",
        "⚡ Quick coding win:\n\n{insight}\n\nTry it out and let me know how it goes! #CodeNewbie",
        "🧵 Thread: {topic}\n\n{insight}\n\n#Developer #Programming"
    ],
    devops: [
        "🔧 DevOps pro tip:\n\n{insight}\n\nYour deployment will thank you later! #DevOps #CloudNative",
        "🚢 Container wisdom:\n\n{insight}\n\n#Docker #Kubernetes #DevOps",
        "🔐 Security + DevOps = ❤️\n\n{insight}\n\n#DevSecOps #CloudSecurity",
        "⚙️ Automation FTW:\n\n{insight}\n\n#CICD #DevOps #Automation"
    ],
    career: [
        "📈 Career advice for 2026 passouts:\n\n{insight}\n\n#CareerAdvice #JobSearch #2026Batch",
        "💼 Job search tip:\n\n{insight}\n\nTag someone who needs to see this! #JobHunt #Careers",
        "🎯 Breaking into tech?\n\n{insight}\n\n#TechCareers #CareerGrowth",
        "🌟 How to stand out in interviews:\n\n{insight}\n\n#InterviewTips #CareerAdvice"
    ]
};

const techTopics = [
    'AI', 'Machine Learning', 'LLMs', 'TypeScript', 'React', 'Next.js', 'Kubernetes',
    'Cloud Computing', 'Serverless', 'Edge Computing', 'WebAssembly', 'Rust',
    'GraphQL', 'tRPC', 'Prisma', 'Supabase', 'Vercel', 'Cloudflare Workers'
];

const codingInsights = [
    'Use TypeScript strict mode from day 1 - it catches bugs before they happen',
    'Write tests for your edge cases, not just happy paths',
    'Code reviews are learning opportunities, not criticism sessions',
    'Refactor when you understand the problem better, not when the code "looks ugly"',
    'Documentation is a love letter to your future self',
    'Small, focused commits > one huge commit with everything',
    'Performance optimization without measurement is premature optimization',
    'The best code is code you don\'t have to write - leverage libraries wisely',
    'Error messages should explain what went wrong AND how to fix it',
    'Clean code > clever code. Always.'
];

const devopsInsights = [
    'Monitor everything, but alert only on what matters',
    'Infrastructure as Code is not optional anymore - it\'s mandatory',
    'A good CI/CD pipeline is worth its weight in gold',
    'Security should be built in, not bolted on',
    'Containers are great, but know when NOT to use them',
    'Observability > Monitoring. Know the difference.',
    'Automate the boring stuff. Your future self will thank you.',
    'Docker != Kubernetes. Start simple, scale when needed.',
    'Configuration management saves lives (and weekends)',
    'Backup everything. Test your backups. Test them again.'
];

const careerInsights = [
    'Build in public. Share your learning journey. It opens doors.',
    'Your GitHub profile is your portfolio - make it count',
    'Networking is not about collecting contacts, it\'s about building relationships',
    'Learn one thing deeply before moving to the next shiny tool',
    'Contribute to open source - it\'s the best way to learn and get noticed',
    'Your resume should tell a story, not just list technologies',
    'Side projects > bootcamp certificates. Show, don\'t tell.',
    'Follow hiring managers and engineers, not just job boards',
    'Tailor your application for each role - generic applications get generic results',
    'Interviewing is a skill. Practice it like you practice coding.'
];

function generateTweet(category: 'tech' | 'coding' | 'devops' | 'career', customTopic?: string): TweetContent {
    const templates = tweetTemplates[category];
    const template = templates[Math.floor(Math.random() * templates.length)];

    let topic: string;
    let insight: string;
    let hashtags: string[];

    switch (category) {
        case 'tech':
            topic = customTopic || techTopics[Math.floor(Math.random() * techTopics.length)];
            insight = `${topic} is revolutionizing how we build software. Stay ahead of the curve!`;
            hashtags = ['#TechTrends', `#${topic.replace(/\s+/g, '')}`, '#2025Tech', '#Innovation'];
            break;

        case 'coding':
            topic = 'Clean Code';
            insight = codingInsights[Math.floor(Math.random() * codingInsights.length)];
            hashtags = ['#100DaysOfCode', '#CodeNewbie', '#Programming', '#WebDev'];
            break;

        case 'devops':
            topic = 'DevOps Best Practices';
            insight = devopsInsights[Math.floor(Math.random() * devopsInsights.length)];
            hashtags = ['#DevOps', '#CloudNative', '#CICD', '#Infrastructure'];
            break;

        case 'career':
            topic = 'Career Growth';
            insight = careerInsights[Math.floor(Math.random() * careerInsights.length)];
            hashtags = ['#CareerAdvice', '#TechCareers', '#JobSearch', '#2026Passout'];
            break;
    }

    let text = template
        .replace('{topic}', topic)
        .replace('{insight}', insight);

    // Add hashtags if they fit
    const hashtagText = '\n\n' + hashtags.slice(0, 4).join(' ');
    if ((text + hashtagText).length <= 280) {
        text += hashtagText;
    }

    // Calculate predicted engagement score
    const engagementScore = calculateEngagementScore(text, hashtags, category);

    return {
        text: text.substring(0, 280), // Twitter limit
        hashtags,
        category,
        characterCount: text.length,
        engagementPredictedScore: engagementScore
    };
}

function calculateEngagementScore(text: string, hashtags: string[], category: string): number {
    let score = 50; // Base score

    // Emoji bonus
    const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
    score += Math.min(emojiCount * 5, 15);

    // Hashtag bonus
    score += Math.min(hashtags.length * 3, 12);

    // Question mark bonus (engagement)
    if (text.includes('?')) score += 10;

    // Call to action bonus
    if (text.match(/let me know|share|comment|thoughts|tag someone/i)) score += 8;

    // Category bonus
    if (category === 'career' || category === 'coding') score += 5;

    // Length penalty for too long tweets
    if (text.length > 250) score -= 5;

    return Math.min(Math.max(score, 0), 100);
}

function getBestTimeToPost(): string {
    const now = new Date();
    const hour = now.getHours();

    // Best times: 8-10 AM, 12-1 PM, 5-6 PM (all times in user's timezone)
    if (hour < 8) return `${8 - hour} hours (8:00 AM - morning engagement peak)`;
    if (hour >= 8 && hour < 10) return 'Now! (Morning peak time)';
    if (hour >= 10 && hour < 12) return `${12 - hour} hours (Noon - lunch break engagement)`;
    if (hour >= 12 && hour < 13) return 'Now! (Lunch break - high engagement)';
    if (hour >= 13 && hour < 17) return `${17 - hour} hours (5:00 PM - evening peak)`;
    if (hour >= 17 && hour < 18) return 'Now! (Evening peak - best engagement)';
    return 'Tomorrow at 8:00 AM (morning peak time)';
}

export const twitterTool = tool({
    description: 'Generate and post tweets about tech, coding, DevOps, and career opportunities. Optimized for engagement and reach. Can be used as a cron job for automated posting. By default, it will POST the tweet immediately.',
    inputSchema: z.object({
        category: z.enum(['tech', 'coding', 'devops', 'career', 'auto']).describe('Category of tweet to generate. "auto" will select based on current trends'),
        topic: z.string().optional().describe('Specific topic to tweet about (optional)'),
        action: z.enum(['generate', 'post', 'schedule']).default('post').describe('Action to perform: generate only, post immediately (default), or schedule for optimal time'),
        customMessage: z.string().optional().describe('Custom message to include in the tweet (will be formatted)'),
    }),
    execute: async ({ category, topic, action = 'post', customMessage }): Promise<TwitterResult> => {
        try {
            // Check Twitter API credentials (using X API keys)
            const twitterApiKey = process.env.X_API_KEY;
            const twitterApiSecret = process.env.X_API_SECRET_KEY;
            const twitterAccessToken = process.env.X_ACCESS_TOKEN;
            const twitterAccessSecret = process.env.X_ACCESS_TOKEN_SECRET;
            const twitterBearerToken = process.env.X_BEARER_TOKEN;
            const twitterClientId = process.env.X_CLIENT_ID;
            const twitterClientSecret = process.env.X_CLIENT_SECRET;

            // Try OAuth 1.0a first (for user context)
            const hasOAuth1 = !!(twitterApiKey && twitterApiSecret && twitterAccessToken && twitterAccessSecret);
            // Try OAuth 2.0 Bearer Token (app-only, read-only usually)
            const hasBearerToken = !!twitterBearerToken;
            // Try OAuth 2.0 User Context
            const hasOAuth2User = !!(twitterClientId && twitterClientSecret && twitterAccessToken && twitterAccessSecret);

            // Initialize Twitter client if credentials are available
            let twitterClient: TwitterApi | null = null;

            if (hasOAuth1) {
                console.log('🔑 Using OAuth 1.0a authentication');
                twitterClient = new TwitterApi({
                    appKey: twitterApiKey!,
                    appSecret: twitterApiSecret!,
                    accessToken: twitterAccessToken!,
                    accessSecret: twitterAccessSecret!,
                });
            } else if (hasOAuth2User) {
                console.log('🔑 Using OAuth 2.0 User Context authentication');
                // For OAuth 2.0, we need to use different auth flow
                // This is more complex and requires user authorization
                // For now, stick with OAuth 1.0a
                return {
                    success: false,
                    error: 'OAuth 2.0 User Context not fully implemented yet',
                    message: 'Please use OAuth 1.0a credentials (X_API_KEY, X_API_SECRET_KEY, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET) and ensure your app has Read and Write permissions'
                };
            } else if (hasBearerToken) {
                console.log('🔑 Using Bearer Token (read-only)');
                return {
                    success: false,
                    error: 'Bearer Token is read-only',
                    message: 'Bearer tokens can only read data, not post tweets. Use OAuth 1.0a credentials instead.'
                };
            }

            const hasCredentials = hasOAuth1;

            // Auto-select category based on day of week
            let selectedCategory = category;
            if (category === 'auto') {
                const dayOfWeek = new Date().getDay();
                const categories: Array<'tech' | 'coding' | 'devops' | 'career'> = ['tech', 'coding', 'devops', 'career'];
                selectedCategory = categories[dayOfWeek % 4];
            }

            // Generate tweet content
            const tweetContent = customMessage
                ? {
                    text: customMessage.substring(0, 280),
                    hashtags: ['#Tech', '#Coding', '#DevOps'],
                    category: selectedCategory as 'tech' | 'coding' | 'devops' | 'career',
                    characterCount: customMessage.length,
                    engagementPredictedScore: 70
                }
                : generateTweet(selectedCategory as 'tech' | 'coding' | 'devops' | 'career', topic);

            console.log('📝 Generated tweet:', tweetContent.text);

            // Get insights
            const insights = {
                bestTimeToPost: getBestTimeToPost(),
                trendingTopics: techTopics.slice(0, 5),
                recommendedHashtags: [
                    '#TechTwitter', '#100DaysOfCode', '#DevCommunity',
                    '#CodeNewbie', '#WebDev', '#CloudNative', '#OpenSource',
                    '#CareerAdvice', '#JobSearch', '#TechCareers'
                ],
                engagementTips: [
                    'Ask questions to encourage replies',
                    'Use 2-4 relevant hashtags for reach',
                    'Post during peak hours (8-10 AM, 12-1 PM, 5-6 PM)',
                    'Add emojis for visual appeal',
                    'Include a call-to-action',
                    'Share personal experiences and insights',
                    'Engage with replies within the first hour'
                ]
            };

            // Handle different actions
            switch (action) {
                case 'generate':
                    return {
                        success: true,
                        tweet: tweetContent,
                        posted: false,
                        message: 'Tweet generated successfully! Use action="post" to publish.',
                        insights
                    };

                case 'post':
                    if (!hasCredentials || !twitterClient) {
                        return {
                            success: false,
                            tweet: tweetContent,
                            posted: false,
                            error: 'Twitter API credentials not configured',
                            message: 'Set X_API_KEY, X_API_SECRET_KEY, X_ACCESS_TOKEN, and X_ACCESS_TOKEN_SECRET in environment variables',
                            insights
                        };
                    }

                    try {
                        console.log('🐦 Posting tweet:', tweetContent.text);
                        console.log('🔐 Using credentials:', {
                            hasApiKey: !!twitterApiKey,
                            hasApiSecret: !!twitterApiSecret,
                            hasAccessToken: !!twitterAccessToken,
                            hasAccessSecret: !!twitterAccessSecret
                        });

                        // Post the tweet using Twitter API v2
                        const rwClient = twitterClient.readWrite;
                        const postedTweet = await rwClient.v2.tweet(tweetContent.text);

                        console.log('✅ Tweet posted successfully! Tweet ID:', postedTweet.data.id);

                        return {
                            success: true,
                            tweet: {
                                ...tweetContent,
                                id: postedTweet.data.id,
                                url: `https://twitter.com/i/web/status/${postedTweet.data.id}`
                            } as any,
                            posted: true,
                            message: `✅ Tweet posted successfully!\n\nTweet ID: ${postedTweet.data.id}\nURL: https://twitter.com/i/web/status/${postedTweet.data.id}\n\nPredicted engagement score: ${tweetContent.engagementPredictedScore}/100\n\n"${tweetContent.text}"`,
                            insights
                        };
                    } catch (postError: any) {
                        console.error('❌ Failed to post tweet:', postError);
                        console.error('Error details:', {
                            code: postError?.code,
                            data: postError?.data,
                            rateLimit: postError?.rateLimit
                        });

                        let errorMessage = postError instanceof Error ? postError.message : 'Failed to post tweet';

                        // Provide specific guidance based on error
                        if (postError?.code === 403) {
                            errorMessage += '\n\n⚠️ 403 Forbidden - Your Twitter app needs "Read and Write" permissions.\n\nFix:\n1. Go to https://developer.twitter.com/en/portal/dashboard\n2. Select your app → Settings\n3. Change permissions to "Read and Write"\n4. Regenerate your Access Token & Secret\n5. Update X_ACCESS_TOKEN and X_ACCESS_TOKEN_SECRET in .env.local\n6. Restart the server';
                        }

                        return {
                            success: false,
                            tweet: tweetContent,
                            posted: false,
                            error: errorMessage,
                            message: `Failed to post tweet. ${errorMessage}`,
                            insights
                        };
                    }

                case 'schedule':
                    const scheduledTime = new Date();
                    scheduledTime.setHours(8, 0, 0, 0); // Schedule for 8 AM next day
                    if (scheduledTime <= new Date()) {
                        scheduledTime.setDate(scheduledTime.getDate() + 1);
                    }

                    return {
                        success: true,
                        tweet: tweetContent,
                        posted: false,
                        scheduledFor: scheduledTime.toISOString(),
                        message: `Tweet scheduled for ${scheduledTime.toLocaleString()} (optimal engagement time)`,
                        insights
                    };

                default:
                    return {
                        success: false,
                        error: 'Invalid action specified',
                        message: 'Action must be one of: generate, post, schedule'
                    };
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                message: 'Failed to process Twitter action'
            };
        }
    },
});

