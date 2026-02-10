import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json({ data: { user: safeUser } });
  } catch {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
}
