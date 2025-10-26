import { githubTool } from '@/app/api/tools/github';
import { webSearchTool } from '@/app/api/tools/webSearch';
import { twitterTool } from '@/app/api/tools/twitter';
import { jobSearchTool } from '@/app/api/tools/jobSearch';
import { lushaTool } from '@/app/api/tools/lusha';

export const allTools = {
    github: githubTool,
    websearch: webSearchTool,
    twitter: twitterTool,
    jobSearch: jobSearchTool,
    lusha: lushaTool,
};
