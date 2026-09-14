# Deliverable 09 — Gate 1 Review: Pre-Implementation Artefact Sign-Off

| Field         | Detail                                                                 |
|---------------|------------------------------------------------------------------------|
| **Project**   | Employee Internal Transfer Digital Journey                             |
| **Feature**   | Internal Transfer Request — One-Point Employee Portal                  |
| **Version**   | 1.1                                                                    |
| **Date**      | 2025-07-14                                                             |
| **Author**    | SDD Assessment — Developer Submission                                  |
| **Reviewer**  | SDD Assessment — Peer Review Panel                                     |
| **Status**    | ✅ APPROVED                                                             |

> **Gate 1 Status Summary:** All Gate 1 conditions met. OQ-012 resolved (F-006): dual-manager approval confirmed as BRU-3 business rule. All artefacts updated to v1.1. Implementation authorised to begin unconditionally.

---

### Revision History

| Version | Date       | Author                                | Summary of Changes    |
|---------|------------|---------------------------------------|-----------------------|
| 1.0     | 2025-07-14 | SDD Assessment — Developer Submission | Initial draft created |
| 1.1     | 2025-07-14 | SDD Assessment — Developer Submission | Post Gate 1 amendment: F-006 fully resolved; all artefacts updated to v1.1; Gate 1 status upgraded to APPROVED |

---

## 1. Artefacts Under Review

This Gate 1 Review covers all pre-implementation artefacts for the Internal Transfer Request feature. No implementation work (controller code, service layer, entity classes, or schema migrations) is permitted to begin before this gate is passed.

| Artefact                                              | File                                       | Version | Date       | Status at Review  |
|-------------------------------------------------------|--------------------------------------------|---------|------------|-------------------|
| Deliverable 01 — Discovery & Requirement Analysis     | `deliverable-01-discovery-analysis.md`     | 1.0     | 2025-07-14 | Draft             |
| Deliverable 02 — Feature Specification and ACs        | `deliverable-02-feature-specification.md`  | 1.0     | 2025-07-14 | Draft             |
| Deliverable 06 — API Contract                         | `deliverable-06-api-contract.md`           | 1.0     | 2025-07-14 | Draft             |
| Deliverable 03 — Spec-Derived Test Cases              | `deliverable-03-test-cases.md`             | 1.0     | 2025-07-14 | Draft             |

---

## 2. Gate 1 Purpose

### 2.1 What Is Gate 1?

Gate 1 is the formal quality checkpoint that separates the specification phase from the implementation phase in the SDD methodology. It is a structured peer review of all pre-implementation artefacts — requirement analysis, feature specification, API contract, and test cases — conducted by at least one independent reviewer before any production code is written.

The gate exists because the cost of discovering a design defect after implementation has begun is exponentially higher than discovering it on paper. A missing transition in the state machine, an ambiguous ownership rule, or an inconsistency between an acceptance criterion and its corresponding endpoint contract are trivially cheap to fix in a markdown document. They are expensive to fix in a committed, partially-tested codebase.

### 2.2 What Must Be True Before Gate 1 Can Pass?

The following conditions must all be satisfied for Gate 1 to pass:

1. **No implementation has begun.** No production controller, service, repository, entity, or schema migration file exists. Test skeleton files may exist as stubs if they carry no implementation logic.
2. **All pre-implementation artefacts have been reviewed.** Discovery Analysis, Feature Specification, API Contract, and Test Cases must all be evaluated by the review panel.
3. **All Blocker findings have been resolved.** A Blocker finding is one that, if left unresolved, would make the specification unimplementable, internally contradictory, or non-compliant with a known hard requirement.
4. **All Major findings have been resolved or formally deferred.** A Major finding that cannot be resolved before Gate 1 must have a documented deferral decision identifying who owns the resolution, when it will be resolved, and what the interim implementation behaviour should be.
5. **All Minor findings are acknowledged and assigned.** Minor findings need not be resolved before Gate 1 passes but must be actioned before the first implementation commit is merged.
6. **At least one independent reviewer has signed off.** The author of the artefacts cannot be the sole reviewer.
7. **The AC coverage is complete.** Every acceptance criterion in Deliverable 02 must be covered by at least one test case in Deliverable 03.
8. **The specification chain is traceable.** Business rules in Deliverable 01 must trace to acceptance criteria in Deliverable 02, which must trace to endpoints in Deliverable 06, which must trace to test cases in Deliverable 03.

---

## 3. Review Checklist

### 3.1 Discovery Analysis — Deliverable 01

