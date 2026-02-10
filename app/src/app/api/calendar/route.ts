import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = { firmId: user.firmId };
    if (type) where.type = type;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) (where.startTime as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.startTime as Record<string, unknown>).lte = new Date(endDate);
    }

    const [events, total] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        include: {
          case: { select: { id: true, caseNumber: true, title: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { startTime: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.calendarEvent.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: events,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const event = await prisma.calendarEvent.create({
      data: {
        title: body.title,
        description: body.description || null,
        type: body.type || 'MEETING',
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        location: body.location || null,
        allDay: body.isAllDay || false,
        caseId: body.caseId || null,
        createdById: user.id,
        firmId: user.firmId,
      },
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
