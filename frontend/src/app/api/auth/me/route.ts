import { NextResponse } from 'next/server';
import { getSession } from '@/features/auth/model/session';

export async function GET() {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ isAdmin: false });
  }
  return NextResponse.json({ isAdmin: session.user.role === 'admin' });
}
