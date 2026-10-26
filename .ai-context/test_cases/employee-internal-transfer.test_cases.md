# Test Cases: Employee Internal Transfer Digital Journey

## Derived From Spec
.ai-context/specs/employee-internal-transfer.spec.md

## Acceptance Test Scenarios

### employee-internal-transfer.TC01 — Form Validation & Notice Period Enforced
- **Maps to AC:** employee-internal-transfer.AC01
- **Given:** An authenticated employee on the internal transfer request page.
- **When:** They submit a request where the effective date is less than 14 calendar days in the future, target department is missing, or the target manager equals their own employee ID.
- **Then:** The system responds with HTTP 400 Bad Request containing field-specific validation errors (`VAL-01` to `VAL-06`), and no record is persisted.
- **Automated Test File:** tests/backend/unit/transfers/transferValidation.test.ts

### employee-internal-transfer.TC02 — Single Active Request Constraint
- **Maps to AC:** employee-internal-transfer.AC02
- **Given:** An employee with an existing transfer request in status `PENDING_CURRENT_MGR`.
- **When:** The employee attempts to submit a second transfer request.
- **Then:** The system rejects the submission with HTTP 409 Conflict, returning error code `ACTIVE_REQUEST_EXISTS` and referencing the active request ID.
- **Automated Test File:** tests/backend/unit/transfers/transferService.test.ts

### employee-internal-transfer.TC03 — Draft Creation & Resumption
- **Maps to AC:** employee-internal-transfer.AC03
- **Given:** An employee partially filling out the transfer application form.
- **When:** The employee clicks "Save Draft".
- **Then:** The partial application is saved in `DRAFT` status with HTTP 200/201, zero manager notifications are triggered, and subsequent calls to `GET /api/transfers/draft` return the saved form data.
- **Automated Test File:** tests/backend/unit/transfers/transferDraft.test.ts

### employee-internal-transfer.TC04 — Current Manager Routing & Decision
- **Maps to AC:** employee-internal-transfer.AC04
- **Given:** A submitted transfer request in status `PENDING_CURRENT_MGR`.
- **When:** The designated Current Line Manager submits an approval decision.
- **Then:** The request transitions to `PENDING_NEW_MGR`, an audit event is logged, and the New Manager receives notification. If rejected with justification, status transitions to `REJECTED`.
- **Automated Test File:** tests/backend/unit/approvals/approvalService.test.ts

### employee-internal-transfer.TC05 — New Manager Evaluation
- **Maps to AC:** employee-internal-transfer.AC05
- **Given:** A transfer request in status `PENDING_NEW_MGR`.
- **When:** The designated Receiving Manager submits an approval decision.
- **Then:** The request transitions to `PENDING_HR`, an audit event is logged, and HR Administrators are alerted. If rejected with justification, status transitions to `REJECTED`.
- **Automated Test File:** tests/backend/unit/approvals/approvalService.test.ts

### employee-internal-transfer.TC06 — HR Administration Approval & Downstream Task Spawning
- **Maps to AC:** employee-internal-transfer.AC06
- **Given:** A transfer request in status `PENDING_HR`.
- **When:** An authorized HR Administrator approves the request.
- **Then:** The request state atomically transitions to `PROCESSING_DOWNSTREAM`, exactly 3 downstream tasks (`IT_PROVISIONING`, `PAYROLL_UPDATE`, `FACILITIES_ALLOCATION`) are created with status `PENDING` and a 5-day SLA deadline, and notification events are dispatched.
- **Automated Test File:** tests/backend/integration/approvals/hrApprovalOrchestration.test.ts

### employee-internal-transfer.TC07 — HR Rejection Decision
- **Maps to AC:** employee-internal-transfer.AC07
- **Given:** A transfer request in status `PENDING_HR`.
- **When:** The HR Administrator rejects the request with mandatory justification.
- **Then:** The status transitions to `REJECTED`, zero downstream tasks are created, and rejection notifications are dispatched to employee and both managers.
- **Automated Test File:** tests/backend/unit/approvals/approvalService.test.ts

