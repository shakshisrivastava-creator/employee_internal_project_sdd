# Deliverable 01 — Discovery & Requirement Analysis

| Field       | Detail                                              |
|-------------|-----------------------------------------------------|
| **Project** | Employee Internal Transfer Digital Journey          |
| **Version** | 1.1                                                 |
| **Date**    | 2025-07-14                                          |
| **Author**  | SDD Assessment — Developer Submission               |
| **Status**  | Updated — Post Gate 1 Review (F-006 Resolution)     |

---

### Revision History

| Version | Date       | Author                                | Summary of Changes                                                                                              |
|---------|------------|---------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| 1.0     | 2025-07-14 | SDD Assessment — Developer Submission | Initial draft created                                                                                           |
| 1.1     | 2025-07-14 | SDD Assessment — Developer Submission | Gate 1 F-006 resolution: OQ-012 resolved; dual-manager approval confirmed (BRU-3); Sections 2, 3, 4, 5, 6, 9 updated |

---

## 1. Business Objective

The organisation operates a **One-Point Employee Portal** that currently relies on manual, multi-team coordination to process internal employee transfers. This manual process introduces delays, inconsistent communication, and a lack of visibility for all parties involved.

The objective of this initiative is to **digitise and orchestrate the end-to-end internal transfer journey** within the portal. By automating the approval chain and integrating with downstream systems, the portal will:

- Eliminate manual hand-offs between Manager, HR, IT, Payroll, and Facilities teams.
- Provide employees with real-time visibility into the status of their transfer request.
- Enforce consistent business rules and approval sequencing across all transfer requests.
- Reduce processing time and administrative overhead for support functions.

The expected outcome is a self-service transfer workflow that is auditable, trackable, and scalable across the organisation.

---

## 2. Primary Users / Actors

| Actor               | Role Description                                                                 | Portal Interaction                                                                                         |
|---------------------|----------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| **Employee**        | The individual initiating the internal transfer request                          | Submits transfer request; selects target department, business unit, location, role, and effective date; views request status; cancels request (before both managers have approved) |
| **Current Manager (Releasing Manager)** | The employee's direct line manager in their current department. Responsible for the first approval gate. Approves or rejects the transfer from a team-capacity and operational perspective. | Receives notification of pending approval; reviews request details; approves or rejects the transfer |
| **Receiving Manager** | The manager of the target department/role the employee is transferring into. Responsible for the second approval gate. Approves or rejects from a headcount-acceptance and role-readiness perspective. | Receives notification after current manager approves; reviews request details including current manager's approval record; approves or rejects the transfer |
| **HR Administrator**| Human Resources representative who validates the transfer against HR policies    | Receives request post both manager approvals; validates role alignment, policy compliance, and HR records; approves or rejects |
| **IT Department**   | Technology team responsible for system access provisioning                       | Receives provisioning task post-HR approval; sets up or migrates system access, equipment, and accounts for the new role |
| **Payroll Team**    | Finance/Payroll team responsible for updating compensation records               | Receives payroll update task; adjusts salary grade, cost centre, and payment schedule based on the new role/location |
| **Facilities Team** | Workplace/Facilities team responsible for physical workspace arrangements        | Receives facilities task; arranges desk, access cards, and any location-specific requirements              |
| **System (Portal)** | The One-Point Employee Portal acting as the orchestration layer                  | Routes requests through each stage; sends notifications; tracks and exposes status to all parties          |

---

## 3. Journey Stages

The following describes the complete end-to-end journey for an internal transfer request from initiation to completion.

**Stage 1 — Request Initiation**
The employee logs into the One-Point Employee Portal and navigates to the Internal Transfer section. They complete the transfer request form by selecting:
- Target department and business unit
- Target location
- Target role or position
- Desired effective date
- Optional reason for transfer

The employee reviews the request summary and submits it. The portal assigns a unique request ID, records a timestamp, and sets the request status to **Pending Current Manager Approval**.

**Stage 2 — Current Manager Approval**
The employee's current line manager (releasing manager) receives an in-app notification and an email alert informing them of the pending transfer request. The manager reviews the request details within the portal and takes one of the following actions:
- **Approves** — the request progresses to Stage 3 (Receiving Manager Approval).
- **Rejects** — the request is closed with a rejection reason; the employee is notified.

