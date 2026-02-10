import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/server/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const caseData = await prisma.case.findFirst({
      where: { id, firmId: user.firmId },
      include: {
        client: true,
        assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        timeline: { orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { firstName: true, lastName: true } } } },
        documents: { orderBy: { createdAt: 'desc' } },
        tasks: { orderBy: { dueDate: 'asc' } },
        timeEntries: { orderBy: { date: 'desc' }, take: 20 },
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!caseData) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: caseData });
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

    const existing = await prisma.case.findFirst({ where: { id, firmId: user.firmId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    const updated = await prisma.case.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        description: body.description ?? existing.description,
        status: body.status ?? existing.status,
        priority: body.priority ?? existing.priority,
        practiceArea: body.practiceArea ?? existing.practiceArea,
        courtName: body.courtName ?? existing.courtName,
        courtCaseNo: body.courtCaseNo ?? existing.courtCaseNo,
        filingDate: body.filingDate ? new Date(body.filingDate) : existing.filingDate,
        nextHearingDate: body.nextHearingDate ? new Date(body.nextHearingDate) : existing.nextHearingDate,
        clientId: body.clientId ?? existing.clientId,
      },
    });

    // Track status change in timeline
    if (body.status && body.status !== existing.status) {
      await prisma.caseTimeline.create({
        data: {
          caseId: id,
          userId: user.id,
          eventType: 'STATUS_CHANGED',
          title: `Status changed to ${body.status}`,
          description: `Case status changed from ${existing.status} to ${body.status}`,
        },
      });
    }

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

    const existing = await prisma.case.findFirst({ where: { id, firmId: user.firmId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    await prisma.case.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Case deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
