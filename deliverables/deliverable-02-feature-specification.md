# Deliverable 02 — Feature Specification and Acceptance Criteria

| Field       | Detail                                              |
|-------------|-----------------------------------------------------|
| **Project** | Employee Internal Transfer Digital Journey          |
| **Feature** | Internal Transfer Request — One-Point Employee Portal |
| **Version** | 1.1                                                 |
| **Date**    | 2025-07-14                                          |
| **Author**  | SDD Assessment — Developer Submission               |
| **Status**  | Updated — Post Gate 1 Review (F-006 Resolution)     |

---

### Revision History

| Version | Date       | Author                                | Summary of Changes                                                                                                           |
|---------|------------|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| 1.0     | 2025-07-14 | SDD Assessment — Developer Submission | Initial draft created                                                                                                        |
| 1.1     | 2025-07-14 | SDD Assessment — Developer Submission | Gate 1 F-006 resolution: OQ-012 resolved; dual-manager approval confirmed; state machine updated; new ACs AC-036 to AC-042 added; data fields, notifications, traceability, and assumptions updated |

---

## 1. Feature Overview

### 1.1 Description

The Internal Transfer Request feature digitises the end-to-end process by which an employee initiates a request to move to a different department, business unit, location, or role within the organisation. The portal orchestrates a sequential approval chain (Current Manager → Receiving Manager → HR Administrator) followed by parallel downstream task execution (IT Provisioning, Payroll Update, Facilities Arrangement), and communicates status to all relevant parties at each stage via in-app and email notifications.

The feature replaces the current manual, multi-team coordination process, providing employees with self-service submission, real-time status visibility, and a complete audit trail of every action taken on their request.

### 1.2 Scope Statement

This specification covers:

- Transfer request submission by an employee
- Current manager (releasing manager) approval or rejection
- Receiving manager approval or rejection
- HR validation approval or rejection
- Parallel downstream task completion by IT, Payroll, and Facilities teams
- Employee cancellation (permitted before both managers have approved)
- In-app and email notifications at each stage transition
- Visibility and audit trail for all actors

This specification does **not** cover:

- Promotion, regrading, or compensation calculation workflows
- Involuntary transfers, redundancies, or restructuring
- New employee onboarding or offboarding
- Cross-legal-entity employment changes
- Third-party HR system record updates (HR team responsibility post-approval)
- Reporting and analytics dashboards
- Mobile native application
- Multi-language or localisation support

### 1.3 Reference

This document builds directly on the findings and definitions established in:

> **Deliverable 01 — Discovery & Requirement Analysis** (v1.1, 2025-07-14)
> File: `deliverable-01-discovery-analysis.md`

All business rules (BR-001 to BR-016), open questions (OQ-001 to OQ-015), and assumptions (AS-001 to AS-013) defined in Deliverable 01 apply to this specification.

---

## 2. Workflow State Machine

### 2.1 States

| State ID | State Name                             | Description                                                                                        |
|----------|----------------------------------------|----------------------------------------------------------------------------------------------------|
| S-01     | `PENDING_CURRENT_MANAGER_APPROVAL`     | Request has been submitted by the employee and is awaiting approval from the employee's current line manager (releasing manager). |
| S-02     | `PENDING_RECEIVING_MANAGER_APPROVAL`   | Current manager has approved; the request is awaiting approval from the manager of the target role/department (receiving manager). |
| S-03     | `PENDING_HR_VALIDATION`                | Both managers have approved; the request now awaits HR Administrator review and validation.         |
| S-04     | `IN_PROGRESS`                          | HR has approved the request; IT, Payroll, and Facilities tasks are running concurrently.            |
| S-05     | `COMPLETED`                            | All three downstream tasks (IT, Payroll, Facilities) have been marked complete. Terminal state.     |
| S-06     | `REJECTED`                             | Request has been rejected by the current manager, the receiving manager, or the HR Administrator. Terminal state. |
| S-07     | `CANCELLED`                            | Employee cancelled the request while it was in `PENDING_CURRENT_MANAGER_APPROVAL` or `PENDING_RECEIVING_MANAGER_APPROVAL`. Terminal state. |

> **Note on DRAFT state:** A DRAFT state (saved but not submitted) is listed as optional in scope. It is **excluded** from the current phase. The employee completes and submits the form in a single action. This decision must be revisited if a save-and-resume capability is required (refer to OQ-009).

---

### 2.2 State Transition Definitions

#### S-01 — PENDING_CURRENT_MANAGER_APPROVAL

| Attribute        | Detail                                                                                      |
|------------------|---------------------------------------------------------------------------------------------|
| **Entry condition**  | Employee completes and submits the transfer request form with all required fields valid. |
| **Valid transitions** | → `PENDING_RECEIVING_MANAGER_APPROVAL` (current manager approves) <br> → `REJECTED` (current manager rejects) <br> → `CANCELLED` (employee cancels) |
| **Exit condition**   | Current manager takes an approval or rejection action, or employee cancels.             |
| **Actor who acts**   | Current Manager (approve/reject), Employee (cancel)                                     |

---

#### S-02 — PENDING_RECEIVING_MANAGER_APPROVAL

| Attribute        | Detail                                                                                          |
|------------------|-------------------------------------------------------------------------------------------------|
| **Entry condition**  | Current manager approves the request while it is in `PENDING_CURRENT_MANAGER_APPROVAL`.     |
| **Valid transitions** | → `PENDING_HR_VALIDATION` (receiving manager approves) <br> → `REJECTED` (receiving manager rejects) <br> → `CANCELLED` (employee cancels) |
| **Exit condition**   | Receiving manager takes an approval or rejection action, or employee cancels.               |
| **Actor who acts**   | Receiving Manager (approve/reject), Employee (cancel)                                       |
| **Cancellation**     | Employee cancellation **is still permitted** from this state.                               |

---

#### S-03 — PENDING_HR_VALIDATION

