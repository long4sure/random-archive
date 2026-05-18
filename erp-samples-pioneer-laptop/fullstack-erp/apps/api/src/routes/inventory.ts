import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendSuccess, sendError, sendPaginated } from '../lib/response';

const router = Router();
router.use(authenticate);

// Products
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { sku: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      prisma.product.findMany({ where, take: limit, skip: (page - 1) * limit, include: { category: true, uom: true }, orderBy: { name: 'asc' } }),
      prisma.product.count({ where }),
    ]);
    return sendPaginated(res, data, total, page, limit);
  } catch { return sendError(res, 'Failed to fetch products', 500); }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: { category: true, uom: true, stockLevels: { include: { location: { include: { warehouse: true } } } } } });
    if (!product) return sendError(res, 'Product not found', 404);
    return sendSuccess(res, product);
  } catch { return sendError(res, 'Failed to fetch product', 500); }
});

router.post('/products', async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body, include: { category: true, uom: true } });
    return sendSuccess(res, product, 201);
  } catch (err: any) { return sendError(res, err.message || 'Failed to create product', 400); }
});

router.patch('/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body, include: { category: true, uom: true } });
    return sendSuccess(res, product);
  } catch { return sendError(res, 'Failed to update product', 400); }
});

// Categories
router.get('/categories', async (_req, res) => {
  try {
    const data = await prisma.category.findMany({ include: { children: true }, where: { parentId: null }, orderBy: { name: 'asc' } });
    return sendSuccess(res, data);
  } catch { return sendError(res, 'Failed to fetch categories', 500); }
});

router.post('/categories', async (req, res) => {
  try {
    const data = await prisma.category.create({ data: req.body });
    return sendSuccess(res, data, 201);
  } catch (err: any) { return sendError(res, err.message, 400); }
});

// Warehouses
router.get('/warehouses', async (_req, res) => {
  try {
    const data = await prisma.warehouse.findMany({ include: { locations: true }, orderBy: { name: 'asc' } });
    return sendSuccess(res, data);
  } catch { return sendError(res, 'Failed to fetch warehouses', 500); }
});

router.post('/warehouses', async (req, res) => {
  try {
    const data = await prisma.warehouse.create({ data: req.body });
    return sendSuccess(res, data, 201);
  } catch (err: any) { return sendError(res, err.message, 400); }
});

// Stock moves
router.get('/stock-moves', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [data, total] = await Promise.all([
      prisma.stockMove.findMany({ take: limit, skip: (page - 1) * limit, include: { product: true, fromLocation: true, toLocation: true, uom: true }, orderBy: { createdAt: 'desc' } }),
      prisma.stockMove.count(),
    ]);
    return sendPaginated(res, data, total, page, limit);
  } catch { return sendError(res, 'Failed to fetch stock moves', 500); }
});

// UoMs
router.get('/uoms', async (_req, res) => {
  try {
    const data = await prisma.unitOfMeasure.findMany({ orderBy: { name: 'asc' } });
    return sendSuccess(res, data);
  } catch { return sendError(res, 'Failed to fetch UoMs', 500); }
});

export default router;
