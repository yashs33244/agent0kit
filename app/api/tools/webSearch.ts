import { tool } from 'ai';
import { z } from 'zod';
import { tvly } from '@/lib/ai/client';

export const webSearchTool = tool({
    description: 'Search the web for information. Use this to find current information, news, or answers to questions.',
    inputSchema: z.object({
        query: z.string().describe('The search query to look up on the web'),
    }),
    execute: async ({ query }) => {
        try {
            const results = await tvly.search(query);
            return {
                success: true,
                query,
                results: results,
            };
        } catch (error) {
            return {
                success: false,
                query,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    },
});