The employee retains the ability to **cancel** the request at any point during this stage.

**Stage 3 — Receiving Manager Approval**
Upon current manager approval, the receiving manager (manager of the target role/department) receives an in-app notification and an email alert. The receiving manager reviews the full request details, including the current manager's approval record, and takes one of the following actions:
- **Approves** — the request progresses to Stage 4 (HR Validation).
- **Rejects** — the request is closed with a rejection reason; the employee and current manager are notified.

The employee retains the ability to **cancel** the request during this stage, up until the receiving manager acts.

**Stage 4 — HR Validation**
Upon both managers' approval, the HR Administrator receives an in-app and email notification. HR reviews the request for policy compliance, role eligibility, and organisational alignment. HR takes one of the following actions:
- **Approves** — the request progresses to parallel downstream processing (Stages 5, 6, and 7).
- **Rejects** — the request is closed with a rejection reason; the employee, current manager, and receiving manager are notified.

The employee **can no longer cancel** the request from this stage onwards.

**Stage 5 — IT Provisioning** *(runs in parallel with Stages 6 and 7)*
IT receives a provisioning task. They set up system access, user accounts, and any equipment requirements aligned to the new role and location. Once complete, they mark the task as done in the portal.

**Stage 6 — Payroll Update** *(runs in parallel with Stages 5 and 7)*
The Payroll team receives an update task. They adjust the employee's compensation details, cost centre allocation, and payroll schedule to reflect the new role and location. Once complete, they mark the task as done.

**Stage 7 — Facilities Arrangement** *(runs in parallel with Stages 5 and 6)*
The Facilities team receives an arrangement task. They prepare the physical workspace — desk allocation, access card configuration, and any location-specific requirements. Once complete, they mark the task as done.

**Stage 8 — Transfer Completion**
Once all three downstream tasks (IT, Payroll, Facilities) are marked complete, the portal automatically sets the overall request status to **Completed**. The employee receives a final in-app and email notification confirming the transfer is fully processed and ready for the effective date.

---

## 4. Business Rules

| Rule ID   | Description                                                                                                                 |
|-----------|-----------------------------------------------------------------------------------------------------------------------------|
| **BR-001** | An employee may have multiple concurrent internal transfer requests active at the same time.                               |
| **BR-002** | Current manager approval is mandatory and must occur before receiving manager approval. Receiving manager approval is mandatory and must occur before HR validation is triggered. These three stages are strictly sequential and cannot run in parallel. |
| **BR-003** | An employee may cancel a transfer request while it is in **PENDING_CURRENT_MANAGER_APPROVAL** or **PENDING_RECEIVING_MANAGER_APPROVAL** status. |
| **BR-004** | Once a request has been approved by both managers and passed to HR, the employee loses the ability to cancel.              |
| **BR-005** | IT Provisioning, Payroll Update, and Facilities Arrangement are triggered simultaneously upon HR approval and run in parallel. |
| **BR-006** | The overall transfer request status is set to **Completed** only when all three downstream tasks are marked as complete.   |
| **BR-007** | If either manager (current or receiving) rejects the request, the journey terminates; no downstream stages are triggered.  |
| **BR-008** | If HR rejects the request, the journey terminates; no downstream stages are triggered.                                     |
| **BR-009** | Notifications (in-app and email) must be sent to the relevant actor at each stage transition.                              |
| **BR-010** | The effective date of the transfer must be a future date at the time of submission.                                        |
| **BR-011** | The transfer request form must capture: department/business unit, location, role/position, effective date, and optional reason. |
| **BR-012** | Each transfer request is assigned a unique system-generated identifier upon submission.                                    |
| **BR-013** | An employee can view the current status and history of all their transfer requests from the portal.                        |
| **BR-014** | Each actor can view their pending actions (approvals or tasks) from within the portal.                                     |
| **BR-015** | The receiving manager is the manager of the target role and department as resolved from the HR system at submission time.  |
| **BR-016** | If the current manager and receiving manager are the same person (e.g., an intra-department move), only one approval action is required. The system must detect this and collapse the two stages into one. |

---

## 5. Open Questions

