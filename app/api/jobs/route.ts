import { NextRequest, NextResponse } from 'next/server';
import { prisma, getHighMatchJobs } from '@/lib/prisma';

// GET /api/jobs?minScore=70&limit=20&notified=false
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const minScore = parseInt(searchParams.get('minScore') || '70');
    const limit = parseInt(searchParams.get('limit') || '20');
    const notified = searchParams.get('notified');
    const source = searchParams.get('source');

    const where: any = {
      matchScore: { gte: minScore },
    };

    if (notified !== null) {
      where.notified = notified === 'true';
    }

    if (source) {
      where.source = source;
    }

    const jobs = await prisma.jobSearchResult.findMany({
      where,
      orderBy: [
        { matchScore: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Calculate stats
    const stats = {
      total: jobs.length,
      highMatch: jobs.filter(j => j.matchScore >= 80).length,
      mediumMatch: jobs.filter(j => j.matchScore >= 60 && j.matchScore < 80).length,
      avgMatchScore: jobs.reduce((sum, j) => sum + j.matchScore, 0) / jobs.length || 0,
      notNotified: jobs.filter(j => !j.notified).length,
    };

    // Get unique companies and sources
    const companies = [...new Set(jobs.map(j => j.company))];
    const sources = [...new Set(jobs.map(j => j.source))];

    return NextResponse.json({
      success: true,
      jobs,
      stats,
      companies,
      sources,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Mark job as notified
export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId required' },
        { status: 400 }
      );
    }

    await prisma.jobSearchResult.update({
      where: { id: jobId },
      data: { notified: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

