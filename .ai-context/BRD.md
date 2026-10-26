# Business Requirements Document (BRD) — v4.0

## Employee Internal Transfer Digital Journey

---

| Field            | Detail                                     |
| ---------------- | ------------------------------------------ |
| **Project Name** | Employee Internal Transfer Digital Journey |
| **Feature Slug** | `employee-internal-transfer`               |
| **BRD Version**  | 4.0 (Proxy-Initiated Transfer Scenarios)   |
| **Author**       | Shakshi                                    |
| **Previous Version** | 3.0 (Comprehensive — All Scenarios) — Approved 2026-10-05 |
| **Change Summary** | Added proxy-initiated transfer scenarios (Manager-proxy, HR-proxy). Introduced `initiatedById` / `transferringEmployeeId` separation. Resolved 7 open business decisions. |
| **Gate 0 Reviewer** | Supratim Jetty (`supratim.jetty@intglobal.com`) |
| **Gate 0 Status** | 🟡 Pending Re-Approval (v4.0 Change)        |
| **Previous Gate 0** | Approved (2026-10-05 13:39:28) — `.ai-context/pr_reviews/GATE0-BRD-v3.0-20261005-133928.md` |
| **Gate 2 Status** | ⛔ Suspended — Gate 0 re-approval required before Gate 2 can resume |
| **SDD Phase**    | Gate 0 Re-Review Required (BRD v4.0 Change) |

> **IMPORTANT — Change Classification Legend used throughout this document:**
> - `[EXISTING]` — Requirement unchanged from BRD v3.0
> - `[NEW]` — Newly proposed requirement added in BRD v4.0
> - `[MODIFIED]` — Existing requirement updated in BRD v4.0
> - `[DECIDED]` — Business decision resolved during v4.0 authoring (from open question)

---

## Table of Contents

1. Executive Summary
2. Business Objectives
3. Problem Statement — AS-IS vs TO-BE
4. Scope & Boundaries
5. Stakeholders & Actor Matrix
6. Complete Employee Journey — Step-by-Step Scenarios
   - Scenarios A–N: `[EXISTING]` (unchanged from v3.0)
   - Scenario P: `[NEW]` Manager-Proxy Initiated Transfer
   - Scenario Q: `[NEW]` HR-Proxy Initiated Transfer
   - Scenario R: `[NEW]` Manager Raises Transfer for Themselves (Self-Initiated Path)
7. Functional Business Requirements
8. Business Rules
9. Request Lifecycle & State Machine
10. Notification Matrix
11. Non-Functional Requirements
12. Working Assumptions & Resolved Open Questions
13. Risk Register
14. Dependencies & External Systems
15. Out-of-Scope Items
16. Glossary

---

## 1. Executive Summary

The organisation operates a **One-Point Employee Portal** providing employees with unified access to HR, Payroll, IT, Learning, Facilities, and other employee services.

Today, when an employee wishes to internally transfer to a new department, location, or role, they must manually interact with multiple teams through email, telephone, and fragmented approval chains. There is no single system of record, no employee-facing tracking, and high risk that critical downstream steps (IT access, payroll update, workspace allocation) are missed or delayed.

This BRD defines the complete requirements to digitise the **Employee Internal Transfer Journey** end-to-end within the One-Point Employee Portal. The portal will:

- Accept and validate transfer requests from employees.
- Route approvals to the correct stakeholders in the correct sequence.
- Orchestrate all downstream departmental tasks automatically.
- Provide employees with a single real-time view of every step.
- Maintain an immutable audit trail of every action and transition.

---

## 2. Business Objectives

| Objective ID | Objective                                                                                        | Measurable Success Criteria                                             |
| ------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| BO-01        | Provide a single digital entry point for employees to initiate a transfer request.               | 100% of transfer requests initiated via the portal.                     |
| BO-02        | Eliminate manual email-based handoffs between departments.                                       | Zero email handoffs for standard transfer routing.                      |
| BO-03        | Orchestrate downstream activities (HR, IT, Payroll, Facilities) automatically after HR approval. | Downstream tasks spawned within 60 seconds of HR approval.              |
| BO-04        | Give employees real-time visibility of their request status at every stage.                      | Employee can view current stage and pending actor at all times.         |
| BO-05        | Provide each stakeholder with a dedicated digital action interface.                              | Managers, HR, and downstream teams act via portal — no manual triage.   |
| BO-06        | Enforce compliance through mandatory rejection reasons and immutable audit logging.              | 100% of state transitions are logged with actor, action, and timestamp. |
| BO-07        | Reduce average transfer processing time.                                                         | Baseline: current process ≥ 30 days. Target: ≤ 14 working days.         |

---

## 3. Problem Statement — AS-IS vs TO-BE

### 3.1 Current State (AS-IS)

The current transfer process is entirely manual, informal, and fragmented:

```
Step 1: Employee verbally or informally discusses transfer with Current Manager.
         ↓ (No formal record created)
Step 2: Current Manager informally consents via email or verbal agreement.
         ↓ (No routing mechanism)
Step 3: Employee separately contacts or emails the proposed New Manager for consent.
         ↓ (Manual follow-up; no SLA)
Step 4: Employee raises request with HR who manually checks eligibility records.
         ↓ (HR checks spreadsheets; no audit trail)
Step 5: HR manually updates the HRMS with new org structure details.
         ↓ (No trigger to downstream systems)
Step 6: IT receives a manual ticket or email to update system access.
         ↓ (Often missed or delayed)
Step 7: Payroll manually aligns compensation/location changes.
         ↓ (Risk of missed payroll cycle)
Step 8: Facilities arranges the employee's new workspace via email.
         ↓ (No SLA; often left to the last day)
Step 9: Employee receives informal, fragmented confirmation (if at all).
```

**Key Pain Points:**

- No single system of record. Transfer details exist only in email threads.
- Employee has zero visibility of where their request stands after submission.
- No formal deadlines — each step can stall indefinitely.
- Rejection reasons are never formally communicated.
- Downstream steps (IT, Payroll, Facilities) are frequently missed.
- No audit trail — compliance risk in regulated industries.
- Duplicate or conflicting requests can exist simultaneously.

### 3.2 Future State (TO-BE)

```
Step 1: Employee opens One-Point Portal and completes the transfer request form.
Step 2: Form submitted → auto-routed to Current Manager for approval.
Step 3: Current Manager approves → auto-routed to New Manager for approval.
Step 4: New Manager approves → auto-routed to HR for eligibility validation.
Step 5: HR approves → portal auto-spawns 4 parallel downstream tasks:
          ├── HR Org Update (HRMS)
          ├── IT Access Provisioning (ITSM)
          ├── Payroll Alignment
          └── Facilities Workspace Allocation
Step 6: Each team marks their task complete via the portal.
Step 7: When all tasks complete → Employee receives final confirmation.
Employee views real-time status dashboard at every step.
Every action is audit-logged.
```

---

## 4. Scope & Boundaries

### 4.1 In Scope

