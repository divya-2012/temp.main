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
    const category = searchParams.get('category');

    const where: Record<string, unknown> = { firmId: user.firmId };
    if (status) where.status = status;
    if (category) where.category = category;

    const [items, total] = await Promise.all([
      prisma.complianceItem.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.complianceItem.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
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

    const item = await prisma.complianceItem.create({
      data: {
        title: body.title,
        description: body.description || null,
        category: body.category,
        status: 'PENDING',
        riskLevel: body.priority || 'MEDIUM',
        dueDate: body.deadline ? new Date(body.deadline) : null,
        caseId: body.caseId || null,
        firmId: user.firmId,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
