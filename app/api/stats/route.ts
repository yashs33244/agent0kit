import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVectorDBStats } from '@/lib/vector-db';
import { getCostSummary, formatCost } from '@/lib/cost-tracker';

// GET /api/stats - Get system statistics
export async function GET() {
  try {
    // Database counts
    const [
      conversationCount,
      messageCount,
      agentRunCount,
      jobCount,
    ] = await Promise.all([
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.agentRun.count(),
      prisma.jobSearchResult.count(),
    ]);

    // Agent stats
    const agentStats = await prisma.agentRun.groupBy({
      by: ['agentId', 'status'],
      _count: true,
    });

    // Recent activity
    const recentRuns = await prisma.agentRun.findMany({
      take: 5,
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        agentId: true,
        status: true,
        startedAt: true,
        duration: true,
      },
    });

    // Job stats
    const jobStats = await prisma.jobSearchResult.aggregate({
      _avg: { matchScore: true },
      _count: { id: true },
      where: { matchScore: { gte: 70 } },
    });

    // Cost stats
    const costSummary = getCostSummary();

    // Vector DB stats
    const vectorStats = await getVectorDBStats().catch(() => null);

    return NextResponse.json({
      success: true,
      database: {
        conversations: conversationCount,
        messages: messageCount,
        agentRuns: agentRunCount,
        jobs: jobCount,
      },
      agents: {
        stats: agentStats,
        recentRuns,
      },
      jobs: {
        highMatchCount: jobStats._count.id,
        avgMatchScore: Math.round(jobStats._avg.matchScore || 0),
      },
      costs: {
        total: formatCost(costSummary.total),
        byService: costSummary.byService,
        requestCount: costSummary.requestCount,
      },
      vectorDB: vectorStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

