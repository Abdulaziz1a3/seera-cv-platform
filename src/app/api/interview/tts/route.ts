import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { auth } from '@/lib/auth';
import { errors } from '@/lib/api-response';
import { hasActiveSubscription } from '@/lib/subscription';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return errors.unauthorized();
    }
    const hasAccess = await hasActiveSubscription(session.user.id);
    if (!hasAccess) {
        return errors.subscriptionRequired('Interview Prep');
    }

    try {
        const { text, voice = 'onyx' } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const response = await getOpenAI().audio.speech.create({
            model: 'tts-1-hd', // HD quality for more natural voice
            voice: voice,
            input: text,
            speed: 0.95, // Slightly slower for more natural pacing
        });

        const audioBuffer = await response.arrayBuffer();

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.byteLength.toString(),
            },
        });
    } catch (error: any) {
        console.error('TTS Error:', error);
        const message = error?.message || 'TTS failed';
        const status = /API_KEY|API key|OpenAI API/i.test(message) ? 503 : 500;
        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
