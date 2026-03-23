import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new Response('Forbidden', { status: 403 });
  }
  
  try {
    await connectToDatabase();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(users);
  } catch(e) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
