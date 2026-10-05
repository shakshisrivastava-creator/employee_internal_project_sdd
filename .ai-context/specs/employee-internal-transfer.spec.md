# Spec: Employee Internal Transfer Digital Journey

## Spec ID
`employee-internal-transfer`

## Status
Approved

## Roles & Assignments
- **Developer:** Antigravity AI / Shakshi
- **Gate 1 Reviewer(s):** Supratim Jetty (`supratim.jetty@intglobal.com`)
- **Gate 2 Reviewer(s):** Supratim Jetty (`supratim.jetty@intglobal.com`)

## Linked BRD
- Primary Baseline: [.ai-context/BRD.md](file:///.ai-context/BRD.md) (v3.0 Comprehensive)
- Assumptions: [.ai-context/assumptions.md](file:///.ai-context/assumptions.md)
- Gate 0 Review Sign-off: [.ai-context/pr_reviews/GATE0-BRD-v3.0-20261005-133928.md](file:///.ai-context/pr_reviews/GATE0-BRD-v3.0-20261005-133928.md)

## Gate Approvals & History
| Gate | Approver Name | Approver Email/ID | Date/Time | Outcome | Approval Comment / Summary |
|---|---|---|---|---|---|
| Gate 0 (BRD Review) | Supratim Jetty | `supratim.jetty@intglobal.com` | 2026-10-05 13:39:28 | Approved | Approved Gate 0 BRD v3.0 baseline. Authorized for Milestone 1 Feature Specification generation. |
| Gate 1 (Spec Review) | Supratim Jetty | `supratim.jetty@intglobal.com` | 2026-10-05 23:34:49 | Approved | Approved Gate 1 Spec Review. Authorized technical plan (.plan.md), tasks breakdown (.tasks.md), and TDD implementation. |
| Gate 2 (Code Review) | Supratim Jetty | `supratim.jetty@intglobal.com` | Pending | Not Started | Blocked until implementation and TDD green tests. |

---

## Intent
Digitise and orchestrate the complete internal employee transfer journey in the One-Point Employee Portal. This feature enables employees to submit transfer requests with real-time validation, enforces sequential approvals (Current Line Manager → Target Receiving Manager → HR Administrator), automatically dispatches parallel downstream operational tasks (IT Provisioning, Payroll Adjustments, Facilities Workspace Allocation), provides real-time status tracking with visual timeline progress, and maintains an immutable audit log for full compliance and transparency.

---

## Context
- **Architecture Style:** Modular Monolith (Microservice Ready) defined in [.ai-context/architecture.md](file:///d:/INTERNAL_SDD/employee_internal_project_sdd/.ai-context/architecture.md)
- **Domain Modules:** `transfers`, `approvals`, `orchestration`, `notifications`
- **Security & Authorization:** Role-Based Access Control (RBAC) with JSON Web Tokens (JWT). Strict prevention of Insecure Direct Object References (IDOR).
- **Concurrency:** Optimistic locking via record versioning (`version` column) on transfer request entities.

---

## API Contract

### employee-internal-transfer.API01 — POST /api/transfers
Creates and formally submits a new transfer request.

**Headers:**
`Authorization: Bearer <JWT>`

**Request payload:**
```json
{
  "targetDepartmentId": "string (UUID)",
  "targetRoleId": "string (UUID)",
  "targetLocationId": "string (UUID)",
  "targetManagerId": "string (UUID)",
  "effectiveDate": "YYYY-MM-DD",
  "reason": "string (min: 20, max: 1000 chars)"
}
```

**Success response (`201 Created`):**
```json
{
  "id": "string (UUID)",
  "employeeId": "string (UUID)",
  "status": "PENDING_CURRENT_MGR",
  "effectiveDate": "YYYY-MM-DD",
  "targetDepartment": { "id": "UUID", "name": "string" },
  "targetRole": { "id": "UUID", "name": "string" },
  "targetLocation": { "id": "UUID", "name": "string" },
  "currentManagerId": "string (UUID)",
  "targetManagerId": "string (UUID)",
  "createdAt": "ISO8601 UTC Timestamp",
  "version": 1
}
```

**Exceptions:**
| Code | Condition | Response body |
| ---- | --------- | ------------- |
| 400 | Validation failure (`VAL-01` to `VAL-06`, e.g., effective date < 14 days, self-transfer target, missing fields) | `{ "error": "VALIDATION_FAILED", "details": [ { "field": "string", "message": "string" } ] }` |
| 401 | Missing or invalid authentication token | `{ "error": "UNAUTHENTICATED", "message": "Authentication required." }` |
| 409 | Employee already has an active, non-terminal transfer request (`BR-01`) | `{ "error": "ACTIVE_REQUEST_EXISTS", "activeRequestId": "UUID", "message": "Employee already has an active transfer request in progress." }` |

---

### employee-internal-transfer.API02 — POST /api/transfers/draft
Saves or updates a draft transfer request without triggering approvals.

**Headers:**
`Authorization: Bearer <JWT>`

**Request payload:**
```json
{
  "draftId": "string (UUID, optional for new draft)",
  "targetDepartmentId": "string (UUID, optional)",
  "targetRoleId": "string (UUID, optional)",
  "targetLocationId": "string (UUID, optional)",
  "targetManagerId": "string (UUID, optional)",
  "effectiveDate": "YYYY-MM-DD (optional)",
  "reason": "string (optional)"
}
```

**Success response (`200 OK` or `201 Created`):**
```json
{
  "draftId": "string (UUID)",
  "status": "DRAFT",
  "updatedAt": "ISO8601 UTC Timestamp"
}
```

---

### employee-internal-transfer.API03 — GET /api/transfers/my
Retrieves all transfer requests submitted by the authenticated employee.

**Headers:**
`Authorization: Bearer <JWT>`

**Success response (`200 OK`):**
```json
{
  "activeRequest": {
    "id": "UUID",
    "status": "PENDING_CURRENT_MGR",
    "targetDepartmentName": "string",
    "targetRoleTitle": "string",
    "effectiveDate": "YYYY-MM-DD",
    "currentStage": "Awaiting Current Line Manager Approval",
    "createdAt": "ISO8601 UTC"
  },
  "history": [
    {
      "id": "UUID",
      "status": "COMPLETED | REJECTED | WITHDRAWN",
      "effectiveDate": "YYYY-MM-DD",
      "closedAt": "ISO8601 UTC"
    }
  ]
}
```

---

### employee-internal-transfer.API04 — GET /api/transfers/:id
Fetches the granular details and visual tracking timeline for a specific transfer request. Enforces strict IDOR prevention.

**Headers:**
`Authorization: Bearer <JWT>`

**Success response (`200 OK`):**
```json
{
  "id": "UUID",
  "employee": {
    "id": "UUID",
    "name": "string",
    "employeeCode": "string",
    "currentDepartment": "string",
    "currentRole": "string",
    "currentLocation": "string"
  },
  "target": {
    "department": "string",
    "role": "string",
    "location": "string",
    "newManagerName": "string"
  },
  "status": "PENDING_CURRENT_MGR | PENDING_NEW_MGR | PENDING_HR | PROCESSING_DOWNSTREAM | COMPLETED | REJECTED | WITHDRAWN",
  "effectiveDate": "YYYY-MM-DD",
  "reason": "string",
  "timeline": [
    {
      "stage": "SUBMISSION",
      "status": "COMPLETED",
      "actor": "string",
      "timestamp": "ISO8601 UTC"
    },
    {
      "stage": "CURRENT_MANAGER_APPROVAL",
      "status": "IN_PROGRESS | COMPLETED | REJECTED",
      "actor": "string",
      "comments": "string",
      "timestamp": "ISO8601 UTC"
    },
    {
      "stage": "NEW_MANAGER_APPROVAL",
      "status": "NOT_STARTED | IN_PROGRESS | COMPLETED | REJECTED",
      "actor": "string",
      "comments": "string",
      "timestamp": "ISO8601 UTC"
    },
    {
      "stage": "HR_COMPLIANCE_REVIEW",
      "status": "NOT_STARTED | IN_PROGRESS | COMPLETED | REJECTED",
      "actor": "string",
      "comments": "string",
      "timestamp": "ISO8601 UTC"
    },
    {
      "stage": "DOWNSTREAM_ORCHESTRATION",
      "status": "NOT_STARTED | IN_PROGRESS | COMPLETED",
      "tasks": [
        { "name": "IT_PROVISIONING", "status": "PENDING | IN_PROGRESS | COMPLETED | FAILED" },
        { "name": "PAYROLL_UPDATE", "status": "PENDING | IN_PROGRESS | COMPLETED | FAILED" },
        { "name": "FACILITIES_ALLOCATION", "status": "PENDING | IN_PROGRESS | COMPLETED | FAILED" }
      ]
    }
  ],
  "canWithdraw": true
}
```

**Exceptions:**
| Code | Condition | Response body |
| ---- | --------- | ------------- |
| 403 | Authenticated user is neither applicant, assigned approver, nor HR Admin (IDOR defense) | `{ "error": "FORBIDDEN", "message": "Access denied to requested transfer record." }` |
| 404 | Transfer request ID not found | `{ "error": "NOT_FOUND", "message": "Transfer request does not exist." }` |

---

### employee-internal-transfer.API05 — POST /api/transfers/:id/withdraw
Allows an employee to withdraw their pending transfer request prior to HR approval.

**Headers:**
`Authorization: Bearer <JWT>`

**Request payload:**
```json
{
  "reason": "string (min: 10, max: 500 chars)"
}
```

**Success response (`200 OK`):**
```json
{
  "id": "UUID",
  "status": "WITHDRAWN",
  "withdrawnAt": "ISO8601 UTC Timestamp",
  "message": "Transfer request successfully withdrawn."
}
```

**Exceptions:**
| Code | Condition | Response body |
| ---- | --------- | ------------- |
| 400 | Request is in `PENDING_HR`, `PROCESSING_DOWNSTREAM`, `COMPLETED`, `REJECTED`, or already `WITHDRAWN` (`BR-09`) | `{ "error": "INVALID_STATE", "message": "Transfer request cannot be withdrawn after HR review stage." }` |
| 403 | User is not the owner of the transfer request | `{ "error": "FORBIDDEN", "message": "Only the applicant can withdraw this request." }` |

---

### employee-internal-transfer.API06 — POST /api/approvals/:id/decision
Processes an approval or rejection decision from Current Manager, New Manager, or HR Administrator.

**Headers:**
`Authorization: Bearer <JWT>`

**Request payload:**
```json
{
  "decision": "APPROVE | REJECT",
  "justification": "string (required if REJECT, min: 15 chars; optional if APPROVE)"
}
```

**Success response (`200 OK`):**
```json
{
  "requestId": "UUID",
  "previousStatus": "PENDING_CURRENT_MGR | PENDING_NEW_MGR | PENDING_HR",
  "newStatus": "PENDING_NEW_MGR | PENDING_HR | PROCESSING_DOWNSTREAM | REJECTED",
  "decidedBy": "UUID",
  "role": "CURRENT_MANAGER | NEW_MANAGER | HR_ADMIN",
  "decidedAt": "ISO8601 UTC Timestamp"
}
```

**Exceptions:**
| Code | Condition | Response body |
| ---- | --------- | ------------- |
| 400 | Missing justification on rejection, or invalid decision enum | `{ "error": "VALIDATION_FAILED", "message": "Justification is required when rejecting a transfer." }` |
| 403 | User is not the authorized approver for the current stage | `{ "error": "FORBIDDEN", "message": "User is not authorized to act on this stage." }` |
| 409 | Version conflict / concurrent modification | `{ "error": "CONCURRENCY_CONFLICT", "message": "Record was updated by another process. Please refresh." }` |

---

### employee-internal-transfer.API07 — GET /api/orchestration/tasks
Returns downstream fulfillment worklist for IT, Payroll, or Facilities teams filtered by role.

**Headers:**
`Authorization: Bearer <JWT>`

**Success response (`200 OK`):**
```json
{
  "tasks": [
    {
      "taskId": "UUID",
      "transferRequestId": "UUID",
      "taskType": "IT_PROVISIONING | PAYROLL_UPDATE | FACILITIES_ALLOCATION",
      "status": "PENDING | IN_PROGRESS | COMPLETED | FAILED",
      "employeeName": "string",
      "targetDepartment": "string",
      "targetLocation": "string",
      "effectiveDate": "YYYY-MM-DD",
      "slaDeadline": "ISO8601 UTC Timestamp",
      "slaBreached": false
    }
  ]
}
```

---

### employee-internal-transfer.API08 — PATCH /api/orchestration/tasks/:id
Updates downstream task execution status (Complete or Failed).

**Headers:**
`Authorization: Bearer <JWT>`

**Request payload:**
```json
{
  "status": "IN_PROGRESS | COMPLETED | FAILED",
  "notes": "string (optional unless FAILED, min: 10 chars if FAILED)"
}
```

**Success response (`200 OK`):**
```json
{
  "taskId": "UUID",
  "status": "COMPLETED | FAILED",
  "completedAt": "ISO8601 UTC Timestamp",
  "overallTransferStatus": "PROCESSING_DOWNSTREAM | COMPLETED"
}
```

---

## Acceptance Criteria

1. **employee-internal-transfer.AC01 — Form Validation & Notice Period Enforced (`VAL-01` to `VAL-06`):**
   Given an authenticated employee on the transfer request page, when they submit a form with missing mandatory fields, an effective date less than 14 calendar days in the future, identical current/target department without role/location change, or selecting themselves as manager, then the system returns HTTP 400 with field-specific validation error details, and no request entity is created.

2. **employee-internal-transfer.AC02 — Single Active Request Constraint (`BR-01`):**
   Given an employee who already has an in-flight transfer request in status `SUBMITTED`, `PENDING_CURRENT_MGR`, `PENDING_NEW_MGR`, `PENDING_HR`, or `PROCESSING_DOWNSTREAM`, when they attempt to submit a new transfer request, then the system rejects the submission with HTTP 409 Conflict indicating an active request already exists.

3. **employee-internal-transfer.AC03 — Draft Creation & Resumption (`BR-02`):**
   Given an employee filling out a transfer application, when they click "Save Draft", then the request is saved in `DRAFT` status without triggering any approval routing or notifications, and the employee can retrieve and resume editing the draft in subsequent sessions.

4. **employee-internal-transfer.AC04 — Current Manager Routing & Decision (`BR-03`):**
   Given a newly submitted transfer request in `PENDING_CURRENT_MGR`, when the designated Current Manager logs in, then they see the request in their approval inbox. If they click "Approve", the status transitions to `PENDING_NEW_MGR` and notifies the New Manager; if they click "Reject" with mandatory justification, the status transitions to `REJECTED` and notifies the applicant.

5. **employee-internal-transfer.AC05 — New Manager Evaluation (`BR-04`):**
   Given a request in `PENDING_NEW_MGR`, when the target New Manager evaluates the request, then they can approve (transitioning request to `PENDING_HR` and alerting HR Ops) or reject with justification (transitioning to `REJECTED` and alerting employee and current manager).

6. **employee-internal-transfer.AC06 — HR Administration Approval & Downstream Trigger (`BR-05`, `BR-06`):**
   Given a request in `PENDING_HR`, when an authorized HR Administrator approves the request, then:
   - Request state transitions to `PROCESSING_DOWNSTREAM`.
   - Exactly three parallel fulfillment tasks (`IT_PROVISIONING`, `PAYROLL_UPDATE`, `FACILITIES_ALLOCATION`) are atomically created with status `PENDING` and a 5-day SLA deadline.
   - Dispatch events are triggered to IT, Payroll, Facilities, and the employee.

7. **employee-internal-transfer.AC07 — HR Rejection Decision (`BR-05`):**
   Given a request in `PENDING_HR`, when HR Administrator rejects the request with justification, then status transitions to `REJECTED`, no downstream tasks are generated, and notifications are sent to the employee and both managers.

8. **employee-internal-transfer.AC08 — Downstream Parallel Fulfillment & Fault Isolation (`BR-07`, `OQ-5`):**
   Given a request in `PROCESSING_DOWNSTREAM`, when IT, Payroll, or Facilities specialists complete their respective tasks, each task is marked `COMPLETED`. If one task fails (status `FAILED`), other downstream tasks continue unaffected, the request remains in `PROCESSING_DOWNSTREAM`, and HR receives an exception alert.

9. **employee-internal-transfer.AC09 — Request Lifecycle Completion:**
   Given a request in `PROCESSING_DOWNSTREAM`, when all three downstream tasks (`IT_PROVISIONING`, `PAYROLL_UPDATE`, `FACILITIES_ALLOCATION`) have reached terminal states, then the overall transfer request automatically transitions to `COMPLETED`, updates the audit log, and dispatches completion notifications with effective date instructions to all stakeholders.

10. **employee-internal-transfer.AC10 — Employee Voluntary Withdrawal (`BR-09`):**
    Given a transfer request in status `SUBMITTED`, `PENDING_CURRENT_MGR`, or `PENDING_NEW_MGR`, when the applicant employee invokes the withdraw action with a valid reason, then the request transitions to `WITHDRAWN`, any pending manager approval tasks are invalidated, and notification is sent to approvers.

11. **employee-internal-transfer.AC11 — Withdrawal Lockout Post-HR:**
    Given a transfer request in `PENDING_HR`, `PROCESSING_DOWNSTREAM`, `COMPLETED`, or `REJECTED`, when the employee attempts to withdraw, then the system returns HTTP 400 Bad Request, preventing withdrawal.

12. **employee-internal-transfer.AC12 — SLA Tracking & Reminder Notifications (`BR-08`, `NFR-02`):**
    Given downstream tasks in `PENDING` or `IN_PROGRESS`, when the elapsed duration exceeds 5 business days without completion, then the system flags `slaBreached = true` and dispatches an automated reminder alert to the responsible department queue and HR Ops.

13. **employee-internal-transfer.AC13 — Insecure Direct Object Reference (IDOR) Defense (`NFR-04`):**
    Given an authenticated employee attempting to view or modify a transfer request ID belonging to a different employee (where they are neither applicant, current manager, receiving manager, nor HR admin), then the API strictly returns HTTP 403 Forbidden with zero data exposure.

14. **employee-internal-transfer.AC14 — Immutable Audit Log Compliance (`NFR-07`):**
    Given any state transition on a transfer request (submission, approval, rejection, withdrawal, task progress), then an immutable audit log record is persisted containing: `transferRequestId`, `actorId`, `actorRole`, `action`, `previousStatus`, `newStatus`, and `timestampUTC`.

15. **employee-internal-transfer.AC15 — Optimistic Concurrency Control (`NFR-06`):**
    Given two concurrent requests attempting to update the same transfer record or approve the same stage simultaneously, then the first request succeeds (version incremented) and the second request returns HTTP 409 Conflict with advice to refresh state.

---

## Unit Test Cases (Spec-Derived)

| Test ID | Maps to AC | Scenario | Expected Outcome |
|---|---|---|---|
| `employee-internal-transfer.UT01` | AC01 | Form submitted with effective date 7 days from now | Throws `ValidationError` (code 400), specifies minimum 14 calendar days notice. |
| `employee-internal-transfer.UT02` | AC01 | Form submitted where target manager equals employee ID | Throws `ValidationError` (code 400), "Applicant cannot be designated as target manager". |
| `employee-internal-transfer.UT03` | AC02 | Employee with request in `PENDING_CURRENT_MGR` posts a new transfer | Returns HTTP 409 Conflict with error code `ACTIVE_REQUEST_EXISTS`. |
| `employee-internal-transfer.UT04` | AC03 | Employee saves incomplete form as draft | Record saved with status `DRAFT`, zero notifications dispatched. |
| `employee-internal-transfer.UT05` | AC04 | Current Manager approves valid request | State transitions to `PENDING_NEW_MGR`, audit log entry recorded. |
| `employee-internal-transfer.UT06` | AC04 | Current Manager rejects request without justification comment | Throws `ValidationError` (code 400), justification required for rejection. |
| `employee-internal-transfer.UT07` | AC05 | New Manager approves request | State transitions to `PENDING_HR`, HR notification event emitted. |
| `employee-internal-transfer.UT08` | AC06 | HR Administrator approves request | State transitions to `PROCESSING_DOWNSTREAM`, 3 orchestration tasks spawned in `PENDING` state. |
| `employee-internal-transfer.UT09` | AC07 | HR Administrator rejects request | State transitions to `REJECTED`, 0 downstream tasks spawned. |
| `employee-internal-transfer.UT10` | AC08 | IT task fails while Payroll and Facilities succeed | IT task marked `FAILED`, overall request stays in `PROCESSING_DOWNSTREAM` with HR exception alert. |
| `employee-internal-transfer.UT11` | AC09 | All 3 downstream tasks complete successfully | Overall transfer request transitions to `COMPLETED`, audit log closed. |
| `employee-internal-transfer.UT12` | AC10 | Employee withdraws request in `PENDING_NEW_MGR` | Request status transitions to `WITHDRAWN`, pending tasks cancelled. |
| `employee-internal-transfer.UT13` | AC11 | Employee attempts to withdraw request in `PROCESSING_DOWNSTREAM` | Request rejected with HTTP 400 `INVALID_STATE`. |
| `employee-internal-transfer.UT14` | AC13 | Employee B requests `GET /api/transfers/:id` of Employee A's request | Returns HTTP 403 Forbidden, zero sensitive payload returned. |
| `employee-internal-transfer.UT15` | AC15 | Simultaneous approval decision submitted with stale version ID | Database rejects update, service returns HTTP 409 Conflict. |

---

## Explicitly Out of Scope
- External candidate hiring and applicant tracking (ATS).
- Compensation restructuring, salary negotiations, or discretionary allowances.
- Relocation expense claim submissions and fiscal reimbursements.
- Cross-border immigration, work permits, or multi-national tax compliance.
- Automated algorithmic HR policy eligibility evaluations (manual review in scope).
- Parallel manager approvals (sequential approval enforced).
- Post-completion transfer reversals or automatic rollback workflows.

---

## Non-Functional Constraints (from constitution.md & BRD v3.0)
- **API Performance:** Response latency < 200ms (P95) for all transfer lifecycle operations.
- **Workflow State Machine:** 100% deterministic state transitions enforced by schema and domain guard rules.
- **Security & PII:** Zero personally identifiable information (PII) like salary figures in debug or system logs; UUIDs and action enums only.
- **Audit Compliance:** 100% of transitions logged with actor ID, role, action, previous status, new status, and UTC timestamp. Retained for compliance.
- **Accessibility:** Frontend interfaces compliant with WCAG 2.1 Level AA standards.