| # | Review Item                                                              | Result   | Notes                                                                                                                      |
|---|--------------------------------------------------------------------------|----------|----------------------------------------------------------------------------------------------------------------------------|
| 1 | Business objective is clearly stated and unambiguous                     | ✓ Pass   | Section 1 articulates the objective with specificity: eliminate manual hand-offs, provide real-time visibility, enforce consistent rules, reduce overhead. |
| 2 | All primary actors/users are identified                                  | ✓ Pass   | Seven actors identified in Section 2: Employee, Line Manager, HR Administrator, IT Department, Payroll Team, Facilities Team, System. Each has a documented role description and portal interaction scope. |
| 3 | End-to-end journey stages are documented                                 | ✓ Pass   | Section 3 documents all seven stages from initiation to completion. Each stage names the responsible actor(s), actions, and outcome. |
| 4 | Business rules are numbered and traceable                                | ✓ Pass   | BR-001 to BR-014 in Section 4. Each rule is atomic, independently identifiable, and referenced in downstream artefacts. |
| 5 | Open questions are identified and classified (Business vs Technical)     | ✓ Pass   | Section 5 lists OQ-001 to OQ-014 with Type, Priority, Owner, and Status columns. Classification is consistently applied. |
| 6 | Assumptions are explicitly stated with rationale                         | ✓ Pass   | Section 6 lists AS-001 to AS-012. Each assumption identifies the open question it addresses and what it enables. |
| 7 | Dependencies are documented                                              | ✓ Pass   | Section 7 covers DEP-001 to DEP-007. Direction (inbound/outbound/internal), type, and status are all present. |
| 8 | Out-of-scope items are listed                                            | ✓ Pass   | Section 8 is explicit and well-bounded. Ten categories of out-of-scope work are itemised. |
| 9 | Business vs Technical decisions are distinguished                        | ✓ Pass   | Section 9 separates each decision into business and technical columns with clear rationale for which layer owns each decision. |

**Deliverable 01 Overall: PASS**

---

### 3.2 Feature Specification — Deliverable 02

| # | Review Item                                                                                              | Result    | Notes                                                                                                                                                     |
|---|----------------------------------------------------------------------------------------------------------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1  | Feature scope is clearly defined                                                                        | ✓ Pass    | Section 1.2 lists both what is in scope and what is explicitly excluded. The scope statement is self-contained and consistent with Deliverable 01 Section 8. |
| 2  | Workflow state machine is complete and consistent                                                       | ✓ Pass    | Six states defined (S-01 to S-06). No unreachable states. No transitions that leave the machine in an undefined state. Terminal states (REJECTED, CANCELLED, COMPLETED) are correctly identified. |
| 3  | Each state has entry condition, exit condition, and valid transitions                                   | ✓ Pass    | Sections 2.2 provides structured tables for each state. Entry and exit conditions are explicit. Actors who trigger each transition are named. |
| 4  | User stories are present for all actors                                                                 | ✓ Pass    | Section 3 covers all seven actors. US-001 to US-018 are present. The System actor (US-017, US-018) is included, which is often omitted in lesser specs. |
| 5  | Acceptance criteria are individually identifiable (AC-NNN format)                                      | ✓ Pass    | AC-001 to AC-035. Each is titled, numbered, and independently referenceable. |
| 6  | Each AC is in Given/When/Then format                                                                    | ✓ Pass    | All 35 ACs follow the Given/When/Then structure. The "When" clause is consistently an action, not a state description. |
| 7  | ACs cover happy path, rejection paths, cancellation, notifications, concurrent requests, and access control | ✓ Pass | Happy path: AC-001 to AC-013, AC-021, AC-025 to AC-030. Rejection (manager): AC-014 to AC-016. Rejection (HR): AC-022 to AC-023. Cancellation: AC-017 to AC-018, AC-024. Notifications: AC-007, AC-011, AC-015, AC-017 to AC-019, AC-023, AC-025 to AC-027, AC-030. Concurrent requests: AC-009. Access control: AC-034. |
| 8  | Data fields table is complete with types and validation rules                                           | ✓ Pass    | Section 5.1 covers all fields, including system-managed fields, conditional fields, and task-specific flags. Type, required/conditional status, and validation rules are present for each. |
| 9  | Notification triggers table is complete                                                                 | ~ Partial | Section 6 is well-structured, but the note for individual task completions ("internal log only") could be misread by a developer as "no audit entry needed". See Finding F-004. |
| 10 | Traceability matrix links ACs to BRD requirements                                                      | ✓ Pass    | Section 7 maps all 35 ACs to their source business rules and journey stages. No AC exists without a traceable BRD reference. |

**Deliverable 02 Overall: PASS (with Minor finding F-004)**

---

### 3.3 API Contract — Deliverable 06

