import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendSuccess, sendError, sendPaginated } from '../lib/response';
import bcrypt from 'bcryptjs';

const router = Router();
router.use(authenticate);

router.get('/', isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [data, total] = await Promise.all([
      prisma.user.findMany({ take: limit, skip: (page - 1) * limit, select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, lastLoginAt: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
      prisma.user.count(),
    ]);
    return sendPaginated(res, data, total, page, limit);
  } catch { return sendError(res, 'Failed to fetch users', 500); }
});

router.patch('/:id', isAdmin, async (req, res) => {
  try {
    const { password, ...data } = req.body;
    const updateData: any = { ...data };
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.update({ where: { id: req.params.id }, data: updateData, select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true } });
    return sendSuccess(res, user);
  } catch { return sendError(res, 'Failed to update user', 400); }
});

export default router;
