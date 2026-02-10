import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, hashPassword } from '@/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const firm = await prisma.firm.findUnique({
      where: { id: user.firmId },
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: { user, firm } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    // Update user profile
    if (body.profile) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: body.profile.firstName ?? user.firstName,
          lastName: body.profile.lastName ?? user.lastName,
          email: body.profile.email ?? user.email,
          phone: body.profile.phone ?? undefined,
        },
      });
    }

    // Update firm (admin only)
    if (body.firm && user.role === 'ADMIN') {
      await prisma.firm.update({
        where: { id: user.firmId },
        data: {
          name: body.firm.name ?? undefined,
          address: body.firm.address ?? undefined,
          phone: body.firm.phone ?? undefined,
          website: body.firm.website ?? undefined,
        },
      });
    }

    // Change password
    if (body.password) {
      const hashed = await hashPassword(body.password.newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashed },
      });
    }

    return NextResponse.json({ success: true, message: 'Settings updated' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
