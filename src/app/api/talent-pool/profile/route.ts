import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        { error: 'This feature is no longer available.' },
        { status: 404 }
    );
}

export async function POST() {
    return NextResponse.json(
        { error: 'This feature is no longer available.' },
        { status: 404 }
    );
}

export async function DELETE() {
    return NextResponse.json(
        { error: 'This feature is no longer available.' },
        { status: 404 }
    );
}
