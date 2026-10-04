# Spec: Employee Internal Transfer Digital Journey

## Spec ID
internal-transfer-journey

## Status
Rejected

## Roles & Assignments
- **Developer:** Antigravity AI / Developer
- **Gate 1 Reviewer(s):** Supratim Jetty (`supratim.jetty@intglobal.com`)
- **Gate 2 Reviewer(s):** Supratim Jetty (`supratim.jetty@intglobal.com`)

## Linked BRD
.ai-context/BRD.md#BRD-001

## Gate Approvals & History
| Gate | Approver Name | Approver Email/ID | Date/Time | Outcome | Approval Comment / Summary |
|---|---|---|---|---|---|
| Gate 1 (Spec Review) | Supratim Jetty | supratim.jetty@intglobal.com | 2026-10-04 17:28:43 | Rejected | "Requirements scope mismatch and missing edge-case handling for cross-department transfers. Return to BRD ingestion." |
| Gate 2 (Code Review) | Supratim Jetty | supratim.jetty@intglobal.com | Pending | Not Started | "Pending Implementation & GREEN tests" |

## Intent
The Employee Internal Transfer Digital Journey provides a unified, self-service digital capability within the One-Point Employee Portal that enables eligible employees to initiate internal job/location transfer requests, orchestrates multi-stage approvals across releasing and receiving line managers and HR administration, tracks parallel downstream execution across IT, Payroll, and Facilities, and delivers real-time visibility and status tracking.

## Context
- Builds on: .ai-context/architecture.md (Modular Monolith Architecture, Workflow State Machine)
- Linked BRD: .ai-context/BRD.md (BRD-001 through BRD-006)
- Constitution: .ai-context/constitution.md (RBAC, TDD Red-Green, API Performance)

## API Contract

### internal-transfer-journey.API01 — POST /api/v1/transfers
**Description:** Initiates and submits a new internal transfer request.

**Request payload:**
```json
{
  "targetDepartment": "Engineering",
  "targetBusinessUnit": "Digital Platforms",
  "targetLocation": "London HQ",
  "targetRole": "Senior Fullstack Engineer",
  "proposedEffectiveDate": "2026-10-15",
  "reason": "Relocating to London office to join core platform team."
}
```

**Success response (`201 Created`):**
```json
{
  "requestId": "TR-2026-00101",
  "employeeId": "EMP-8821",
  "status": "PENDING_CURRENT_MANAGER_APPROVAL",
  "currentStage": "RELEASING_MANAGER_REVIEW",
  "submittedAt": "2026-09-14T11:40:00Z",
  "targetDetails": {
    "targetDepartment": "Engineering",
    "targetBusinessUnit": "Digital Platforms",
    "targetLocation": "London HQ",
    "targetRole": "Senior Fullstack Engineer",
    "proposedEffectiveDate": "2026-10-15",
    "reason": "Relocating to London office to join core platform team."
  }
}
```

**Exceptions:**
| Code | Condition | Response body |
|---|---|---|
| 400 | Missing mandatory fields or effective date < 14 days notice | `{"error": "VALIDATION_FAILED", "message": "Effective date must be at least 14 days in advance"}` |
| 409 | Employee already has an active, non-terminal transfer request | `{"error": "ACTIVE_REQUEST_EXISTS", "message": "Employee has an active transfer request: TR-2026-00089"}` |
| 401 | Missing or invalid JWT authorization token | `{"error": "UNAUTHORIZED", "message": "Authentication required"}` |

---

### internal-transfer-journey.API02 — GET /api/v1/transfers/:requestId
**Description:** Fetches complete details, timeline, and current stage of a transfer request.

**Success response (`200 OK`):**
```json
{
  "requestId": "TR-2026-00101",
  "employeeId": "EMP-8821",
  "employeeName": "Jane Doe",
  "status": "PENDING_RECEIVING_MANAGER_APPROVAL",
  "currentManagerApproval": {
    "status": "APPROVED",
    "approvedBy": "John Smith",
    "approvedAt": "2026-09-14T12:00:00Z",
    "comments": "Endorsed. Handover scheduled."
  },
  "receivingManagerApproval": {
    "status": "PENDING",
    "assignedTo": "Alice Johnson"
  },
  "hrValidation": {
    "status": "NOT_STARTED"
  },
  "downstreamTasks": {
    "it": { "status": "NOT_STARTED", "completedAt": null },
    "payroll": { "status": "NOT_STARTED", "completedAt": null },
    "facilities": { "status": "NOT_STARTED", "completedAt": null }
  },
  "timeline": [
    { "stage": "SUBMITTED", "actor": "Jane Doe", "timestamp": "2026-09-14T11:40:00Z" },
    { "stage": "CURRENT_MANAGER_APPROVED", "actor": "John Smith", "timestamp": "2026-09-14T12:00:00Z" }
  ]
}
```

