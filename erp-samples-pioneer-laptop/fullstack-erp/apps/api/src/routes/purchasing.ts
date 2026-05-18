import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendSuccess, sendError, sendPaginated } from '../lib/response';

const router = Router();
router.use(authenticate);

router.get('/vendors', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [data, total] = await Promise.all([
      prisma.vendor.findMany({ take: limit, skip: (page - 1) * limit, include: { _count: { select: { purchaseOrders: true } } }, orderBy: { name: 'asc' } }),
      prisma.vendor.count(),
    ]);
    return sendPaginated(res, data, total, page, limit);
  } catch { return sendError(res, 'Failed to fetch vendors', 500); }
});

router.post('/vendors', async (req, res) => {
  try {
    const data = await prisma.vendor.create({ data: req.body });
    return sendSuccess(res, data, 201);
  } catch (err: any) { return sendError(res, err.message, 400); }
});

router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({ take: limit, skip: (page - 1) * limit, include: { vendor: { select: { name: true } }, lines: { select: { id: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.purchaseOrder.count(),
    ]);
    return sendPaginated(res, data, total, page, limit);
  } catch { return sendError(res, 'Failed to fetch purchase orders', 500); }
});

router.post('/orders', async (req, res) => {
  try {
    const { lines, ...orderData } = req.body;
    const reference = `PO-${Date.now()}`;
    const data = await prisma.purchaseOrder.create({
      data: { ...orderData, reference, lines: { create: lines } },
      include: { vendor: true, lines: { include: { product: true } } },
    });
    return sendSuccess(res, data, 201);
  } catch (err: any) { return sendError(res, err.message, 400); }
});

export default router;