The following questions must be resolved by the relevant business or technical owners before detailed design and development can be finalised.

| ID      | Question                                                                                                              | Type       | Priority | Owner            | Status      | Resolution Note |
|---------|-----------------------------------------------------------------------------------------------------------------------|------------|----------|------------------|-------------|-----------------|
| OQ-001  | What eligibility rules govern whether an employee is permitted to submit a transfer request? (e.g., minimum tenure, probation period restrictions, performance rating thresholds, active disciplinary action) | Business   | High     | HR               | Open        | — |
| OQ-002  | What is the SLA (service level agreement) for each approval/task stage? (e.g., manager must approve within X business days; HR within Y days; IT/Payroll/Facilities within Z days) | Business   | High     | HR / Operations  | Open        | — |
| OQ-003  | What happens when an SLA deadline is breached? Is there an escalation process, and if so, to whom and how? | Business   | High     | HR / Operations  | Open        | — |
| OQ-004  | Are there conflict-of-interest rules? For example, can a manager approve a transfer for a direct family member, or can an employee transfer into their own manager's team? | Business   | Medium   | HR / Compliance  | Open        | — |
| OQ-005  | Under what specific conditions is the Payroll team triggered and what exact data must they receive? (e.g., only on grade change, or always; what if the new role carries the same pay grade?) | Business   | High     | Payroll          | Open        | — |
| OQ-006  | What are the detailed rules for IT provisioning? (e.g., does the employee retain existing access, is all access revoked and rebuilt from scratch, or is it a delta change aligned to the new role profile?) | Business   | High     | IT               | Open        | — |
| OQ-007  | What are the rules for Facilities arrangement? (e.g., is a desk always required, how are shared/hot-desking environments handled, are access card changes automatic or manual?) | Business   | Medium   | Facilities       | Open        | — |
| OQ-008  | What should happen if a downstream system (IT, Payroll, or Facilities) is unavailable at the time the task is triggered? Should the portal retry, queue the task, or alert an administrator? | Technical  | High     | Architecture/IT  | Open        | — |
| OQ-009  | Can an employee modify a transfer request after it has been submitted but before it has been approved by the manager? | Business   | Medium   | HR               | Open        | — |
| OQ-010  | Can an employee or HR resubmit a rejected transfer request, and if so, must it go through the full approval cycle again? | Business   | Medium   | HR               | Open        | — |
| OQ-011  | Is there a maximum number of concurrent active transfer requests permitted per employee, or is it truly unlimited? | Business   | Medium   | HR               | Open        | — |
| OQ-012  | Does the receiving manager (if different from the current manager) need to approve the transfer in addition to the current manager? | Business   | High     | HR               | **Resolved** | **Resolved: Both the current (releasing) manager and the receiving manager must approve the transfer, in that order. The current manager approves first; only then does the receiving manager receive the approval request. This is confirmed by BRU-3 in the business requirements.** |
| OQ-013  | How are inter-regional or cross-legal-entity transfers handled? Are there additional approval steps for transfers across countries or business units with different HR policies? | Business   | Medium   | HR / Legal       | Open        | — |
| OQ-014  | What audit and data retention requirements apply to transfer request records? (e.g., GDPR, local labour law) | Business   | Medium   | Legal/Compliance | Open        | — |
| OQ-015  | How should the system behave when the current manager and receiving manager are the same person (intra-department transfer)? Should one approval suffice, or should the manager approve twice in their dual capacity? | Business   | High     | HR               | Open        | — |

---

## 6. Assumptions

The following assumptions have been made to enable design progress in the absence of complete BRD detail. Each must be validated with the relevant stakeholder.