- `[EXISTING]` Employee-facing transfer request initiation form with validation.
- `[EXISTING]` Save-as-Draft capability for incomplete requests.
- `[EXISTING]` Sequential dual-manager approval flow (Current Manager → New Manager).
- `[EXISTING]` HR eligibility validation step with mandatory justification on rejection.
- `[EXISTING]` Downstream orchestration task management for 4 departments: HR Org Update, IT Access, Payroll Update, Facilities.
- `[EXISTING]` Employee-facing real-time status dashboard showing all journey stages and pending actors.
- `[EXISTING]` Employee withdrawal of submitted requests (prior to HR approval).
- `[EXISTING]` Rejection at any stage with mandatory rejection reason and employee notification.
- `[EXISTING]` Role-based access control (RBAC) ensuring each actor can only view and act on their assigned items.
- `[EXISTING]` Immutable audit trail for every lifecycle action.
- `[EXISTING]` Stakeholder notifications (email + in-portal) at every stage transition.
- `[EXISTING]` Reference data dropdown population (Departments, Locations, Roles).
- `[NEW]` **Proxy-Initiated Transfer**: A Manager may raise a transfer request on behalf of one of their own direct reports. The system records the initiator (`initiatedById`) separately from the transferring employee (`transferringEmployeeId`).
- `[NEW]` **HR-Proxy Initiated Transfer**: An HR Administrator may raise a transfer request on behalf of any employee in the organisation. Both roles recorded separately.
- `[NEW]` **Proxy Draft Management**: A proxy initiator (Manager or HR) may save and edit a draft on behalf of the transferring employee.
- `[NEW]` **Proxy Notification on Submission**: When a proxy initiates a request on behalf of an employee, the transferring employee is immediately notified.
- `[NEW]` **Dual Withdrawal Rights for Proxy Requests**: Either the transferring employee or the proxy initiator may withdraw a proxy-initiated request, subject to the same pre-HR lockout window.
- `[NEW]` **Modified Approval Routing for Manager-Proxy**: When a Manager raises a proxy request, the Current Manager approval step is skipped (proxy consent is implicit); the request routes directly to New Manager approval.

### 4.2 Out of Scope

| OOS ID | Item                                                     | Reason                                                                  |
| ------ | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| OOS-01 | External recruitment or new-hire onboarding              | Different journey; separate module.                                     |
| OOS-02 | Salary negotiation or compensation renegotiation         | Handled by a separate Compensation module.                              |
| OOS-03 | Physical relocation expense reimbursements               | Handled by a dedicated Relocation module.                               |
| OOS-04 | Cross-border legal, immigration, or visa compliance      | Deferred to future international expansion phase.                       |
| OOS-05 | Automated algorithmic HR eligibility rules               | Manual HR review is in scope; automated rule engine is deferred.        |
| OOS-06 | Parallel manager approval (both managers simultaneously) | Sequential is assumed; parallel deferred pending business confirmation. |
| OOS-07 | Performance-based transfer decisions                     | Separate Performance Management module.                                 |
| OOS-08 | Transfer reversal or rollback after COMPLETED state      | Out of scope for this phase.                                            |

---

## 5. Stakeholders & Actor Matrix

| Actor | Role | Change | Responsibilities in Journey | Portal Access Level |
| --- | --- | --- | --- | --- |
| **Employee** | `[EXISTING]` Self-Initiator / Transferring Employee | `[MODIFIED]` Now may also be the recipient of a proxy-initiated request | Draft, submit, track, withdraw own request. Receives notification if a proxy initiates on their behalf. | Own requests only. |
| **Current Manager** | `[EXISTING]` Outbound Approver / `[NEW]` Proxy Initiator | `[MODIFIED]` Dual role added | **Approver role:** First approval gate for self-initiated requests. **Proxy role `[NEW]`:** May initiate a transfer request on behalf of one of their own direct reports. Proxy initiation skips the Current Manager approval step (consent implicit in initiation). | Requests where they are the current manager; `[NEW]` can initiate proxy requests for own direct reports only. |
| **New Manager** | `[EXISTING]` Inbound Approver | No change | Second approval gate. Reviews request to accept the employee into their team. Can approve or reject with a reason. Receives proxy-initiated requests identically to self-initiated. | Requests targeted at their department. |
| **HR Administrator** | `[EXISTING]` Eligibility Validator / `[NEW]` Proxy Initiator | `[MODIFIED]` Proxy role added | **Validator role:** Third approval gate. **Proxy role `[NEW]`:** May initiate a transfer request on behalf of any employee in the organisation. HR-initiated requests still go through the full approval chain; HR initiator cannot approve their own proxy request. | All requests in PENDING_HR_VALIDATION; `[NEW]` can initiate proxy requests for any employee. |
| **IT Administrator** | `[EXISTING]` Downstream Executor | No change | Reviews IT access requirements. Marks IT task as COMPLETED or FAILED. | Assigned IT orchestration tasks. |
| **Payroll Administrator** | `[EXISTING]` Downstream Executor | No change | Updates payroll records. Marks Payroll task as COMPLETED or FAILED. | Assigned Payroll orchestration tasks. |
| **Facilities Administrator** | `[EXISTING]` Downstream Executor | No change | Allocates workspace at the new location. Marks Facilities task as COMPLETED or FAILED. | Assigned Facilities orchestration tasks. |
| **`initiatedById` vs `transferringEmployeeId`** | `[NEW]` Conceptual distinction | `[NEW]` | In proxy scenarios, `initiatedById` = the person who submitted (Manager or HR), `transferringEmployeeId` = the employee actually transferring. In self-initiated, both fields are identical. All approval routing, eligibility checks, duplicate-request validation, and IDOR enforcement must use `transferringEmployeeId`. | N/A — system field distinction |

---

## 6. Complete Employee Journey — Step-by-Step Scenarios

This section covers every scenario an employee or stakeholder may encounter, including the happy path, rejection paths, withdrawal, and failure handling.

---

### Scenario A: Happy Path — Successful Transfer (End-to-End)

**Description**: Employee submits a complete, valid transfer request that is approved at every stage.

#### Stage A1: Employee Submits Request

1. Employee logs into the One-Point Portal using SSO credentials.
2. Employee navigates to **My Transfers → New Transfer Request**.
3. The form loads with dropdowns populated from the Reference Data API:
   - **New Department** (mandatory)
   - **New Location** (mandatory)
   - **New Role / Job Position** (mandatory)
   - **Effective Date** (mandatory — minimum 14 calendar days from today)
   - **Reason for Transfer** (optional — max 500 characters)
4. Employee completes all fields and clicks **Submit**.
5. System validates all mandatory fields and the effective date constraint.
6. Request is created with status **PENDING_CURRENT_MANAGER_APPROVAL**.
7. Employee sees a success screen: _"Your transfer request has been submitted. Request ID: TRF-00142."_
8. Current Manager receives an email + in-portal notification.

#### Stage A2: Current Manager Approves

1. Current Manager logs into the portal and sees a notification: _"Action Required: Transfer Request TRF-00142."_
2. Current Manager opens the request and reviews: Employee name, proposed department, role, location, and effective date.
3. Current Manager clicks **Approve** (optionally enters a comment).
4. Request status changes to **PENDING_NEW_MANAGER_APPROVAL**.
5. New Manager receives an email + in-portal notification.
6. Employee receives a notification: _"Your current manager has approved your transfer request."_

