import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/agents/runs/[id] - Get specific run details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const run = await prisma.agentRun.findUnique({
      where: { id: params.id },
      include: {
        notifications: true,
        agent: true,
      },
    });

    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Run not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      run,
    });
  } catch (error) {
    console.error('Error fetching run:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch run' },
      { status: 500 }
    );
  }
}

