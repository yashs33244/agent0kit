import { tool } from 'ai';
import { z } from 'zod';
import fetch from 'node-fetch';

export const githubTool = tool({
    description: 'Get pull requests from a GitHub repository',
    inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
    }),
    execute: async ({ owner, repo }) => {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
            headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
        });
        const data: any = await res.json();
        return data.map((pr: any) => ({
            title: pr.title,
            user: pr.user.login,
            url: pr.html_url,
        }));
    },
});