### employee-internal-transfer.TC08 — Downstream Parallel Fulfillment & Fault Isolation
- **Maps to AC:** employee-internal-transfer.AC08
- **Given:** A transfer request in status `PROCESSING_DOWNSTREAM` with 3 active tasks.
- **When:** The IT Specialist marks `IT_PROVISIONING` as `FAILED` while Facilities marks `FACILITIES_ALLOCATION` as `COMPLETED`.
- **Then:** The IT task is recorded as `FAILED`, Facilities task is recorded as `COMPLETED`, Payroll remains `PENDING`, overall request remains in `PROCESSING_DOWNSTREAM`, and an exception alert is dispatched to HR Ops.
- **Automated Test File:** tests/backend/unit/orchestration/orchestrationService.test.ts

### employee-internal-transfer.TC09 — Request Lifecycle Completion
- **Maps to AC:** employee-internal-transfer.AC09
- **Given:** A transfer request in status `PROCESSING_DOWNSTREAM` where 2 tasks are `COMPLETED`.
- **When:** The final remaining downstream task (`PAYROLL_UPDATE`) is marked `COMPLETED`.
- **Then:** The overall transfer request status automatically transitions to `COMPLETED`, the audit log records completion, and completion notifications with effective date instructions are sent to all stakeholders.
- **Automated Test File:** tests/backend/unit/orchestration/orchestrationService.test.ts

### employee-internal-transfer.TC10 — Employee Voluntary Withdrawal
- **Maps to AC:** employee-internal-transfer.AC10
- **Given:** A transfer request in status `PENDING_CURRENT_MGR` or `PENDING_NEW_MGR`.
- **When:** The applicant employee calls `POST /api/transfers/:id/withdraw` with a valid reason.
- **Then:** The request status transitions to `WITHDRAWN`, pending manager approvals are invalidated, and approvers are notified.
- **Automated Test File:** tests/backend/unit/transfers/transferWithdrawal.test.ts

### employee-internal-transfer.TC11 — Withdrawal Lockout Post-HR
- **Maps to AC:** employee-internal-transfer.AC11
- **Given:** A transfer request in status `PENDING_HR`, `PROCESSING_DOWNSTREAM`, `COMPLETED`, or `REJECTED`.
- **When:** The employee attempts to withdraw the request.
- **Then:** The system rejects the request with HTTP 400 Bad Request (`INVALID_STATE`), preventing withdrawal after HR review.
- **Automated Test File:** tests/backend/unit/transfers/transferWithdrawal.test.ts

### employee-internal-transfer.TC12 — SLA Tracking & Reminder Notifications
- **Maps to AC:** employee-internal-transfer.AC12
- **Given:** Downstream fulfillment tasks in `PENDING` or `IN_PROGRESS`.
- **When:** The SLA scheduler inspects tasks where current time exceeds the 5-business-day deadline.
- **Then:** The system marks `slaBreached = true` and dispatches automated reminder alerts to the responsible department queue and HR Ops.
- **Automated Test File:** tests/backend/unit/orchestration/slaTracking.test.ts

### employee-internal-transfer.TC13 — Insecure Direct Object Reference (IDOR) Defense
- **Maps to AC:** employee-internal-transfer.AC13
- **Given:** An authenticated Employee B who is neither applicant, current manager, receiving manager, nor HR admin for Employee A's transfer request.
- **When:** Employee B calls `GET /api/transfers/:id` for Employee A's request ID.
- **Then:** The API returns HTTP 403 Forbidden with zero transfer data exposure.
- **Automated Test File:** tests/backend/integration/transfers/idorProtection.test.ts

### employee-internal-transfer.TC14 — Immutable Audit Log Compliance
- **Maps to AC:** employee-internal-transfer.AC14
- **Given:** Any lifecycle action executed on a transfer request (submission, approval, rejection, withdrawal, downstream task completion).
- **When:** The state transition transaction completes.
- **Then:** An audit log entry is persisted containing `transferRequestId`, `actorId`, `actorRole`, `action`, `previousStatus`, `newStatus`, and `timestampUTC`.
- **Automated Test File:** tests/backend/unit/notifications/auditLogger.test.ts

### employee-internal-transfer.TC15 — Optimistic Concurrency Control
- **Maps to AC:** employee-internal-transfer.AC15
- **Given:** A transfer request with version `1`.
- **When:** Two concurrent approval requests attempt to transition the request simultaneously with version `1`.
- **Then:** The first transaction commits (version updated to `2`) and the second transaction is rejected with HTTP 409 Conflict (`CONCURRENCY_CONFLICT`).
- **Automated Test File:** tests/backend/integration/approvals/optimisticConcurrency.test.ts