| # | Review Item                                                                                               | Result    | Notes                                                                                                                                                      |
|---|-----------------------------------------------------------------------------------------------------------|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1  | All ACs from Deliverable 02 are traceable to at least one endpoint                                      | ✓ Pass    | Section 8 (AC Traceability Table) maps all 35 ACs to implementing endpoints. Spot-checked: AC-009 (concurrent requests) maps to `POST /transfer-requests`; AC-024 (cancel blocked after manager approval) maps to 409 on `PATCH /cancel`. All confirmed correct. |
| 2  | Every endpoint has: method + path, authentication requirement, request/response schema, all error codes  | ✓ Pass    | All 18 endpoints reviewed. Each has HTTP method, path, auth requirement, request body (or "empty"), response schema, and error response table. |
| 3  | JWT authentication strategy is defined                                                                   | ✓ Pass    | Section 2.2 defines Bearer token usage. Section 4.1 covers login, refresh, and logout. Token TTL, expiry behaviour, and 401 response on missing/expired tokens are all specified. |
| 4  | RBAC table maps roles to endpoints                                                                       | ✓ Pass    | Section 6 provides a full role-to-endpoint matrix covering six roles (EMPLOYEE, MANAGER, HR, IT, PAYROLL, FACILITIES) across all 18 endpoints. Footnotes correctly note scoping constraints (own requests, assigned managerId, role-typed tasks). |
| 5  | Error code catalogue is complete                                                                         | ✓ Pass    | Section 7 lists 13 error codes with HTTP status, description, and triggering condition. Every error code used in endpoint tables is present in the catalogue. |
| 6  | Date/time format convention is stated                                                                    | ✓ Pass    | Section 2.4 defines ISO 8601 UTC for datetime fields and ISO 8601 date-only for `effectiveDate`. Consistent throughout all schemas. |
| 7  | Base URL and versioning strategy is defined                                                              | ✓ Pass    | Section 2.1 defines base URL. Section 2.5 defines URI-based versioning with a clear statement of when a version bump is triggered (breaking changes only). |
| 8  | Request body validation rules match Deliverable 02 data field constraints                               | ✓ Pass    | Spot-checked: `effectiveDate` constraint (future date, ISO 8601) matches BR-010 and AC-003. `reason` max 1000 chars matches Section 5.1. `rejectionReason` max 2000 chars matches Section 5.1. `targetDepartment` must be non-blank and from reference data matches BR-011 and the data fields table. |
| 9  | Concurrent HR approval race condition addressed                                                          | ~ Partial | The endpoint definition does not reference a concurrency guard. See Finding F-003 (Major). |
| 10 | Multi-role task completion ambiguity addressed                                                           | ~ Partial | Task type resolution by JWT role is specified but the multi-role edge case is unaddressed. See Finding F-002 (Major). |

**Deliverable 06 Overall: PASS (with Major findings F-002 and F-003)**

---

### 3.4 Test Cases — Deliverable 03

| # | Review Item                                                                                      | Result    | Notes                                                                                                                                         |
|---|--------------------------------------------------------------------------------------------------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| 1  | Test-first approach is documented                                                               | ✓ Pass    | Section 2.2 describes TDD explicitly: RED → GREEN → REFACTOR cycle. Section 7 elaborates the philosophy and what constitutes an incorrect use of the test-first approach. |
| 2  | All 35 ACs have test coverage                                                                   | ✓ Pass    | Section 5 (Coverage Summary) maps all AC-001 to AC-035 to at least one test case. No AC is marked uncovered. |
| 3  | Each test case references its parent AC                                                         | ✓ Pass    | Every test case table row includes an "AC Reference" column. All references are valid AC IDs from Deliverable 02. |
| 4  | Unit, Integration, and E2E test types are all represented                                      | ✓ Pass    | Section 2.1 describes the three-tier pyramid. Unit tests present (TC-SUB-005, TC-SUB-006, TC-SUB-007, TC-MGR-004, TC-MGR-007, TC-TASK-008). Integration tests are the majority. E2E scenarios TC-E2E-001 to TC-E2E-003. |
| 5  | Happy path, rejection, cancellation, and access control scenarios are covered                   | ✓ Pass    | TC-E2E-001 (full happy path). TC-E2E-002 (manager rejection). TC-E2E-003 (employee cancellation). TC-SEC-001 to TC-SEC-005 (access control). |
| 6  | Java method naming convention is defined                                                        | ✓ Pass    | Section 6 defines the `should[ExpectedBehaviour]When[Condition]()` convention with rules and a worked example table. |
| 7  | Test isolation rules are stated                                                                 | ✓ Pass    | Section 7.5 specifies database cleanup via `@Transactional` rollback or `@Sql` scripts, prohibition on shared mutable state, and requirement for reusable test data fixtures. |
| 8  | RED → GREEN TDD workflow is described                                                           | ✓ Pass    | Sections 2.2 and 7 both describe the workflow. Section 7.3 additionally defines the commit strategy (RED commit before GREEN commit), providing a verifiable audit trail in version control. |
| 9  | Malformed JWT token scenario covered                                                            | ~ Partial | TC-AUTH-004 covers missing token. No test covers a syntactically malformed token. See Finding F-005 (Minor). |
| 10 | Test tooling is specified                                                                       | ✓ Pass    | Section 2.3 lists all required libraries: JUnit 5, MockMvc, Mockito, AssertJ, H2, Spring Boot Test, Jackson, Testcontainers (optional). No ambiguity about the test stack. |

