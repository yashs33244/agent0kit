import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const agents = await prisma.agent.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ agents });
    } catch (error) {
        console.error('❌ Failed to fetch agents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch agents' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { agentId, name, description, icon, category, schedule, envVars } = body;

        if (!agentId || !name || !description || !schedule) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const agent = await prisma.agent.create({
            data: {
                agentId,
                name,
                description,
                icon: icon || '🤖',
                category: category || 'Custom',
                status: 'paused',
                schedule,
                envVars: envVars || {},
            },
        });

        return NextResponse.json({ agent }, { status: 201 });
    } catch (error) {
        console.error('❌ Failed to create agent:', error);
        return NextResponse.json(
            { error: 'Failed to create agent' },
            { status: 500 }
        );
    }
}

