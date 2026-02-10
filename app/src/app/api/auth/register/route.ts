import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken, setAuthCookie } from '@/server/auth';

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password, firmName } = await request.json();

    if (!firstName || !lastName || !email || !password || !firmName) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 12) {
      return NextResponse.json(
        { message: 'Password must be at least 12 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ message: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Create firm and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const firm = await tx.firm.create({
        data: { name: firmName },
      });

      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email: email.toLowerCase(),
          passwordHash,
          role: 'ADMIN',
          firmId: firm.id,
        },
        include: { firm: true },
      });

      return user;
    });

    const token = signToken({
      userId: result.id,
      firmId: result.firmId,
      email: result.email,
      role: result.role,
    });

    await setAuthCookie(token);

    const { passwordHash: _, ...safeUser } = result;

    return NextResponse.json(
      { data: { user: safeUser }, message: 'Account created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
