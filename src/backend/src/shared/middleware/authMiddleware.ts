import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUser, UserRole } from '../types';
import { ForbiddenError, UnauthorizedError, AppError, ValidationError } from '../errors/AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'int-sdd-enterprise-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '8h' });
}

export function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication required. Missing Bearer token.'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    return next();
  } catch (_err) {
    return next(new UnauthorizedError('Invalid or expired authentication token.'));
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Role ${req.user.role} does not have required permissions.`
        )
      );
    }

    return next();
  };
}

export function globalErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  if (err instanceof ValidationError) {
    res.status(400).json({
      error: 'VALIDATION_FAILED',
      message: err.message,
      details: err.details
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(statusCode).json({
      error: err.constructor.name.toUpperCase(),
      message: err.message,
      ...(err as any).activeRequestId ? { activeRequestId: (err as any).activeRequestId } : {}
    });
    return;
  }

  // Non-operational or unhandled errors
  console.error('[InternalError]', err);
  res.status(statusCode).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: isOperational ? err.message : 'An unexpected error occurred.'
  });
}
