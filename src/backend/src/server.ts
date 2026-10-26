import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware, globalErrorHandler } from './shared/middleware/authMiddleware';
import { TransferController } from './modules/transfers/controllers/transferController';
import { ApprovalController } from './modules/approvals/controllers/approvalController';
import { OrchestrationController } from './modules/orchestration/controllers/orchestrationController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'employee-internal-transfer-backend',
    timestamp: new Date().toISOString()
  });
});

// Controllers
const transferCtrl = new TransferController();
const approvalCtrl = new ApprovalController();
const orchestrationCtrl = new OrchestrationController();

// Transfer Routes (API01 - API05)
app.post('/api/v1/transfers', authMiddleware, transferCtrl.createTransfer);
app.post('/api/v1/transfers/draft', authMiddleware, transferCtrl.saveDraft);
app.get('/api/v1/transfers/draft', authMiddleware, transferCtrl.getDraft);
app.get('/api/v1/transfers/my', authMiddleware, transferCtrl.getMyTransfers);
app.get('/api/v1/transfers/:id', authMiddleware, transferCtrl.getTransferDetails);
app.post('/api/v1/transfers/:id/withdraw', authMiddleware, transferCtrl.withdrawTransfer);

// Approval Routes (API06)
app.post('/api/v1/approvals/:id/decision', authMiddleware, approvalCtrl.processDecision);
app.get('/api/v1/approvals/inbox', authMiddleware, approvalCtrl.getInbox);

// Orchestration Routes (API07, API08)
app.get('/api/v1/orchestration/tasks', authMiddleware, orchestrationCtrl.getTasks);
app.patch('/api/v1/orchestration/tasks/:id', authMiddleware, orchestrationCtrl.updateTask);

// Centralized error handler
app.use(globalErrorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