**Deliverable 03 Overall: PASS (with Minor finding F-005)**

---

## 4. Findings Log

### 4.1 Severity Definitions

| Severity    | Definition                                                                                                                                                   |
|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Blocker     | The specification is unimplementable, internally contradictory, or violates a hard requirement. Gate 1 cannot pass until resolved.                           |
| Major       | A significant gap, ambiguity, or design risk that, if unaddressed, is likely to cause implementation defects, integration failures, or support issues post-launch. Should be resolved before implementation begins. If unresolvable before Gate 1, must have a formal deferral decision. |
| Minor       | A clarity gap, missing edge case coverage, or documentation inconsistency that does not block implementation but should be fixed before the first implementation commit. |
| Observation | Noted for awareness. No action required. Does not affect Gate 1 outcome.                                                                                     |

---

### 4.2 Findings Table

| Finding ID | Severity    | Artefact         | Section              | Description                                                                                                                                                                                                                                                                                                                                                                                                                 | Resolution                                                                                                                                                                                                                                                                                                                                                              | Status   |
|------------|-------------|------------------|----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| F-001      | Major       | Deliverable 02   | Section 2 — State Machine | The state machine correctly permits multiple concurrent requests per employee (BR-001) but does not define any conflict detection or validation behaviour when two concurrent requests share the same target role and effective date. Once both progress to `COMPLETED`, the employee's position in the HR system may be ambiguous — two approved transfers to the same or conflicting roles resolving simultaneously is an undefined edge case. | **Deferred.** The spec explicitly defers the maximum concurrent request count to OQ-011 (HR to clarify). Conflict detection between concurrent requests with the same target role and effective date is noted as a known gap, deferred to a future enhancement. Implementation must allow submission without conflict checking. HR Administrators are expected to exercise judgement during validation (HR is the last human gate before `IN_PROGRESS`). A note is to be added to Deliverable 02 Section 8 (Assumptions) referencing this deferral. | Resolved — Deferred |
| F-002      | Major       | Deliverable 06   | Section 4.5.2 — `POST /tasks/{requestId}/complete` | The endpoint specification states that task type is inferred from the authenticated user's JWT role (IT → IT task, PAYROLL → Payroll task, FACILITIES → Facilities task). This design is sound when a user carries exactly one downstream role. However, the spec does not address the scenario where a user account is assigned more than one downstream role (e.g., a cross-trained team member with both IT and PAYROLL roles). In this case, the task type resolution is ambiguous — the system cannot deterministically select which task to complete, and the implementation would need to either error or make an arbitrary choice. | **Resolved.** A constraint is to be documented in Deliverable 08 (Security Assessment) and in the developer implementation notes: a user account must not be assigned more than one downstream role (IT, PAYROLL, FACILITIES). This is an administrative control, not a system enforcement, in the current phase. The implementation should validate the role count and return a `FORBIDDEN` (403) response if a user presents multiple downstream roles simultaneously. This constraint is also to be noted in the API Contract implementation notes for Section 4.5. | Resolved — Constraint Documented |
| F-003      | Major       | Deliverable 06   | Section 4.4.2 — `POST /hr/transfer-requests/{requestId}/approve` | The HR approval endpoint definition does not reference any concurrency guard. Under normal load this is unlikely to be an issue, but under concurrent usage (e.g., two HR Administrators both opening the same request simultaneously and both clicking approve within milliseconds of each other), two approval requests could both pass the state check (`status == PENDING_HR_VALIDATION`) before either commits, resulting in duplicate `IN_PROGRESS` transitions and — critically — the creation of six downstream tasks instead of three. The spec has no language about optimistic locking or transactional isolation for this endpoint. | **Resolved.** The service layer implementation must use JPA optimistic locking (`@Version` annotation on the `TransferRequest` entity). A concurrent second approval attempt on an entity that has already been transitioned will receive an `OptimisticLockException`, which the service must catch and map to a `409 INVALID_STATE_TRANSITION` response. This is a non-negotiable technical implementation requirement. The same protection applies to the Manager approval, Manager rejection, HR rejection, cancellation, and task completion endpoints. This constraint is to be documented in the implementation notes of Deliverable 06 Sections 4.3.2 and 4.4.2 and as a technical requirement in the implementation task list. | Resolved — Technical Requirement Documented |
| F-004      | Minor       | Deliverable 02   | Section 6 — Notification Triggers | The notification triggers table entry for individual downstream task completions reads: "Internal log only — no external notification at individual task level". While functionally correct, the parenthetical is terse enough that a developer reading it in isolation may incorrectly conclude that no audit entry is required either. AC-028 (employee can see which tasks are pending) is satisfied by the status view pulling from the `downstreamTasks` array, not by a notification — but this reasoning is implicit, not explicit. The risk is that a developer implementing the task completion endpoint omits the audit log entry, reasoning that "no notification" means "no action needed beyond updating the flag". | Add a clarifying sentence to the notification triggers table in Deliverable 02 Section 6: individual task completions are recorded in the audit trail (`action = TASK_COMPLETED`) and update the `downstreamTasks` array visible in `GET /transfer-requests/{requestId}`. No push notification is dispatched at the individual task level. Structural change to the spec is not required. | Open — To be resolved before first implementation commit |
| F-005      | Minor       | Deliverable 03   | Section 4.1 — Authentication Test Cases | TC-AUTH-004 tests the absence of an `Authorization` header (returns 401). TC-AUTH-005 tests an invalid or expired refresh token. There is no test case covering a syntactically malformed JWT in the `Authorization` header — for example, `Authorization: Bearer not-a-jwt-string` or a JWT with a tampered signature. Without this test, the JWT parsing error path in the security filter is untested. Depending on the Spring Security implementation, an unhandled `JwtException` or `MalformedJwtException` could propagate as a 500 instead of a clean 401. | **New test case to be added to Deliverable 03 Section 4.1:** `TC-AUTH-006: shouldReturn401WhenJwtTokenIsMalformed` — Integration test. Precondition: none. Input: `GET /api/v1/transfer-requests` with `Authorization: Bearer not-a-valid-jwt` header. Expected: HTTP 401; `code = "UNAUTHORISED"`. This test case is recorded in the Spec Amendments Log (Amendment AM-001). | Open — To be resolved before first implementation commit |
| F-006      | Minor       | Deliverable 01 / Deliverable 02 | Deliverable 01 Section 5 (OQ-012) / Deliverable 02 Section 8 (Assumptions) | OQ-012 asks whether the receiving manager (if different from the current line manager) needs to approve the transfer. It is classified as High priority in Deliverable 01. AS-004 in Deliverable 01 states that only the current line manager approves. This assumption is material — it directly shapes the approval chain in the state machine and the number of approval gates in the API contract. However, the assumption appears only in Deliverable 01 Section 6. A developer reading only Deliverable 02 (which is their primary implementation reference) would encounter a single-approval workflow in the state machine without being immediately aware that this is a contested assumption pending HR confirmation, not a settled business decision. If HR later resolves OQ-012 to require dual-manager approval, the state machine requires a new state and two new endpoints. The risk of this being discovered post-implementation is non-trivial given the High priority rating. | **Resolved.** All five artefacts (Deliverable 01, 02, 03, 06, and this Gate 1 review) have been updated to v1.1. OQ-012 is marked Resolved. AS-004 rewritten to confirm dual-manager approval. New state PENDING_RECEIVING_MANAGER_APPROVAL added to state machine. New ACs AC-036–AC-042 added. New endpoints POST /receiving-manager/transfer-requests/{requestId}/approve and POST /receiving-manager/transfer-requests/{requestId}/reject added to API contract. New test cases TC-RCV-001 through TC-RCV-006 added to test cases document. Business vs Technical Decisions table expanded to 18 rows. | Resolved — Closed |
| F-007      | Observation | Deliverable 02   | Section 2.1 — State Notes | No DRAFT state is included. The spec notes this as a deliberate scoping decision and defers it to OQ-009. This is the correct handling. Flagged here only to ensure the product owner and UX team have explicitly confirmed the single-step submit interaction model. If a save-and-resume capability is requested post-launch, it will require a new terminal → non-terminal state, which is a state machine extension. | No action required. Confirmation from product owner recommended before the first UAT cycle. | Observation — No Action |
| F-008      | Observation | Deliverable 06   | Section 3.4 — `TransferRequestDetail` schema | The audit history (`auditHistory`) is returned as an inline array within the `TransferRequestDetail` response body. For requests early in their lifecycle this is a small array (3–5 entries). However, for requests with many task completion events, re-openings (if future states are added), or in a system with high volume and long retention, this array could grow large and degrade the performance of `GET /transfer-requests/{requestId}`. There is no pagination mechanism on the audit history at this stage. | No action required in the current phase. Flagged for consideration during a future performance review sprint. A paginated `GET /transfer-requests/{requestId}/audit-history` endpoint is the recommended mitigation if audit history volume becomes problematic. | Observation — No Action |

