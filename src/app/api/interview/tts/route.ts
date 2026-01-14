import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';

export async function POST(request: NextRequest) {
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
        return NextResponse.json(
            { error: error.message || 'TTS failed' },
            { status: 500 }
        );
    }
}
