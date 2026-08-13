import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || err.error || 'Internal Server Error';
  const details = err.details || undefined;

  res.status(statusCode).json({
    error: message,
    ...(details ? { details } : {}),
  });
};
