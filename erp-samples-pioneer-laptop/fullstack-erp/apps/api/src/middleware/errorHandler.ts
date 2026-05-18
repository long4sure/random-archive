import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/response';
import { logger } from '../lib/logger';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message, { stack: err.stack });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as { code: string; meta?: { target?: string[] } };
    if (prismaErr.code === 'P2002') {
      return res.status(409).json({ success: false, message: `Duplicate value for: ${prismaErr.meta?.target?.join(', ')}` });
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
  }

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};