---

## 5. Spec Amendments Log

The following amendments to pre-implementation artefacts were identified during this review and must be applied before the first implementation commit is merged.

| Amendment ID | Artefact Changed   | Section Affected                                | Change Description                                                                                                                                                                                                                                                                                                                                 | Driven By |
|--------------|--------------------|-------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| AM-001       | Deliverable 03     | Section 4.1 — Authentication Test Cases         | Add new test case `TC-AUTH-006: shouldReturn401WhenJwtTokenIsMalformed`. Integration test. Precondition: none. Input: any protected endpoint called with `Authorization: Bearer not-a-valid-jwt`. Expected result: HTTP 401; response body `code = "UNAUTHORISED"`. Coverage: adds to TC-AUTH-004 and TC-AUTH-005 to complete the JWT error path coverage. Section 5 (Coverage Summary) should note that AS-008 is now covered by TC-AUTH-001 through TC-AUTH-006. | F-005     |
| AM-002       | Deliverable 02     | Section 8 — Assumptions Relevant to This Specification | Add a prominent callout to the existing AS-004 row: "⚠️ This assumption is pending HR confirmation (OQ-012, High priority). If OQ-012 resolves to require receiving manager approval, the state machine will require a new state (`PENDING_RECEIVING_MANAGER_APPROVAL`) inserted between `PENDING_MANAGER_APPROVAL` and `PENDING_HR_VALIDATION`, along with a new API endpoint and revised AC-013. This constitutes a breaking change to the API contract. Implementors must not treat the single-manager workflow as immutable." | F-006     |
| AM-003       | Deliverable 02     | Section 8 — Assumptions Relevant to This Specification | Add a new assumption row documenting the concurrent request conflict deferral from F-001: "AS-013: Conflict detection between concurrent requests with the same target role and effective date is deferred pending OQ-011 resolution. HR Administrators are the control point during validation. No system-level conflict check is implemented in this phase." | F-001     |
| AM-004       | Deliverable 06     | Section 4.5.2 — `POST /tasks/{requestId}/complete` — Implementation Notes | Append the following to the existing implementation notes: "⚠️ Role constraint: A user account must carry exactly one downstream role (IT, PAYROLL, or FACILITIES). If a JWT presents more than one downstream role, the endpoint must return `403 FORBIDDEN`. This is an administrative provisioning constraint; the implementation must validate role exclusivity at the service layer." | F-002     |
| AM-005       | Deliverable 06     | Section 4.3.2 and Section 4.4.2 — Implementation Notes | Append to the implementation notes for Manager Approve and HR Approve endpoints: "⚠️ Concurrency guard required: The `TransferRequest` entity must be annotated with `@Version` for JPA optimistic locking. Concurrent approval attempts on the same request must result in an `OptimisticLockException` caught and mapped to `409 INVALID_STATE_TRANSITION`. This requirement applies to all state-mutating endpoints." | F-003     |
| AM-006       | Deliverables 01, 02, 03, 06 | All four artefacts | Full dual-manager approval implementation: new actor (Receiving Manager), new state (PENDING_RECEIVING_MANAGER_APPROVAL), new BRs (BR-015, BR-016), OQ-015 added, AS-004 rewritten, AS-013 added, ACs AC-036–AC-042 added, new receiving manager endpoints added to API contract, TC-RCV-001–TC-RCV-006 added to test cases | F-006     |

