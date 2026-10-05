# BRD Change Log & Impact Analysis

This log records requirements baseline versions, classifications, and system impact analysis in accordance with the INT SDD Ingestion Policy.

---

### Version 3.0 (Comprehensive — All Scenarios Baseline)

- **Change ID:** BRD-INGEST-003
- **Baseline Date:** 2026-10-04
- **Author:** Shakshi
- **Reviewer:** Soumyadeep / Supratim Jetty
- **Status:** Pending Gate 0 Review
- **Source Document:** `docs/BRD_Employee_Internal_Transfer.md`
- **Feature Slug:** `employee-internal-transfer`

#### Change Summary
Upgraded baseline from preliminary drafts to comprehensive v3.0 BRD (`BRD_Employee_Internal_Transfer.md`). Resolves previous Gate 1 review blocker regarding scope mismatch, unhandled cross-department edge cases, missing state machine definitions, and actor responsibilities.

#### Requirement Classification

##### Added Requirements
- **BRD-REQ-001**: Single-page internal transfer application form with dynamic reactive fields.
- **BRD-REQ-002**: Draft preservation allowing employees to save progress prior to formal submission.
- **BRD-REQ-003**: Pre-submission eligibility and validation engine enforcing 14-day notice, valid manager selection, and single-active-request constraint.
- **BRD-REQ-004**: Sequential multi-tier manager routing (`PENDING_CURRENT_MGR` → `PENDING_NEW_MGR`).
- **BRD-REQ-005**: HR Compliance & Policy Review stage (`PENDING_HR`) with decision justification logging.
- **BRD-REQ-006**: Automated downstream orchestration dispatch spawning parallel IT, Payroll, and Facilities tasks upon HR approval.
- **BRD-REQ-007**: Downstream task status lifecycle (`PENDING` → `IN_PROGRESS` → `COMPLETED` / `FAILED`) with fault isolation.
- **BRD-REQ-008**: Employee real-time journey tracker timeline with visual status indicators.
- **BRD-REQ-009**: Employee pre-HR withdrawal capability transition to terminal `WITHDRAWN` state.
- **BRD-REQ-010**: Comprehensive immutable audit trail logging all state transitions, actor IDs, roles, and UTC timestamps.
- **BRD-REQ-011**: SLA monitoring (5 business days) with automated reminder dispatches.
- **BRD-REQ-012**: Strict Role-Based Access Control (RBAC) and Insecure Direct Object Reference (IDOR) prevention returning HTTP 403 for unauthorized access.

##### Modified Requirements
- **BRD-MOD-001 (formerly BRD-001/002)**: Formalized sequential approval chain with distinct state transitions rather than generalized review.
- **BRD-MOD-002 (formerly BRD-004/005)**: Downstream orchestration expanded from 2 tasks to 3 explicit tasks (IT Provisioning, Payroll Adjustment, Facilities Workspace Allocation) with dedicated task status states.

##### Removed Requirements
- None. (Previous preliminary specifications were superseded by full v3.0 baseline).

##### Unchanged Requirements
- High-level business objective to eliminate email-based transfer handoffs in One-Point Portal.

---

#### System & Architecture Impact Analysis

| Dimension | Impact Analysis |
|---|---|
| **Affected Business Domains** | Employee Portal, Line Management Approvals, HR Operations, Enterprise IT, Corporate Payroll, Facilities Management. |
| **Affected Modules** | `transfers` (submission, validation, withdrawal), `approvals` (sequential manager/HR decision engine), `orchestration` (parallel downstream task dispatch and monitoring), `notifications` (event-driven dispatchers). |
| **API Impact** | RESTful endpoints required: `POST /api/transfers`, `GET /api/transfers/my`, `GET /api/transfers/:id`, `POST /api/transfers/:id/withdraw`, `POST /api/approvals/:id/decision`, `GET /api/orchestration/tasks`, `PATCH /api/orchestration/tasks/:id`. |
| **Database Impact** | Relational schema requiring tables: `transfer_requests`, `approval_decisions`, `orchestration_tasks`, `audit_logs`. Indexes on `employee_id`, `status`, and `transfer_request_id`. Optimistic locking via `version` column. |
| **Frontend Impact** | Responsive UI with single-pane transfer submission form, interactive stepper/timeline component, manager approval inbox, and HR admin dashboard. WCAG 2.1 AA accessible. |
| **Backend Impact** | Robust state machine implementation with transition guards, RBAC middleware, transactional outbox for event notifications, and background SLA polling job. |
| **Test Impact** | Comprehensive test pyramid: Unit tests for state machine, validators, and rules; integration tests for sequential approvals and parallel downstream tasks; security tests for IDOR and RBAC. |
| **Existing Implementation Impact** | None; greenfield implementation within `src/` following INT SDD test-first guidelines. |
| **Architecture Impact** | Modular monolith with clean domain separation between transfers, approvals, and downstream orchestration. Ready for microservice decomposition if scaled. |

---

#### Gate Governance & Sign-Off
- **Gate 0 Status:** Approved ([GATE0-BRD-v3.0-20261005-133928.md](file:///d:/INTERNAL_SDD/employee_internal_project_sdd/.ai-context/pr_reviews/GATE0-BRD-v3.0-20261005-133928.md))
- **Gate 1 Status:** Pending (Authorized to draft feature specification `.ai-context/specs/employee-internal-transfer.spec.md`)
- **Approval Date:** 2026-10-05 13:39:28
- **Approved By:** Supratim Jetty (`supratim.jetty@intglobal.com`)
- **Approval Notes:** Gate 0 BRD Review Approved. Comprehensive BRD v3.0 baseline successfully addresses cross-department transfer workflows, edge cases, SLA management, and downstream orchestration. Ready for Milestone 1 Feature Specification generation.

---

### Historical Versions

#### Version 1.0 (2026-09-14)
- **Status:** Superseded
- **Summary:** Initial baseline creation from Developer Assessment & Discovery Analysis.