| ID       | Assumption                                                                                                                                    |
|----------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| **AS-001** | No employee eligibility rules are enforced by the system at submission time until OQ-001 is resolved. Any authenticated employee can submit a transfer request. |
| **AS-002** | No SLA enforcement or escalation logic will be built until OQ-002 and OQ-003 are resolved. The system will display elapsed time but not auto-escalate. |
| **AS-003** | IT, Payroll, and Facilities are triggered in parallel immediately upon HR approval. There is no conditional logic that skips any downstream team unless OQ-005, OQ-006, or OQ-007 indicate otherwise. |
| **AS-004** | The transfer requires two sequential manager approvals: first by the current line manager (releasing manager), then by the receiving manager (manager of the target role/department). This is confirmed by BRU-3. Both managers are resolved from the HR system at submission time. |
| **AS-005** | A rejected request is terminal. It cannot be resubmitted unless OQ-010 is resolved to indicate otherwise. |
| **AS-006** | A submitted request cannot be modified after submission. The employee must cancel (where permitted) and raise a new request unless OQ-009 is resolved otherwise. |
| **AS-007** | Notifications are delivered via in-app alerts and email only. No SMS, push notification, or third-party messaging integration is assumed. |
| **AS-008** | JWT tokens will be short-lived (e.g., 15–60 minute expiry) with a refresh token mechanism. The exact expiry and rotation policy will be confirmed during security design. |
| **AS-009** | The effective date field is validated to be a future date but no minimum lead-time is enforced until OQ-002 indicates a minimum notice period. |
| **AS-010** | All portal users are internal employees of the organisation. No external or contractor access is in scope. |
| **AS-011** | The portal will expose the status of each downstream task (IT, Payroll, Facilities) individually so that employees and HR can see which tasks are outstanding. |
| **AS-012** | Downstream systems (IT, Payroll, Facilities) do not have existing APIs to integrate with. The portal will expose task interfaces for those teams to action within the portal itself unless confirmed otherwise. |
| **AS-013** | If the current manager and receiving manager resolve to the same employee ID, the system will treat this as a single-approval scenario and advance directly from PENDING_CURRENT_MANAGER_APPROVAL to PENDING_HR_VALIDATION upon that manager's approval. This assumption is pending confirmation from HR (OQ-015). |

---

## 7. Dependencies

