import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../lib/response';

const router = Router();

router.get('/kpis', authenticate, async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalCustomers, totalVendors, totalProducts,
      activeOrders, openPOs, activeEmployees,
      monthRevenue, lastMonthRevenue,
      draftWorkOrders, confirmedWorkOrders, inProgressWorkOrders,
      lowStockProducts, overdueInvoices,
    ] = await Promise.all([
      prisma.customer.count({ where: { isActive: true } }),
      prisma.vendor.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.saleOrder.count({ where: { status: { in: ['CONFIRMED', 'IN_PRODUCTION', 'READY'] } } }),
      prisma.purchaseOrder.count({ where: { status: { in: ['SENT', 'CONFIRMED', 'PARTIAL_RECEIVED'] } } }),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.invoice.aggregate({ where: { status: { in: ['SENT', 'PARTIAL_PAID', 'PAID'] }, issueDate: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      prisma.invoice.aggregate({ where: { status: { in: ['SENT', 'PARTIAL_PAID', 'PAID'] }, issueDate: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { totalAmount: true } }),
      prisma.workOrder.count({ where: { status: 'DRAFT' } }),
      prisma.workOrder.count({ where: { status: 'CONFIRMED' } }),
      prisma.workOrder.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.stockLevel.count({ where: { quantity: { gt: 0 }, product: { isActive: true } } }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
    ]);

    const thisMonth = monthRevenue._sum.totalAmount || 0;
    const lastMonth = lastMonthRevenue._sum.totalAmount || 0;
    const revenueGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return sendSuccess(res, {
      customers: totalCustomers,
      vendors: totalVendors,
      products: totalProducts,
      activeOrders,
      openPOs,
      activeEmployees,
      monthRevenue: thisMonth,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      workOrders: { draft: draftWorkOrders, confirmed: confirmedWorkOrders, inProgress: inProgressWorkOrders },
      lowStockProducts,
      overdueInvoices,
    });
  } catch (err) {
    return sendError(res, 'Failed to fetch KPIs', 500);
  }
});

router.get('/recent-orders', authenticate, async (_req, res) => {
  try {
    const orders = await prisma.saleOrder.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } }, lines: { select: { id: true } } },
    });
    return sendSuccess(res, orders);
  } catch {
    return sendError(res, 'Failed to fetch recent orders', 500);
  }
});

router.get('/revenue-chart', authenticate, async (_req, res) => {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const result = await prisma.invoice.aggregate({
        where: { issueDate: { gte: start, lte: end }, status: { in: ['SENT', 'PARTIAL_PAID', 'PAID'] } },
        _sum: { totalAmount: true },
      });
      months.push({
        month: start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: result._sum.totalAmount || 0,
      });
    }
    return sendSuccess(res, months);
  } catch {
    return sendError(res, 'Failed to fetch revenue chart', 500);
  }
});

export default router;
