import { tool } from 'ai';
import { z } from 'zod';
import { tvly } from '@/lib/ai/client';

export const webSearchTool = tool({
    description: `Search the web for current information, news, or answers to questions. 
    Returns results with citations and source URLs.
    Use this when you need up-to-date information not in your training data.`,
    inputSchema: z.object({
        query: z.string().describe('The search query to look up on the web'),
        maxResults: z.number().optional().describe('Maximum number of results to return (default: 5)'),
    }),
    execute: async ({ query, maxResults = 5 }) => {
        try {
            console.log(`🔍 Web searching: "${query}"`);
            
            const results = await tvly.search(query, {
                maxResults,
                includeAnswer: true,
                includeRawContent: false,
            });

            // Format results with clear citations
            const formattedResults = results.results?.map((result: any, index: number) => ({
                position: index + 1,
                title: result.title,
                url: result.url,
                snippet: result.content,
                score: result.score,
            })) || [];

            // Create citation list
            const citations = formattedResults.map((r: any) => 
                `[${r.position}] ${r.title}\n    ${r.url}`
            ).join('\n\n');

            console.log(`✅ Found ${formattedResults.length} results`);

            return {
                success: true,
                query,
                answer: results.answer || 'No direct answer available',
                resultsCount: formattedResults.length,
                results: formattedResults,
                citations: `\n\n📚 **Sources:**\n${citations}`,
                searchMetadata: {
                    timestamp: new Date().toISOString(),
                    provider: 'Tavily',
                    maxResults,
                },
            };
        } catch (error) {
            console.error('❌ Web search failed:', error);
            return {
                success: false,
                query,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                resultsCount: 0,
                results: [],
            };
        }
    },
});