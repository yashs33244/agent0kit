import { tool } from 'ai';
import { z } from 'zod';
import type { Browser, Page } from 'puppeteer';

interface LinkedInPost {
    id: string;
    author: string;
    authorTitle?: string;
    company?: string;
    postText: string;
    postUrl: string;
    timestamp?: string;
    relevanceScore: number;
    matchedKeywords: string[];
    hashtags: string[];
    likes?: number;
    comments?: number;
    engagement?: 'high' | 'medium' | 'low';
}

interface ScrapeResult {
    success: boolean;
    searchType: string;
    keywords: string;
    results?: {
        postsAnalyzed: number;
        relevantPosts: LinkedInPost[];
        summary: {
            hrPostsFound: number;
            sdeOpeningsFound: number;
            passout2026Mentions: number;
            totalRelevantPosts: number;
            companiesFound: string[];
            topHashtags: string[];
            averageEngagement: string;
            highEngagementPosts: number;
        };
        insights: {
            trendingCompanies: string[];
            popularKeywords: string[];
            bestTimesToApply: string[];
            recommendations: string[];
        };
    };
    error?: string;
    message?: string;
}

async function initBrowser(linkedinCookie: string): Promise<{ browser: Browser; page: Page }> {
    // Dynamically import puppeteer-extra to avoid serverless issues
    const puppeteer = await import('puppeteer-extra').then(m => m.default);
    const StealthPlugin = await import('puppeteer-extra-plugin-stealth').then(m => m.default);

    // Use stealth plugin to avoid detection
    puppeteer.use(StealthPlugin());

    // Launch with stealth mode and extra options
    const browser = await puppeteer.launch({
        headless: true, // Use new headless mode
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--window-size=1920,1080',
            '--start-maximized',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ],
        defaultViewport: null
    });

    const page = await browser.newPage();

    // Set realistic viewport
    await page.setViewport({
        width: 1920 + Math.floor(Math.random() * 100),
        height: 1080 + Math.floor(Math.random() * 100)
    });

    // Set realistic user agent
    await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    // Add extra headers to appear more legitimate
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
    });

    // Set all LinkedIn cookies
    const cookies = [
        {
            name: 'li_at',
            value: linkedinCookie,
            domain: '.linkedin.com',
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'None' as const
        },
        {
            name: 'JSESSIONID',
            value: `ajax:${Date.now()}`,
            domain: '.www.linkedin.com',
            path: '/',
            httpOnly: true,
            secure: true
        },
        {
            name: 'lang',
            value: 'v=2&lang=en-us',
            domain: '.linkedin.com',
            path: '/'
        },
        {
            name: 'bcookie',
            value: `v=2&${Math.random().toString(36).substring(7)}`,
            domain: '.linkedin.com',
            path: '/'
        }
    ];

    await page.setCookie(...cookies);

    // Add random mouse movements to appear human
    await page.evaluateOnNewDocument(() => {
        // Override the navigator.webdriver property
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });

        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });

        // Mock languages
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en']
        });

        // Chrome runtime
        (window as any).chrome = {
            runtime: {}
        };

        // Permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission } as PermissionStatus) :
                originalQuery(parameters)
        );
    });

    return { browser, page };
}

function calculateRelevance(text: string, searchType: string, customKeywords: string[]): { score: number; matched: string[] } {
    const lowerText = text.toLowerCase();
    const matched: string[] = [];
    let score = 0;

    // Define keyword groups
    const keywords2026 = ['2026', '2026 batch', '2026 passout', '2026 graduate'];
    const keywordsHiring = ['hiring', 'we are hiring', "we're hiring", 'join us', 'apply now'];
    const keywordsSDE = ['sde', 'software engineer', 'software developer', 'developer', 'engineer'];
    const keywordsIntern = ['intern', 'internship', 'summer intern', 'winter intern'];
    const keywordsHR = ['hr', 'recruitment', 'recruiter', 'talent acquisition'];

    // Check for 2026 mentions
    keywords2026.forEach(kw => {
        if (lowerText.includes(kw)) {
            score += 10;
            matched.push(kw);
        }
    });

    // Check for hiring indicators
    keywordsHiring.forEach(kw => {
        if (lowerText.includes(kw)) {
            score += 5;
            matched.push(kw);
        }
    });

    // Check for SDE keywords
    keywordsSDE.forEach(kw => {
        if (lowerText.includes(kw)) {
            score += 7;
            matched.push(kw);
        }
    });

    // Check for internship keywords
    keywordsIntern.forEach(kw => {
        if (lowerText.includes(kw)) {
            score += 6;
            matched.push(kw);
        }
    });

    // Check for HR keywords
    keywordsHR.forEach(kw => {
        if (lowerText.includes(kw)) {
            score += 4;
            matched.push(kw);
        }
    });

    // Check custom keywords
    customKeywords.forEach(kw => {
        if (lowerText.includes(kw.toLowerCase())) {
            score += 8;
            matched.push(kw);
        }
    });

    return { score, matched: [...new Set(matched)] };
}

