import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt';
import { sendError } from '../lib/response';
import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }
    const token = authHeader.split(' ')[1];
    req.user = verifyToken(token);
    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    if (!roles.includes(req.user.role as UserRole)) {
      return sendError(res, 'Insufficient permissions', 403);
    }
    next();
  };
};

// Role hierarchy: SUPER_ADMIN > ADMIN > MANAGER > specific roles > VIEWER
export const isAdmin = authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN);
export const isManagerOrAbove = authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER);