| Dependency ID | System / Team          | Type        | Direction    | Description                                                                                              | Status     |
|---------------|------------------------|-------------|--------------|----------------------------------------------------------------------------------------------------------|------------|
| DEP-001       | HR System              | Data        | Inbound      | Employee records, current role, department, manager hierarchy (including both current manager and target role's receiving manager), and employment status must be readable by the portal to pre-populate request forms and route approvals. | To Confirm |
| DEP-002       | Identity / Directory   | Auth        | Inbound      | Employee identity (username, email, employee ID) is required for JWT authentication and user lookup.     | To Confirm |
| DEP-003       | Email Service          | Notification | Outbound     | An SMTP or email gateway service is required to dispatch email notifications at each stage transition.    | To Confirm |
| DEP-004       | IT Provisioning System | Task        | Outbound     | The portal must either call an IT system API or create a task visible to IT within the portal. Depends on OQ-006 and AS-012. | To Confirm |
| DEP-005       | Payroll System         | Task        | Outbound     | The portal must either call a Payroll system API or create a task visible to Payroll within the portal. Depends on OQ-005 and AS-012. | To Confirm |
| DEP-006       | Facilities System      | Task        | Outbound     | The portal must either call a Facilities system API or create a task visible to Facilities within the portal. Depends on OQ-007 and AS-012. | To Confirm |
| DEP-007       | Database               | Persistence | Internal     | A relational database is required to store transfer requests, status history, approvals, and audit logs. | Assumed    |

---

## 8. Out-of-Scope Items

The following items are explicitly excluded from the scope of this feature:

- **External / contractor transfers** — only permanent internal employees are in scope.
- **Promotion or regrading workflows** — a transfer in this context refers to a lateral or location-based move, not a change in job grade initiated outside this flow.
- **Redundancy, restructuring, or involuntary transfers** — all transfers in scope are employee-initiated.
- **Cross-entity legal employment changes** — transfers that require a change of legal employer entity are out of scope.
- **Onboarding journeys for new hires** — this feature covers transfers only, not new employee onboarding.
- **Offboarding / exit workflows** — resignation or termination processes are separate.
- **Payroll calculation engine** — the portal triggers the Payroll team; it does not compute salaries or bonuses.
- **IT access management logic** — the portal raises a provisioning task; it does not implement or replicate the IT access control model.
- **Third-party HR system changes** — updates to the HR system's own records are the responsibility of the HR team after approval, not automated by this portal in the current scope.
- **Reporting and analytics dashboards** — aggregate transfer reporting is out of scope for this phase.
- **Mobile native application** — the portal is a web application; a native iOS/Android app is not in scope.
- **Multi-language / localisation support** — a single language interface is assumed for this phase.

---

## 9. Business vs Technical Decisions

| Decision Area                                   | Business Decision                                                                                        | Technical Decision                                                                                                  |
|-------------------------------------------------|----------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| **Approval sequence**                           | Current manager approval must precede receiving manager approval, which must precede HR validation — defined by business policy (BRU-3, BR-002) | Implemented as a sequential state machine with enforced stage ordering in the application layer; three distinct approval states |
| **Dual-manager approval sequencing**            | Both managers must approve sequentially; current manager before receiving manager — confirmed BRU-3 business rule | System must route approval notifications and enforce state transitions to the correct manager at each stage; manager identity resolved from HR system at submission time |
| **Same-person manager detection**               | Whether one approval suffices when current and receiving manager are the same — business decision (OQ-015) | System must compare current manager employee ID and receiving manager employee ID at submission time; if equal, collapse dual-stage into single-stage approval |
| **Concurrent transfer requests**                | Multiple concurrent requests per employee are permitted — business policy decision                       | Database and API must support multiple active requests per employee ID without conflict                             |
| **Cancellation window**                         | Employee may withdraw before both manager approvals are complete — business policy                       | Cancellation endpoint must permit cancellation from PENDING_CURRENT_MANAGER_APPROVAL and PENDING_RECEIVING_MANAGER_APPROVAL states; block cancellation from PENDING_HR_VALIDATION onwards |
| **Employee eligibility rules**                  | Whether tenure, probation, or performance restrict eligibility is a business policy question (OQ-001)    | Once rules are defined, they will be enforced as validation logic in the submission service                         |
| **Notification channels**                       | In-app and email notifications are sufficient — business preference                                      | Notification service will integrate with an email gateway (SMTP/API); in-app alerts stored and surfaced via API    |
| **Downstream orchestration trigger**            | HR approval (not manager approval) triggers downstream actions — confirmed BRU-4 business rule           | State machine transitions from PENDING_HR_VALIDATION to IN_PROGRESS only on HR approval; downstream task creation is an atomic operation within the HR approval transaction |
| **SLA definitions**                             | How many days each stage is allotted is a business/operational decision (OQ-002)                         | SLA tracking and escalation logic will be implemented once business defines the thresholds                          |
| **Authentication mechanism**                    | No existing SSO plugin is available — determined by current infrastructure state                         | JWT-based authentication designed from scratch using Spring Security; token issuance, validation, and refresh built internally |
| **API design**                                  | REST APIs are to be designed from scratch — no legacy contracts to honour                                | RESTful API design following standard conventions (resource-oriented URLs, HTTP verbs, JSON payloads, status codes) |
| **Technology stack**                            | Java Spring Boot chosen as the backend framework — organisational/project decision                       | Spring Boot application with Spring Web (MVC), Spring Security (JWT), Spring Data JPA, and a relational database    |
| **Downstream system integration model**         | Whether downstream teams use the portal as a task interface or integrate via API is undecided (OQ-008, AS-012) | Integration pattern (REST callback, portal-native task board, or message queue) to be confirmed after OQ resolution |
| **Effective date validation**                   | Effective date must be in the future — business rule (BR-010)                                            | Server-side date validation on submission; client-side date picker constrained to future dates                      |
| **Reference data governance**                   | Which teams own the canonical lists of departments, roles, locations — business/data governance decision  | Reference data served via read-only API endpoints; sourced from HR system (DEP-001); portal does not own or maintain this data |
| **Rejection reason mandatory**                  | Both managers and HR must provide a reason when rejecting — business policy decision                     | Rejection endpoints validate presence of rejectionReason field; return 400 if absent                               |
| **Concurrent requests permitted**               | Multiple active requests per employee is an explicit business permission — business policy (BR-001)      | No uniqueness constraint on (employeeId, status=active); database and API support multiple non-terminal requests per employee |
| **Audit and data retention**                    | Retention period and legal obligations are business/legal decisions (OQ-014)                             | Audit log table design and archival/purge jobs will be built once legal requirements are confirmed                  |
