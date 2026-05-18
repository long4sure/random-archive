import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendSuccess, sendError, sendPaginated } from '../lib/response';

const router = Router();
router.use(authenticate);

// Customers
router.get('/customers', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      prisma.customer.findMany({ where, take: limit, skip: (page - 1) * limit, include: { _count: { select: { saleOrders: true } } }, orderBy: { name: 'asc' } }),
      prisma.customer.count({ where }),
    ]);
    return sendPaginated(res, data, total, page, limit);
  } catch { return sendError(res, 'Failed to fetch customers', 500); }
});

router.get('/customers/:id', async (req, res) => {
  try {
    const data = await prisma.customer.findUnique({ where: { id: req.params.id }, include: { contacts: true, saleOrders: { take: 5, orderBy: { createdAt: 'desc' } } } });
    if (!data) return sendError(res, 'Customer not found', 404);
    return sendSuccess(res, data);
  } catch { return sendError(res, 'Failed to fetch customer', 500); }
});

router.post('/customers', async (req, res) => {
  try {
    const data = await prisma.customer.create({ data: req.body });
    return sendSuccess(res, data, 201);
  } catch (err: any) { return sendError(res, err.message, 400); }
});

router.patch('/customers/:id', async (req, res) => {
  try {
    const data = await prisma.customer.update({ where: { id: req.params.id }, data: req.body });
    return sendSuccess(res, data);
  } catch { return sendError(res, 'Failed to update customer', 400); }
});

// Sale Orders
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const where = status ? { status: status as any } : {};
    const [data, total] = await Promise.all([
      prisma.saleOrder.findMany({ where, take: limit, skip: (page - 1) * limit, include: { customer: { select: { name: true } }, lines: { select: { id: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.saleOrder.count({ where }),
    ]);
    return sendPaginated(res, data, total, page, limit);
  } catch { return sendError(res, 'Failed to fetch orders', 500); }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const data = await prisma.saleOrder.findUnique({ where: { id: req.params.id }, include: { customer: true, lines: { include: { product: { include: { uom: true } } } } } });
    if (!data) return sendError(res, 'Order not found', 404);
    return sendSuccess(res, data);
  } catch { return sendError(res, 'Failed to fetch order', 500); }
});

router.post('/orders', async (req, res) => {
  try {
    const { lines, ...orderData } = req.body;
    const reference = `SO-${Date.now()}`;
    const data = await prisma.saleOrder.create({
      data: { ...orderData, reference, lines: { create: lines } },
      include: { customer: true, lines: { include: { product: true } } },
    });
    return sendSuccess(res, data, 201);
  } catch (err: any) { return sendError(res, err.message, 400); }
});

router.patch('/orders/:id', async (req, res) => {
  try {
    const data = await prisma.saleOrder.update({ where: { id: req.params.id }, data: req.body });
    return sendSuccess(res, data);
  } catch { return sendError(res, 'Failed to update order', 400); }
});

export default router;