---

### internal-transfer-journey.API03 — POST /api/v1/transfers/:requestId/actions
**Description:** Submits an approval or rejection action for Current Manager, Receiving Manager, or HR Administrator.

**Request payload:**
```json
{
  "action": "APPROVE",
  "comments": "Approved from capacity and role perspective."
}
```

**Success response (`200 OK`):**
```json
{
  "requestId": "TR-2026-00101",
  "status": "PENDING_HR_VALIDATION",
  "action": "APPROVE",
  "actorId": "MGR-4401",
  "processedAt": "2026-09-14T12:30:00Z"
}
```

**Exceptions:**
| Code | Condition | Response body |
|---|---|---|
| 400 | Reject action submitted without mandatory comments | `{"error": "REJECTION_REASON_REQUIRED", "message": "Rejection comments are mandatory"}` |
| 403 | Authenticated actor does not hold permission for the current workflow stage | `{"error": "FORBIDDEN", "message": "Actor not authorized for current approval gate"}` |

---

### internal-transfer-journey.API04 — POST /api/v1/transfers/:requestId/cancel
**Description:** Cancels an active transfer request (allowed only prior to HR approval).

**Request payload:**
```json
{
  "cancellationReason": "Personal circumstances changed."
}
```

**Success response (`200 OK`):**
```json
{
  "requestId": "TR-2026-00101",
  "status": "CANCELLED",
  "cancelledAt": "2026-09-14T13:00:00Z"
}
```

**Exceptions:**
| Code | Condition | Response body |
|---|---|---|
| 400 | Cancellation attempted after HR validation approval | `{"error": "CANCELLATION_LOCKED", "message": "Cannot cancel transfer once HR validation is approved"}` |

---

### internal-transfer-journey.API05 — POST /api/v1/transfers/:requestId/tasks/:taskType/complete
**Description:** Marks a parallel downstream task (`it`, `payroll`, or `facilities`) as completed.

**Request payload:**
```json
{
  "notes": "System access granted, laptop dispatched."
}
```

**Success response (`200 OK`):**
```json
{
  "requestId": "TR-2026-00101",
  "taskType": "it",
  "taskStatus": "COMPLETED",
  "overallTransferStatus": "IN_PROGRESS",
  "remainingTasks": ["payroll", "facilities"]
}
```

---

## Acceptance Criteria

### [internal-transfer-journey.AC01] Submission Validation
Given an authenticated employee on the Transfer Request form, when they provide valid target department, business unit, location, role, and an effective date >= 14 days in the future, then the system creates the request with status `PENDING_CURRENT_MANAGER_APPROVAL`, assigns a unique request ID, and dispatches a notification to the current line manager.

### [internal-transfer-journey.AC02] Active Request Conflict Prevention
Given an employee with an existing transfer request in a non-terminal state (`PENDING_CURRENT_MANAGER_APPROVAL`, `PENDING_RECEIVING_MANAGER_APPROVAL`, `PENDING_HR_VALIDATION`, or `IN_PROGRESS`), when they attempt to submit a new transfer request, then the system rejects the submission with HTTP 409 Conflict.

### [internal-transfer-journey.AC03] Current Line Manager Approval
Given a transfer request in `PENDING_CURRENT_MANAGER_APPROVAL`, when the employee's current line manager approves the request, then the status transitions to `PENDING_RECEIVING_MANAGER_APPROVAL`, an approval audit record is stored, and the receiving manager receives an approval task notification.

### [internal-transfer-journey.AC04] Current Line Manager Rejection
Given a transfer request in `PENDING_CURRENT_MANAGER_APPROVAL`, when the current line manager rejects the request with a mandatory reason, then the status transitions to `REJECTED`, the rejection reason is recorded, and the employee is notified.

### [internal-transfer-journey.AC05] Receiving Manager Approval
Given a transfer request in `PENDING_RECEIVING_MANAGER_APPROVAL`, when the receiving manager approves the request, then the status transitions to `PENDING_HR_VALIDATION`, and an approval notification is dispatched to HR Administration.

### [internal-transfer-journey.AC06] Receiving Manager Rejection
Given a transfer request in `PENDING_RECEIVING_MANAGER_APPROVAL`, when the receiving manager rejects the request, then the status transitions to `REJECTED`, and both the employee and current manager are notified.

### [internal-transfer-journey.AC07] HR Policy Validation Approval
Given a transfer request in `PENDING_HR_VALIDATION`, when the HR Administrator verifies policy compliance and approves, then the status transitions to `IN_PROGRESS`, and three parallel downstream tasks (`it`, `payroll`, `facilities`) are spawned.

### [internal-transfer-journey.AC08] HR Validation Rejection
Given a transfer request in `PENDING_HR_VALIDATION`, when HR rejects the request with comments, then the status transitions to `REJECTED`, and all previous stakeholders are notified.

