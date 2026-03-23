import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/Chat';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    // Fetch last 50 messages
    const messages = await Chat.find({ userId: (session.user as any).id })
                               .sort({ createdAt: 1 })
                               .limit(50);
    
    // Map to AI SDK format
    const formatted = messages.map(m => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
      createdAt: m.createdAt
    }));

    return NextResponse.json(formatted);
  } catch(e: any) {
    console.error("Failed to fetch history:", e);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
