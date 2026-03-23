import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';

// Verifies auth or secret if needed, but since it's just a keepalive, it's safe to be public
// Vercel Cron will hit this endpoint securely if we set a secret, but a simple read is harmless.
export async function GET() {
  try {
    await connectToDatabase();
    // A simple query to wake up and keep MongoDB active
    const product = await Product.findOne().select('_id').lean();
    
    return NextResponse.json({ 
      ok: true, 
      message: "Database ping successful",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Keepalive error:", error);
    return NextResponse.json({ error: "Ping failed" }, { status: 500 });
  }
}
