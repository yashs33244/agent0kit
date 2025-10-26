'use cache';

import { prisma } from './prisma';

/**
 * Cached function to fetch recent conversations
 * This will be cached by Next.js and revalidated based on cacheLife
 */
export async function getCachedConversations(limit: number = 20) {
    'use cache';
    
    try {
        const conversations = await prisma.conversation.findMany({
            orderBy: { updatedAt: 'desc' },
            take: limit,
            include: {
                _count: {
                    select: { messages: true },
                },
            },
        });

        return {
            success: true,
            conversations: conversations.map(conv => ({
                id: conv.id,
                userId: conv.userId,
                title: conv.title,
                createdAt: conv.createdAt.toISOString(),
                updatedAt: conv.updatedAt.toISOString(),
                messageCount: conv._count.messages,
            })),
        };
    } catch (error) {
        console.error('Error fetching cached conversations:', error);
        return {
            success: false,
            conversations: [],
        };
    }
}

