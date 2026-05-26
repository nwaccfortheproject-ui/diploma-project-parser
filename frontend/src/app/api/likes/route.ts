import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Types } from 'mongoose';
import connectToDatabase from '@/lib/db';
import Like from '@/models/Like';
import Product from '@/models/Product';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type SessionUser = { id?: string; email?: string | null; name?: string | null };

export async function GET(_req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as SessionUser | undefined)?.id;
        if (!userId) {
            return NextResponse.json({ items: [], total: 0 });
        }

        await connectToDatabase();

        const likes = await Like.find({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .lean<{ productId: Types.ObjectId; createdAt: Date }[]>();

        const productIds = likes.map((l) => l.productId);
        const products = await Product.find({ _id: { $in: productIds } })
            .lean<(Record<string, unknown> & { _id: Types.ObjectId })[]>();

        const productMap = new Map<string, Record<string, unknown>>();
        for (const p of products) {
            const { _id, __v: _v, ...rest } = p;
            productMap.set(_id.toString(), { ...rest, id: _id.toString() });
        }

        const items = likes
            .map((l) => productMap.get(l.productId.toString()))
            .filter((p): p is Record<string, unknown> => Boolean(p));

        return NextResponse.json({ items, total: items.length });
    } catch (err) {
        console.error('Likes GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