| Attribute        | Detail                                                                                        |
|------------------|-----------------------------------------------------------------------------------------------|
| **Entry condition**  | Receiving manager approves the request while it is in `PENDING_RECEIVING_MANAGER_APPROVAL`. |
| **Valid transitions** | → `IN_PROGRESS` (HR approves) <br> → `REJECTED` (HR rejects)                           |
| **Exit condition**   | HR Administrator takes an approval or rejection action.                                   |
| **Actor who acts**   | HR Administrator                                                                          |
| **Cancellation**     | Employee cancellation is **not permitted** from this state or any subsequent state.       |

---

#### S-04 — IN_PROGRESS

| Attribute        | Detail                                                                                                   |
|------------------|----------------------------------------------------------------------------------------------------------|
| **Entry condition**  | HR Administrator approves the request while it is in `PENDING_HR_VALIDATION`.                       |
| **Valid transitions** | → `COMPLETED` (all three downstream tasks — IT, Payroll, Facilities — are marked complete)         |
| **Exit condition**   | Each of the three parallel tasks is independently marked complete; status advances when the last outstanding task is completed. |
| **Actor who acts**   | IT Team (mark IT task done), Payroll Team (mark Payroll task done), Facilities Team (mark Facilities task done) |
| **Sub-state visibility** | Each downstream task carries its own completion flag (`itTaskComplete`, `payrollTaskComplete`, `facilitiesTaskComplete`). These are visible to the employee and HR. |

---

#### S-05 — COMPLETED

| Attribute        | Detail                                                                                       |
|------------------|----------------------------------------------------------------------------------------------|
| **Entry condition**  | All three downstream tasks are marked complete while the request is in `IN_PROGRESS`.    |
| **Valid transitions** | None. Terminal state.                                                                    |
| **Exit condition**   | N/A                                                                                      |
| **Post-completion**  | Employee receives final confirmation notification. Request is read-only and archived.    |

---

#### S-06 — REJECTED

| Attribute        | Detail                                                                                                                          |
|------------------|---------------------------------------------------------------------------------------------------------------------------------|
| **Entry condition**  | Current manager rejects while in `PENDING_CURRENT_MANAGER_APPROVAL`; receiving manager rejects while in `PENDING_RECEIVING_MANAGER_APPROVAL`; or HR rejects while in `PENDING_HR_VALIDATION`. |
| **Valid transitions** | None. Terminal state.                                                                                                       |
| **Exit condition**   | N/A                                                                                                                         |
| **Metadata stored**  | Rejected by: `MANAGER`, `RECEIVING_MANAGER`, or `HR`; rejection reason (mandatory); timestamp.                             |
| **Resubmission**     | A rejected request cannot be resubmitted (AS-005). This assumption must be confirmed with HR (OQ-010).                     |

---

#### S-07 — CANCELLED

| Attribute        | Detail                                                                                                  |
|------------------|---------------------------------------------------------------------------------------------------------|
| **Entry condition**  | Employee cancels the request while it is in `PENDING_CURRENT_MANAGER_APPROVAL` or `PENDING_RECEIVING_MANAGER_APPROVAL`. |
| **Valid transitions** | None. Terminal state.                                                                               |
| **Exit condition**   | N/A                                                                                                 |
| **Metadata stored**  | Cancelled by: employee ID; timestamp.                                                               |

---

### 2.3 State Transition Diagram (Text Representation)

```
[Employee Submits]
        |
        ▼
PENDING_CURRENT_MANAGER_APPROVAL ──(Employee Cancels)──► CANCELLED
        |
        ├──(Current Manager Rejects)──────────────────► REJECTED
        |
        ▼ (Current Manager Approves)
PENDING_RECEIVING_MANAGER_APPROVAL ──(Employee Cancels)──► CANCELLED
        |
        ├──(Receiving Manager Rejects)────────────────► REJECTED
        |
        ▼ (Receiving Manager Approves)
PENDING_HR_VALIDATION
        |
        ├──(HR Rejects)───────────────────────────────► REJECTED
        |
        ▼ (HR Approves)
IN_PROGRESS
  [IT Task]  [Payroll Task]  [Facilities Task]
  All three marked complete
        |
        ▼
COMPLETED
```

---

## 3. User Stories

### 3.1 Employee

**US-001**
As an **Employee**, I want to submit an internal transfer request by selecting my target department, business unit, location, role, and effective date, so that I can formally initiate a transfer through the portal without requiring manual intervention.

**US-002**
As an **Employee**, I want to view the real-time status of all my active and historical transfer requests from a single dashboard, so that I can track progress and know what actions are pending at each stage.

**US-003**
As an **Employee**, I want to cancel a transfer request that is still awaiting manager approval (either current or receiving), so that I can withdraw a request I no longer wish to proceed with before it advances beyond the manager approval stages.

**US-004**
As an **Employee**, I want to receive in-app and email notifications at every stage transition of my request, so that I am always informed of progress or required action without having to manually check the portal.

---

### 3.2 Current Manager (Releasing Manager)

**US-005**
As the **Current Manager (Releasing Manager)**, I want to receive an in-app and email notification when one of my direct reports submits a transfer request pending my approval, so that I am promptly informed and can release or retain the employee from my team.

**US-006**
As the **Current Manager**, I want to view the full details of a transfer request before approving or rejecting it, so that I can make an informed decision based on the employee's requested role, location, effective date, and reason.

**US-007**
As the **Current Manager**, I want to reject a transfer request by providing a mandatory rejection reason, so that the employee understands why their request was not approved and has a clear record of the decision.

---

### 3.3 Receiving Manager

**US-019**
As the **Receiving Manager**, I want to receive an in-app and email notification when the current manager has approved a transfer request for an employee joining my team, so that I can confirm I have capacity and the role is ready.

**US-020**
As the **Receiving Manager**, I want to approve or reject the transfer with a mandatory rejection reason, so that my decision is formally recorded and the employee understands the outcome.

---

### 3.4 HR Administrator

