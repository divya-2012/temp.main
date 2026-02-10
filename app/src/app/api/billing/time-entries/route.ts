import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const caseId = searchParams.get('caseId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { firmId: user.firmId };
    if (caseId) where.caseId = caseId;
    if (status) where.billable = status === 'BILLABLE';

    const [entries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          case: { select: { id: true, caseNumber: true, title: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.timeEntry.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: entries,
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

    const entry = await prisma.timeEntry.create({
      data: {
        date: new Date(body.date),
        hours: body.hours,
        rate: body.rate || 350,
        amount: (body.hours || 0) * (body.rate || 350),
        description: body.description,
        billable: body.billable !== false,
        caseId: body.caseId,
        userId: user.id,
        firmId: user.firmId,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