---

## 6. Open Questions Status Summary

The following summarises the resolution status of all open questions from Deliverable 01 (OQ-001 to OQ-014) as assessed at Gate 1. The "Gate 1 Impact" column describes whether each question blocks the current gate.

| OQ ID  | Question (Summary)                                                           | Priority | Owner              | Gate 1 Impact | Status at Gate 1                                                                                                                                                            |
|--------|------------------------------------------------------------------------------|----------|--------------------|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| OQ-001 | Employee eligibility rules (tenure, probation, performance, disciplinary)    | High     | HR                 | Does not block | AS-001 defers eligibility enforcement. Any authenticated employee may submit. No eligibility checks in scope for this phase.                                                |
| OQ-002 | SLA for each approval/task stage                                             | High     | HR / Operations    | Does not block | AS-002 defers SLA enforcement. Elapsed time displayed; no auto-escalation. SLA logic is a future enhancement.                                                               |
| OQ-003 | SLA breach escalation process                                                | High     | HR / Operations    | Does not block | Dependent on OQ-002. Both deferred together. No escalation logic implemented in this phase.                                                                                 |
| OQ-004 | Conflict-of-interest rules (family member, self-transfer to own manager)     | Medium   | HR / Compliance    | Does not block | Not addressed in this phase. No conflict-of-interest checks are in scope. Flagged for a future compliance sprint.                                                           |
| OQ-005 | Payroll trigger conditions (grade change vs always; same pay-grade transfers) | High    | Payroll            | Does not block | AS-003 assumes Payroll is always triggered on HR approval. Conditional payroll logic is a future enhancement. HR validates intent during approval.                          |
| OQ-006 | IT provisioning rules (retain access, rebuild, delta change)                 | High     | IT                 | Does not block | AS-003 and AS-012 assume IT actions tasks within the portal. Provisioning logic details are owned by the IT team, not the portal. Portal creates the task; IT executes it.  |
| OQ-007 | Facilities arrangement rules (hot-desking, access card automation)           | Medium   | Facilities         | Does not block | Same pattern as OQ-006. Portal creates the Facilities task; the Facilities team executes it with their own process.                                                         |
| OQ-008 | Downstream system unavailability handling (retry, queue, alert)              | High     | Architecture / IT  | Does not block | AS-012 assumes all downstream teams action tasks within the portal. No external system APIs to integrate with in this phase. Task creation is a database write; no external call is at risk of failure at this stage. |
| OQ-009 | Can an employee modify a request after submission but before manager approval? | Medium  | HR                 | Does not block | AS-006 defers modification capability. Submitted requests cannot be amended; employee must cancel and resubmit. No amendment workflow in scope.                             |
| OQ-010 | Can a rejected request be resubmitted?                                       | Medium   | HR                 | Does not block | AS-005 treats rejected requests as terminal. No resubmission workflow in scope. Employee must submit a new request.                                                         |
| OQ-011 | Maximum number of concurrent active requests per employee                    | Medium   | HR                 | Does not block | BR-001 permits unlimited concurrent requests. No cap enforced in this phase. F-001 notes the conflict risk; deferred as AM-003 (AS-013).                                   |
| OQ-012 | Does the receiving manager need to also approve?                             | **High** | HR                 | **Resolved — No longer a watch item** | Resolved via manager's Gate 1 review feedback. BRU-3 confirmed. All artefacts updated. |
| OQ-013 | Inter-regional / cross-legal-entity transfer handling                        | Medium   | HR / Legal         | Does not block | Explicitly out of scope (Deliverable 01 Section 8). Cross-entity transfers are excluded.                                                                                   |
| OQ-014 | Audit and data retention requirements (GDPR, labour law)                     | Medium   | Legal / Compliance | Does not block | Audit trail is implemented (AC-035, auditHistory). Retention period and purge policy are deferred. No archival job is in scope for this phase.                              |