**US-008**
As an **HR Administrator**, I want to receive a notification when a transfer request has been approved by both managers and is awaiting HR validation, so that I can review it promptly and ensure it meets HR policy and organisational alignment requirements.

**US-009**
As an **HR Administrator**, I want to view both managers' approval records alongside the full request details, so that I have complete context when validating a transfer request.

**US-010**
As an **HR Administrator**, I want to approve or reject a transfer request with a mandatory reason for rejection, so that the approval decision is formally recorded and all parties are informed of the outcome.

---

### 3.5 IT Team

**US-011**
As a member of the **IT Team**, I want to receive a task notification when HR approves a transfer request, so that I can begin provisioning the employee's system access, accounts, and equipment for the new role.

**US-012**
As a member of the **IT Team**, I want to mark my provisioning task as complete within the portal, so that the system can track overall request progress and advance to the final completion stage once all teams are done.

---

### 3.6 Payroll Team

**US-013**
As a member of the **Payroll Team**, I want to receive a task notification when HR approves a transfer request, so that I can update the employee's compensation details, cost centre allocation, and payroll schedule for the new role and location.

**US-014**
As a member of the **Payroll Team**, I want to mark my payroll update task as complete within the portal, so that the system can accurately reflect that the payroll changes have been processed.

---

### 3.7 Facilities Team

**US-015**
As a member of the **Facilities Team**, I want to receive a task notification when HR approves a transfer request, so that I can prepare the physical workspace — including desk allocation and access card configuration — for the employee's new location.

**US-016**
As a member of the **Facilities Team**, I want to mark my facilities task as complete within the portal, so that there is a clear record that the workspace has been prepared and the overall transfer can be finalised.

---

### 3.8 System / Portal

**US-017**
As the **Portal System**, I want to automatically assign a unique request ID and record a timestamp when a transfer request is submitted, so that every request is uniquely identifiable and fully auditable from the moment of creation.

**US-018**
As the **Portal System**, I want to automatically set the overall request status to COMPLETED when all three downstream tasks (IT, Payroll, Facilities) are marked complete, so that the transfer lifecycle is closed accurately without requiring manual intervention.

---

## 4. Acceptance Criteria

---

### Submission

---

**AC-001: Transfer request form displays all required fields**
- **Given:** An authenticated employee navigates to the Internal Transfer section of the portal
- **When:** The transfer request form is rendered
- **Then:** The form displays input fields for: Target Department, Target Business Unit, Target Location, Target Role/Position, Effective Date, and an optional Reason field; all field labels are visible and clearly identified as required or optional

---

**AC-002: All required fields must be completed before submission**
- **Given:** An employee is on the transfer request submission form
- **When:** The employee attempts to submit the form with one or more required fields left empty (Target Department, Target Business Unit, Target Location, Target Role, or Effective Date)
- **Then:** The submission is rejected; the portal displays a field-level validation error identifying each missing required field; no request ID is generated; no notification is sent

---

**AC-003: Effective date must be a future date**
- **Given:** An employee is completing the transfer request form
- **When:** The employee enters an effective date that is today's date or any date in the past
- **Then:** The portal rejects the submission and displays a validation error stating the effective date must be a future date; the request is not created

---

**AC-004: Optional reason field is not required for submission**
- **Given:** An employee is completing the transfer request form with all required fields populated
- **When:** The employee leaves the optional Reason field blank and submits the form
- **Then:** The request is accepted and created successfully; no validation error is raised for the Reason field

---

**AC-005: System assigns a unique request ID on submission**
- **Given:** An employee submits a valid transfer request form with all required fields completed and a future effective date
- **When:** The portal processes the submission
- **Then:** The system generates and assigns a unique, system-generated request identifier (requestId) to the request; the requestId is returned to the employee and is visible in the request detail view

---

**AC-006: Request status is set to PENDING_CURRENT_MANAGER_APPROVAL on submission**
- **Given:** An employee submits a valid transfer request
- **When:** The portal successfully creates the request
- **Then:** The request status is set to `PENDING_CURRENT_MANAGER_APPROVAL`; this status is reflected immediately in the employee's request list view

---

**AC-007: Employee receives in-app and email confirmation on submission**
- **Given:** An employee successfully submits a transfer request
- **When:** The request is created with status `PENDING_CURRENT_MANAGER_APPROVAL`
- **Then:** The employee receives an in-app notification confirming the submission; the employee receives an email notification confirming the submission; both notifications include the unique requestId and the current status

---

**AC-008: Employee cannot submit a request with a past effective date**
- **Given:** An employee completes the transfer request form and enters an effective date in the past
- **When:** The employee submits the form
- **Then:** The API returns a 400 Bad Request response; no request record is persisted; the error message specifies that the effective date must be a future date

---

**AC-009: Employee can have multiple concurrent active transfer requests**
- **Given:** An employee already has one or more active transfer requests in any non-terminal status (e.g., `PENDING_CURRENT_MANAGER_APPROVAL`, `PENDING_RECEIVING_MANAGER_APPROVAL`, `PENDING_HR_VALIDATION`, `IN_PROGRESS`)
- **When:** The employee submits a new transfer request
- **Then:** The new request is accepted and created successfully; both the existing and new requests are independently tracked; no conflict or duplication error is raised

---

**AC-010: Employee can view all their submitted requests and statuses**
- **Given:** An authenticated employee has submitted one or more transfer requests
- **When:** The employee navigates to the My Transfer Requests section of the portal
- **Then:** The portal displays a list of all transfer requests (active and historical) associated with the employee's account, showing for each: requestId, target role, target department, effective date, current status, and submission date

---

### Current Manager Approval

---

**AC-011: Current manager receives in-app and email notification on pending approval**
- **Given:** An employee submits a valid transfer request
- **When:** The request status transitions to `PENDING_CURRENT_MANAGER_APPROVAL`
- **Then:** The employee's current line manager (releasing manager) receives an in-app notification indicating a transfer request requires their approval; the current manager also receives an email notification with a summary of the request and a link to the approval screen

---

