import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/Chat';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { role, content, images } = await req.json();
    await connectToDatabase();

    const newChat = await Chat.create({
      userId: (session.user as any).id,
      role,
      content,
      images: images || [],
    });

    return NextResponse.json({ success: true, id: newChat._id });
  } catch(e: any) {
    console.error("Failed to save message:", e);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
