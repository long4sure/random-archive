import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { signToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { sendSuccess, sendError } from '../lib/response';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 'Email and password required', 400);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive) return sendError(res, 'Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return sendError(res, 'Invalid credentials', 401);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const payload = { userId: user.id, email: user.email, role: user.role };
    const token = signToken(payload);
    const refreshToken = signRefreshToken(payload);

    return sendSuccess(res, {
      token,
      refreshToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    });
  } catch (err) {
    return sendError(res, 'Login failed', 500);
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName || !lastName) return sendError(res, 'All fields required', 400);
    if (password.length < 8) return sendError(res, 'Password must be at least 8 characters', 400);

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return sendError(res, 'Email already in use', 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash, firstName, lastName, role: role || 'VIEWER' },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
    });

    const payload = { userId: user.id, email: user.email, role: user.role };
    return sendSuccess(res, { token: signToken(payload), user }, 201);
  } catch (err) {
    return sendError(res, 'Registration failed', 500);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 'Refresh token required', 400);
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) return sendError(res, 'User not found', 401);
    const newPayload = { userId: user.id, email: user.email, role: user.role };
    return sendSuccess(res, { token: signToken(newPayload), refreshToken: signRefreshToken(newPayload) });
  } catch {
    return sendError(res, 'Invalid refresh token', 401);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, lastLoginAt: true, createdAt: true, employee: { select: { id: true, employeeId: true, departmentId: true, position: true } } },
    });
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user);
  } catch {
    return sendError(res, 'Failed to fetch user', 500);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return sendError(res, 'User not found', 404);
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return sendError(res, 'Current password is incorrect', 400);
    if (newPassword.length < 8) return sendError(res, 'New password must be at least 8 characters', 400);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return sendSuccess(res, { message: 'Password updated successfully' });
  } catch {
    return sendError(res, 'Failed to change password', 500);
  }
};
