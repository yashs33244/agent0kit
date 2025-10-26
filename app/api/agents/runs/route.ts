import { NextRequest, NextResponse } from 'next/server';
import { prisma, getAgentRuns } from '@/lib/prisma';

// GET /api/agents/runs?agentId=xxx&limit=10
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'success' | 'error' | 'running'

    const where: any = {};
    if (agentId) where.agentId = agentId;
    if (status) where.status = status;

    const runs = await prisma.agentRun.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        notifications: true,
        agent: {
          select: {
            name: true,
            icon: true,
            category: true,
          },
        },
      },
    });

    // Calculate stats
    const stats = {
      total: runs.length,
      success: runs.filter(r => r.status === 'success').length,
      error: runs.filter(r => r.status === 'error').length,
      running: runs.filter(r => r.status === 'running').length,
      avgDuration: runs.reduce((sum, r) => sum + (r.duration || 0), 0) / runs.length || 0,
    };

    return NextResponse.json({
      success: true,
      runs,
      stats,
    });
  } catch (error) {
    console.error('Error fetching agent runs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent runs' },
      { status: 500 }
    );
  }
}

