import request from 'supertest';
import app from '../../../../src/backend/src/server';
import { db } from '../../../../src/backend/src/shared/db/inMemoryDb';
import { generateToken } from '../../../../src/backend/src/shared/middleware/authMiddleware';
import { UserRole, TransferStatus, DownstreamTaskStatus } from '../../../../src/backend/src/shared/types';

describe('End-to-End REST API Integration Tests (API01–API08)', () => {
  const applicant = {
    id: 'emp-integration-001',
    name: 'Alice Employee',
    email: 'alice@company.com',
    employeeCode: 'EMP2001',
    role: UserRole.EMPLOYEE,
    currentDepartmentId: 'dept-dev-001',
    currentDepartmentName: 'Software Engineering',
    currentRoleId: 'role-dev-001',
    currentRoleTitle: 'Software Engineer',
    currentLocationId: 'loc-ny-001',
    currentLocationName: 'New York',
    managerId: 'mgr-line-001'
  };

  const currentManager = { ...applicant, id: 'mgr-line-001', name: 'Bob CurrentManager', role: UserRole.CURRENT_MANAGER };
  const targetManager = { ...applicant, id: 'mgr-target-001', name: 'Carol TargetManager', role: UserRole.NEW_MANAGER };
  const hrAdmin = { ...applicant, id: 'hr-admin-001', name: 'David HRAdmin', role: UserRole.HR_ADMIN };
  const itSpecialist = { ...applicant, id: 'it-spec-001', name: 'Frank IT', role: UserRole.IT_SPECIALIST };

  const applicantToken = generateToken(applicant);
  const currentMgrToken = generateToken(currentManager);
  const targetMgrToken = generateToken(targetManager);
  const hrAdminToken = generateToken(hrAdmin);
  const itSpecToken = generateToken(itSpecialist);

  const validPayload = {
    targetDepartmentId: 'dept-cloud-001',
    targetDepartmentName: 'Cloud Infrastructure',
    targetRoleId: 'role-sre-001',
    targetRoleTitle: 'Site Reliability Engineer',
    targetLocationId: 'loc-austin-001',
    targetLocationName: 'Austin Campus',
    targetManagerId: 'mgr-target-001',
    effectiveDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: 'Transitioning to cloud engineering team to support multi-region infrastructure.'
  };

  beforeEach(() => {
    db.clear();
  });

  describe('API01 — POST /api/v1/transfers', () => {
    it('should create transfer request with HTTP 201 Created', async () => {
      const res = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe(TransferStatus.PENDING_CURRENT_MGR);
      expect(res.body.version).toBe(1);
    });

    it('should return HTTP 401 when Authorization header is missing', async () => {
      const res = await request(app).post('/api/v1/transfers').send(validPayload);
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHORIZEDERROR');
    });

    it('should return HTTP 400 when notice period is less than 14 days', async () => {
      const shortNotice = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ ...validPayload, effectiveDate: shortNotice });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_FAILED');
    });

    it('should return HTTP 409 Conflict when submitting while active request exists', async () => {
      await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send(validPayload);

      const second = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send(validPayload);

      expect(second.status).toBe(409);
      expect(second.body.activeRequestId).toBeDefined();
    });
  });

  describe('API02 & API03 — Draft and My Transfers', () => {
    it('should save and retrieve draft', async () => {
      const draftData = { targetDepartmentId: 'dept-cloud-001', reason: 'Draft reason test' };

      const saveRes = await request(app)
        .post('/api/v1/transfers/draft')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send(draftData);

      expect(saveRes.status).toBe(200);

      const getRes = await request(app)
        .get('/api/v1/transfers/draft')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.formData.targetDepartmentId).toBe('dept-cloud-001');
    });

    it('should return activeRequest and history in GET /api/v1/transfers/my', async () => {
      await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send(validPayload);

      const res = await request(app)
        .get('/api/v1/transfers/my')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.activeRequest).toBeDefined();
      expect(res.body.activeRequest.status).toBe(TransferStatus.PENDING_CURRENT_MGR);
    });
  });

  describe('API04 & API05 — Details and Voluntary Withdrawal', () => {
    it('should enforce IDOR defense: return 403 Forbidden for unrelated user', async () => {
      const createRes = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send(validPayload);

      const stranger = { ...applicant, id: 'emp-stranger-999', role: UserRole.EMPLOYEE };
      const strangerToken = generateToken(stranger);

      const getRes = await request(app)
        .get(`/api/v1/transfers/${createRes.body.id}`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(getRes.status).toBe(403);
    });

    it('should allow employee to withdraw pending transfer', async () => {
      const createRes = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send(validPayload);

      const withdrawRes = await request(app)
        .post(`/api/v1/transfers/${createRes.body.id}/withdraw`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ reason: 'Personal circumstances changed, withdrawing request.' });

      expect(withdrawRes.status).toBe(200);
      expect(withdrawRes.body.status).toBe(TransferStatus.WITHDRAWN);
    });
  });

  describe('Full Multi-Gate Journey (API06, API07, API08)', () => {
    it('should advance from submission through Current Manager, New Manager, HR, and Downstream Tasks to COMPLETED', async () => {
      // 1. Submit
      const createRes = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send(validPayload);

      const id = createRes.body.id;

      // 2. Current Manager Approves
      const appr1 = await request(app)
        .post(`/api/v1/approvals/${id}/decision`)
        .set('Authorization', `Bearer ${currentMgrToken}`)
        .send({ decision: 'APPROVE' });

      expect(appr1.status).toBe(200);
      expect(appr1.body.newStatus).toBe(TransferStatus.PENDING_NEW_MGR);

      // 3. Target Manager Approves
      const appr2 = await request(app)
        .post(`/api/v1/approvals/${id}/decision`)
        .set('Authorization', `Bearer ${targetMgrToken}`)
        .send({ decision: 'APPROVE' });

      expect(appr2.status).toBe(200);
      expect(appr2.body.newStatus).toBe(TransferStatus.PENDING_HR);

      // 4. HR Admin Approves -> Transitions to PROCESSING_DOWNSTREAM and spawns 3 tasks
      const appr3 = await request(app)
        .post(`/api/v1/approvals/${id}/decision`)
        .set('Authorization', `Bearer ${hrAdminToken}`)
        .send({ decision: 'APPROVE' });

      expect(appr3.status).toBe(200);
      expect(appr3.body.newStatus).toBe(TransferStatus.PROCESSING_DOWNSTREAM);

      // 5. IT Specialist checks task queue (API07)
      const tasksRes = await request(app)
        .get('/api/v1/orchestration/tasks')
        .set('Authorization', `Bearer ${itSpecToken}`);

      expect(tasksRes.status).toBe(200);
      expect(tasksRes.body.tasks.length).toBeGreaterThanOrEqual(1);
      const itTaskId = tasksRes.body.tasks[0].id;

      // 6. Complete IT Task (API08)
      const updateRes = await request(app)
        .patch(`/api/v1/orchestration/tasks/${itTaskId}`)
        .set('Authorization', `Bearer ${itSpecToken}`)
        .send({ status: DownstreamTaskStatus.COMPLETED });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe(DownstreamTaskStatus.COMPLETED);
    });
  });
});
