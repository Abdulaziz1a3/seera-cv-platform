import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createSignedInterviewUrl, uploadInterviewRecording } from '@/lib/supabase-storage';

export const runtime = 'nodejs';

const MAX_RECORDING_BYTES = 30 * 1024 * 1024; // 30MB

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const interviewSession = await prisma.interviewSession.findFirst({
        where: { id: params.id, userId: session.user.id },
    });

    if (!interviewSession?.recordingPath || !interviewSession.recordingBucket) {
        return NextResponse.json({ error: 'Recording not available' }, { status: 404 });
    }

    try {
        const url = await createSignedInterviewUrl({
            bucket: interviewSession.recordingBucket,
            path: interviewSession.recordingPath,
        });
        return NextResponse.json({ url });
    } catch (error) {
        console.error('Recording URL error:', error);
        return NextResponse.json({ error: 'Failed to load recording' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const interviewSession = await prisma.interviewSession.findFirst({
        where: { id: params.id, userId: session.user.id },
    });

    if (!interviewSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    if (file.size > MAX_RECORDING_BYTES) {
        return NextResponse.json({ error: 'Recording is too large' }, { status: 413 });
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = file.type || 'audio/webm';

        const { bucket, path } = await uploadInterviewRecording({
            userId: session.user.id,
            sessionId: interviewSession.id,
            contentType,
            data: buffer,
        });

        const updated = await prisma.interviewSession.update({
            where: { id: interviewSession.id },
            data: {
                recordingProvider: 'supabase',
                recordingBucket: bucket,
                recordingPath: path,
                recordingMimeType: contentType,
            },
        });

        return NextResponse.json({
            recordingAvailable: true,
            recordingPath: updated.recordingPath,
        });
    } catch (error) {
        console.error('Recording upload error:', error);
        return NextResponse.json({ error: 'Failed to upload recording' }, { status: 500 });
    }
}
