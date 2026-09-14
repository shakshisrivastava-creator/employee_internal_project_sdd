# Business Requirements Document (BRD)
## Project: Employee Internal Transfer Digital Journey

### Document Metadata
- **Project ID:** PRJ-EMP-TRANSFER
- **Version:** 1.1.0
- **Baseline Date:** 2026-09-14
- **Status:** Pending Review (Gate 0 BRD Review)
- **Author:** SDD Engineering Team
- **Assigned Gate 0 Reviewer:** Supratim Jetty (Tech Lead / PM, `supratim.jetty@intglobal.com`)
- **Methodology:** INT Specification-Driven Development (SDD)

---

## 1. Executive Summary & Business Objective
The organisation operates a centralized **One-Point Employee Portal** providing unified access to HR, payroll, IT, learning, facilities, and employee support services.

Currently, employee internal transfer requests rely on fragmented communication and manual, multi-team coordination across direct managers, receiving managers, HR policy teams, IT access management, payroll adjustments, and facilities allocation. This manual process causes significant delays, inconsistent rule enforcement, and a complete lack of real-time visibility for transferring employees.

The primary objective of this initiative is to **digitise and orchestrate the end-to-end internal transfer digital journey** within the One-Point Employee Portal:
- Automate multi-tiered sequential approvals (Current Releasing Manager → Target Receiving Manager → HR Administration).
- Orchestrate parallel downstream fulfillment across IT Provisioning, Payroll Adjustments, and Facilities Allocation.
- Deliver single-pane-of-glass transparency for employees to monitor live status and audit progression.
- Enforce strict eligibility checks, single-active-request constraints, and SLA tracking.

---

## 2. Primary Actors & Stakeholders

| Actor | Role & Responsibilities | Key Portal Interactions |
|---|---|---|
| **Employee (Applicant)** | Initiates, tracks, and manages personal transfer requests. | Submits transfer request form; views status timeline; cancels request (allowed before HR approval). |
| **Current Manager (Releasing)** | Line manager of the employee's current department. Evaluates operational/team capacity impact. | Reviews submitted request; approves (routes to receiving manager) or rejects with justification. |
| **Receiving Manager** | Line manager of target department/role. Evaluates role fit, headcount, and budget. | Reviews request and current manager's approval; approves (routes to HR) or rejects with justification. |
| **HR Administrator** | Enforces organizational policies, grade alignment, tenure eligibility, and compliance. | Validates employee eligibility; approves (triggers downstream orchestration) or rejects. |
| **IT Specialist** | Manages systems, permissions, email accounts, and equipment provisioning. | Receives IT task post-HR approval; provisions hardware/software access; marks task completed. |
| **Payroll Specialist** | Adjusts compensation bands, cost center allocations, tax jurisdiction, and payroll records. | Receives Payroll task post-HR approval; updates payroll systems; marks task completed. |
| **Facilities Specialist** | Coordinates workspace allocations, building access cards, and desk equipment. | Receives Facilities task post-HR approval; assigns desk and badge access; marks task completed. |
| **System (Portal Engine)** | Orchestrates workflow state machine, triggers parallel tasks, dispatches notifications, and logs audit events. | Automated routing, notification dispatch, state transitions, validation enforcement. |

---

## 3. Scope Definition

### 3.1 In-Scope Capabilities
- Self-service internal transfer initiation with target department, business unit, location, role, effective date, and optional purpose.
- Enforced validation rules (minimum 14 calendar days advance effective date, single active transfer limit).
- Sequential approval gates: Current Line Manager ➔ Target Receiving Manager ➔ HR Policy Administrator.
- Parallel downstream task spawning post-HR approval (IT Provisioning, Payroll Update, Facilities Arrangement).
- Independent fulfillment and completion tracking for each downstream task.
- Automated state advancement to `COMPLETED` upon final downstream task completion.
- Self-service cancellation by employee (permitted prior to HR approval; locked thereafter).
- Real-time visual progress timeline, stage status, and pending actor display.
- Immutable event audit logging across all state transitions and human actions.
- In-app and email notifications to relevant actors at every workflow milestone.

### 3.2 Explicitly Out-of-Scope
- Cross-company legal entity employment transfers and statutory immigration handling.
- Automated salary recalculations or promotion pay adjustments (handled separately by HR Compensation).
- Involuntary restructuring, redundancies, or department mergers.
- Physical courier shipping tracking for hardware/laptops.
- Multi-language localisation (initial release English only).
- Mobile native application (responsive web portal application only).

---

## 4. Functional Requirements Baseline

### [BRD-001] Transfer Request Initiation & Validation
- **Requirement:** The One-Point Employee Portal shall allow authenticated employees to submit an internal transfer request.
- **Mandatory Input Fields:**
  - Target Department (dropdown / lookup)
  - Target Business Unit (dropdown / lookup)
  - Target Location / Office Campus (dropdown / lookup)
  - Target Role / Position (dropdown / lookup)
  - Proposed Effective Date (date picker, must be >= 14 calendar days in the future)
  - Optional Reason / Statement of Purpose (free-text, max 1000 characters)
