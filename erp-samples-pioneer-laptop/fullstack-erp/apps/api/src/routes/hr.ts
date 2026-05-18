import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendSuccess, sendError, sendPaginated } from '../lib/response';

const router = Router();
router.use(authenticate);

router.get('/employees', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const where = search ? { OR: [{ firstName: { contains: search, mode: 'insensitive' as const } }, { lastName: { contains: search, mode: 'insensitive' as const } }, { employeeId: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      prisma.employee.findMany({ where, take: limit, skip: (page - 1) * limit, include: { department: true }, orderBy: { firstName: 'asc' } }),
      prisma.employee.count({ where }),
    ]);
    return sendPaginated(res, data, total, page, limit);
  } catch { return sendError(res, 'Failed to fetch employees', 500); }
});

router.post('/employees', async (req, res) => {
  try {
    const data = await prisma.employee.create({ data: req.body, include: { department: true } });
    return sendSuccess(res, data, 201);
  } catch (err: any) { return sendError(res, err.message, 400); }
});

router.get('/departments', async (_req, res) => {
  try {
    const data = await prisma.department.findMany({ include: { _count: { select: { employees: true } } }, orderBy: { name: 'asc' } });
    return sendSuccess(res, data);
  } catch { return sendError(res, 'Failed to fetch departments', 500); }
});

router.post('/departments', async (req, res) => {
  try {
    const data = await prisma.department.create({ data: req.body });
    return sendSuccess(res, data, 201);
  } catch (err: any) { return sendError(res, err.message, 400); }
});

router.get('/payroll-runs', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [data, total] = await Promise.all([
      prisma.payrollRun.findMany({ take: limit, skip: (page - 1) * limit, include: { _count: { select: { lines: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.payrollRun.count(),
    ]);
    return sendPaginated(res, data, total, page, limit);
  } catch { return sendError(res, 'Failed to fetch payroll runs', 500); }
});

export default router;