**AC-012: Current manager can view full request details before deciding**
- **Given:** A current manager has a pending transfer request in their approval queue
- **When:** The current manager opens the request detail view
- **Then:** The current manager can see all submitted fields: employee name, current department, target department, target business unit, target location, target role, effective date, and reason (if provided); the request ID and submission timestamp are also visible

---

**AC-013: Current manager approval transitions request to PENDING_RECEIVING_MANAGER_APPROVAL**
- **Given:** A request is in `PENDING_CURRENT_MANAGER_APPROVAL` status and the current manager is viewing the request
- **When:** The current manager clicks Approve and confirms the action
- **Then:** The request status transitions to `PENDING_RECEIVING_MANAGER_APPROVAL`; the current manager approval timestamp and approver ID are recorded against the request; the change is reflected immediately

---

**AC-014: Current manager rejection requires a mandatory rejection reason**
- **Given:** A request is in `PENDING_CURRENT_MANAGER_APPROVAL` status and the current manager is viewing the request
- **When:** The current manager clicks Reject without providing a rejection reason
- **Then:** The rejection action is blocked; the portal displays a validation error requiring the current manager to enter a rejection reason before the action can be submitted

---

**AC-015: Employee is notified with reason on current manager rejection**
- **Given:** A current manager rejects a transfer request and provides a rejection reason
- **When:** The rejection is submitted successfully
- **Then:** The employee receives an in-app notification stating the request has been rejected, including the rejection reason provided by the current manager; the employee also receives an email notification with the same details

---

**AC-016: Request status is set to REJECTED on current manager rejection**
- **Given:** A current manager rejects a request in `PENDING_CURRENT_MANAGER_APPROVAL` status
- **When:** The rejection is processed
- **Then:** The request status is set to `REJECTED`; the metadata fields `rejectedBy` (value: `MANAGER`) and `rejectionReason` are populated; the `lastUpdatedAt` timestamp is updated; no downstream stages are triggered

---

**AC-017: Employee can cancel request while in PENDING_CURRENT_MANAGER_APPROVAL**
- **Given:** An authenticated employee has a transfer request in `PENDING_CURRENT_MANAGER_APPROVAL` status
- **When:** The employee submits a cancellation request via the portal
- **Then:** The request status transitions to `CANCELLED`; the `cancelledAt` timestamp and the `cancelledBy` employee ID are recorded; the employee receives an in-app and email confirmation of the cancellation

---

**AC-018: Current manager is notified when an employee cancels a pending request**
- **Given:** A transfer request in `PENDING_CURRENT_MANAGER_APPROVAL` status is cancelled by the employee
- **When:** The cancellation is processed
- **Then:** The current manager receives an in-app notification informing them that the pending request has been withdrawn by the employee; the request is removed from the current manager's pending approvals queue

---

### Receiving Manager Approval

---

**AC-036: Receiving manager receives in-app and email notification upon current manager approval**
- **Given:** The current manager approves a transfer request in `PENDING_CURRENT_MANAGER_APPROVAL`
- **When:** The request status transitions to `PENDING_RECEIVING_MANAGER_APPROVAL`
- **Then:** The receiving manager receives an in-app notification and an email notification indicating a transfer request for an incoming employee requires their approval; the notification includes the employee name, target role, target department, effective date, and requestId

---

**AC-037: Receiving manager can view full request details including current manager approval record**
- **Given:** A request is in `PENDING_RECEIVING_MANAGER_APPROVAL` and the receiving manager is authenticated
- **When:** The receiving manager opens the request detail view
- **Then:** The receiving manager sees all submission fields plus the current manager's name, employee ID, approval timestamp, and a clear indication that the current manager has already approved

---

**AC-038: Receiving manager approval transitions request to PENDING_HR_VALIDATION**
- **Given:** A request is in `PENDING_RECEIVING_MANAGER_APPROVAL` and the receiving manager is viewing it
- **When:** The receiving manager clicks Approve and confirms the action
- **Then:** The request status transitions to `PENDING_HR_VALIDATION`; the receiving manager's approval timestamp and approver ID are recorded; the HR Administrator receives a notification

---

**AC-039: Receiving manager rejection requires a mandatory rejection reason**
- **Given:** A request is in `PENDING_RECEIVING_MANAGER_APPROVAL` and the receiving manager attempts to reject it
- **When:** The receiving manager clicks Reject without providing a rejection reason
- **Then:** The rejection is blocked; a validation error is displayed requiring the receiving manager to provide a rejection reason before the action can be submitted

---

**AC-040: Employee and current manager are notified with reason on receiving manager rejection**
- **Given:** The receiving manager rejects a request in `PENDING_RECEIVING_MANAGER_APPROVAL` and provides a rejection reason
- **When:** The rejection is processed
- **Then:** The request status is set to `REJECTED` with `rejectedBy` = `RECEIVING_MANAGER`; the employee receives an in-app and email notification with the rejection reason; the current manager also receives an in-app and email notification with the same details

---

**AC-041: Employee can cancel while request is in PENDING_RECEIVING_MANAGER_APPROVAL**
- **Given:** An authenticated employee has a request in `PENDING_RECEIVING_MANAGER_APPROVAL` status
- **When:** The employee submits a cancellation
- **Then:** The request status transitions to `CANCELLED`; both the current manager and receiving manager receive an in-app notification that the request has been withdrawn; the `cancelledAt` timestamp and `cancelledBy` employee ID are recorded

---

**AC-042: HR Administrator receives notification after both managers approve**
- **Given:** The receiving manager approves a request transitioning it to `PENDING_HR_VALIDATION`
- **When:** The status transition is processed
- **Then:** The HR Administrator receives an in-app and email notification that a transfer request has been approved by both managers and is pending HR validation; the notification includes both managers' names and approval timestamps, the employee name, target role, target department, and requestId

---

### HR Validation

---