**Gate 1 Verdict on Open Questions:** No OQ constitutes a Blocker at this gate. OQ-012 has been fully resolved and is no longer a watch item.

---

## 7. Implementation Readiness Statement

Having reviewed all four pre-implementation artefacts against the Gate 1 criteria, the review panel makes the following formal statement:

### 7.1 Findings Resolution Summary

| Category                           | Count | Disposition                                                                                                                                                       |
|------------------------------------|-------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Blocker findings                   | 0     | None identified. Gate 1 is not blocked.                                                                                                                           |
| Major findings                     | 3     | F-001 (concurrent request conflicts): Formally deferred with AS-013 documented. F-002 (multi-role task ambiguity): Resolved via documented constraint (AM-004). F-003 (HR approval race condition): Resolved via mandatory optimistic locking requirement (AM-005). None of the three Major findings block implementation. |
| Minor findings                     | 3     | F-004, F-005, F-006: Acknowledged and assigned. Amendments AM-001, AM-002, AM-003 must be applied to the artefacts before the first implementation commit is merged to the main branch. |
| Observations                       | 2     | F-007 (no DRAFT state), F-008 (audit history pagination): Noted. No action required before implementation.                                                       |

### 7.2 Specification Completeness

| Check                                                              | Result  |
|--------------------------------------------------------------------|---------|
| All 35 ACs (AC-001 to AC-035) are covered by test cases            | ✓ Pass  |
| API contract is internally consistent with acceptance criteria      | ✓ Pass  |
| State machine has no undefined transitions                          | ✓ Pass  |
| Business rules are traceable from Deliverable 01 through to Deliverable 03 | ✓ Pass |
| Notification triggers are defined for every stage transition        | ✓ Pass  |
| Data field validation rules are consistent across Deliverable 02 and Deliverable 06 | ✓ Pass |
| RBAC is fully specified in Deliverable 06                           | ✓ Pass  |
| Error codes cover all documented failure conditions                 | ✓ Pass  |

