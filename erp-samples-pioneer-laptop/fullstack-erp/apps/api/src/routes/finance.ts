import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendSuccess, sendError, sendPaginated } from '../lib/response';

const router = Router();
router.use(authenticate);

router.get('/accounts', async (_req, res) => {
  try {
    const data = await prisma.account.findMany({ orderBy: { code: 'asc' } });
    return sendSuccess(res, data);
  } catch { return sendError(res, 'Failed to fetch accounts', 500); }
});

router.post('/accounts', async (req, res) => {
  try {
    const data = await prisma.account.create({ data: req.body });
    return sendSuccess(res, data, 201);
  } catch (err: any) { return sendError(res, err.message, 400); }
});

router.get('/journals', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [data, total] = await Promise.all([
      prisma.journal.findMany({ take: limit, skip: (page - 1) * limit, include: { lines: { include: { account: true } } }, orderBy: { date: 'desc' } }),
      prisma.journal.count(),
    ]);
    return sendPaginated(res, data, total, page, limit);
  } catch { return sendError(res, 'Failed to fetch journals', 500); }
});

router.get('/invoices', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const where = status ? { status: status as any } : {};
    const [data, total] = await Promise.all([
      prisma.invoice.findMany({ where, take: limit, skip: (page - 1) * limit, include: { customer: { select: { name: true } } }, orderBy: { issueDate: 'desc' } }),
      prisma.invoice.count({ where }),
    ]);
    return sendPaginated(res, data, total, page, limit);
  } catch { return sendError(res, 'Failed to fetch invoices', 500); }
});

export default router;