### [internal-transfer-journey.AC09] Parallel Downstream Task Execution
Given a transfer request in `IN_PROGRESS`, when IT, Payroll, or Facilities specialists complete their respective tasks in any arbitrary order, then the individual task flags are updated independently.

### [internal-transfer-journey.AC10] Automatic Transfer Completion
Given a transfer request in `IN_PROGRESS` with 2 of 3 downstream tasks completed, when the final remaining downstream task is marked completed, then the overall transfer status automatically transitions to `COMPLETED`, and a final confirmation notification is sent to the employee.

### [internal-transfer-journey.AC11] Pre-HR Employee Cancellation
Given a transfer request in `PENDING_CURRENT_MANAGER_APPROVAL` or `PENDING_RECEIVING_MANAGER_APPROVAL`, when the employee requests cancellation, then the status transitions to `CANCELLED`, pending approvals are aborted, and all parties are notified.

### [internal-transfer-journey.AC12] Post-HR Cancellation Lock
Given a transfer request in `PENDING_HR_VALIDATION` (after receiving manager approval) or `IN_PROGRESS`, when an employee attempts cancellation, then the system blocks the action and returns an error explaining cancellation is locked post-manager approval.

### [internal-transfer-journey.AC13] Employee Status Tracking & Timeline
Given an authenticated employee viewing their transfer request, when they open the tracking view, then they see the real-time stage, active actor, downstream sub-task statuses, and timestamped audit history.

### [internal-transfer-journey.AC14] Role-Based Access Control (RBAC)
Given an unauthenticated or unauthorized user, when they attempt to perform manager approvals, HR validation, or complete downstream tasks, then the system returns HTTP 401 or 403 Forbidden.

### [internal-transfer-journey.AC15] Immutable Event Audit Trail
Given any lifecycle transition (submission, approvals, rejections, task completions, cancellation), when the action occurs, then an immutable audit log entry is recorded with actor ID, actor role, timestamp, action type, and comments.

---

## Unit Test Cases (Spec-Derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| `internal-transfer-journey.UT01` | AC01 | Submit transfer with valid fields & date >= 14 days | Request created in `PENDING_CURRENT_MANAGER_APPROVAL` with ID generated |
| `internal-transfer-journey.UT02` | AC01 | Submit transfer with effective date < 14 days | Validation error returned (HTTP 400) |
| `internal-transfer-journey.UT03` | AC02 | Submit transfer when employee has active request in progress | Conflict error returned (HTTP 409) |
| `internal-transfer-journey.UT04` | AC03 | Current manager approves request | State transitions to `PENDING_RECEIVING_MANAGER_APPROVAL` |
| `internal-transfer-journey.UT05` | AC04 | Current manager rejects request without comments | Validation error: comment required (HTTP 400) |
| `internal-transfer-journey.UT06` | AC04 | Current manager rejects request with comments | State transitions to `REJECTED` |
| `internal-transfer-journey.UT07` | AC05 | Receiving manager approves request | State transitions to `PENDING_HR_VALIDATION` |
| `internal-transfer-journey.UT08` | AC06 | Receiving manager rejects request with comments | State transitions to `REJECTED` |
| `internal-transfer-journey.UT09` | AC07 | HR administrator approves request | State transitions to `IN_PROGRESS`, 3 downstream tasks created |
| `internal-transfer-journey.UT10` | AC08 | HR administrator rejects request | State transitions to `REJECTED` |
| `internal-transfer-journey.UT11` | AC09 | Mark IT task complete while payroll and facilities pending | IT status updated, overall request remains `IN_PROGRESS` |
| `internal-transfer-journey.UT12` | AC10 | Complete third and final downstream task | Overall request state automatically transitions to `COMPLETED` |
| `internal-transfer-journey.UT13` | AC11 | Employee cancels during `PENDING_CURRENT_MANAGER_APPROVAL` | State transitions to `CANCELLED` |
| `internal-transfer-journey.UT14` | AC12 | Employee attempts cancellation during `IN_PROGRESS` | Cancellation blocked with HTTP 400 error |
| `internal-transfer-journey.UT15` | AC14 | Non-manager user attempts manager approval endpoint | HTTP 403 Forbidden returned |

---

## Explicitly Out of Scope
- Automatic payroll calculation or bank account restructuring.
- Cross-company legal entity transfer contracts.
- Physical hardware shipment logistics or tracking.
- Automated Active Directory account creation via LDAP (mock orchestration interface only).

---

## Non-Functional Constraints (from constitution.md)
- **Performance:** Read queries p95 < 200ms; state transition mutations p95 < 500ms.
- **Security:** Strict JWT validation and RBAC authorization on every route.
- **Coverage:** >= 90% unit test coverage on domain services and state transitions.
- **Traceability:** All automated test files mirror domain module structure and map to AC IDs.
