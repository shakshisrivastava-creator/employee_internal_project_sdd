# Plan: Employee Internal Transfer Digital Journey

## Derived From
.ai-context/specs/employee-internal-transfer.spec.md

## Architecture Approach
The implementation follows the established **Modular Monolith (Microservice Ready)** architecture defined in `.ai-context/architecture.md` and the security/testing requirements in `.ai-context/constitution.md`.

### 1. Backend Modules (`src/backend/modules/`)
- **`transfers` Module (`src/backend/modules/transfers/`)**:
  - `TransferRequest` & `TransferDraft` domain models with versioning (`version` column for optimistic locking).
  - Input validation DTOs enforcing notice period (>= 14 days), self-transfer restrictions, mandatory field checks, and single-active-request constraint (`BR-01`).
  - `TransferService` providing draft persistence, submission, IDOR-protected retrieval, and withdrawal prior to HR approval stage.
  - `TransferController` exposing `/api/v1/transfers` REST endpoints matching API01–API05 contracts.
- **`approvals` Module (`src/backend/modules/approvals/`)**:
  - `ApprovalService` implementing the deterministic approval state machine (`PENDING_CURRENT_MGR` -> `PENDING_NEW_MGR` -> `PENDING_HR` -> `PROCESSING_DOWNSTREAM` / `REJECTED`).
  - Role-based authorization guard verifying that only designated Line Manager, Target Manager, or HR Admin can submit decisions on their respective gate.
  - Mandatory justification validation for rejections (min 15 characters).
  - Optimistic concurrency conflict resolution (`409 CONCURRENCY_CONFLICT`).
  - `ApprovalController` exposing `/api/v1/approvals/:id/decision` (API06).
- **`orchestration` Module (`src/backend/modules/orchestration/`)**:
  - `OrchestrationService` handling atomic creation of 3 parallel downstream tasks (`IT_PROVISIONING`, `PAYROLL_UPDATE`, `FACILITIES_ALLOCATION`) with 5-day SLA deadlines upon HR approval.
  - Task progress tracking, fault isolation (one task failure does not abort other tasks), and automatic overall request transition to `COMPLETED` when all downstream tasks reach terminal state.
  - SLA breach detection and query engine.
  - `OrchestrationController` exposing `/api/v1/orchestration/tasks` (API07, API08).
- **`notifications` & `audit` Module (`src/backend/modules/notifications/`)**:
  - `AuditLogger` writing immutable audit trail records for every lifecycle event and state transition.
  - `NotificationEmitter` simulating role-targeted alerts for approval routing, rejections, withdrawals, and task dispatches.
- **`shared` Infrastructure (`src/backend/shared/`)**:
  - Database configuration supporting PostgreSQL and SQLite/In-memory execution for deterministic automated testing.
  - JWT Authentication middleware and RBAC role guards.
  - Standardized error handlers and response formatters.

### 2. Frontend Modules (`src/frontend/modules/`)
- **`transfers` Module (`src/frontend/modules/transfers/`)**:
  - `TransferInitiationForm`: Client-side validation for notice period, department/role select, draft saving, and real-time guidance.
  - `TransferDetailView`: Single-pane-of-glass status tracker featuring interactive visual stepper timeline, stage-by-stage status, approver comments, and voluntary withdrawal trigger.
  - `TransferHistoryTable`: Historical and active request overview for applicant employee.
- **`approvals` Module (`src/frontend/modules/approvals/`)**:
  - `ApprovalInbox`: Dedicated queues for Current Line Manager, Receiving Manager, and HR Administrator.
  - `ApprovalDecisionModal`: Modal dialog enforcing required justification on rejection and structured approval confirmation.
- **`tasks` Module (`src/frontend/modules/tasks/`)**:
  - `DownstreamTaskWorklist`: Filtered task list for IT Specialists, Payroll Specialists, and Facilities Specialists with SLA countdown badges and status update controls.
- **`shared` Components (`src/frontend/shared/`)**:
  - Design system tokens, modal dialogs, status badges, timeline stepper, notification banners, and authenticated API client.

---

## Data Model

### 1. `TransferRequest` Entity
- `id`: UUID (Primary Key)
- `employeeId`: UUID (Indexed, Foreign Key to User)
- `status`: Enum (`DRAFT`, `SUBMITTED`, `PENDING_CURRENT_MGR`, `PENDING_NEW_MGR`, `PENDING_HR`, `PROCESSING_DOWNSTREAM`, `COMPLETED`, `REJECTED`, `WITHDRAWN`)
- `targetDepartmentId`: UUID
- `targetRoleId`: UUID
- `targetLocationId`: UUID
- `currentManagerId`: UUID
- `targetManagerId`: UUID
- `effectiveDate`: Date (YYYY-MM-DD)
- `reason`: Text (20-1000 characters)
- `version`: Integer (Default: 1, incremented on each state change)
- `withdrawnAt`: Timestamp (Nullable)
- `withdrawnReason`: Text (Nullable)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### 2. `TransferDraft` Entity
- `id`: UUID (Primary Key)
- `employeeId`: UUID (Unique per employee)
- `formData`: JSONB (Stores partial form values)
- `updatedAt`: Timestamp

