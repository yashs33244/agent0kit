import { NextRequest, NextResponse } from 'next/server';
import { prisma, saveMessage } from '@/lib/prisma';
import { storeMessageEmbedding } from '@/lib/vector-db';

// GET /api/messages?conversationId=xxx&limit=100&offset=0
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'conversationId required' },
        { status: 400 }
      );
    }

    // Get total count
    const totalCount = await prisma.message.count({
      where: { conversationId },
    });

    // Fetch messages with pagination
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    console.log(`📨 Fetched ${messages.length}/${totalCount} messages for conversation ${conversationId}`);

    return NextResponse.json({
      success: true,
      messages,
      total: totalCount,
      limit,
      offset,
      hasMore: offset + messages.length < totalCount,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/messages - Save new message
export async function POST(req: NextRequest) {
  try {
    const { conversationId, role, content, toolCalls, toolResults } = await req.json();

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { success: false, error: 'conversationId, role, and content required' },
        { status: 400 }
      );
    }

    const message = await saveMessage(
      conversationId,
      role,
      content,
      toolCalls,
      toolResults
    );

    // Store embedding asynchronously (don't wait) - only if both OpenAI and Qdrant are configured
    if (process.env.OPENAI_API_KEY && process.env.QDRANT_URL !== 'disabled') {
      storeMessageEmbedding(
        message.id,
        conversationId,
        content,
        role
      ).catch(err => {
        // Silent fail - embedding is optional
        console.log('⚠️ Skipping embedding storage (optional feature)');
      });
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save message' },
      { status: 500 }
    );
  }
}

