import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Types } from 'mongoose';
import connectToDatabase from '@/lib/db';
import Like from '@/models/Like';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type SessionUser = { id?: string; email?: string | null; name?: string | null };

export async function GET(_req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as SessionUser | undefined)?.id;
        if (!userId) {
            return NextResponse.json({ ids: [] });
        }

        await connectToDatabase();

        const likes = await Like.find({ userId: new Types.ObjectId(userId) })
            .select('productId')
            .lean<{ productId: Types.ObjectId }[]>();

        return NextResponse.json({ ids: likes.map((l) => l.productId.toString()) });
    } catch (err) {
        console.error('Likes ids error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
