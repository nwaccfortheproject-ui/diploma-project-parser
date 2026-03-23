import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import { Types } from 'mongoose';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new Response('Forbidden', { status: 403 });
  }
  
  try {
    const { id } = await params;
    await connectToDatabase();
    
    let query;
    if (Types.ObjectId.isValid(id)) {
        query = { _id: id };
    } else {
        query = { article: id };
    }
    
    await Product.deleteOne(query);
    return NextResponse.json({ success: true });
  } catch(e) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
