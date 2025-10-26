import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/conversations - List all conversations
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const userId = searchParams.get('userId');

        const conversations = await prisma.conversation.findMany({
            where: userId ? { userId } : undefined,
            orderBy: { updatedAt: 'desc' },
            take: limit,
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
                summary: true,
                _count: {
                    select: { messages: true },
                },
            },
        });

        return NextResponse.json({
            success: true,
            conversations: conversations.map(conv => ({
                id: conv.id,
                userId: conv.userId,
                title: conv.title,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt,
                messageCount: conv._count.messages,
                lastMessage: conv.messages[0]?.content.substring(0, 100),
                hasSummary: !!conv.summary,
            })),
            total: conversations.length,
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch conversations' },
            { status: 500 }
        );
    }
}

// POST /api/conversations - Create new conversation
export async function POST(req: NextRequest) {
    try {
        const { userId, title } = await req.json();

        const conversation = await prisma.conversation.create({
            data: {
                userId,
                title: title || `Chat ${new Date().toLocaleDateString()}`,
            },
        });

        return NextResponse.json({ success: true, conversation });
    } catch (error) {
        console.error('Error creating conversation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create conversation' },
            { status: 500 }
        );
    }
}

