import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendSuccess, sendError, sendPaginated } from '../lib/response';

const router = Router();
router.use(authenticate);

router.get('/boms', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [data, total] = await Promise.all([
      prisma.billOfMaterial.findMany({ take: limit, skip: (page - 1) * limit, include: { finishedProduct: { select: { name: true, sku: true } }, lines: { include: { product: { select: { name: true } }, uom: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.billOfMaterial.count(),
    ]);
    return sendPaginated(res, data, total, page, limit);
  } catch { return sendError(res, 'Failed to fetch BOMs', 500); }
});

router.post('/boms', async (req, res) => {
  try {
    const { lines, ...bomData } = req.body;
    const reference = `BOM-${Date.now()}`;
    const data = await prisma.billOfMaterial.create({
      data: { ...bomData, reference, lines: { create: lines } },
      include: { finishedProduct: true, lines: { include: { product: true, uom: true } } },
    });
    return sendSuccess(res, data, 201);
  } catch (err: any) { return sendError(res, err.message, 400); }
});

router.get('/work-orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const where = status ? { status: status as any } : {};
    const [data, total] = await Promise.all([
      prisma.workOrder.findMany({ where, take: limit, skip: (page - 1) * limit, include: { bom: { include: { finishedProduct: { select: { name: true, sku: true } } } }, workCenter: true }, orderBy: { createdAt: 'desc' } }),
      prisma.workOrder.count({ where }),
    ]);
    return sendPaginated(res, data, total, page, limit);
  } catch { return sendError(res, 'Failed to fetch work orders', 500); }
});

router.post('/work-orders', async (req, res) => {
  try {
    const reference = `WO-${Date.now()}`;
    const data = await prisma.workOrder.create({
      data: { ...req.body, reference },
      include: { bom: { include: { finishedProduct: true } }, workCenter: true },
    });
    return sendSuccess(res, data, 201);
  } catch (err: any) { return sendError(res, err.message, 400); }
});

router.patch('/work-orders/:id', async (req, res) => {
  try {
    const data = await prisma.workOrder.update({ where: { id: req.params.id }, data: req.body, include: { bom: { include: { finishedProduct: true } }, workCenter: true } });
    return sendSuccess(res, data);
  } catch { return sendError(res, 'Failed to update work order', 400); }
});

router.get('/work-centers', async (_req, res) => {
  try {
    const data = await prisma.workCenter.findMany({ orderBy: { name: 'asc' } });
    return sendSuccess(res, data);
  } catch { return sendError(res, 'Failed to fetch work centers', 500); }
});

export default router;
