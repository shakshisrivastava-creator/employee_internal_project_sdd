# Assumptions Baseline — Employee Internal Transfer Digital Journey

## Document Metadata
- **Project Name:** Employee Internal Transfer Digital Journey
- **Feature Slug:** `employee-internal-transfer`
- **Baseline Version:** 4.0
- **Governing BRD:** [.ai-context/BRD.md](file:///d:/INTERNAL_SDD/employee_internal_project_sdd/.ai-context/BRD.md)
- **Status:** Pending Review (Gate 0 BRD v4.0 Re-Review)
- **Last Updated:** 2026-10-26

---

## 1. Core Architecture & Workflow Assumptions

| Assumption ID | Area | Working Assumption / Resolution | Rationale & Architectural Impact | Gate 0 Reviewer Action |
|---|---|---|---|---|
| **ASM-01** | Approval Model | **Sequential Manager Approval**: Current Manager approves first; upon approval, request advances to New Manager; upon New Manager approval, routes to HR Administrator. | Simplest governance model; prevents premature engagement of receiving department before current department releases employee. State machine implements distinct states: `PENDING_CURRENT_MGR` -> `PENDING_NEW_MGR` -> `PENDING_HR`. | Confirm sequential model for initial phase. |
| **ASM-02** | HR Eligibility | **Manual HR Review**: HR Administrator conducts policy, tenure, and disciplinary evaluation manually during `PENDING_HR` stage. | Automated algorithmic rule engine is deferred to a future phase (OOS-05). No automated policy check required for MVP release. | Confirm manual HR decision flow. |
| **ASM-03** | Downstream SLA | **5 Business Days SLA**: Each downstream fulfillment team (IT, Payroll, Facilities) operates under a 5 business day SLA. | System automatically dispatches reminder notifications upon SLA breach. No automated escalation or forced state transition. | Confirm 5 business day SLA threshold. |
| **ASM-04** | IT Task Triggering | **Universal IT Provisioning**: IT provisioning task is triggered for 100% of approved transfers, regardless of whether changes are department-, role-, or location-only. | IT Specialist evaluates and determines if network, hardware, or access changes are necessary. Simplifies orchestration engine. | Confirm IT task is always generated. |
| **ASM-05** | Downstream Fault Isolation | **Individual Task Failure Isolation**: Failure of one downstream task (e.g., IT hardware backordered) does not block or fail others (Payroll, Facilities). | Overall request remains in `PROCESSING_DOWNSTREAM` until all 3 downstream tasks reach a terminal state (`COMPLETED` or `FAILED`). HR is alerted for manual exception handling. | Confirm fault isolation pattern. |
| **ASM-06** | Notice Period | **14 Calendar Days Minimum Notice**: Employee-selected `effectiveDate` must be at least 14 calendar days from submission timestamp. | Accommodates 5-10 business day approval chain plus operational preparation for IT/Payroll/Facilities. Enforced via `VAL-4` validator. | Confirm 14 calendar day notice minimum. |
| **ASM-07** | Single Active Request | **Single In-Flight Constraint**: An employee may only have one active request in non-terminal state (`DRAFT`, `SUBMITTED`, `PENDING_*`, `PROCESSING_DOWNSTREAM`). | Prevents duplicate routing, conflicting departmental allocations, and database race conditions. Validated against `transferringEmployeeId`. Returns HTTP 409 Conflict. | Approved in BRD v4.0. |
| **ASM-08** | Withdrawal Window | **Pre-HR Withdrawal**: Voluntary cancellation is permitted at any time prior to HR Administrator approval (`SUBMITTED`, `PENDING_CURRENT_MGR`, `PENDING_NEW_MGR`). | Once HR approves and downstream provisioning begins, withdrawal is locked out to prevent orchestration inconsistency. | Approved in BRD v4.0. |
| **ASM-09** | Identity Separation `[NEW]` | **Proxy Initiator Separation**: In proxy-initiated requests, `initiatedById` captures the proxy actor (Manager or HR) while `transferringEmployeeId` captures the subject employee. | All business rules, duplicate validation (BRU-01), IDOR access control, and notification targets operate on `transferringEmployeeId`. For self-initiated requests, both fields are equal (`initiationMode = SELF`). | Confirm separation model. |
| **ASM-10** | Manager Proxy Scope `[NEW]` | **Direct Reports Only**: A Manager may only initiate a transfer request on behalf of their own direct reports. | System validates hierarchy relation against HRMS (DEP-01); attempts to proxy non-reports return HTTP 403 Forbidden. Self-transfer by a manager follows standard `SELF` mode (Scenario R). | Confirm direct report boundary. |
| **ASM-11** | HR Proxy Scope `[NEW]` | **Org-Wide Scope**: An HR Administrator may initiate a proxy transfer on behalf of any active employee across the organisation. | HR portal exposes organisation-wide employee search. All downstream validations apply to `transferringEmployeeId`. | Confirm organisation-wide HR scope. |
| **ASM-12** | Approval Routing `[NEW]` | **Manager Proxy Approval Skip**: When a Manager submits a proxy request for their direct report, the Current Manager approval step is skipped. | The manager's consent is implicit in the initiation act. Request transitions immediately from `DRAFT` to `PENDING_NEW_MANAGER_APPROVAL`. | Confirm approval step bypass. |
| **ASM-13** | Separation of Duties `[NEW]` | **HR Self-Approval Prevention**: The specific HR Administrator who initiated a proxy request is barred from approving that same request at the HR validation gate. | Enforces governance and four-eyes principle. System mandates a different HR Administrator conduct the `PENDING_HR_VALIDATION` review. | Confirm segregation of duties. |
| **ASM-14** | Dual Withdrawal Rights `[NEW]` | **Shared Pre-HR Withdrawal**: For proxy-initiated requests, either the transferring employee or the proxy initiator may withdraw the request prior to HR approval. | When either party withdraws, the request transitions to `WITHDRAWN` and cross-notification is immediately dispatched to both parties. | Confirm dual cancellation authority. |
| **ASM-15** | Notification Transparency `[NEW]` | **Immediate Proxy Notification**: The transferring employee must receive immediate email and in-portal notification when a proxy request is submitted on their behalf. | Ensures complete transparency so employees are never unaware of transfer workflows initiated in their name. | Confirm notification immediacy. |

---

## 2. Dependencies & External Integration Assumptions

| Dependency ID | System | Integration Mechanism | Assumption / Fallback |
|---|---|---|---|
| **DEP-01** | HRMS (Workday / SAP SuccessFactors) | REST API | Assumed accessible for employee profile, current role, and manager hierarchy. In local/test environments, mock adapter will supply deterministic test fixtures. |
| **DEP-02** | ITSM (ServiceNow / Jira Service Management) | REST API | Assumed to support programmatic task creation and webhook/callback for completion status. |
| **DEP-03** | Payroll System (SAP / ADP) | REST API | Assumed to accept cost-center and compensation schedule adjustments. Mocked in early phases. |
| **DEP-04** | Facilities Management | REST API | Workspace and badge provisioning handled via mock or asynchronous task status update. |
| **DEP-05** | SSO / IAM (Okta / Azure AD) | JWT / OAuth2 | Standard Bearer token authentication containing employee ID and role claims (`EMPLOYEE`, `MANAGER`, `HR_ADMIN`, `IT_SPECIALIST`, etc.). |
| **DEP-06** | Notification Dispatcher | Event Bus / SMTP | Assumed asynchronous dispatch with failure retry; does not block synchronous transaction commits. |

---

## 3. Out-of-Scope (Boundaries) Assumptions

- **OOS-01:** External hiring, job board posting, and candidate interview tracking.
- **OOS-02:** Compensation negotiation or custom remuneration packaging.
- **OOS-03:** Physical relocation and travel expense reimbursement processing.
- **OOS-04:** Cross-border visa, taxation, or international immigration compliance.
- **OOS-05:** Automated algorithmic rule engine for HR policy validation.
- **OOS-06:** Parallel manager approval workflows.
- **OOS-07:** Performance management linkages or appraisal overrides.
- **OOS-08:** Post-completion rollback or reversal workflow.

---

## 4. Gate 0 Sign-Off Checklist
- [ ] Reviewer verifies that all 6 initial Open Questions (OQ-1 to OQ-6) and 7 proxy-initiated business decisions (OQ-NEW-01 to OQ-NEW-07) have acceptable working resolutions.
- [ ] Reviewer verifies that external dependencies have clear mock/adapter fallback strategies.
- [ ] Reviewer verifies scope boundaries and proxy governance rules (ASM-09 to ASM-15) before Feature Specification (`.ai-context/specs/`) is revised.

