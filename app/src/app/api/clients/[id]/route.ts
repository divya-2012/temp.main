import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/server/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: { id, firmId: user.firmId },
      include: {
        cases: { orderBy: { updatedAt: 'desc' } },
        _count: { select: { cases: true } },
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.client.findFirst({ where: { id, firmId: user.firmId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        firstName: body.firstName ?? existing.firstName,
        lastName: body.lastName ?? existing.lastName,
        companyName: body.companyName ?? existing.companyName,
        email: body.email ?? existing.email,
        phone: body.phone ?? existing.phone,
        address: body.address ?? existing.address,
        type: body.type ?? existing.type,
        notes: body.notes ?? existing.notes,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const existing = await prisma.client.findFirst({ where: { id, firmId: user.firmId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Client deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
