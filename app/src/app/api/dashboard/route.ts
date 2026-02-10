import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries for dashboard metrics
    const [
      totalCases,
      activeCases,
      totalClients,
      pendingTasks,
      upcomingEvents,
      recentActivity,
      monthlyRevenue,
      overdueCompliance,
    ] = await Promise.all([
      prisma.case.count({ where: { firmId: user.firmId } }),
      prisma.case.count({ where: { firmId: user.firmId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.client.count({ where: { firmId: user.firmId } }),
      prisma.task.count({ where: { firmId: user.firmId, status: { in: ['TODO', 'IN_PROGRESS'] } } }),
      prisma.calendarEvent.findMany({
        where: {
          firmId: user.firmId,
          startTime: { gte: now },
        },
        orderBy: { startTime: 'asc' },
        take: 5,
        include: {
          case: { select: { title: true } },
        },
      }),
      prisma.auditLog.findMany({
        where: { firmId: user.firmId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.invoice.aggregate({
        where: {
          firmId: user.firmId,
          status: 'PAID',
          paidAt: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
      prisma.complianceItem.count({
        where: {
          firmId: user.firmId,
          status: { in: ['OVERDUE', 'NON_COMPLIANT'] },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalCases,
          activeCases,
          totalClients,
          pendingTasks,
          monthlyRevenue: monthlyRevenue._sum.total || 0,
          overdueCompliance,
        },
        upcomingEvents,
        recentActivity,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