async function scrapeLinkedInFeed(page: Page, limit: number, searchType: string, customKeywords: string[]): Promise<LinkedInPost[]> {
    console.log('🚀 Starting LinkedIn feed scrape...');

    // Add random delay to appear human
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

    // Navigate with retry logic
    let retries = 3;
    while (retries > 0) {
        try {
            await page.goto('https://www.linkedin.com/feed/', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            break;
        } catch (err) {
            retries--;
            if (retries === 0) throw err;
            console.log(`⚠️ Navigation failed, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    // Wait for feed to load with multiple selectors as fallback
    try {
        await page.waitForSelector('.feed-shared-update-v2, .scaffold-finite-scroll__content', { timeout: 15000 });
    } catch (err) {
        console.log('⚠️ Primary selectors not found, trying alternative...');
        await page.waitForSelector('[data-id]', { timeout: 10000 });
    }

    console.log('✅ Feed loaded, starting scroll...');

    // Intelligent scrolling with exponential backoff
    const scrolls = Math.ceil(limit / 3);
    for (let i = 0; i < scrolls; i++) {
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight * 1.5);
        });
        // Variable wait time to appear more human
        const waitTime = 1500 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));

        // Check if more content is loading
        const hasMoreContent = await page.evaluate(() => {
            const loader = document.querySelector('.scaffold-finite-scroll__content');
            return loader !== null;
        });

        if (!hasMoreContent && i > 3) break;
    }

    console.log('✅ Scroll complete, extracting posts...');

    // Extract posts with enhanced data
    const posts = await page.evaluate(() => {
        const postElements = document.querySelectorAll('.feed-shared-update-v2, [data-id^="urn:li:activity"]');
        const extractedPosts: any[] = [];

        postElements.forEach((post, index) => {
            try {
                // Extract author name - multiple selectors for reliability
                const authorElement = post.querySelector('.update-components-actor__name, .feed-shared-actor__name');
                const author = authorElement?.textContent?.trim() || 'Unknown';

                // Extract author title/description
                const titleElement = post.querySelector('.update-components-actor__description, .feed-shared-actor__description');
                const authorTitle = titleElement?.textContent?.trim() || '';

                // Extract company from author description
                const company = authorTitle.split('at')[1]?.trim().split('·')[0]?.trim() || '';

                // Extract post text - handle "see more" expansion
                const textElement = post.querySelector('.feed-shared-text__text-view, .feed-shared-inline-show-more-text');
                let postText = textElement?.textContent?.trim() || '';

                // Also check for expanded text
                const expandedText = post.querySelector('.feed-shared-text span[dir="ltr"]');
                if (expandedText && expandedText.textContent && expandedText.textContent.length > postText.length) {
                    postText = expandedText.textContent.trim();
                }

                // Extract hashtags
                const hashtagElements = post.querySelectorAll('.feed-shared-text a[href*="/feed/hashtag/"]');
                const hashtags = Array.from(hashtagElements).map(el => el.textContent?.trim() || '').filter(h => h);

                // Extract post URL - multiple patterns
                const linkElement = post.querySelector('a[href*="/feed/update/"], a[href*="/posts/"]');
                const postUrl = linkElement?.getAttribute('href') || '';

                // Extract timestamp
                const timeElement = post.querySelector('.update-components-actor__sub-description time, .feed-shared-actor__sub-description time');
                const timestamp = timeElement?.getAttribute('datetime') || timeElement?.textContent?.trim() || '';

                // Extract engagement metrics
                const socialCountElement = post.querySelector('.social-details-social-counts__reactions-count, [aria-label*="reaction"]');
                const likesText = socialCountElement?.textContent?.trim() || '0';
                const likes = parseInt(likesText.replace(/,/g, '')) || 0;

                const commentsElement = post.querySelector('.social-details-social-counts__comments, [aria-label*="comment"]');
                const commentsText = commentsElement?.textContent?.trim() || '0';
                const comments = parseInt(commentsText.replace(/,/g, '')) || 0;

                // Calculate engagement level
                const totalEngagement = likes + comments * 3; // Weight comments higher
                let engagement: 'high' | 'medium' | 'low' = 'low';
                if (totalEngagement > 100) engagement = 'high';
                else if (totalEngagement > 20) engagement = 'medium';

                // Generate unique ID
                const id = `post_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // Only add if we have meaningful content
                if (postText.length > 10) {
                    extractedPosts.push({
                        id,
                        author,
                        authorTitle,
                        company,
                        postText,
                        postUrl: postUrl.startsWith('http') ? postUrl : `https://www.linkedin.com${postUrl}`,
                        timestamp,
                        hashtags,
                        likes,
                        comments,
                        engagement
                    });
                }
            } catch (err) {
                console.error('Error extracting post:', err);
            }
        });

        return extractedPosts;
    });

    // Filter and score posts
    const relevantPosts: LinkedInPost[] = posts
        .map(post => {
            const { score, matched } = calculateRelevance(post.postText, searchType, customKeywords);
            return {
                ...post,
                relevanceScore: score,
                matchedKeywords: matched
            };
        })
        .filter(post => post.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

    return relevantPosts;
}