### 3. `ApprovalAction` Entity
- `id`: UUID (Primary Key)
- `transferRequestId`: UUID (Foreign Key)
- `stage`: Enum (`CURRENT_MANAGER_APPROVAL`, `NEW_MANAGER_APPROVAL`, `HR_COMPLIANCE_REVIEW`)
- `decision`: Enum (`APPROVE`, `REJECT`)
- `justification`: Text (Nullable if approved, mandatory if rejected)
- `decidedBy`: UUID (Foreign Key to User)
- `decidedAt`: Timestamp

### 4. `DownstreamTask` Entity
- `id`: UUID (Primary Key)
- `transferRequestId`: UUID (Foreign Key)
- `taskType`: Enum (`IT_PROVISIONING`, `PAYROLL_UPDATE`, `FACILITIES_ALLOCATION`)
- `status`: Enum (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`)
- `assignedRole`: Enum (`IT_SPECIALIST`, `PAYROLL_SPECIALIST`, `FACILITIES_SPECIALIST`)
- `notes`: Text (Nullable unless failed)
- `slaDeadline`: Timestamp (Calculated as +5 business days from HR approval)
- `slaBreached`: Boolean (Default: false)
- `completedAt`: Timestamp (Nullable)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### 5. `AuditLog` Entity
- `id`: UUID (Primary Key)
- `transferRequestId`: UUID (Indexed)
- `actorId`: UUID
- `actorRole`: String
- `action`: String
- `previousStatus`: String (Nullable)
- `newStatus`: String
- `metadata`: JSONB
- `timestampUTC`: Timestamp

---

## Constitution Check
- [x] **No new datastore introduced without ADR**: Uses PostgreSQL schema with SQLite/in-memory adapter for test runner; no extraneous datastore added.
- [x] **Testing discipline matches constitution.md**: Strict TDD discipline with RED test phase prior to implementation, minimum 90% coverage for business rules and state machine transitions.
- [x] **Security posture matches constitution.md**: JWT token authentication, RBAC enforcing 7 distinct roles, strict IDOR prevention on all transfer records, schema input validation, and zero PII logging.
- [x] **Architecture and modularity**: Domain modularity maintained with clear boundary separation between transfers, approvals, orchestration, and notifications.
- [x] **Portability**: All file references use workspace-relative paths.

---

## Explicitly Deferred
- **External Applicant Tracking System (ATS) Integration**: Out of scope per BRD v3.0 Section 1.5; internal transfers only.
- **Automated Payroll Ledger & Direct Deposit Execution**: Out of scope per BRD v3.0; specialist manually marks task complete after updating core payroll ledger.
- **Relocation & Travel Expense Claims**: Handled through separate fiscal travel portal per BRD v3.0.
- **Cross-border international tax and visa orchestration**: Deferred to Phase 2; domestic transfers supported in baseline.

---

## Sequencing
1. **Foundation & Shared Core**:
   - Establish database schema, connection pooling, and in-memory test runner.
   - Implement JWT authentication middleware and RBAC role validation guards.
   - Implement centralized audit logging and error handling.
2. **Transfer Management Domain (Backend)**:
   - Implement DTOs and validation rules (14-day notice, self-transfer prevention, active request uniqueness).
   - Implement draft saving, transfer submission, IDOR-protected detail retrieval, and voluntary withdrawal.
   - Test-first TDD suite covering UT01–UT04, UT12–UT14.
3. **Approval State Machine Domain (Backend)**:
   - Implement sequential approval transitions (Line Manager -> Receiving Manager -> HR Admin).
   - Implement optimistic locking and rejection justification validation.
   - Test-first TDD suite covering UT05–UT07, UT15.
4. **Downstream Task Orchestration Domain (Backend)**:
   - Implement atomic 3-task generation on HR approval with 5-day SLA deadlines.
   - Implement specialist task updates, fault isolation, and auto-completion when all tasks reach terminal state.
   - Test-first TDD suite covering UT08–UT11.
5. **Frontend Core & Transfer Application**:
   - Build responsive layout, design system styling, and authenticated navigation.
   - Implement `TransferInitiationForm` with real-time validation and draft persistence.
   - Implement `TransferDetailView` with visual stepper timeline and withdrawal trigger.
6. **Frontend Approvals & Fulfillment Portals**:
   - Implement `ApprovalInbox` and decision dialog for Current Manager, Target Manager, and HR Administrator.
   - Implement `DownstreamTaskWorklist` with SLA countdown badges for IT, Payroll, and Facilities teams.
7. **End-to-End Verification & Gate 2 Preparation**:
   - Execute full test suite verifying 100% PASS across all 15 Acceptance Criteria and unit tests.
   - Update status board and synchronize dashboard.
