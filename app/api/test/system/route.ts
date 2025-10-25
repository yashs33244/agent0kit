import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkVectorDBHealth } from '@/lib/vector-db';
import { getCostReport } from '@/lib/cost-tracker';

export async function GET() {
  try {
    // Test PostgreSQL
    let postgresStatus = 'error';
    try {
      await prisma.$queryRaw`SELECT 1`;
      postgresStatus = 'connected';
    } catch (e) {
      postgresStatus = 'error: ' + (e as Error).message;
    }

    // Test Qdrant
    const qdrantStatus = await checkVectorDBHealth() ? 'connected' : 'error';

    // Get table counts
    const counts = {
      conversations: await prisma.conversation.count().catch(() => 0),
      messages: await prisma.message.count().catch(() => 0),
      agentRuns: await prisma.agentRun.count().catch(() => 0),
      jobResults: await prisma.jobSearchResult.count().catch(() => 0),
    };

    // Get cost report
    const costReport = getCostReport();

    return NextResponse.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        postgresql: postgresStatus,
        qdrant: qdrantStatus,
        redis: 'not tested',
      },
      database: {
        tables: counts,
        totalRecords: Object.values(counts).reduce((a, b) => a + b, 0),
      },
      costs: costReport,
      system: {
        node: process.version,
        platform: process.platform,
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

