import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../shared/middleware/authMiddleware';
import { TransferService } from '../services/transferService';
import { db } from '../../../shared/db/inMemoryDb';
import { UnauthorizedError } from '../../../shared/errors/AppError';

export class TransferController {
  private transferService: TransferService;

  constructor() {
    this.transferService = new TransferService(db);
  }

  // POST /api/v1/transfers (API01)
  public createTransfer = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const result = this.transferService.createTransfer(req.body, req.user);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  // POST /api/v1/transfers/draft (API02)
  public saveDraft = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const result = this.transferService.saveDraft(req.user.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  // GET /api/v1/transfers/draft (API02)
  public getDraft = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const result = this.transferService.getDraft(req.user.id);
      res.status(200).json(result || null);
    } catch (err) {
      next(err);
    }
  };

  // GET /api/v1/transfers/my (API03)
  public getMyTransfers = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const result = this.transferService.getMyTransfers(req.user.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  // GET /api/v1/transfers/:id (API04)
  public getTransferDetails = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const result = this.transferService.getTransferDetails(req.params.id, req.user);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  // POST /api/v1/transfers/:id/withdraw (API05)
  public withdrawTransfer = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const { reason } = req.body;
      const result = this.transferService.withdrawTransfer(req.params.id, req.user, reason);
      res.status(200).json({
        id: result.id,
        status: result.status,
        withdrawnAt: result.withdrawnAt,
        message: 'Transfer request successfully withdrawn.'
      });
    } catch (err) {
      next(err);
    }
  };
}
