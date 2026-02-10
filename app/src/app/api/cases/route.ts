import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = { firmId: user.firmId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { caseNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          client: { select: { id: true, firstName: true, lastName: true, companyName: true } },
          assignments: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.case.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: cases,
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

    // Generate case number
    const count = await prisma.case.count({ where: { firmId: user.firmId } });
    const caseNumber = `CASE-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        title: body.title,
        description: body.description || null,
        status: 'OPEN',
        priority: body.priority || 'MEDIUM',
        practiceArea: body.practiceArea,
        courtName: body.courtName || null,
        courtCaseNo: body.courtCaseNo || null,
        filingDate: body.filingDate ? new Date(body.filingDate) : null,
        nextHearingDate: body.nextHearingDate ? new Date(body.nextHearingDate) : null,
        firmId: user.firmId,
        clientId: body.clientId,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, companyName: true } },
      },
    });

    // Assign lead attorney if provided
    if (body.leadAttorneyId) {
      await prisma.caseAssignment.create({
        data: {
          caseId: newCase.id,
          userId: body.leadAttorneyId,
          role: 'LEAD_ATTORNEY',
        },
      });
    }

    // Create timeline entry
    await prisma.caseTimeline.create({
      data: {
        caseId: newCase.id,
        userId: user.id,
        eventType: 'CASE_CREATED',
        title: 'Case created',
        description: `Case ${caseNumber} was created.`,
      },
    });

    return NextResponse.json({ success: true, data: newCase }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
