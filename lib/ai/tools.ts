import { githubTool } from '@/app/api/tools/github';
import { webSearchTool } from '@/app/api/tools/webSearch';
import { linkedinTool } from '@/app/api/tools/linkedin';
import { twitterTool } from '@/app/api/tools/twitter';

export const allTools = {
    github: githubTool,
    websearch: webSearchTool,
    linkedin: linkedinTool,
    twitter: twitterTool,
};
