import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkVectorDBHealth } from '@/lib/vector-db';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      database: 'checking',
      vectorDB: 'checking',
    },
    uptime: process.uptime(),
  };

  try {
    // Check PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'ok';
  } catch (error) {
    health.services.database = 'error';
    health.status = 'degraded';
  }

  try {
    // Check Qdrant
    const qdrantOk = await checkVectorDBHealth();
    health.services.vectorDB = qdrantOk ? 'ok' : 'error';
    if (!qdrantOk) health.status = 'degraded';
  } catch (error) {
    health.services.vectorDB = 'error';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}

