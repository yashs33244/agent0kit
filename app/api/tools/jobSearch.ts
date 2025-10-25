import { tool } from 'ai';
import { z } from 'zod';
import { tvly, openaiClient } from '@/lib/ai/client';
import { RESUME_PROFILE } from '@/lib/resume-profile';
import { generateText } from 'ai';

interface JobPosting {
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    salary?: string;
    source: string;
    matchScore: number;
    matchedSkills: string[];
    relevanceFactors: string[];
}

interface JobSearchResult {
    success: boolean;
    searchQuery: string;
    totalJobs: number;
    highMatchJobs: JobPosting[];
    mediumMatchJobs: JobPosting[];
    lowMatchJobs: JobPosting[];
    summary: {
        averageMatchScore: number;
        topSkillsRequired: string[];
        topCompanies: string[];
        recommendedActions: string[];
    };
    citations: string[];
    csvData?: string;
    error?: string;
    message?: string;
}

function generateCSV(jobs: JobPosting[]): string {
    const headers = ['Title', 'Company', 'Location', 'Salary', 'Match Score', 'Matched Skills', 'Relevance Factors', 'URL'];
    const rows = jobs.map(job => [
        job.title.replace(/,/g, ';'),
        job.company.replace(/,/g, ';'),
        job.location.replace(/,/g, ';'),
        job.salary || 'Not specified',
        job.matchScore.toString(),
        job.matchedSkills.join('; '),
        job.relevanceFactors.join('; '),
        job.url,
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
}

async function searchJobsWithTavilyAndOpenAI(searchQuery: string): Promise<any[]> {
    try {
        console.log(`🔍 Searching jobs with Tavily + OpenAI: "${searchQuery}"`);

        // Step 1: Use OpenAI to generate optimized search queries
        const { text: optimizedQueries } = await generateText({
            model: openaiClient,
            prompt: `Generate 5 different job search queries for finding SDE/Software Engineer internships for 2026 passouts in India.
            
Base query: "${searchQuery}"
User skills: ${RESUME_PROFILE.skills.programmingLanguages.join(', ')}

Return ONLY a JSON array of search strings, no explanation:
["query1", "query2", "query3", "query4", "query5"]`,
        });

        let searchQueries: string[];
        try {
            searchQueries = JSON.parse(optimizedQueries);
        } catch {
            // Fallback queries
            searchQueries = [
                `site:linkedin.com/jobs ${searchQuery} 2026 passout intern OR SDE`,
                `site:naukri.com ${searchQuery} 2026 graduate fresher`,
                `site:instahyre.com ${searchQuery} 2026 batch`,
                `site:wellfound.com ${searchQuery} internship 2026`,
                `${searchQuery} internship 2026 passout stipend PPO India`,
            ];
        }

        console.log(`📝 Using ${searchQueries.length} optimized search queries`);

        // Step 2: Search with Tavily using optimized queries
        const allResults: any[] = [];
        const seenUrls = new Set<string>();

        for (const query of searchQueries.slice(0, 5)) {
            try {
                const results = await tvly.search(query, {
                    maxResults: 8,
                    includeAnswer: false,
                    includeRawContent: false,
                });

                if (results.results && results.results.length > 0) {
                    // Deduplicate by URL
                    results.results.forEach((result: any) => {
                        if (!seenUrls.has(result.url)) {
                            seenUrls.add(result.url);
                            allResults.push(result);
                        }
                    });
                }
            } catch (error) {
                console.error(`⚠️ Search failed for: ${query}`, error);
            }
        }

        console.log(`✅ Found ${allResults.length} unique job results`);
        return allResults;
    } catch (error) {
        console.error('❌ Job search failed:', error);
        return [];
    }
}

async function analyzeJobWithOpenAI(result: any, userProfile: typeof RESUME_PROFILE): Promise<{
    matchScore: number;
    matchedSkills: string[];
    relevanceFactors: string[];
} | null> {
    try {
        const { text: analysis } = await generateText({
            model: openaiClient,
            prompt: `Analyze this job posting for a 2026 CSE graduate.

Job Title: ${result.title}
Job Content: ${result.content?.substring(0, 500)}

User Profile:
- Skills: ${userProfile.skills.programmingLanguages.join(', ')}
- Looking for: SDE/Intern roles for 2026 passout
- Preferences: Good stipend (50k+), PPO opportunity, tech stack match

Return ONLY a JSON object:
{
  "matchScore": 0-100,
  "matchedSkills": ["skill1", "skill2"],
  "relevanceFactors": ["factor1", "factor2"],
  "reasoning": "brief explanation"
}`,
        });

        const parsed = JSON.parse(analysis);
        return {
            matchScore: Math.min(Math.max(parsed.matchScore || 50, 0), 100),
            matchedSkills: parsed.matchedSkills || [],
            relevanceFactors: parsed.relevanceFactors || [],
        };
    } catch (error) {
        console.error('⚠️ OpenAI analysis failed, using fallback:', error);
        return null;
    }
}

async function extractJobDetails(result: any, userSkills: string[]): Promise<JobPosting | null> {
    try {
        const title = result.title || '';
        const url = result.url || '';
        const content = result.content || '';

        // Extract company from URL or title
        let company = 'Unknown';
        if (url.includes('linkedin.com')) {
            const match = title.match(/at\s+([^-|]+)/i);
            company = match ? match[1].trim() : 'LinkedIn';
        } else if (url.includes('naukri.com')) {
            company = 'Naukri';
        } else if (url.includes('instahyre.com')) {
            company = 'Instahyre';
        } else {
            const match = title.match(/at\s+([^-|]+)/i);
            company = match ? match[1].trim() : 'See Website';
        }

        // Extract location
        const locationMatch = content.match(/(Bangalore|Mumbai|Delhi|Hyderabad|Pune|Chennai|Remote|Hybrid|Bengaluru|NCR)/i);
        const location = locationMatch ? locationMatch[1] : 'India';

        // Extract salary
        const salaryMatch = content.match(/₹?\s*(\d{1,3}[,.]?\d{0,3})\s*(?:k|K|lakh|LPA|per month|\/month)/i);
        const salary = salaryMatch ? salaryMatch[0] : undefined;

        // Try OpenAI analysis first
        const aiAnalysis = await analyzeJobWithOpenAI(result, RESUME_PROFILE);

        let matchScore: number;
        let matchedSkills: string[];
        let relevanceFactors: string[];

        if (aiAnalysis) {
            // Use OpenAI analysis
            matchScore = aiAnalysis.matchScore;
            matchedSkills = aiAnalysis.matchedSkills;
            relevanceFactors = aiAnalysis.relevanceFactors;
            console.log(`🤖 OpenAI analysis: ${matchScore}/100 for "${title.substring(0, 40)}"`);
        } else {
            // Fallback: Rule-based matching
            matchedSkills = [];
            const contentLower = (title + ' ' + content).toLowerCase();

            userSkills.forEach(skill => {
                if (contentLower.includes(skill.toLowerCase())) {
                    matchedSkills.push(skill);
                }
            });

            const hasRelevantTitle = /intern|sde|software|developer|engineer|graduate/i.test(title);
            const has2026Batch = /2026|passout|fresher|graduate/i.test(content);
            const hasPPO = /ppo|pre.?placement|conversion/i.test(content);
            const hasGoodStipend = /₹\s*[5-9]\d,?\d{3}|lakh|LPA/i.test(content);

            matchScore = 30;
            matchScore += matchedSkills.length * 10;
            if (hasRelevantTitle) matchScore += 15;
            if (has2026Batch) matchScore += 15;
            if (hasPPO) matchScore += 10;
            if (hasGoodStipend) matchScore += 10;
            matchScore = Math.min(matchScore, 100);

            relevanceFactors = [];
            if (has2026Batch) relevanceFactors.push('🎯 2026 Batch');
            if (hasPPO) relevanceFactors.push('✅ PPO Opportunity');
            if (hasGoodStipend) relevanceFactors.push('💰 Good Stipend');
            if (matchedSkills.length >= 3) relevanceFactors.push(`🛠️ ${matchedSkills.length} Skills Match`);
        }

        return {
            title: title.substring(0, 100),
            company,
            location,
            description: content.substring(0, 300),
            url,
            salary,
            source: url.split('/')[2] || 'web',
            matchScore,
            matchedSkills: matchedSkills.slice(0, 5),
            relevanceFactors,
        };
    } catch (error) {
        console.error('❌ Error extracting job details:', error);
        return null;
    }
}

export const jobSearchTool = tool({
    description: `AI-powered job search for 2026 passout internships and SDE roles.
    Searches multiple platforms: LinkedIn, Naukri, Instahyre, Wellfound.
    Provides match scores, skill analysis, and direct application links.
    Focuses on PPO opportunities and competitive compensation.`,
    inputSchema: z.object({
        searchQuery: z.string().describe('Job search query (e.g., "SDE Intern", "Python Developer")'),
        location: z.string().optional().describe('Preferred location (default: India)'),
    }),
    execute: async ({ searchQuery, location = 'India' }) => {
        try {
            console.log(`🎯 Starting AI-powered job search: "${searchQuery}"`);

            // Build enhanced search query
            const enhancedQuery = `${searchQuery} ${location} internship OR SDE 2026 passout`;

            // Search with Tavily + OpenAI
            const searchResults = await searchJobsWithTavilyAndOpenAI(enhancedQuery);

            if (searchResults.length === 0) {
                return {
                    success: false,
                    searchQuery,
                    totalJobs: 0,
                    highMatchJobs: [],
                    mediumMatchJobs: [],
                    lowMatchJobs: [],
                    summary: {
                        averageMatchScore: 0,
                        topSkillsRequired: [],
                        topCompanies: [],
                        recommendedActions: ['Try broader search terms', 'Check job platforms directly'],
                    },
                    citations: [],
                    message: 'No jobs found. Try refining your search.',
                };
            }

            // Extract and analyze jobs
            const userSkills = RESUME_PROFILE.skills.programmingLanguages;

            const jobs: JobPosting[] = [];
            const citations: string[] = [];
            const seenUrls = new Set<string>();

            // Limit to top 15 results for faster analysis
            const topResults = searchResults.slice(0, 15);
            console.log(`🤖 Analyzing top ${topResults.length} jobs with OpenAI (parallel)...`);

            // Parallel processing - analyze all jobs at once
            const jobPromises = topResults
                .filter(result => !seenUrls.has(result.url))
                .map(async (result) => {
                    seenUrls.add(result.url);
                    return await extractJobDetails(result, userSkills);
                });

            const analyzedJobs = await Promise.all(jobPromises);

            // Filter and add to jobs array
            analyzedJobs.forEach((job, index) => {
                if (job && job.matchScore >= 40) {
                    jobs.push(job);
                    citations.push(`[${citations.length + 1}] ${job.title} - ${job.url}`);
                }
            });

            console.log(`✅ Analysis complete: ${jobs.length} qualifying jobs found`);

            // Sort by match score
            jobs.sort((a, b) => b.matchScore - a.matchScore);

            // Categorize jobs
            const highMatchJobs = jobs.filter(j => j.matchScore >= 70);
            const mediumMatchJobs = jobs.filter(j => j.matchScore >= 40 && j.matchScore < 70);
            const lowMatchJobs = jobs.filter(j => j.matchScore < 40);

            // Calculate summary
            const avgScore = jobs.length > 0
                ? Math.round(jobs.reduce((sum, j) => sum + j.matchScore, 0) / jobs.length)
                : 0;

            const allSkills = jobs.flatMap(j => j.matchedSkills);
            const skillCounts = allSkills.reduce((acc, skill) => {
                acc[skill] = (acc[skill] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const topSkills = Object.entries(skillCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([skill]) => skill);

            const companyCounts = jobs.reduce((acc, j) => {
                acc[j.company] = (acc[j.company] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const topCompanies = Object.entries(companyCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([company]) => company);

            const recommendedActions = [
                `Apply to ${highMatchJobs.length} high-match jobs immediately`,
                `Review ${mediumMatchJobs.length} medium-match jobs for backup`,
                'Update resume to highlight: ' + topSkills.slice(0, 3).join(', '),
                'Set up job alerts on LinkedIn and Naukri',
            ];

            // Generate CSV for all jobs
            const csvData = generateCSV(jobs);
            console.log(`📄 Generated CSV with ${jobs.length} jobs`);

            const result: JobSearchResult = {
                success: true,
                searchQuery: enhancedQuery,
                totalJobs: jobs.length,
                highMatchJobs: highMatchJobs.slice(0, 10),
                mediumMatchJobs: mediumMatchJobs.slice(0, 5),
                lowMatchJobs: lowMatchJobs.slice(0, 3),
                summary: {
                    averageMatchScore: avgScore,
                    topSkillsRequired: topSkills,
                    topCompanies,
                    recommendedActions,
                },
                citations,
                csvData,
            };

            console.log(`✅ Job search complete: ${jobs.length} jobs found`);
            console.log(`   High match: ${highMatchJobs.length}`);
            console.log(`   Medium match: ${mediumMatchJobs.length}`);
            console.log(`   Average score: ${avgScore}/100`);

            return result;
        } catch (error) {
            console.error('❌ Job search error:', error);
            return {
                success: false,
                searchQuery,
                totalJobs: 0,
                highMatchJobs: [],
                mediumMatchJobs: [],
                lowMatchJobs: [],
                summary: {
                    averageMatchScore: 0,
                    topSkillsRequired: [],
                    topCompanies: [],
                    recommendedActions: [],
                },
                citations: [],
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to complete job search. Please try again.',
            };
        }
    },
});