- **Constraint:** An employee cannot submit a new request if they currently have an active transfer in `PENDING_CURRENT_MANAGER_APPROVAL`, `PENDING_RECEIVING_MANAGER_APPROVAL`, `PENDING_HR_VALIDATION`, or `IN_PROGRESS`.

### [BRD-002] Releasing (Current) Line Manager Approval Gate
- **Requirement:** Upon successful submission, the system shall route the request to the employee's current line manager.
- **Actions Available:**
  - **Approve:** Advances request to `PENDING_RECEIVING_MANAGER_APPROVAL` and alerts Receiving Manager.
  - **Reject:** Requires mandatory rejection remarks; transitions request to terminal `REJECTED` state and alerts employee.

### [BRD-003] Target Receiving Line Manager Approval Gate
- **Requirement:** Upon Current Manager approval, the request routes to the receiving manager of the target role.
- **Actions Available:**
  - **Approve:** Advances request to `PENDING_HR_VALIDATION` and alerts HR Administration.
  - **Reject:** Requires mandatory rejection remarks; transitions request to terminal `REJECTED` state and alerts employee and current manager.

### [BRD-004] HR Administrator Policy Validation Gate
- **Requirement:** Upon dual-manager approval, the request routes to HR Administration for eligibility review.
- **Eligibility Checks:** Tenure in current role (>= 6 months), performance standing, and headcount budget.
- **Actions Available:**
  - **Approve:** Advances request to `IN_PROGRESS` and simultaneously initiates parallel downstream tasks.
  - **Reject:** Requires mandatory rejection remarks; transitions request to terminal `REJECTED` state.

### [BRD-005] Parallel Downstream Task Orchestration
- **Requirement:** When HR approves, the system shall spawn three independent, parallel tasks:
  1. **IT Task:** System access provisioning and equipment allocation.
  2. **Payroll Task:** Cost center allocation and compensation schedule update.
  3. **Facilities Task:** Workspace desk assignment and building access badges.
- **Completion Rule:** Each task owner marks their task completed independently. When all 3 tasks are complete, the request automatically transitions to `COMPLETED`.

### [BRD-006] Employee Tracking & Self-Service Cancellation
- **Requirement:** Employees shall have 24/7 access to view their transfer progress timeline and pending actions.
- **Cancellation Policy:**
  - Allowed during `PENDING_CURRENT_MANAGER_APPROVAL` and `PENDING_RECEIVING_MANAGER_APPROVAL`.
  - Strictly locked once request enters `PENDING_HR_VALIDATION` or `IN_PROGRESS`.

---

## 5. Business Rules & Logic

- **BR-001 (Single Active Request):** Only one active (non-terminal) transfer request per employee at any given time.
- **BR-002 (Notice Period):** Proposed effective date must be at least 14 calendar days after submission date.
- **BR-003 (Sequential Hierarchy):** Approval must follow strict sequence: Current Manager ➔ Receiving Manager ➔ HR.
- **BR-004 (Mandatory Rejection Comments):** Any rejection action requires non-empty feedback (minimum 10 characters).
- **BR-005 (Parallel Fulfillment):** Downstream tasks (IT, Payroll, Facilities) execute concurrently without inter-task dependencies.
- **BR-006 (Cancellation Boundary):** Cancellation is disallowed once receiving manager approves (entering HR review).
- **BR-007 (Audit Immutability):** All state changes, human approvals, task closures, and comments are write-once, tamper-evident records.

---

## 6. Non-Functional Requirements & Constraints

- **NFR-001 (Performance):** 95th percentile response time for API read endpoints < 200ms; mutation/approval endpoints < 500ms.
- **NFR-002 (Security & RBAC):** Strict JWT authentication and role-based permissions preventing cross-tenant or unauthorized approvals.
- **NFR-003 (Data Privacy):** Sensitive payroll notes and HR policy remarks accessible only to HR and Payroll roles.
- **NFR-004 (Reliability):** Idempotent state transitions preventing duplicate task spawning or race conditions.
- **NFR-005 (TDD Discipline):** 100% test-first Red-Green methodology with minimum 90% coverage on core workflow state logic.

---

## 7. Derivation of Business Modules

Based on the functional boundaries established in this BRD and approved in `architecture.md`, the system derives the following core business modules:

```text
src/backend/modules/
├── transfers/          # Request initiation, validation, details, cancellation, employee queries
├── approvals/          # Multi-stage manager and HR approval decision engines & audit logs
├── orchestration/      # Parallel downstream task management (IT, Payroll, Facilities)
└── notifications/      # Event-driven in-app alerts and email dispatcher
```