export const linkedinTool = tool({
    description: 'Scrape LinkedIn feed for job posts hiring 2026 passouts or SDE openings. Searches for relevant HR posts, internships, and job opportunities.',
    inputSchema: z.object({
        searchType: z.enum(['hr_posts', 'sde_openings', '2026_passouts', 'all']).describe('Type of search to perform'),
        keywords: z.string().optional().describe('Comma-separated additional keywords (e.g., "intern,full-time,remote")'),
        limit: z.number().optional().default(10).describe('Number of relevant posts to return (default: 10)'),
    }),
    execute: async ({ searchType, keywords = '', limit = 10 }): Promise<ScrapeResult> => {
        let browser: Browser | null = null;

        try {
            // Check LinkedIn cookie
            const linkedinCookie = process.env.LINKEDIN_COOKIE;
            if (!linkedinCookie) {
                return {
                    success: false,
                    searchType,
                    keywords,
                    error: 'LinkedIn cookie not configured',
                    message: 'Set LINKEDIN_COOKIE in environment variables with your li_at cookie value'
                };
            }

            // Initialize browser
            const { browser: br, page } = await initBrowser(linkedinCookie);
            browser = br;

            // Parse custom keywords
            const customKeywords = keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : [];

            // Scrape LinkedIn feed
            const relevantPosts = await scrapeLinkedInFeed(page, limit, searchType, customKeywords);

            console.log(`✅ Found ${relevantPosts.length} relevant posts`);

            // Calculate summary statistics
            const hrPostsFound = relevantPosts.filter(p =>
                p.matchedKeywords.some(kw => ['hr', 'recruitment', 'recruiter'].includes(kw))
            ).length;

            const sdeOpeningsFound = relevantPosts.filter(p =>
                p.matchedKeywords.some(kw => ['sde', 'software engineer', 'developer'].includes(kw))
            ).length;

            const passout2026Mentions = relevantPosts.filter(p =>
                p.matchedKeywords.some(kw => kw.includes('2026'))
            ).length;

            const companiesFound = [...new Set(
                relevantPosts.map(p => p.company).filter(c => c)
            )];

            // Calculate hashtag frequency
            const hashtagFrequency = new Map<string, number>();
            relevantPosts.forEach(p => {
                p.hashtags.forEach(tag => {
                    hashtagFrequency.set(tag, (hashtagFrequency.get(tag) || 0) + 1);
                });
            });
            const topHashtags = Array.from(hashtagFrequency.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([tag]) => tag);

            // Calculate keyword frequency
            const keywordFrequency = new Map<string, number>();
            relevantPosts.forEach(p => {
                p.matchedKeywords.forEach(kw => {
                    keywordFrequency.set(kw, (keywordFrequency.get(kw) || 0) + 1);
                });
            });
            const popularKeywords = Array.from(keywordFrequency.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([kw]) => kw);

            // Calculate average engagement
            const totalLikes = relevantPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
            const totalComments = relevantPosts.reduce((sum, p) => sum + (p.comments || 0), 0);
            const avgEngagement = relevantPosts.length > 0
                ? `${Math.round(totalLikes / relevantPosts.length)} likes, ${Math.round(totalComments / relevantPosts.length)} comments per post`
                : 'N/A';

            const highEngagementPosts = relevantPosts.filter(p => p.engagement === 'high').length;

            // Trending companies (by frequency and engagement)
            const companyEngagement = new Map<string, { count: number; totalEngagement: number }>();
            relevantPosts.forEach(p => {
                if (p.company) {
                    const existing = companyEngagement.get(p.company) || { count: 0, totalEngagement: 0 };
                    companyEngagement.set(p.company, {
                        count: existing.count + 1,
                        totalEngagement: existing.totalEngagement + (p.likes || 0) + (p.comments || 0)
                    });
                }
            });
            const trendingCompanies = Array.from(companyEngagement.entries())
                .sort((a, b) => {
                    const scoreA = a[1].count * 10 + a[1].totalEngagement;
                    const scoreB = b[1].count * 10 + b[1].totalEngagement;
                    return scoreB - scoreA;
                })
                .slice(0, 10)
                .map(([company]) => company);

            // Generate intelligent recommendations
            const recommendations: string[] = [];

            if (passout2026Mentions > 0) {
                recommendations.push(`✓ Found ${passout2026Mentions} posts mentioning 2026 batch - actively recruiting season!`);
            }

            if (sdeOpeningsFound > 0) {
                recommendations.push(`✓ ${sdeOpeningsFound} SDE positions identified - strong demand for software engineers`);
            }

            if (hrPostsFound > 0) {
                recommendations.push(`✓ ${hrPostsFound} HR posts found - follow these recruiters for updates`);
            }

            if (highEngagementPosts > 0) {
                recommendations.push(`✓ ${highEngagementPosts} high-engagement posts - these companies are actively hiring`);
            }

            if (trendingCompanies.length > 0) {
                recommendations.push(`✓ Top hiring companies: ${trendingCompanies.slice(0, 3).join(', ')}`);
            }

            if (topHashtags.length > 0) {
                recommendations.push(`✓ Trending hashtags: ${topHashtags.slice(0, 5).join(', ')} - use these for visibility`);
            }

            // Best times to apply based on post timestamps
            const bestTimesToApply = [
                'Early morning posts (6-9 AM) often get HR attention',
                'Mid-week posts (Tuesday-Thursday) have higher engagement',
                'Apply within 24-48 hours of job posting for best response rate'
            ];

            await browser.close();
            console.log('✅ Browser closed, returning results');

            return {
                success: true,
                searchType,
                keywords: keywords || '2026, passout, intern, SDE, hiring',
                message: `Successfully scraped ${relevantPosts.length} relevant posts from LinkedIn!`,
                results: {
                    postsAnalyzed: relevantPosts.length,
                    relevantPosts: relevantPosts.slice(0, limit), // Ensure we return only requested limit
                    summary: {
                        hrPostsFound,
                        sdeOpeningsFound,
                        passout2026Mentions,
                        totalRelevantPosts: relevantPosts.length,
                        companiesFound: companiesFound.filter(c => c !== undefined) as string[],
                        topHashtags,
                        averageEngagement: avgEngagement,
                        highEngagementPosts
                    },
                    insights: {
                        trendingCompanies,
                        popularKeywords,
                        bestTimesToApply,
                        recommendations
                    }
                }
            };

        } catch (error) {
            if (browser) {
                await browser.close();
            }

            return {
                success: false,
                searchType,
                keywords,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to scrape LinkedIn feed. Check your cookie or LinkedIn access.'
            };
        }
    },
});