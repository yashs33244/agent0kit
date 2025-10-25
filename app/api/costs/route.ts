import { NextResponse } from 'next/server';
import { getCostSummary, getDetailedCostReport, formatCost, resetCostTracking } from '@/lib/cost-tracker';

// GET /api/costs - Get cost report
export async function GET() {
  try {
    const report = getDetailedCostReport();

    return NextResponse.json({
      success: true,
      ...report.summary,
      formattedTotal: formatCost(report.summary.total),
      recommendations: report.recommendations,
      detailedLogs: report.logs.slice(0, 50), // Last 50 API calls
    });
  } catch (error) {
    console.error('Error fetching costs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch costs' },
      { status: 500 }
    );
  }
}

// POST /api/costs/reset - Reset cost tracking
export async function POST() {
  try {
    resetCostTracking();
    return NextResponse.json({
      success: true,
      message: 'Cost tracking reset',
    });
  } catch (error) {
    console.error('Error resetting costs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset costs' },
      { status: 500 }
    );
  }
}

