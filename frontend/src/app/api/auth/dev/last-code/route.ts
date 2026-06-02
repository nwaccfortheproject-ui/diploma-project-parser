import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import VerificationCode from '@/models/VerificationCode';

/**
 * DEV-ONLY. Returns the most recent un-consumed verification code's plaintext
 * for a given email so Playwright/local tests can complete the login flow.
 * Returns 404 in production so accidentally-exposed paths leak nothing.
 */
export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Not found', { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.toLowerCase();
    if (!email) {
        return NextResponse.json({ error: 'email_required' }, { status: 400 });
    }

    await connectToDatabase();

    const doc = await VerificationCode.findOne({ email, consumed: false })
        .sort({ createdAt: -1 })
        .lean<{ devPlain?: string; expiresAt: Date; createdAt: Date } | null>();

    if (!doc || !doc.devPlain) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({
        email,
        code: doc.devPlain,
        expiresAt: doc.expiresAt,
        createdAt: doc.createdAt,
    });
}
