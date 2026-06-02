import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import connectToDatabase from '@/lib/db';
import VerificationCode from '@/models/VerificationCode';
import User from '@/models/User';
import { sendVerificationCodeEmail } from '@/lib/mailer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;
const PER_EMAIL_WINDOW_MS = 60 * 1000;
const PER_EMAIL_MAX = 3;

function generateCode(): string {
    const buf = new Uint8Array(4);
    crypto.getRandomValues(buf);
    const n = ((buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | buf[3]) >>> 0;
    return (n % 1_000_000).toString().padStart(6, '0');
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json().catch(() => null)) as { email?: string; name?: string } | null;
        const email = body?.email?.trim().toLowerCase();
        const requestedName = body?.name?.trim();

        if (!email || !EMAIL_RE.test(email)) {
            return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
        }

        await connectToDatabase();

        const now = Date.now();

        const recentForEmail = await VerificationCode.countDocuments({
            email,
            createdAt: { $gt: new Date(now - PER_EMAIL_WINDOW_MS) },
        });
        if (recentForEmail >= PER_EMAIL_MAX) {
            return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
        }

        const code = generateCode();
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(now + CODE_TTL_MS);
        const isProd = process.env.NODE_ENV === 'production';

        // Invalidate any previous unused codes for this email so the latest is the only valid one.
        await VerificationCode.updateMany(
            { email, consumed: false },
            { $set: { consumed: true } }
        );

        await VerificationCode.create({
            email,
            codeHash,
            devPlain: isProd ? undefined : code,
            expiresAt,
            attempts: 0,
            consumed: false,
        });

        // Make sure a user exists. Auto-provision on first code request keeps the UX simple
        // (no separate "register" step) — name is optional and only used at first sign-in.
        const existingUser = await User.findOne({ email }).lean<{ _id: Types.ObjectId } | null>();
        if (!existingUser) {
            await User.create({ email, name: requestedName });
        } else if (requestedName && requestedName.length > 0) {
            await User.updateOne(
                { _id: existingUser._id },
                { $set: { name: requestedName } }
            );
        }

        const result = await sendVerificationCodeEmail(email, code);

        return NextResponse.json({
            ok: true,
            transport: result.transport,
            delivered: result.delivered,
            // Never expose the code itself through this endpoint, even in dev.
        });
    } catch (err) {
        console.error('send-code error:', err);
        return NextResponse.json({ error: 'internal' }, { status: 500 });
    }
}