#### Stage A3: New Manager Approves

1. New Manager logs into the portal and reviews the inbound transfer request.
2. New Manager clicks **Approve**.
3. Request status changes to **PENDING_HR_VALIDATION**.
4. HR Administrator receives an email + in-portal notification.
5. Employee receives a notification: _"Your new manager has approved your transfer request. HR review in progress."_

#### Stage A4: HR Validates and Approves

1. HR Administrator opens the request, reviews all details, and verifies the employee's eligibility (manual review — tenure, performance standing).
2. HR Administrator clicks **Approve**.
3. Request status changes to **PROCESSING_DOWNSTREAM**.
4. Portal automatically spawns 4 orchestration tasks (all initially in PENDING):
   - **HR Org Update** — HR team to update HRMS hierarchy.
   - **IT Access** — IT team to update system access.
   - **Payroll Update** — Payroll team to align compensation records.
   - **Facilities** — Facilities team to arrange workspace.
5. Each team's admin receives an email + in-portal notification for their task.
6. Employee receives a notification: _"HR has approved your transfer. Your request is now being processed by HR, IT, Payroll, and Facilities."_

#### Stage A5: Downstream Teams Complete Their Tasks

1. Each team's administrator logs into the portal and marks their task as **COMPLETED** (independently — order does not matter).
2. As each task is completed, the employee's status dashboard updates in real time.
3. Once the final task is marked COMPLETED, the portal automatically transitions the overall request to **COMPLETED**.

#### Stage A6: Transfer Completed

1. Request status transitions to **COMPLETED**.
2. Employee receives a final confirmation notification: _"Congratulations! Your internal transfer is complete. You will be joining [New Department] in [New Location] as [New Role] effective [Date]."_
3. Employee can view the completed request with full audit history.

---

### Scenario B: Save as Draft and Resume

**Description**: Employee begins filling the form but is not ready to submit. They save and return later.

1. Employee navigates to the transfer form and fills in partial details.
2. Employee clicks **Save as Draft**.
3. Request is saved with status **DRAFT**.
4. No stakeholder is notified.
5. Employee sees a confirmation: _"Your request has been saved as a draft. You can return and complete it later."_
6. Later, employee returns to **My Transfers** and opens the draft.
7. Employee completes the remaining mandatory fields and clicks **Submit**.
8. Full validation runs. If valid, request transitions to **PENDING_CURRENT_MANAGER_APPROVAL**.
9. Journey continues as in Scenario A.

---

### Scenario C: Current Manager Rejects the Request

**Description**: The current manager declines the transfer request.

1. Current Manager reviews the request.
2. Current Manager clicks **Reject** and is required to enter a rejection reason (mandatory — cannot be empty).
3. System validates that a reason has been provided.
4. Request status transitions to **REJECTED**.
5. Employee receives a notification: _"Your transfer request has been rejected by your current manager. Reason: [Rejection Reason]."_
6. New Manager is NOT notified (request is already closed).
7. Employee views the request status showing **REJECTED** with the rejection reason and stage (Current Manager).
8. Employee's active request count is now zero — they may submit a new request.

---

### Scenario D: New Manager Rejects the Request

**Description**: The new manager declines to accept the inbound transfer.

1. Current Manager has already approved.
2. New Manager reviews the request and decides their team cannot accommodate the transfer.
3. New Manager clicks **Reject** and provides a mandatory rejection reason.
4. Request status transitions to **REJECTED**.
5. Employee receives a notification: _"Your transfer request has been rejected by the proposed new manager. Reason: [Rejection Reason]."_
6. HR Administrator is NOT notified.
7. Employee views the rejection with the stage (New Manager) and reason clearly displayed.
8. Employee may now submit a new transfer request.

---

### Scenario E: HR Administrator Rejects the Request

**Description**: HR determines the employee is not eligible for the transfer.

1. Both managers have approved. HR is reviewing.
2. HR Administrator determines the employee does not meet the eligibility criteria (e.g., insufficient tenure, active performance improvement plan).
3. HR Administrator clicks **Reject** and provides a mandatory rejection reason.
4. Request status transitions to **REJECTED**.
5. Employee receives a notification: _"Your transfer request has been reviewed by HR and was not approved. Reason: [Rejection Reason]."_
6. Downstream teams (IT, Payroll, Facilities) are NOT notified — no tasks are spawned.
7. Employee views the rejection with the HR stage and reason clearly displayed.
8. Employee may now submit a new transfer request.

---

### Scenario F: Employee Withdraws Before Manager Approval

**Description**: Employee changes their mind after submitting and withdraws the request before manager action.

1. Employee has submitted a request. Status is **PENDING_CURRENT_MANAGER_APPROVAL** (or **PENDING_NEW_MANAGER_APPROVAL**).
2. Employee opens the request and clicks **Withdraw Request**.
3. System prompts: _"Are you sure you want to withdraw this transfer request? This action cannot be undone."_
4. Employee confirms withdrawal.
5. Request status transitions to **WITHDRAWN**.
6. The current pending approver (manager) is notified: _"The transfer request from [Employee] has been withdrawn."_
7. Employee's active request count is now zero — they may submit a new request.

---

### Scenario G: Employee Attempts to Withdraw After HR Approval (Blocked)

**Description**: Employee tries to withdraw after HR has approved and downstream processing has begun.

1. Request is in **PROCESSING_DOWNSTREAM** (HR has already approved).
2. Employee opens the request and clicks **Withdraw Request**.
3. System **blocks** the withdrawal and displays: _"This request can no longer be withdrawn. Processing is underway. Please contact HR if you need to cancel."_
4. Request status remains unchanged.
5. No notifications are sent.

---

### Scenario H: Downstream Task Fails

**Description**: One of the downstream teams (e.g., IT) encounters an error and cannot complete their task.

1. Request is in **PROCESSING_DOWNSTREAM**. IT Administrator attempts to provision access.
2. The provisioning system is unavailable or the employee's profile has a conflict.
3. IT Administrator marks the IT task as **FAILED** with a mandatory comment describing the failure.
4. HR Administrator and the IT team lead receive an alert notification: _"IT Access task has FAILED for transfer TRF-00142. Comment: [Failure Comment]. Manual triage required."_
5. The overall request remains in **PROCESSING_DOWNSTREAM** — it does not auto-close.
6. Employee's status dashboard shows IT task as **FAILED** with the failure visible.
7. The other tasks (Payroll, Facilities, HR Org Update) continue independently.
8. The FAILED task requires manual HR intervention to resolve.
9. The request only reaches **COMPLETED** when all FAILED tasks have been re-processed and marked COMPLETED.

---

### Scenario I: Attempted Duplicate Active Request (Blocked)

**Description**: Employee already has an active transfer request and tries to submit another.

