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
    const clientId = searchParams.get('clientId');

    const where: Record<string, unknown> = { firmId: user.firmId };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: { select: { id: true, firstName: true, lastName: true, companyName: true } },
          case: { select: { id: true, caseNumber: true, title: true } },
        },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: invoices,
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

    // Generate invoice number
    const count = await prisma.invoice.count({ where: { firmId: user.firmId } });
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        subtotal: body.amount || 0,
        tax: body.tax || 0,
        total: (body.amount || 0) + (body.tax || 0),
        status: 'DRAFT',
        issueDate: body.issuedDate ? new Date(body.issuedDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: body.notes || null,
        clientId: body.clientId,
        caseId: body.caseId || null,
        firmId: user.firmId,
      },
    });

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
