import { Response } from 'express';

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200, meta?: object) => {
  return res.status(statusCode).json({ success: true, data, ...(meta && { meta }) });
};

export const sendError = (res: Response, message: string, statusCode = 400, errors?: unknown) => {
  return res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
) => {
  return res.status(200).json({
    success: true,
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
  });
};

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
