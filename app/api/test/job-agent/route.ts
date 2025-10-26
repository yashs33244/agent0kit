import { NextResponse } from 'next/server';

export async function POST() {
    try {
        console.log('🧪 Testing Job Search Agent...');

        // Trigger job search agent
        const runResponse = await fetch('http://localhost:3000/api/agents/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: 'ai-job-search' }),
        });

        const result = await runResponse.json();

        return NextResponse.json({
            success: runResponse.ok,
            result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('❌ Test failed:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
}

