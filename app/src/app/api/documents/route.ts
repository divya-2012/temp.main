import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const caseId = searchParams.get('caseId');
    const category = searchParams.get('category');

    const where: Record<string, unknown> = { firmId: user.firmId };
    if (caseId) where.caseId = caseId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          case: { select: { id: true, caseNumber: true, title: true } },
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: documents,
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

    const document = await prisma.document.create({
      data: {
        name: body.name,
        originalName: body.originalName || body.name,
        mimeType: body.mimeType,
        size: body.size,
        storagePath: body.storageKey || body.storagePath || '',
        tags: body.tags || [],
        caseId: body.caseId || null,
        firmId: user.firmId,
        uploadedById: user.id,
      },
    });

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
