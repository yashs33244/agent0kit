import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const agent = await prisma.agent.findUnique({
            where: { agentId: id },
            include: {
                runs: {
                    orderBy: { startedAt: 'desc' },
                    take: 50,
                    include: {
                        notifications: true,
                    },
                },
            },
        });

        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ agent });
    } catch (error) {
        console.error('❌ Failed to fetch agent:', error);
        return NextResponse.json(
            { error: 'Failed to fetch agent' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { status, schedule, envVars } = body;

        const agent = await prisma.agent.update({
            where: { agentId: id },
            data: {
                ...(status && { status }),
                ...(schedule && { schedule }),
                ...(envVars && { envVars }),
            },
        });

        return NextResponse.json({ agent });
    } catch (error) {
        console.error('❌ Failed to update agent:', error);
        return NextResponse.json(
            { error: 'Failed to update agent' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.agent.delete({
            where: { agentId: id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Failed to delete agent:', error);
        return NextResponse.json(
            { error: 'Failed to delete agent' },
            { status: 500 }
        );
    }
}