1. Employee has an active request in **PENDING_CURRENT_MANAGER_APPROVAL**.
2. Employee navigates to New Transfer Request and submits another request.
3. System **blocks** the submission and displays: _"You already have an active transfer request (TRF-00142). Please wait for it to be resolved before submitting a new one."_
4. System provides a link to the existing request.
5. No new request is created.

---

### Scenario J: Invalid Effective Date (Validation Block)

**Description**: Employee attempts to set an effective date less than 14 days from today.

1. Employee fills in the form and sets the effective date to 5 days from today.
2. Employee clicks Submit.
3. System **blocks** the submission and displays: _"Effective date must be at least 14 calendar days from today. Please select a date on or after [Date + 14 days]."_
4. No request is created.
5. The date picker restricts date selection to show only valid dates (≥ T+14).

---

### Scenario K: Mandatory Field Missing (Validation Block)

**Description**: Employee submits the form without completing a mandatory field.

1. Employee leaves the **Role/Job Position** dropdown unselected and clicks Submit.
2. System **blocks** the submission and highlights the missing field with an inline error: _"Please select a role."_
3. All other missing mandatory fields are also highlighted simultaneously.
4. No request is created.

---

### Scenario L: Cross-Employee Unauthorized Access Attempt (Security Block)

**Description**: Employee B attempts to view Employee A's transfer request.

1. Employee B, authenticated in the portal, attempts to access Employee A's transfer request URL directly (e.g., by guessing or obtaining the URL).
2. System checks that the authenticated user is the owner of the request (or an authorised manager/HR).
3. If the authenticated user does not have permission, the system returns **HTTP 403 Forbidden** with: _"You do not have access to this transfer request."_
4. No request data is disclosed.

---

### Scenario M: Reference Data Unavailable (Degraded Mode)

**Description**: The Reference Data API (Departments, Locations, Roles) is temporarily unavailable when the employee opens the form.

1. Employee opens the transfer request form.
2. The portal attempts to load reference data from the Reference Data API.
3. The API is unavailable.
4. Dropdowns display an error state: _"Reference data is currently unavailable. Please try again later."_
5. The **Submit** button is disabled until reference data loads successfully.
6. Employee cannot submit the form in degraded mode.

---

### Scenario N: Downstream SLA Breach (Reminder Notification) `[EXISTING]`

**Description**: A downstream team has not completed their task within 5 business days of assignment.

1. IT task was created when HR approved the request.
2. 5 business days pass and the IT task remains in **PENDING** status.
3. System automatically sends a reminder notification to the IT team administrator and their manager: _"Reminder: IT Access task for transfer TRF-00142 is overdue (assigned [Date]). Please action immediately."_
4. Employee's status dashboard shows the task as overdue (visual indicator).
5. No automatic state change occurs — human action is still required.

---

### Scenario P: Manager Raises a Transfer Request on Behalf of a Direct Report `[NEW]`

**Description**: A Current Manager wishes to initiate a transfer for one of their own direct reports rather than waiting for the employee to self-initiate.

**Pre-condition:** The transferring employee does not already have an active (non-terminal) transfer request.

#### Stage P1: Manager Initiates Proxy Request

1. Manager logs into the One-Point Portal and navigates to **Team Transfers → Initiate Transfer for Employee**.
2. Manager selects the employee to transfer from a dropdown of their **own direct reports only** (system enforces this constraint).
3. Manager completes the transfer form: target department, location, role, effective date (≥14 days), and reason.
4. System validates: effective date, no active request for the **transferring employee**, target manager is not the transferring employee.
5. Manager may save as **DRAFT** or submit directly.
6. On submit, system creates the request recording:
   - `initiatedById` = Manager's employee ID
   - `transferringEmployeeId` = selected direct report's employee ID
   - `initiationMode` = `PROXY_MANAGER`
7. **Transferring employee is immediately notified**: _"A transfer request has been initiated on your behalf by your manager [Manager Name] to [New Department]. Request ID: TRF-00143."_
8. Because the initiating Manager has already consented (by initiating the request), **the Current Manager approval step is skipped**.
9. Request status transitions directly to **PENDING_NEW_MANAGER_APPROVAL**.
10. New Manager receives standard approval notification.

#### Stage P2: Approval and Downstream Flow

- From **PENDING_NEW_MANAGER_APPROVAL** onward, the process is identical to Scenario A (Stages A3–A6).
- Rejection, withdrawal, and downstream orchestration follow the same rules as self-initiated requests.

#### Stage P3: Withdrawal of Proxy-Initiated Request

- Either the **transferring employee** or the **proxy initiator (Manager)** may withdraw the request while it is in **PENDING_NEW_MANAGER_APPROVAL** or an earlier non-terminal state.
- Withdrawal after HR approval follows the same lockout rules as Scenario G.
- When either party withdraws, the other party is notified.

---

### Scenario Q: HR Administrator Raises a Transfer Request on Behalf of an Employee `[NEW]`

**Description**: An HR Administrator initiates a transfer request on behalf of any employee in the organisation (e.g., for organisational restructuring).

**Pre-condition:** The transferring employee does not already have an active (non-terminal) transfer request.

#### Stage Q1: HR Initiates Proxy Request

1. HR Administrator logs into the portal and navigates to **HR Tools → Initiate Transfer on Behalf of Employee**.
2. HR selects any employee in the organisation from the employee directory (no hierarchy restriction for HR-proxy).
3. HR completes the transfer form: target department, location, role, effective date (≥14 days), and reason.
4. System validates: effective date, no active request for the **transferring employee**, target manager is not the transferring employee.
5. HR may save as **DRAFT** or submit directly.
6. On submit, system creates the request recording:
   - `initiatedById` = HR Administrator's employee ID
   - `transferringEmployeeId` = selected employee's employee ID
   - `initiationMode` = `PROXY_HR`
7. **Transferring employee is immediately notified**: _"A transfer request has been initiated on your behalf by HR [HR Admin Name] to [New Department]. Request ID: TRF-00144."_
8. **HR-proxy requests are NOT self-approved**: Even though HR initiated the request, it must still go through the full approval chain:
   - PENDING_CURRENT_MANAGER_APPROVAL → PENDING_NEW_MANAGER_APPROVAL → PENDING_HR_VALIDATION.
   - The HR Administrator who initiated the request **must not be the same person** who validates it at the HR gate (system enforces).