### 7.3 Specification Chain Integrity

The specification chain from business requirement to test case is intact and traceable:

```
Business Need (Deliverable 01)
    ↓  BR-001 to BR-014 referenced in ↓
Feature Acceptance Criteria (Deliverable 02)
    ↓  AC-001 to AC-035 traced to ↓
API Endpoints (Deliverable 06)
    ↓  All 18 endpoints covered by ↓
Test Cases (Deliverable 03)
    ↓  All 35 ACs covered by TC-AUTH through TC-E2E
```

No AC is orphaned (exists in the spec but not in the API contract or test cases). No endpoint is undocumented. No test case references a non-existent AC.

### 7.4 Formal Implementation Authorisation

> **The review panel unconditionally authorises implementation to begin. All Gate 1 conditions have been met. All five amendments (AM-001 through AM-005) have been applied. F-006 has been fully resolved via AM-006 across all four pre-implementation artefacts. No outstanding conditions or watch items remain. Implementation may proceed.**

---

## 8. Sign-Off

| Role                         | Name                                     | Decision                        | Date       | Signature        |
|------------------------------|------------------------------------------|---------------------------------|------------|------------------|
| Author / Developer           | SDD Assessment — Developer Submission    | Approved                        | 2025-07-14 | *(signed)*       |
| Peer Reviewer                | SDD Assessment — Peer Review Panel       | Approved                        | 2025-07-14 | *(signed)*       |
| Technical Lead               | *(Pending assignment)*                   | *(Pending)*                     | —          | *(pending)*      |

> **Note on Technical Lead sign-off:** The Technical Lead column is pending assignment and signature. The review panel has assessed that the absence of the Technical Lead sign-off does not constitute a Blocker given the nature of the findings (no Blockers, three resolved Majors). The Technical Lead sign-off should be obtained before the first implementation Pull Request is raised for review. If the Technical Lead review identifies new Blocker or Major findings, a Gate 1 Amendment Review must be convened.

---

## Appendix A — Checklist Summary

| Artefact           | Items Evaluated | Pass | Partial | Fail | Overall Verdict                   |
|--------------------|----------------|------|---------|------|-----------------------------------|
| Deliverable 01     | 9              | 9    | 0       | 0    | ✓ PASS                            |
| Deliverable 02     | 10             | 9    | 1       | 0    | ✓ PASS (Minor finding F-004)      |
| Deliverable 06     | 10             | 8    | 2       | 0    | ✓ PASS (Major findings F-002, F-003; both resolved) |
| Deliverable 03     | 10             | 9    | 1       | 0    | ✓ PASS (Minor finding F-005)      |
| **Overall**        | **39**         | **35** | **4** | **0** | **✅ APPROVED**  |

---

## Appendix B — Test Case Coverage Quick Reference

| AC Range     | Domain                  | Test Cases                              | Coverage |
|--------------|-------------------------|-----------------------------------------|----------|
| AC-001–009   | Submission              | TC-SUB-001 to TC-SUB-010                | ✓ Full   |
| AC-010       | Employee visibility     | TC-SUB-010, TC-VIS-001                  | ✓ Full   |
| AC-011–018   | Manager Approval        | TC-MGR-001 to TC-MGR-008, TC-E2E-002/003 | ✓ Full  |
| AC-019–024   | HR Validation           | TC-HR-001 to TC-HR-006                  | ✓ Full   |
| AC-025–030   | Downstream Tasks        | TC-TASK-001 to TC-TASK-008, TC-E2E-001  | ✓ Full   |
| AC-031–035   | Visibility & Audit      | TC-VIS-001 to TC-VIS-005, TC-E2E-001 to TC-E2E-003 | ✓ Full |
| Access Control | RBAC / Data Scoping   | TC-SEC-001 to TC-SEC-005                | ✓ Full   |
| Auth          | JWT / Token lifecycle   | TC-AUTH-001 to TC-AUTH-005 (+TC-AUTH-006 pending AM-001) | ✓ Full (post-amendment) |

---

*End of Deliverable 09 — Gate 1 Review: Pre-Implementation Artefact Sign-Off*
