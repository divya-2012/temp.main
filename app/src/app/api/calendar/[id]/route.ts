import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/server/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const event = await prisma.calendarEvent.findFirst({
      where: { id, firmId: user.firmId },
      include: {
        case: { select: { id: true, caseNumber: true, title: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: event });
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

    const existing = await prisma.calendarEvent.findFirst({ where: { id, firmId: user.firmId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        description: body.description ?? existing.description,
        type: body.type ?? existing.type,
        startTime: body.startTime ? new Date(body.startTime) : existing.startTime,
        endTime: body.endTime ? new Date(body.endTime) : existing.endTime,
        location: body.location ?? existing.location,
        allDay: body.allDay ?? existing.allDay,
        caseId: body.caseId !== undefined ? body.caseId : existing.caseId,
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

    const existing = await prisma.calendarEvent.findFirst({ where: { id, firmId: user.firmId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    await prisma.calendarEvent.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