9. Current Manager of the **transferring employee** (not the HR initiator's manager) receives the standard approval notification.

#### Stage Q2: Approval and Downstream Flow

- From **PENDING_CURRENT_MANAGER_APPROVAL** onward, the process is identical to Scenario A (Stages A2–A6).
- Rejection, withdrawal, and downstream orchestration follow the same rules as self-initiated requests.

#### Stage Q3: Withdrawal of HR-Proxy Request

- Either the **transferring employee** or the **HR proxy initiator** may withdraw the request while it is in PENDING_CURRENT_MANAGER_APPROVAL or PENDING_NEW_MANAGER_APPROVAL.
- Withdrawal after HR approval follows the same lockout rules as Scenario G.

---

### Scenario R: Manager Raises a Transfer Request for Themselves `[NEW — DECIDED]`

**Description**: A Manager wishes to transfer themselves to a different department/role. Even though they hold a Manager role, they are acting as an employee.

**Business Decision (OQ-NEW-05 — DECIDED):** When a Manager raises a transfer request for themselves, the **self-initiated path applies**. The system treats them identically to any employee self-initiating: `initiatedById` = `transferringEmployeeId` = the Manager's own employee ID. No proxy recording occurs. The `initiationMode` = `SELF`.

1. Manager navigates to **My Transfers → New Transfer Request** (same as any employee).
2. System does not offer the "select employee" proxy picker — the form is pre-populated with their own profile.
3. Submission, validation, and approval routing follow Scenario A exactly.
4. The approval chain routes to **the Manager's own line manager** (skip-level) as the Current Manager approver.

---

## 7. Functional Business Requirements

| BR ID | Change | Requirement Description | Priority | Scenario Ref |
| ----- | ------ | ----------------------- | -------- | ------------ |
| BR-01 | `[EXISTING]` | The initiator shall select a target department, location, role, and effective date (all mandatory). | Must Have | A, B, J, K, P, Q |
| BR-02 | `[EXISTING]` | The initiator may optionally provide a reason for the transfer (max 500 characters). | Should Have | A, P, Q |
| BR-03 | `[EXISTING]` | The effective date must be at least 14 calendar days from the date of submission. | Must Have | A, J, P, Q |
| BR-04 | `[MODIFIED]` | The initiator (employee or proxy) shall be able to save an incomplete transfer request as a DRAFT and resume it later. A proxy initiator may also save and edit drafts on behalf of the transferring employee. | Must Have | B, P, Q |
| BR-05 | `[MODIFIED]` | A transferring employee may have only one active non-terminal transfer request at any time. The uniqueness check is always based on `transferringEmployeeId`, never `initiatedById`. | Must Have | I, P, Q |
| BR-06 | `[EXISTING]` | The Current Manager shall be able to approve or reject the request with a mandatory rejection reason. | Must Have | A, C |
| BR-07 | `[EXISTING]` | The New Manager shall be able to approve or reject the request with a mandatory rejection reason. | Must Have | A, D, P |
| BR-08 | `[EXISTING]` | The HR Administrator shall be able to approve (triggering downstream tasks) or reject with a mandatory reason. | Must Have | A, E, Q |
| BR-09 | `[EXISTING]` | Downstream orchestration tasks (HR Org Update, IT Access, Payroll, Facilities) shall be spawned automatically upon HR approval. | Must Have | A, H |
| BR-10 | `[EXISTING]` | Each downstream team shall independently mark their task as COMPLETED or FAILED, with a mandatory comment on failure. | Must Have | A, H |
| BR-11 | `[MODIFIED]` | The transferring employee and the proxy initiator (if applicable) shall be able to view the real-time status of all journey stages and the pending actor at each stage. | Must Have | A through N, P, Q |
| BR-12 | `[MODIFIED]` | The transferring employee **or** the proxy initiator (if applicable) shall be able to withdraw a submitted request at any time prior to HR validation commencing. When one party withdraws, the other party is notified. | Must Have | F, G, P, Q |
| BR-13 | `[MODIFIED]` | All stakeholders (including the transferring employee when a proxy initiates on their behalf) shall receive timely notifications (email + in-portal) when their action is required or a transition occurs. | Must Have | A through N, P, Q |
| BR-14 | `[EXISTING]` | The employee shall see a clear rejection banner with the rejecting actor, the rejection stage, and the reason. | Must Have | C, D, E |
| BR-15 | `[EXISTING]` | An immutable audit log shall be created for every lifecycle state transition, capturing actor, role, action, and UTC timestamp. | Must Have | All |
| BR-16 | `[NEW]` | A Manager shall be able to initiate a transfer request on behalf of **one of their own direct reports only** (system enforces direct-report constraint). The system shall record `initiatedById` (Manager) and `transferringEmployeeId` (direct report) as separate fields. | Must Have | P |
| BR-17 | `[NEW]` | An HR Administrator shall be able to initiate a transfer request on behalf of **any employee in the organisation**. The system shall record `initiatedById` (HR) and `transferringEmployeeId` as separate fields. | Must Have | Q |
| BR-18 | `[NEW]` | When a Manager initiates a proxy request, the Current Manager approval step shall be skipped (proxy consent is implicit); the request shall route directly to New Manager approval. | Must Have | P |
| BR-19 | `[NEW]` | When an HR Administrator initiates a proxy request, the full Current Manager → New Manager → HR approval chain must be followed. The initiating HR Administrator must not approve their own proxy-initiated request at the HR gate. | Must Have | Q |
| BR-20 | `[NEW]` | When any proxy request is submitted, the transferring employee shall receive an immediate notification informing them that a request has been raised on their behalf, including the initiator's name and the target department. | Must Have | P, Q |
| BR-21 | `[NEW]` | All approval routing, eligibility checks (14-day notice, no active request constraint), self-transfer prevention, IDOR access control, and audit log entries shall be evaluated against the `transferringEmployeeId`, not the `initiatedById`. | Must Have | P, Q |
| BR-22 | `[NEW]` | A Manager raising a transfer request for themselves shall follow the standard self-initiated path (Scenario R). `initiationMode = SELF`; `initiatedById` = `transferringEmployeeId`. No proxy path is applied. | Must Have | R |

---

## 8. Business Rules

| Rule ID | Change | Business Rule | Scenario |
| ------- | ------ | ------------- | -------- |
| BRU-01 | `[MODIFIED]` | A **transferring employee** (`transferringEmployeeId`) may have only one non-terminal active request at any time. The uniqueness constraint is on the employee being transferred, regardless of who initiated the request. | I, P, Q |
| BRU-02 | `[EXISTING]` | Effective date must be ≥ today + 14 calendar days. | J, P, Q |
| BRU-03 | `[EXISTING]` | Reason field is optional but must not exceed 500 characters if provided. | K |
| BRU-04 | `[EXISTING]` | For self-initiated requests: Manager approvals are strictly sequential (Current Manager → New Manager). | A, C, D |
| BRU-05 | `[EXISTING]` | Both the Current Manager and New Manager must approve before HR validation can begin (self-initiated path). | A |
| BRU-06 | `[EXISTING]` | HR must approve before any downstream task is spawned. | A, E |
| BRU-07 | `[EXISTING]` | Rejection at any stage (Current Manager, New Manager, or HR) must include a mandatory non-empty reason. | C, D, E |
| BRU-08 | `[EXISTING]` | Rejection at any stage terminates the request permanently (status = REJECTED); no downstream teams are notified. | C, D, E |
| BRU-09 | `[MODIFIED]` | Either the **transferring employee** or the **proxy initiator** may withdraw a request while it is in PENDING_CURRENT_MANAGER_APPROVAL or PENDING_NEW_MANAGER_APPROVAL. For self-initiated requests, only the employee may withdraw. When withdrawal is triggered by either party, the other party is notified. | F, G, P, Q |
| BRU-10 | `[EXISTING]` | A downstream task marked as FAILED does not block the other downstream tasks from completing independently. | H |
| BRU-11 | `[NEW]` | A Manager may only initiate a proxy transfer request for employees who are their **own direct reports**. Attempting to initiate for a non-direct-report returns HTTP 403 Forbidden. | P |
| BRU-12 | `[NEW]` | An HR Administrator may initiate a proxy transfer request for **any employee in the organisation**, without hierarchy restriction. | Q |
| BRU-13 | `[NEW]` | When a Manager initiates a proxy request, the Current Manager approval step is **skipped** (proxy consent is implicit). The request enters the approval chain at PENDING_NEW_MANAGER_APPROVAL. | P |
| BRU-14 | `[NEW]` | When an HR Administrator initiates a proxy request, the full approval chain (PENDING_CURRENT_MANAGER_APPROVAL → PENDING_NEW_MANAGER_APPROVAL → PENDING_HR_VALIDATION) must be followed. The initiating HR Administrator is **not permitted** to approve their own proxy request at the HR gate; a different HR Administrator must validate. | Q |
| BRU-15 | `[NEW]` | Self-transfer prevention (`targetManagerId ≠ transferringEmployeeId`) is enforced using the `transferringEmployeeId`, never the `initiatedById`. | P, Q |
| BRU-16 | `[NEW]` | A Manager raising a transfer request for themselves follows the self-initiated path (`initiationMode = SELF`, `initiatedById = transferringEmployeeId`). The proxy flow is not applied. | R |
| BRU-17 | `[NEW]` | The `initiationMode` field on a transfer request shall be one of: `SELF` (employee raises own request), `PROXY_MANAGER` (manager raises for direct report), `PROXY_HR` (HR raises for any employee). | P, Q, R |

---

## 9. Request Lifecycle & State Machine

### 9.1 Status Definitions

| Status                             | Description                                                         | Entry Condition                                        | Terminal? |
| ---------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ | --------- |
| `DRAFT`                            | Saved by employee. Not submitted. No stakeholder notified.          | Employee clicks "Save as Draft".                       | No        |
| `PENDING_CURRENT_MANAGER_APPROVAL` | Awaiting the Current Manager's decision.                            | Employee submits a valid form (or submits from DRAFT). | No        |
| `PENDING_NEW_MANAGER_APPROVAL`     | Current Manager approved. Awaiting New Manager's decision.          | Current Manager approves.                              | No        |
| `PENDING_HR_VALIDATION`            | Both managers approved. Awaiting HR decision.                       | New Manager approves.                                  | No        |
| `PROCESSING_DOWNSTREAM`            | HR approved. 4 orchestration tasks spawned and being processed.     | HR Administrator approves.                             | No        |
| `COMPLETED`                        | All 4 downstream tasks marked COMPLETED. Transfer is effective.     | All downstream tasks = COMPLETED.                      | Yes       |
| `REJECTED`                         | Rejected by Current Manager, New Manager, or HR. Request is closed. | Any approver rejects.                                  | Yes       |
| `WITHDRAWN`                        | Voluntarily withdrawn by the employee before HR approval.           | Employee withdraws pre-HR.                             | Yes       |

### 9.2 Allowed Transitions

| From Status | Action | Performed By | To Status | Change |
| --- | --- | --- | --- | --- |
| _(new)_ | SAVE_DRAFT | Employee | DRAFT | `[EXISTING]` |
| _(new)_ | SUBMIT | Employee | PENDING_CURRENT_MANAGER_APPROVAL | `[EXISTING]` |
| _(new)_ | SAVE_DRAFT | Manager (proxy for direct report) | DRAFT | `[NEW]` |
| _(new)_ | SUBMIT | Manager (proxy for direct report) | PENDING_NEW_MANAGER_APPROVAL ⚡ **(skips Current Manager step)** | `[NEW]` |
| _(new)_ | SAVE_DRAFT | HR Administrator (proxy for any employee) | DRAFT | `[NEW]` |
| _(new)_ | SUBMIT | HR Administrator (proxy for any employee) | PENDING_CURRENT_MANAGER_APPROVAL | `[NEW]` |
| DRAFT | SUBMIT | Employee | PENDING_CURRENT_MANAGER_APPROVAL | `[EXISTING]` |
| DRAFT | SUBMIT | Manager (proxy) | PENDING_NEW_MANAGER_APPROVAL | `[NEW]` |
| DRAFT | SUBMIT | HR (proxy) | PENDING_CURRENT_MANAGER_APPROVAL | `[NEW]` |
| DRAFT | DELETE | Employee or Proxy Initiator | _(record deleted)_ | `[MODIFIED]` |
| PENDING_CURRENT_MANAGER_APPROVAL | APPROVE | Current Manager | PENDING_NEW_MANAGER_APPROVAL | `[EXISTING]` |
| PENDING_CURRENT_MANAGER_APPROVAL | REJECT | Current Manager | REJECTED | `[EXISTING]` |
| PENDING_CURRENT_MANAGER_APPROVAL | WITHDRAW | Transferring Employee **or** Proxy Initiator | WITHDRAWN | `[MODIFIED]` |
| PENDING_NEW_MANAGER_APPROVAL | APPROVE | New Manager | PENDING_HR_VALIDATION | `[EXISTING]` |
| PENDING_NEW_MANAGER_APPROVAL | REJECT | New Manager | REJECTED | `[EXISTING]` |
| PENDING_NEW_MANAGER_APPROVAL | WITHDRAW | Transferring Employee **or** Proxy Initiator | WITHDRAWN | `[MODIFIED]` |
| PENDING_HR_VALIDATION | APPROVE | HR Administrator *(must not be same as HR proxy initiator if applicable)* | PROCESSING_DOWNSTREAM | `[MODIFIED]` |
| PENDING_HR_VALIDATION | REJECT | HR Administrator | REJECTED | `[EXISTING]` |
| PROCESSING_DOWNSTREAM | TASK_COMPLETE | Team Administrator | PROCESSING_DOWNSTREAM / COMPLETED | `[EXISTING]` |
| PROCESSING_DOWNSTREAM | TASK_FAIL | Team Administrator | PROCESSING_DOWNSTREAM _(flagged)_ | `[EXISTING]` |
| COMPLETED | _(no action)_ | — | _(terminal)_ | `[EXISTING]` |
| REJECTED | _(no action)_ | — | _(terminal)_ | `[EXISTING]` |
| WITHDRAWN | _(no action)_ | — | _(terminal)_ | `[EXISTING]` |

---

## 10. Notification Matrix

| Trigger Event | Change | Notified Actor(s) | Channel | Message Summary |
| --- | --- | --- | --- | --- |
| Employee submits request (self-initiated) | `[EXISTING]` | Current Manager | Email + In-Portal | "Action Required: Transfer request from [Employee] is awaiting your approval." |
| **Manager submits proxy request** | `[NEW]` | Transferring Employee + New Manager | Email + In-Portal | Employee: "A transfer request has been initiated on your behalf by [Manager Name] to [New Dept]. Request ID: TRF-XXXXX." New Manager: "Action Required: Inbound transfer request for [Employee]." |
| **HR submits proxy request** | `[NEW]` | Transferring Employee + Current Manager | Email + In-Portal | Employee: "A transfer request has been initiated on your behalf by HR [Name] to [New Dept]. Request ID: TRF-XXXXX." Current Manager: "Action Required: Transfer request for your direct report [Employee]." |
| Current Manager approves | `[EXISTING]` | New Manager + Transferring Employee + Proxy Initiator (if applicable) | Email + In-Portal | New Manager: "Action Required." Employee: "Current Manager approved." Proxy Initiator: "Update: request advancing." |
| Current Manager rejects | `[EXISTING]` | Transferring Employee + Proxy Initiator (if applicable) | Email + In-Portal | "Transfer request has been rejected. Reason: [Reason]." |
| New Manager approves | `[EXISTING]` | HR Administrator + Transferring Employee + Proxy Initiator (if applicable) | Email + In-Portal | HR: "Action Required." Employee/Initiator: "New Manager approved." |
| New Manager rejects | `[EXISTING]` | Transferring Employee + Proxy Initiator (if applicable) | Email + In-Portal | "Transfer request has been rejected by the New Manager. Reason: [Reason]." |
| HR approves | `[EXISTING]` | All 4 downstream teams + Transferring Employee + Proxy Initiator (if applicable) | Email + In-Portal | Teams: "Task Assigned." Employee/Initiator: "HR approved. Processing underway." |
| HR rejects | `[EXISTING]` | Transferring Employee + Proxy Initiator (if applicable) | Email + In-Portal | "Transfer request was not approved by HR. Reason: [Reason]." |
| Downstream task completed | `[EXISTING]` | Transferring Employee (status update) | In-Portal | Real-time dashboard update. |
| All downstream tasks completed | `[EXISTING]` | Transferring Employee + Proxy Initiator (if applicable) | Email + In-Portal | "Congratulations! Internal transfer complete." |
| Downstream task FAILED | `[EXISTING]` | HR Admin + Team Lead | Email + In-Portal | "Task FAILED — manual intervention required. Comment: [Failure Comment]." |
| **Withdrawal by Transferring Employee (proxy request)** | `[NEW]` | Proxy Initiator + Currently assigned approver | Email + In-Portal | Proxy Initiator: "The transferring employee has withdrawn the request you initiated." Approver: "Request withdrawn." |
| **Withdrawal by Proxy Initiator** | `[NEW]` | Transferring Employee + Currently assigned approver | Email + In-Portal | Employee: "The transfer request raised on your behalf has been withdrawn by [Initiator Name]." Approver: "Request withdrawn." |
| Employee withdraws (self-initiated) | `[EXISTING]` | Currently assigned approver | Email + In-Portal | "Transfer request from [Employee] has been withdrawn." |
| Downstream SLA breach (5 days) | `[EXISTING]` | Team Administrator + Manager | Email | "Overdue: Please complete your assigned task for transfer TRF-XXXXX." |

---

## 11. Non-Functional Requirements

| NFR ID | Category           | Requirement                                                             | Standard                                                                                                                               |
| ------ | ------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-01 | Performance        | API response time for form submission and status retrieval.             | < 3 seconds at P95 under 500 concurrent users.                                                                                         |
| NFR-02 | Security — Transit | All data transmitted between client and server.                         | TLS 1.2 or higher mandatory.                                                                                                           |
| NFR-03 | Security — Rest    | Transfer request data at rest.                                          | AES-256 encryption or equivalent.                                                                                                      |
| NFR-04 | Security — Access  | Cross-employee data access prevention (IDOR).                           | Any cross-employee access attempt returns HTTP 403. Zero data disclosed.                                                               |
| NFR-05 | Security — Logging | PII in application logs.                                                | No employee names, personal emails, or salary data in logs. Only UUID identifiers and action enums.                                    |
| NFR-06 | Concurrency        | Simultaneous manager approvals or task completions on the same request. | Handled via optimistic locking. No data corruption under concurrent access.                                                            |
| NFR-07 | Audit Compliance   | Every state transition.                                                 | Immutable audit log entry for 100% of transitions capturing: actor ID, actor role, action, previous status, new status, UTC timestamp. |
| NFR-08 | Availability       | Portal availability for employees to submit and track.                  | 99.5% uptime during business hours.                                                                                                    |
| NFR-09 | Data Retention     | Audit logs and completed transfer records.                              | Retained for a minimum of 7 years in compliance with HR record-keeping regulations.                                                    |
| NFR-10 | Accessibility      | Employee-facing form and status dashboard.                              | WCAG 2.1 Level AA compliance.                                                                                                          |

---

## 12. Working Assumptions & Resolved Open Questions

| OQ ID | Status | Question | Resolution / Working Assumption | Impact |
| --- | --- | --- | --- | --- |
| OQ-1 | `[EXISTING]` | Sequential vs parallel manager approval? | **Sequential assumed**: Current Manager approves first, then New Manager is notified. Simplest governance model for this phase. | State machine has distinct states for each manager. |
| OQ-2 | `[EXISTING]` | What eligibility rules does HR apply? | **Manual review assumed**: HR Administrator manually reviews and makes an approve/reject decision. Automated rule engine deferred to a future phase. | No automated eligibility logic required in this release. |
| OQ-3 | `[EXISTING]` | SLA for downstream teams? | **5 business days assumed** per downstream task. System sends automatic reminder notifications at SLA breach. No automatic escalation or state change. | SLA reminder notification required. |
| OQ-4 | `[EXISTING]` | When does IT provisioning trigger? | **All transfers assumed**: IT provisioning is triggered for all transfers regardless of whether only department, location, or role changes. IT reviews and decides if access changes are needed. | IT task always spawned. |
| OQ-5 | `[EXISTING]` | What happens if a downstream task fails? | **Individual task failure assumed**: The FAILED task does not block other tasks. Overall request remains PROCESSING_DOWNSTREAM until all tasks reach a terminal state. HR is alerted for manual resolution. | FAILED task isolation logic required. |
| OQ-6 | `[EXISTING]` | Minimum effective date notice period? | **14 calendar days assumed**: Rationale: dual manager review + HR validation typically spans 5–10 business days. A 14-day notice period is operationally realistic for IT/Payroll/Facilities preparation. | VAL-4 validation rule; date picker constraint. |
| OQ-NEW-01 | `[DECIDED]` | Can a Manager raise proxy requests for any employee or only direct reports? | **Direct reports only** (DECIDED 2026-10-26): A Manager may only initiate a proxy transfer for their own direct report. Enforced via RBAC at API layer. | BRU-11; requires direct-report lookup against HRMS manager hierarchy (DEP-01). |
| OQ-NEW-02 | `[DECIDED]` | Can HR raise proxy requests for any employee? | **Any employee in the organisation** (DECIDED 2026-10-26): HR Administrator has organisation-wide scope. | BRU-12; HR portal must expose org-wide employee directory search. |
| OQ-NEW-03 | `[DECIDED]` | Who can withdraw a proxy-initiated request? | **Either party** (DECIDED 2026-10-26): Both the transferring employee and the proxy initiator may withdraw, subject to the same pre-HR lockout (BRU-09). When either withdraws, the other is notified. | BRU-09 modified; dual withdrawal rights; cross-notification required. |
| OQ-NEW-04 | `[DECIDED]` | Does the initiating Manager skip the Current Manager approval step? | **Yes — Current Manager step is skipped** (DECIDED 2026-10-26): Manager's consent is implicit in the initiation act. Request routes directly to PENDING_NEW_MANAGER_APPROVAL. | BRU-13; state machine transition modified. |
| OQ-NEW-05 | `[DECIDED]` | What path does a Manager follow when requesting a transfer for themselves? | **Self-initiated path applies** (DECIDED 2026-10-26): `initiationMode = SELF`. No proxy recording. | BRU-16; Scenario R. No change to self-initiated logic. |
| OQ-NEW-06 | `[DECIDED]` | Should the transferring employee be notified immediately when a proxy raises a request? | **Yes — immediate notification** (DECIDED 2026-10-26): Employee receives email + in-portal notification upon proxy submission. | BR-20; new notification trigger added. |
| OQ-NEW-07 | `[DECIDED]` | Can the proxy initiator save drafts on behalf of the employee? | **Yes — proxy can save and edit drafts** (DECIDED 2026-10-26): Draft ownership is shared between initiator and transferring employee. | BR-04 modified; draft access model updated. |

---

## 13. Risk Register

| Risk ID | Risk                                                                                             | Likelihood | Impact | Mitigation                                                                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------ | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RSK-01  | Downstream APIs (HRMS, ITSM, Payroll, Facilities) unavailable or not ready for integration.      | Medium     | High   | Develop against mock APIs. Engage integration system owners in sprint 1.                                                                               |
| RSK-02  | Business reverses OQ-1 assumption from sequential to parallel, requiring state machine redesign. | Low        | High   | Design state machine to be modular. Sequential states are straightforward to split into parallel. Confirm with HR sponsor before Day 5 technical plan. |
| RSK-03  | HRMS manager hierarchy data incomplete — incorrect manager auto-routing.                         | Medium     | High   | Validate manager hierarchy data quality before go-live. Add fallback: if manager not found, route to HR for manual assignment.                         |
| RSK-04  | Downstream SLA not enforced, leaving PROCESSING_DOWNSTREAM requests open indefinitely.           | Medium     | Medium | Implement SLA reminder at 5 business days. Add admin dashboard for HR to view stalled tasks.                                                           |
| RSK-05  | 14-day minimum effective date rejected as too restrictive by operations or business.             | Low        | Low    | Open as business decision — present to HR sponsor at Gate 1 re-review.                                                                                 |
| RSK-06  | Employee attempts to game the system by submitting multiple requests via API.                    | Low        | Medium | Enforce duplicate-request check at service layer (not just UI). Return 409 Conflict.                                                                   |

---

## 14. Dependencies & External Systems

| DEP ID | System                                    | Integration Type | Purpose                                                                         | Owner              |
| ------ | ----------------------------------------- | ---------------- | ------------------------------------------------------------------------------- | ------------------ |
| DEP-01 | HRMS (e.g., Workday / SAP SuccessFactors) | REST API         | Source of employee master data, manager hierarchy, org structure update target. | HR Systems Team    |
| DEP-02 | ITSM (e.g., ServiceNow)                   | REST API         | IT access provisioning and revocation on transfer completion.                   | IT Operations      |
| DEP-03 | Payroll System (e.g., SAP Payroll / ADP)  | REST API         | Payroll record updates on the effective transfer date.                          | Payroll Team       |
| DEP-04 | Facilities Management System              | REST API         | Workspace/seat allocation at the new location.                                  | Facilities Team    |
| DEP-05 | SSO / IAM (e.g., Okta / Azure AD)         | Platform         | Employee authentication and JWT issuance.                                       | Platform Team      |
| DEP-06 | Notification Service                      | Platform         | Email and in-portal notification dispatch at every stage.                       | Portal Team        |
| DEP-07 | Reference Data API                        | Internal         | Departments, Locations, Roles master data for dropdown population.              | Portal / HRMS Team |

---

## 15. Out-of-Scope Items

| OOS ID | Item                                                              | Rationale                                                            |
| ------ | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| OOS-01 | External recruitment or new-hire onboarding.                      | Different process; managed by Talent Acquisition module.             |
| OOS-02 | Salary negotiation or compensation renegotiation.                 | Managed by Compensation & Benefits module.                           |
| OOS-03 | Physical relocation expense reimbursements.                       | Managed by dedicated Relocation & Mobility module.                   |
| OOS-04 | Cross-border legal, immigration, or visa compliance.              | Deferred to international expansion phase.                           |
| OOS-05 | Automated algorithmic HR eligibility rule engine.                 | Manual review is in scope. Rule engine is deferred.                  |
| OOS-06 | Parallel manager approval flow.                                   | Sequential assumed. Parallel deferred pending business confirmation. |
| OOS-07 | Performance management or promotion decisions linked to transfer. | Separate Performance Management module.                              |
| OOS-08 | Transfer reversal / rollback after COMPLETED state.               | Out of scope for this phase.                                         |

---

## 16. Glossary

| Term                      | Definition                                                                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Internal Transfer**     | A voluntary move of an employee from one department, location, or role to another within the same organisation, without external hiring.                             |
| **Current Manager**       | The direct line manager of the employee at the time of the transfer request.                                                                                         |
| **New Manager**           | The direct line manager of the target role/department into which the employee is transferring.                                                                       |
| **Orchestration Task**    | A downstream action item automatically created for a specific department (HR, IT, Payroll, Facilities) when HR approves the transfer.                                |
| **Effective Date**        | The date on which the transfer becomes operationally active and the employee begins in their new role.                                                               |
| **DRAFT**                 | A saved-but-not-submitted transfer request. Visible only to the employee.                                                                                            |
| **WITHDRAWN**             | A request voluntarily cancelled by the employee before HR approval.                                                                                                  |
| **REJECTED**              | A request formally declined by any approver (manager or HR). Cannot be re-opened.                                                                                    |
| **PROCESSING_DOWNSTREAM** | The state where HR has approved and all four downstream orchestration tasks are being actioned.                                                                      |
| **IDOR**                  | Insecure Direct Object Reference — a security vulnerability where an authenticated user accesses data belonging to another user by manipulating request identifiers. |
| **SLA**                   | Service Level Agreement — the agreed maximum time within which a downstream team must complete their orchestration task (5 business days).                           |
| **RBAC**                  | Role-Based Access Control — a security model where system access is restricted based on the authenticated user's role.                                               |
| **JWT**                   | JSON Web Token — a digitally signed token used to verify the identity and permissions of an authenticated user.                                                      |
| **Sequential Approval**   | A model where each approval step is completed one after the other in a fixed sequence, rather than in parallel.                                                      |
| **Audit Log**             | An immutable, chronological record of every action taken on a transfer request, including who took the action, what the action was, and when it occurred.            |

---