**AC-019: HR receives notification when request reaches PENDING_HR_VALIDATION**
- **Given:** Both the current manager and the receiving manager have approved the transfer request
- **When:** The request status transitions to `PENDING_HR_VALIDATION` (triggered by the receiving manager's approval)
- **Then:** The HR Administrator receives an in-app notification that a transfer request is pending HR validation; the HR Administrator also receives an email notification with a summary and a link to the request

---

**AC-020: HR can view full request details including both managers' approval records**
- **Given:** A request is in `PENDING_HR_VALIDATION` status and an HR Administrator is viewing the request
- **When:** The HR Administrator opens the request detail view
- **Then:** The HR Administrator can see all submitted request fields plus: the current manager's name, employee ID, and approval timestamp; the receiving manager's name, employee ID, and approval timestamp; and a clear indication that both manager approvals have been granted

---

**AC-021: HR approval triggers parallel downstream tasks**
- **Given:** A request is in `PENDING_HR_VALIDATION` status and the HR Administrator approves it
- **When:** The approval is submitted
- **Then:** The request status transitions to `IN_PROGRESS`; three downstream tasks are created simultaneously — one for IT, one for Payroll, and one for Facilities; each task is assigned an initial status of pending/incomplete; the HR approval timestamp and approver ID are recorded

---

**AC-022: HR rejection requires a mandatory rejection reason**
- **Given:** A request is in `PENDING_HR_VALIDATION` status and the HR Administrator attempts to reject it
- **When:** The HR Administrator clicks Reject without entering a rejection reason
- **Then:** The rejection action is blocked; the portal displays a validation error requiring the HR Administrator to provide a rejection reason before the action can be submitted

---

**AC-023: Employee and both managers are notified on HR rejection with reason**
- **Given:** An HR Administrator rejects a request in `PENDING_HR_VALIDATION` and provides a rejection reason
- **When:** The rejection is processed
- **Then:** The employee receives an in-app and email notification stating the request has been rejected by HR, including the rejection reason; the current manager also receives an in-app and email notification with the same details; the receiving manager also receives an in-app and email notification with the same details; the request status is set to `REJECTED` with `rejectedBy` value of `HR`

---

**AC-024: Employee cannot cancel once request is in PENDING_HR_VALIDATION or beyond**
- **Given:** An authenticated employee has a transfer request in `PENDING_HR_VALIDATION`, `IN_PROGRESS`, or `COMPLETED` status
- **When:** The employee attempts to submit a cancellation action for that request
- **Then:** The portal returns an error response (HTTP 409 Conflict or equivalent); the request status is unchanged; a clear message is displayed stating cancellation is no longer permitted at this stage

---

### Downstream Tasks — IT, Payroll, Facilities

---

**AC-025: IT team receives notification and can mark their task complete**
- **Given:** An HR Administrator approves a transfer request and the request transitions to `IN_PROGRESS`
- **When:** The IT provisioning task is created
- **Then:** The IT team receives an in-app and email notification with the transfer details and a link to their task; an authorised IT team member can open the task and mark it as complete in the portal; the `itTaskComplete` flag is set to `true` and the completion timestamp is recorded

---

**AC-026: Payroll team receives notification and can mark their task complete**
- **Given:** An HR Administrator approves a transfer request and the request transitions to `IN_PROGRESS`
- **When:** The Payroll update task is created
- **Then:** The Payroll team receives an in-app and email notification with the transfer details and a link to their task; an authorised Payroll team member can open the task and mark it as complete in the portal; the `payrollTaskComplete` flag is set to `true` and the completion timestamp is recorded

---

**AC-027: Facilities team receives notification and can mark their task complete**
- **Given:** An HR Administrator approves a transfer request and the request transitions to `IN_PROGRESS`
- **When:** The Facilities arrangement task is created
- **Then:** The Facilities team receives an in-app and email notification with the transfer details and a link to their task; an authorised Facilities team member can open the task and mark it as complete in the portal; the `facilitiesTaskComplete` flag is set to `true` and the completion timestamp is recorded

---

**AC-028: Overall status remains IN_PROGRESS while any downstream task is incomplete**
- **Given:** A request is in `IN_PROGRESS` status and one or two (but not all three) of the downstream tasks have been marked complete
- **When:** The system evaluates the task completion state
- **Then:** The overall request status remains `IN_PROGRESS`; the employee and HR can see which specific tasks are complete and which are still outstanding; no completion notification is sent until all three tasks are done

---

**AC-029: Status transitions to COMPLETED when all three tasks are marked complete**
- **Given:** A request is in `IN_PROGRESS` status and two of the three downstream tasks are already marked complete
- **When:** The third and final downstream task is marked as complete
- **Then:** The system automatically sets the overall request status to `COMPLETED`; the `completedAt` timestamp is recorded; no manual intervention is required to trigger this transition

---

**AC-030: Employee receives final notification when status transitions to COMPLETED**
- **Given:** All three downstream tasks have been marked complete and the request status has transitioned to `COMPLETED`
- **When:** The status change is processed
- **Then:** The employee receives an in-app notification confirming their transfer request has been fully processed and is ready for the effective date; the employee also receives an email notification with the same confirmation; the notification includes the requestId, the target role and department, and the effective date

---

### Visibility and Tracking

---

**AC-031: Employee can view real-time status of their request at any point**
- **Given:** An authenticated employee has one or more transfer requests in any status
- **When:** The employee views a specific request
- **Then:** The portal displays the current status of the request in real time, reflecting the latest state without requiring a page refresh beyond normal navigation; the current status label is clearly visible on the request detail view

---

**AC-032: Employee can see which downstream tasks are pending and which are complete**
- **Given:** A transfer request is in `IN_PROGRESS` status
- **When:** The employee views the request detail page
- **Then:** The portal displays the individual completion status of each downstream task — IT Provisioning, Payroll Update, and Facilities Arrangement — showing clearly which tasks are complete and which are still in progress

---

**AC-033: Each stage transition is timestamped and visible in request history**
- **Given:** A transfer request has progressed through one or more stage transitions
- **When:** Any actor views the request history or activity log
- **Then:** Each status transition is listed chronologically with: the previous status, the new status, the actor who triggered the change (by name and role), and the UTC timestamp of the transition; no transitions are omitted from the history

---

**AC-034: Actors can see only their own pending actions**
- **Given:** Multiple actors (current managers, receiving managers, HR Administrators, IT, Payroll, Facilities) are authenticated in the portal
- **When:** Each actor navigates to their pending actions or task queue
- **Then:** Each actor sees only the requests or tasks assigned to them; a current manager does not see another manager's pending approvals; an IT team member does not see Payroll or Facilities tasks; data is scoped by actor role and assignment

---

**AC-035: All actions taken on a request are recorded in an audit trail**
- **Given:** Any actor performs any action on a transfer request (submit, approve, reject, cancel, mark task complete)
- **When:** The action is processed by the system
- **Then:** An immutable audit log entry is created, recording: the action type, the actor's user ID and role, the timestamp of the action, and any relevant metadata (e.g., rejection reason, task completion flag); audit entries cannot be deleted or modified

---

## 5. Data Fields and Validation Rules

### 5.1 Transfer Request Record

| Field Name                    | Type            | Required    | Validation Rules                                                                                       | Notes                                                    |
|-------------------------------|-----------------|-------------|--------------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| `requestId`                   | String (UUID)   | System      | Auto-generated on submission; must be globally unique                                                  | Assigned by the system; not user-supplied                |
| `employeeId`                  | String          | Yes         | Must correspond to an authenticated employee in the system                                             | Derived from JWT token at submission time                |
| `employeeName`                | String          | System      | Populated from HR/identity system based on employeeId                                                  | Read-only; not user-editable                             |
| `currentDepartment`           | String          | System      | Populated from HR system based on the employee's current record                                        | Pre-populated; not user-editable                         |
| `targetDepartment`            | String          | Yes         | Must not be empty; must match a valid department code from the reference list                          | User-selected from a controlled list                     |
| `targetBusinessUnit`          | String          | Yes         | Must not be empty; must correspond to a valid business unit within the selected targetDepartment        | User-selected; dependent on targetDepartment selection   |
| `targetLocation`              | String          | Yes         | Must not be empty; must match a valid location code from the reference list                            | User-selected from a controlled list                     |
| `targetRole`                  | String          | Yes         | Must not be empty; must correspond to a valid role/position code in the reference data                 | User-selected from a controlled list                     |
| `effectiveDate`               | Date (ISO 8601) | Yes         | Must be a future date (strictly after the current date at time of submission); no minimum lead time enforced at this phase (AS-009) | Server-side validation required in addition to client-side |
| `reason`                      | String          | No          | Maximum 1000 characters if provided; no special character restrictions                                 | Optional free-text field                                 |
| `status`                      | Enum            | System      | One of: `PENDING_CURRENT_MANAGER_APPROVAL`, `PENDING_RECEIVING_MANAGER_APPROVAL`, `PENDING_HR_VALIDATION`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`, `CANCELLED` | Managed by the system state machine; never user-settable |
| `submittedAt`                 | DateTime (UTC)  | System      | Set at request creation; immutable thereafter                                                          | ISO 8601 UTC timestamp                                   |
| `lastUpdatedAt`               | DateTime (UTC)  | System      | Updated on every status change or task completion event                                                | ISO 8601 UTC timestamp                                   |
| `managerId`                   | String          | System      | Resolved from HR system (employee's current line manager) at submission time                           | Used to route current manager approval notification      |
| `receivingManagerId`          | String          | System      | Resolved from HR system (manager of target role/department) at submission time                         | Used to route receiving manager approval notification    |
| `managerApprovedBy`           | String          | Conditional | Populated when current manager approves; stores current manager's employeeId                           | Null until current manager approval                      |
| `managerApprovedAt`           | DateTime (UTC)  | Conditional | Set when current manager approves                                                                      | Null until current manager approval                      |
| `receivingManagerApprovedBy`  | String          | Conditional | Populated when receiving manager approves; stores receiving manager's employeeId                       | Null until receiving manager approval                    |
| `receivingManagerApprovedAt`  | DateTime (UTC)  | Conditional | Set when receiving manager approves                                                                    | Null until receiving manager approval                    |
| `hrApprovedBy`                | String          | Conditional | Populated when HR approves; stores HR Administrator's employeeId                                       | Null until HR approval                                   |
| `hrApprovedAt`                | DateTime (UTC)  | Conditional | Set when HR approves                                                                                   | Null until HR approval                                   |
| `rejectedBy`                  | Enum            | Conditional | One of: `MANAGER`, `RECEIVING_MANAGER`, `HR`; populated only when status is `REJECTED`                | Null for non-rejected requests                           |
| `rejectionReason`             | String          | Conditional | Required when a rejection action is taken; maximum 2000 characters                                     | Null for non-rejected requests                           |
| `rejectedAt`                  | DateTime (UTC)  | Conditional | Set when rejection action is taken                                                                     | Null for non-rejected requests                           |
| `cancelledBy`                 | String          | Conditional | Employee ID of the employee who cancelled; populated only when status is `CANCELLED`                   | Null for non-cancelled requests                          |
| `cancelledAt`                 | DateTime (UTC)  | Conditional | Set when employee cancels the request                                                                  | Null for non-cancelled requests                          |
| `itTaskComplete`              | Boolean         | System      | Default: `false`; set to `true` when IT team marks task complete                                       | Only relevant when status is `IN_PROGRESS` or `COMPLETED` |
| `itTaskCompletedAt`           | DateTime (UTC)  | Conditional | Set when IT marks their task complete                                                                  | Null until IT task completion                            |
| `payrollTaskComplete`         | Boolean         | System      | Default: `false`; set to `true` when Payroll team marks task complete                                  | Only relevant when status is `IN_PROGRESS` or `COMPLETED` |
| `payrollTaskCompletedAt`      | DateTime (UTC)  | Conditional | Set when Payroll marks their task complete                                                             | Null until Payroll task completion                       |
| `facilitiesTaskComplete`      | Boolean         | System      | Default: `false`; set to `true` when Facilities team marks task complete                               | Only relevant when status is `IN_PROGRESS` or `COMPLETED` |
| `facilitiesTaskCompletedAt`   | DateTime (UTC)  | Conditional | Set when Facilities marks their task complete                                                          | Null until Facilities task completion                    |
| `completedAt`                 | DateTime (UTC)  | Conditional | Set when all three downstream tasks are complete and overall status transitions to `COMPLETED`         | Null until final completion                              |

---

## 6. Notification Triggers

| Trigger Event                                               | Recipients                                           | Channel          | Message Summary                                                                                                                                                              |
|-------------------------------------------------------------|------------------------------------------------------|------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Request submitted successfully                              | Employee                                             | In-app + Email   | "Your transfer request [requestId] has been submitted and is pending current manager approval."                                                                               |
| Request reaches PENDING_CURRENT_MANAGER_APPROVAL            | Current Manager (Releasing Manager)                  | In-app + Email   | "A transfer request from [employeeName] requires your approval. Reference: [requestId]."                                                                                      |
| Current manager approves → PENDING_RECEIVING_MANAGER_APPROVAL | Receiving Manager                                 | In-app + Email   | "A transfer request from [employeeName] for the role [targetRole] in your team requires your approval. Reference: [requestId]. Current manager [currentManagerName] has already approved." |
| Receiving manager approves → PENDING_HR_VALIDATION          | HR Administrator                                     | In-app + Email   | "Transfer request [requestId] for [employeeName] has been approved by both managers and requires HR validation."                                                              |
| Current manager rejects request                             | Employee                                             | In-app + Email   | "Your transfer request [requestId] has been rejected by your current manager. Reason: [rejectionReason]."                                                                     |
| Receiving manager rejects request                           | Employee, Current Manager                            | In-app + Email   | "Your transfer request [requestId] has been rejected by the receiving manager. Reason: [rejectionReason]."                                                                    |
| Employee cancels request                                    | Employee, Current Manager (always); Receiving Manager (if request was in PENDING_RECEIVING_MANAGER_APPROVAL) | In-app + Email | Employee: "Your transfer request [requestId] has been cancelled." Manager(s): "Transfer request [requestId] from [employeeName] has been withdrawn." |
| HR approves request                                         | IT Team, Payroll Team, Facilities Team               | In-app + Email   | "A transfer provisioning/update/arrangement task has been created for employee [employeeName] (Request: [requestId]). Please action this within the portal."                  |
| HR rejects request                                          | Employee, Current Manager, Receiving Manager         | In-app + Email   | "Transfer request [requestId] for [employeeName] has been rejected by HR. Reason: [rejectionReason]."                                                                        |
| IT task marked complete                                     | (Internal log only — no external notification at individual task level. An audit entry is recorded with `action = TASK_COMPLETED` and the `itTaskComplete` flag is updated; this is surfaced via `GET /transfer-requests/{requestId}`. No push notification is dispatched.) | — | — |
| Payroll task marked complete                                | (Internal log only — no external notification at individual task level. An audit entry is recorded with `action = TASK_COMPLETED` and the `payrollTaskComplete` flag is updated; this is surfaced via `GET /transfer-requests/{requestId}`. No push notification is dispatched.) | — | — |
| Facilities task marked complete                             | (Internal log only — no external notification at individual task level. An audit entry is recorded with `action = TASK_COMPLETED` and the `facilitiesTaskComplete` flag is updated; this is surfaced via `GET /transfer-requests/{requestId}`. No push notification is dispatched.) | — | — |
| All downstream tasks complete — status COMPLETED            | Employee                                             | In-app + Email   | "Your transfer request [requestId] has been fully processed. Your transfer to [targetRole] in [targetDepartment] is confirmed for [effectiveDate]."                           |

> **Note:** Individual downstream task completion does not trigger an external notification. The system records each completion in the audit trail (`action = TASK_COMPLETED`) and updates the relevant task flag, which is surfaced via the portal's status view (AC-032). The final completion notification fires only when all three tasks are done.

---

## 7. Traceability Matrix

| AC ID  | Acceptance Criteria Title                                                              | Business Rule / Requirement Source                        |
|--------|----------------------------------------------------------------------------------------|-----------------------------------------------------------|
| AC-001 | Transfer request form displays all required fields                                     | BR-011, BR-012, Section 3 Stage 1 (Deliverable 01)        |
| AC-002 | All required fields must be completed before submission                                | BR-011, Section 3 Stage 1                                 |
| AC-003 | Effective date must be a future date                                                   | BR-010, AS-009                                            |
| AC-004 | Optional reason field is not required for submission                                   | BR-011 (reason listed as optional)                        |
| AC-005 | System assigns a unique request ID on submission                                       | BR-012                                                    |
| AC-006 | Request status set to PENDING_CURRENT_MANAGER_APPROVAL on submission                  | Section 3 Stage 1, BR-002                                 |
| AC-007 | Employee receives in-app and email confirmation on submission                          | BR-009, AS-007                                            |
| AC-008 | Employee cannot submit a request with a past effective date                            | BR-010                                                    |
| AC-009 | Employee can have multiple concurrent active transfer requests                         | BR-001                                                    |
| AC-010 | Employee can view all their submitted requests and statuses                            | BR-013                                                    |
| AC-011 | Current manager receives in-app and email notification on pending approval             | BR-009, Section 3 Stage 2                                 |
| AC-012 | Current manager can view full request details before deciding                          | BR-014, Section 3 Stage 2                                 |
| AC-013 | Current manager approval transitions request to PENDING_RECEIVING_MANAGER_APPROVAL    | BR-002, BR-015, Section 3 Stage 2                         |
| AC-014 | Current manager rejection requires a mandatory rejection reason                        | Section 3 Stage 2, BR-007                                 |
| AC-015 | Employee is notified with reason on current manager rejection                          | BR-009, BR-007                                            |
| AC-016 | Request status set to REJECTED on current manager rejection                            | BR-007                                                    |
| AC-017 | Employee can cancel request while in PENDING_CURRENT_MANAGER_APPROVAL                 | BR-003, Section 3 Stage 2                                 |
| AC-018 | Current manager is notified when employee cancels a pending request                    | BR-009, Section 3 Stage 2                                 |
| AC-019 | HR receives notification when request reaches PENDING_HR_VALIDATION                   | BR-009, Section 3 Stage 4; triggered by both managers approving |
| AC-020 | HR can view full request details including both managers' approval records              | BR-014, Section 3 Stage 4                                 |
| AC-021 | HR approval triggers parallel downstream tasks                                         | BR-005, Section 3 Stage 4                                 |
| AC-022 | HR rejection requires a mandatory rejection reason                                     | Section 3 Stage 4, BR-008                                 |
| AC-023 | Employee and both managers are notified on HR rejection with reason                    | BR-009, BR-008                                            |
| AC-024 | Employee cannot cancel once request is in PENDING_HR_VALIDATION or beyond              | BR-003, BR-004                                            |
| AC-025 | IT team receives notification and can mark their task complete                         | BR-005, BR-009, Section 3 Stage 5                         |
| AC-026 | Payroll team receives notification and can mark their task complete                    | BR-005, BR-009, Section 3 Stage 6                         |
| AC-027 | Facilities team receives notification and can mark their task complete                 | BR-005, BR-009, Section 3 Stage 7                         |
| AC-028 | Overall status remains IN_PROGRESS while any downstream task is incomplete             | BR-006, Section 3 Stage 8                                 |
| AC-029 | Status transitions to COMPLETED when all three tasks are marked complete               | BR-006, Section 3 Stage 8                                 |
| AC-030 | Employee receives final notification when status transitions to COMPLETED              | BR-009, Section 3 Stage 8                                 |
| AC-031 | Employee can view real-time status of their request at any point                       | BR-013, AS-011                                            |
| AC-032 | Employee can see which downstream tasks are pending and which are complete             | BR-013, AS-011                                            |
| AC-033 | Each stage transition is timestamped and visible in request history                    | BR-013, OQ-014 (audit obligation), AS-011                 |
| AC-034 | Actors can see only their own pending actions                                          | BR-014, Security / Data Scoping                           |
| AC-035 | All actions taken on a request are recorded in an audit trail                          | OQ-014, BR-012, Section 9 Decision: Audit and Data Retention |
| AC-036 | Receiving manager receives notification upon current manager approval                  | BR-002, BR-015, BR-009, BRU-3, Section 3 Stage 3         |
| AC-037 | Receiving manager can view full request details including current manager approval record | BR-014, Section 3 Stage 3                              |
| AC-038 | Receiving manager approval transitions request to PENDING_HR_VALIDATION               | BR-002, BR-015, BRU-3, Section 3 Stage 3                 |
| AC-039 | Receiving manager rejection requires a mandatory rejection reason                      | Section 3 Stage 3, BR-007                                 |
| AC-040 | Employee and current manager notified with reason on receiving manager rejection        | BR-009, BR-007, BR-015                                    |
| AC-041 | Employee can cancel while request is in PENDING_RECEIVING_MANAGER_APPROVAL            | BR-003, Section 3 Stage 3                                 |
| AC-042 | HR Administrator receives notification after both managers approve                     | BR-002, BR-009, BRU-3, Section 3 Stage 3                 |

---

## 8. Assumptions Relevant to This Specification

The following assumptions from Deliverable 01 directly affect the acceptance criteria and behaviour defined in this document. Each must be validated with the relevant stakeholder.

| Assumption ID | Summary                                                                                                   | Impact on This Spec                                                                 |
|---------------|-----------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| AS-001        | No employee eligibility rules enforced at submission time                                                  | AC-001 / AC-002 do not include eligibility checks; any authenticated employee can submit |
| AS-002        | No SLA enforcement or auto-escalation in this phase                                                        | No escalation AC items are included; elapsed time display is noted but not specified here |
| AS-003        | IT, Payroll, and Facilities are always triggered in parallel on HR approval                                 | AC-021 and AC-025–AC-027 are written without conditional skip logic                 |
| AS-004        | The transfer requires two sequential manager approvals: first by the current line manager (releasing manager), then by the receiving manager (manager of the target role/department). This is confirmed by BRU-3. Both managers are resolved from the HR system at submission time. | AC-011 to AC-018 apply to the current manager gate; AC-036 to AC-042 apply to the receiving manager gate; AC-013 transitions to PENDING_RECEIVING_MANAGER_APPROVAL (not PENDING_HR_VALIDATION) |
| AS-005        | A rejected request is terminal and cannot be resubmitted                                                    | No resubmission AC is included; REJECTED is a terminal state                        |
| AS-006        | A submitted request cannot be modified; employee must cancel and resubmit                                   | No request amendment AC is included                                                 |
| AS-007        | Notifications via in-app and email only                                                                     | All notification AC items specify in-app + email; no other channels                 |
| AS-009        | Effective date validated as a future date; no minimum lead time enforced                                    | AC-003 and AC-008 validate future date only                                         |
| AS-011        | Portal exposes individual downstream task status to employees and HR                                        | AC-032 specifies per-task visibility                                                 |
| AS-012        | Downstream systems do not have existing APIs; teams action tasks within the portal                          | AC-025–AC-027 describe in-portal task completion, not external API callbacks         |
| AS-013        | If the current manager and receiving manager resolve to the same employee ID, the system will treat this as a single-approval scenario and advance directly from PENDING_CURRENT_MANAGER_APPROVAL to PENDING_HR_VALIDATION upon that manager's approval. Pending confirmation from HR (OQ-015). | If OQ-015 confirms this behaviour, BR-016 governs; the dual-stage path via PENDING_RECEIVING_MANAGER_APPROVAL is bypassed for same-person scenarios |

---

*End of Deliverable 02 — Feature Specification and Acceptance Criteria*
