import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Types } from 'mongoose';
import connectToDatabase from '@/lib/db';
import Like from '@/models/Like';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type SessionUser = { id?: string; email?: string | null; name?: string | null };

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as SessionUser | undefined)?.id;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await req.json()) as { productId?: string };
        const productId = body.productId;
        if (!productId || !Types.ObjectId.isValid(productId)) {
            return NextResponse.json({ error: 'Invalid productId' }, { status: 400 });
        }

        await connectToDatabase();

        const filter = {
            userId: new Types.ObjectId(userId),
            productId: new Types.ObjectId(productId),
        };

        const existing = await Like.findOne(filter).lean();
        if (existing) {
            await Like.deleteOne(filter);
            return NextResponse.json({ liked: false });
        }
        await Like.create(filter);
        return NextResponse.json({ liked: true });
    } catch (err) {
        console.error('Likes toggle error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
