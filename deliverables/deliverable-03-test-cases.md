# Deliverable 03 — Spec-Derived Test Cases

| Field       | Detail                                              |
|-------------|-----------------------------------------------------|
| **Project** | Employee Internal Transfer Digital Journey          |
| **Feature** | Internal Transfer Request — One-Point Employee Portal |
| **Version** | 1.1                                                 |
| **Date**    | 2025-07-14                                          |
| **Author**  | SDD Assessment — Developer Submission               |
| **Status**  | Draft — Pending Technical Review                    |

---

### Revision History

| Version | Date       | Author                                | Summary of Changes    |
|---------|------------|---------------------------------------|-----------------------|
| 1.0     | 2025-07-14 | SDD Assessment — Developer Submission | Initial draft created |
| 1.1     | 2025-07-14 | SDD Assessment — Developer Submission | Gate 1 F-006 resolution: dual-manager approval added; TC-RCV-001 to TC-RCV-006 added; TC-SUB-001 updated; TC-MGR-003 updated; TC-E2E-001 and TC-E2E-002 updated; coverage summary extended to AC-042 |

---

## 1. References

This document derives all test cases from:

- **Deliverable 01 — Discovery & Requirement Analysis** (v1.0, 2025-07-14) — business rules BR-001 to BR-014, assumptions AS-001 to AS-012
- **Deliverable 02 — Feature Specification and Acceptance Criteria** (v1.1, 2025-07-14) — acceptance criteria AC-001 to AC-042, state machine, data model, and notification triggers
- **Deliverable 06 — API Contract** (v1.0, 2025-07-14) — endpoint definitions, request/response schemas, error codes

Every test case in this document references the AC ID from Deliverable 02 that motivated it. No test case exists without a traceable acceptance criterion.

---

## 2. Test Strategy

### 2.1 Test Pyramid

Test coverage is organised into three layers, corresponding to the classic test pyramid:

```
        /\
       /E2E\         ← Scenario-level, fewest in number, highest confidence
      /------\
     / Integr.\      ← MockMvc + H2, verifies HTTP contracts and Spring context
    /----------\
   /   Unit      \   ← JUnit 5 + Mockito, largest in number, fastest feedback
  /--------------\
```

- **Unit tests** are the foundation. They test individual service classes, domain logic, and validation rules in isolation using Mockito stubs for all dependencies. They run in milliseconds and form the RED/GREEN cycle in TDD.
- **Integration tests** spin up the Spring application context (or a slice of it) with an H2 in-memory database and exercise the full HTTP layer via MockMvc. They verify that controller → service → repository → database interactions work end-to-end within a single JVM.
- **E2E scenario tests** are written as descriptive flow narratives. In a CI environment they run against a deployed test instance; in a local developer environment they map to ordered integration test sequences that walk the complete workflow from submission to final completion or terminal rejection.

### 2.2 Test-First (TDD) Approach

All test cases in this document are written **before any implementation code**. The workflow for each test case is:

1. **RED** — Write and commit the test. Run it. It must fail because no implementation exists.
2. **GREEN** — Write the minimal implementation code that makes the test pass.
3. **REFACTOR** — Clean up the implementation without breaking any passing test.

No controller, service, or repository method should be written without a corresponding failing test committed first. This document is the source of truth for what the RED tests should assert.

### 2.3 Tools and Libraries

| Tool / Library      | Role                                                                                          |
|---------------------|-----------------------------------------------------------------------------------------------|
| **JUnit 5**         | Test runner and assertion framework (`@Test`, `@BeforeEach`, `@ParameterizedTest`)            |
| **MockMvc**         | Spring MVC test framework for exercising HTTP endpoints without a running server              |
| **Mockito**         | Mocking framework for unit tests; isolates service logic from repository and external calls   |
| **AssertJ**         | Fluent assertion library (`assertThat(...).isEqualTo(...)`) used in preference to plain JUnit assertions |
| **H2 (in-memory)**  | Embedded relational database used during integration tests; schema bootstrapped by Flyway/Liquibase or JPA DDL |
| **Spring Boot Test**| `@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest` slices for selective context loading         |
| **Jackson**         | JSON serialisation/deserialisation of request and response bodies in MockMvc tests            |
| **Testcontainers**  | Optional — used for full integration against a PostgreSQL container if H2 dialect limitations are encountered |

### 2.4 Test Slice Strategy

| Test Type      | Annotation                   | Context Loaded                                  |
|----------------|------------------------------|-------------------------------------------------|
| Unit           | None (plain JUnit 5)         | No Spring context; all dependencies mocked      |
| Controller slice | `@WebMvcTest(XController.class)` | Web layer only; services mocked via `@MockBean` |
| Service unit   | None                         | Service class instantiated directly; repos mocked |
| Full integration | `@SpringBootTest` + `@AutoConfigureMockMvc` | Full context, H2 DB, real service wiring |
| E2E            | Ordered `@SpringBootTest` test sequences | Full context; state threaded between test methods |

### 2.5 Traceability

Every test case ID maps to one or more AC IDs from Deliverable 02. The coverage summary in Section 5 provides a complete reverse mapping from AC to test case(s).

---

## 3. Test Case Table Format

Each structured test case table uses the following columns:

| Column              | Description                                                                                           |
|---------------------|-------------------------------------------------------------------------------------------------------|
| **TC-ID**           | Unique test case identifier (e.g., `TC-SUB-001`)                                                      |
| **AC Reference**    | The acceptance criterion (or criteria) from Deliverable 02 that this test validates                   |
| **Test Name**       | Java method name in the format `should[ExpectedBehaviour]When[Condition]()`                           |
| **Type**            | `Unit`, `Integration`, or `E2E`                                                                       |
| **Preconditions**   | System state, authenticated user, or data setup required before the test executes                     |
| **Test Steps / Input** | The HTTP request, service call input, or sequence of actions performed                             |
| **Expected Result** | The concrete, verifiable outcome — HTTP status, response body fields, database state, notification    |
| **Priority**        | `High` (core workflow), `Medium` (alternate paths), `Low` (edge cases and convenience features)       |

---

## 4. Test Cases

---

### 4.1 Authentication

These tests cover the login, token refresh, and logout flows, and the JWT guard on all protected endpoints.

| TC-ID        | AC Reference | Test Name                                                        | Type        | Preconditions                                         | Test Steps / Input                                                                                                           | Expected Result                                                                                                                        | Priority |
|--------------|--------------|------------------------------------------------------------------|-------------|-------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|----------|
| TC-AUTH-001  | AS-008       | `shouldReturn200WithTokensWhenCredentialsAreValid`               | Integration | Employee `EMP-001` exists in the user store with correct password | `POST /api/v1/auth/login` with `{ "username": "jane.smith@company.com", "password": "s3cur3P@ssw0rd" }` | HTTP 200; response body contains non-null `accessToken`, non-null `refreshToken`, `tokenType = "Bearer"`, `expiresIn > 0`, `employeeId = "EMP-001"`, `roles` array non-empty | High     |
| TC-AUTH-002  | AS-008       | `shouldReturn401WhenPasswordIsIncorrect`                         | Integration | Employee `EMP-001` exists in the user store           | `POST /api/v1/auth/login` with correct username and wrong password                                                           | HTTP 401; response body `code = "INVALID_CREDENTIALS"`                                                                                 | High     |
| TC-AUTH-003  | AS-008       | `shouldReturn400WhenUsernameIsMissingOnLogin`                    | Integration | No precondition                                       | `POST /api/v1/auth/login` with `{ "password": "s3cur3P@ssw0rd" }` (no username field)                                       | HTTP 400; response body `code = "VALIDATION_ERROR"`; `details` array references the `username` field                                  | High     |
| TC-AUTH-004  | AS-008       | `shouldReturn401WhenAccessTokenIsMissingOnProtectedEndpoint`     | Integration | No token issued                                       | `GET /api/v1/transfer-requests` with no `Authorization` header                                                               | HTTP 401; response body `code = "UNAUTHORISED"`                                                                                        | High     |
| TC-AUTH-005  | AS-008       | `shouldReturn401WhenRefreshTokenIsInvalidOrExpired`              | Integration | Refresh token `bad-token-xyz` does not exist in the token store | `POST /api/v1/auth/refresh` with `{ "refreshToken": "bad-token-xyz" }`                                        | HTTP 401; response body `code = "REFRESH_TOKEN_INVALID"`                                                                               | High     |

---

### 4.2 Transfer Request Submission

Maps to AC-001 through AC-009 (submission rules) and AC-010 (employee list view).

| TC-ID       | AC Reference | Test Name                                                                    | Type        | Preconditions                                                                                    | Test Steps / Input                                                                                                                                                                                                                                   | Expected Result                                                                                                                                                                                                              | Priority |
|-------------|--------------|------------------------------------------------------------------------------|-------------|--------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| TC-SUB-001  | AC-002, AC-005, AC-006, AC-007 | `shouldReturn201WithRequestIdAndPendingStatusWhenRequestIsValid` | Integration | Employee `EMP-001` authenticated with EMPLOYEE role; valid departments, BU, location, role codes exist in reference data | `POST /api/v1/transfer-requests` with all required fields: `targetDepartment`, `targetBusinessUnit`, `targetLocation`, `targetRole`, `effectiveDate` (tomorrow's date), optional `reason` | HTTP 201; response body contains non-null `requestId` (UUID format); `status = "PENDING_CURRENT_MANAGER_APPROVAL"`; `submittedAt` is a non-null UTC timestamp; notifications triggered for employee and current line manager | High     |
| TC-SUB-002  | AC-002       | `shouldReturn400WhenTargetDepartmentIsMissing`                               | Integration | Employee `EMP-001` authenticated with EMPLOYEE role                                              | `POST /api/v1/transfer-requests` with all fields present except `targetDepartment`                                                                                                                                                                  | HTTP 400; `code = "VALIDATION_ERROR"`; `details` array contains a message referencing `targetDepartment`; no request persisted in DB                                                                                         | High     |
| TC-SUB-003  | AC-002       | `shouldReturn400WhenTargetRoleIsMissing`                                     | Integration | Employee `EMP-001` authenticated with EMPLOYEE role                                              | `POST /api/v1/transfer-requests` with all fields present except `targetRole`                                                                                                                                                                        | HTTP 400; `code = "VALIDATION_ERROR"`; `details` references `targetRole`; no request persisted                                                                                                                               | High     |
| TC-SUB-004  | AC-002       | `shouldReturn400WhenEffectiveDateIsMissing`                                  | Integration | Employee `EMP-001` authenticated with EMPLOYEE role                                              | `POST /api/v1/transfer-requests` with all fields present except `effectiveDate`                                                                                                                                                                     | HTTP 400; `code = "VALIDATION_ERROR"`; `details` references `effectiveDate`; no request persisted                                                                                                                            | High     |
| TC-SUB-005  | AC-003, AC-008 | `shouldReturn400WhenEffectiveDateIsToday`                                  | Unit        | `TransferRequestService` instantiated with mocked repo; system clock returns today's date        | Call `submitRequest(...)` with `effectiveDate = LocalDate.now()`                                                                                                                                                                                     | `InvalidEffectiveDateException` thrown (maps to HTTP 400 `INVALID_EFFECTIVE_DATE`)                                                                                                                                           | High     |
| TC-SUB-006  | AC-003, AC-008 | `shouldReturn400WhenEffectiveDateIsYesterday`                              | Unit        | `TransferRequestService` instantiated with mocked repo; system clock returns today's date        | Call `submitRequest(...)` with `effectiveDate = LocalDate.now().minusDays(1)`                                                                                                                                                                        | `InvalidEffectiveDateException` thrown                                                                                                                                                                                       | High     |
| TC-SUB-007  | AC-003       | `shouldAcceptSubmissionWhenEffectiveDateIsInTheFuture`                       | Unit        | `TransferRequestService` instantiated with mocked repo                                           | Call `submitRequest(...)` with `effectiveDate = LocalDate.now().plusDays(30)`                                                                                                                                                                        | Method completes without exception; returned DTO has `status = PENDING_CURRENT_MANAGER_APPROVAL`                                                                                                                             | High     |
| TC-SUB-008  | AC-004       | `shouldAcceptSubmissionWhenReasonFieldIsOmitted`                             | Integration | Employee `EMP-001` authenticated; valid reference data present                                   | `POST /api/v1/transfer-requests` with all required fields populated; `reason` field omitted from request body                                                                                                                                        | HTTP 201; request created successfully; `reason` is null or absent in stored record; no validation error                                                                                                                     | Medium   |
| TC-SUB-009  | AC-009       | `shouldCreateSecondRequestSuccessfullyWhenFirstRequestIsStillActive`         | Integration | Employee `EMP-001` already has one request in `PENDING_CURRENT_MANAGER_APPROVAL`; authenticated with EMPLOYEE role | `POST /api/v1/transfer-requests` with a valid second request payload                                                                                                                                                              | HTTP 201; second request created with its own unique `requestId`; first request unchanged in DB; no `409` conflict error                                                                                                     | Medium   |
| TC-SUB-010  | AC-010       | `shouldReturnOnlyRequestsBelongingToAuthenticatedEmployee`                   | Integration | Two employees (`EMP-001` and `EMP-002`) each have submitted requests; `EMP-001` authenticated   | `GET /api/v1/transfer-requests`                                                                                                                                                                                                                      | HTTP 200; response `data` array contains only requests where `employeeId = "EMP-001"`; requests belonging to `EMP-002` are absent; `totalCount` reflects `EMP-001`'s requests only                                          | High     |

---

### 4.3 Current Manager Approval

Maps to AC-011 through AC-018.

| TC-ID       | AC Reference | Test Name                                                                           | Type        | Preconditions                                                                                             | Test Steps / Input                                                                                                                                                              | Expected Result                                                                                                                                                                                                         | Priority |
|-------------|--------------|------------------------------------------------------------------------------------|-------------|-----------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| TC-MGR-001  | AC-011       | `shouldAppearInManagerQueueAfterEmployeeSubmits`                                    | Integration | `EMP-001` submits a request; `MGR-042` is their assigned line manager; `MGR-042` authenticated with MANAGER role | `GET /api/v1/manager/transfer-requests`                                                                                                                                         | HTTP 200; `data` array contains the submitted request with `status = "PENDING_CURRENT_MANAGER_APPROVAL"`; `employeeName` and `effectiveDate` are correct                                                                | High     |
| TC-MGR-002  | AC-012       | `shouldReturnFullRequestDetailWhenManagerViewsRequest`                              | Integration | Request `REQ-001` exists in `PENDING_CURRENT_MANAGER_APPROVAL`; `MGR-042` is the assigned manager and is authenticated | `GET /api/v1/transfer-requests/{requestId}` as `MGR-042`                                                                                                                       | HTTP 200; response body contains all fields: `employeeName`, `currentDepartment`, `targetDepartment`, `targetBusinessUnit`, `targetLocation`, `targetRole`, `effectiveDate`, `reason`, `submittedAt`, `managerId`       | High     |
| TC-MGR-003  | AC-013       | `shouldTransitionStatusToPendingReceivingManagerApprovalWhenCurrentManagerApproves` | Integration | Request in `PENDING_CURRENT_MANAGER_APPROVAL`; `MGR-042` authenticated as MANAGER                        | `POST /api/v1/manager/transfer-requests/{requestId}/approve`                                                                                                                    | HTTP 200; response `status = "PENDING_RECEIVING_MANAGER_APPROVAL"`; `managerApprovedBy = "MGR-042"`; `managerApprovedAt` non-null; DB record updated accordingly                                                        | High     |
| TC-MGR-004  | AC-036       | `shouldDispatchNotificationToReceivingManagerWhenCurrentManagerApproves`            | Unit        | `TransferRequestService` with mocked `NotificationService`; request in `PENDING_CURRENT_MANAGER_APPROVAL` | Call `approveByManager(requestId, managerId)`                                                                                                                                   | `NotificationService.send(...)` invoked with `recipientId = receivingManagerId` and `type = "PENDING_RECEIVING_MANAGER_APPROVAL"`; notification references the `requestId`                                              | High     |
| TC-MGR-005  | AC-014       | `shouldReturn400WhenManagerRejectsWithoutRejectionReason`                          | Integration | Request in `PENDING_CURRENT_MANAGER_APPROVAL`; `MGR-042` authenticated as MANAGER                        | `POST /api/v1/manager/transfer-requests/{requestId}/reject` with empty body `{}`                                                                                                | HTTP 400; `code = "REJECTION_REASON_REQUIRED"`; request status unchanged in DB                                                                                                                                          | High     |
| TC-MGR-006  | AC-015, AC-016 | `shouldTransitionStatusToRejectedWithManagerMetadataWhenManagerRejectsWithReason` | Integration | Request in `PENDING_CURRENT_MANAGER_APPROVAL`; `MGR-042` authenticated                                   | `POST /api/v1/manager/transfer-requests/{requestId}/reject` with `{ "rejectionReason": "No headcount capacity." }` | HTTP 200; `status = "REJECTED"`; `rejectedBy = "MANAGER"`; `rejectionReason = "No headcount capacity."`; `rejectedAt` non-null; employee receives notification containing rejection reason                              | High     |
| TC-MGR-007  | AC-015       | `shouldDispatchNotificationToEmployeeWithReasonWhenManagerRejects`                 | Unit        | `TransferRequestService` with mocked `NotificationService`                                                | Call `rejectByManager(requestId, managerId, "No headcount capacity.")`                                                                                                          | `NotificationService.send(...)` called once for the submitting employee; notification `type = "MANAGER_REJECTED"`; notification message contains the rejection reason text                                               | High     |
| TC-MGR-008  | AC-017, AC-018 | `shouldTransitionStatusToCancelledAndNotifyManagerWhenEmployeeCancels`            | Integration | Request `REQ-001` in `PENDING_CURRENT_MANAGER_APPROVAL`; submitting employee `EMP-001` authenticated     | `PATCH /api/v1/transfer-requests/{requestId}/cancel`                                                                                                                            | HTTP 200; `status = "CANCELLED"`; `cancelledAt` non-null; `cancelledBy = "EMP-001"`; manager `MGR-042` receives in-app notification of type `REQUEST_CANCELLED`; request no longer appears in manager's pending queue   | High     |

---

### 4.3A Receiving Manager Approval

Maps to AC-036 through AC-042.

| TC-ID       | AC Reference | Test Name                                                                                                             | Type        | Preconditions                                                                                                                                                       | Test Steps / Input                                                                                                                                                              | Expected Result                                                                                                                                                                                                                                                               | Priority |
|-------------|--------------|-----------------------------------------------------------------------------------------------------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| TC-RCV-001  | AC-036       | `shouldDispatchNotificationToReceivingManagerWhenCurrentManagerApproves`                                              | Integration | Request `REQ-001` transitions to `PENDING_RECEIVING_MANAGER_APPROVAL` after current manager approval; receiving manager `RCV-MGR-015` is registered in the system  | Inspect notifications after `POST /api/v1/manager/transfer-requests/{requestId}/approve` succeeds; `GET /api/v1/notifications` as `RCV-MGR-015`                                 | HTTP 200; `data` array contains a notification of type `PENDING_RECEIVING_MANAGER_APPROVAL` addressed to `RCV-MGR-015`; notification includes `requestId`, employee name, target role, and target department                                                                   | High     |
| TC-RCV-002  | AC-037       | `shouldReturnFullRequestDetailWithCurrentManagerApprovalRecordWhenReceivingManagerViewsRequest`                       | Integration | Request `REQ-001` in `PENDING_RECEIVING_MANAGER_APPROVAL`; `RCV-MGR-015` authenticated as MANAGER                                                                  | `GET /api/v1/transfer-requests/{requestId}` as `RCV-MGR-015`                                                                                                                    | HTTP 200; response includes all submission fields plus `managerApprovedBy` (non-null), `managerApprovedAt` (non-null), `managerId`; `receivingManagerApprovedBy = null`; `status = "PENDING_RECEIVING_MANAGER_APPROVAL"`                                                       | High     |
| TC-RCV-003  | AC-038, AC-042 | `shouldTransitionStatusToPendingHrValidationAndNotifyHrWhenReceivingManagerApproves`                                | Integration | Request in `PENDING_RECEIVING_MANAGER_APPROVAL`; `RCV-MGR-015` authenticated as MANAGER and is the `receivingManagerId` on the request                             | `POST /api/v1/receiving-manager/transfer-requests/{requestId}/approve` as `RCV-MGR-015`                                                                                         | HTTP 200; `status = "PENDING_HR_VALIDATION"`; `receivingManagerApprovedBy = "RCV-MGR-015"`; `receivingManagerApprovedAt` non-null; HR Administrator receives an in-app notification of type `RECEIVING_MANAGER_APPROVED`; DB record updated accordingly                        | High     |
| TC-RCV-004  | AC-039       | `shouldReturn400WhenReceivingManagerRejectsWithoutRejectionReason`                                                    | Integration | Request in `PENDING_RECEIVING_MANAGER_APPROVAL`; `RCV-MGR-015` authenticated                                                                                       | `POST /api/v1/receiving-manager/transfer-requests/{requestId}/reject` with empty body `{}`                                                                                      | HTTP 400; `code = "REJECTION_REASON_REQUIRED"`; request status remains `PENDING_RECEIVING_MANAGER_APPROVAL` in DB                                                                                                                                                             | High     |
| TC-RCV-005  | AC-040       | `shouldTransitionToRejectedAndNotifyEmployeeAndCurrentManagerWhenReceivingManagerRejects`                             | Integration | Request in `PENDING_RECEIVING_MANAGER_APPROVAL`; `RCV-MGR-015` authenticated; employee `EMP-001` and current manager `MGR-042` registered                          | `POST /api/v1/receiving-manager/transfer-requests/{requestId}/reject` with `{ "rejectionReason": "No headcount in target team." }` as `RCV-MGR-015`                             | HTTP 200; `status = "REJECTED"`; `rejectedBy = "RECEIVING_MANAGER"`; `rejectionReason = "No headcount in target team."`; `rejectedAt` non-null; `EMP-001` receives in-app notification with rejection reason; `MGR-042` receives in-app notification with rejection reason; no downstream IT/Payroll/Facilities tasks created | High     |
| TC-RCV-006  | AC-041       | `shouldTransitionToCancelledAndNotifyBothManagersWhenEmployeeCancelsFromPendingReceivingManagerApproval`              | Integration | Request `REQ-001` in `PENDING_RECEIVING_MANAGER_APPROVAL`; submitting employee `EMP-001` authenticated; `MGR-042` is current manager; `RCV-MGR-015` is receiving manager | `PATCH /api/v1/transfer-requests/{requestId}/cancel` as `EMP-001`                                                                                                          | HTTP 200; `status = "CANCELLED"`; `cancelledBy = "EMP-001"`; `cancelledAt` non-null; `MGR-042` receives in-app notification of type `REQUEST_CANCELLED`; `RCV-MGR-015` ALSO receives in-app notification of type `REQUEST_CANCELLED`; request absent from both managers' pending queues | High     |

---

### 4.4 HR Validation

Maps to AC-019 through AC-024.

| TC-ID      | AC Reference | Test Name                                                                              | Type        | Preconditions                                                                                                                                             | Test Steps / Input                                                                                                                                                                 | Expected Result                                                                                                                                                                                                                    | Priority |
|------------|--------------|----------------------------------------------------------------------------------------|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| TC-HR-001  | AC-019       | `shouldAppearInHrQueueAfterBothManagersApprove`                                        | Integration | Request advanced to `PENDING_HR_VALIDATION` by both the current manager and receiving manager (in sequence); HR user `HR-007` authenticated with HR role  | `GET /api/v1/hr/transfer-requests`                                                                                                                                                 | HTTP 200; `data` array contains the request with `status = "PENDING_HR_VALIDATION"`                                                                                                                                                | High     |
| TC-HR-002  | AC-020       | `shouldReturnRequestDetailWithBothManagerApprovalRecordsWhenHrViewsRequest`            | Integration | Request in `PENDING_HR_VALIDATION`; `HR-007` authenticated                                                                                                | `GET /api/v1/transfer-requests/{requestId}` as `HR-007`                                                                                                                            | HTTP 200; response body includes all submission fields plus `managerApprovedBy` (non-null), `managerApprovedAt` (non-null), `receivingManagerApprovedBy` (non-null), `receivingManagerApprovedAt` (non-null), and both manager IDs identifying each approving manager | High     |
| TC-HR-003  | AC-021, AC-025, AC-026, AC-027 | `shouldTransitionToInProgressAndCreateThreeTasksWhenHrApproves`      | Integration | Request in `PENDING_HR_VALIDATION`; `HR-007` authenticated                                                                                                | `POST /api/v1/hr/transfer-requests/{requestId}/approve`                                                                                                                            | HTTP 200; `status = "IN_PROGRESS"`; `hrApprovedBy = "HR-007"`; `hrApprovedAt` non-null; `downstreamTasks` array contains exactly 3 objects — one each for `IT`, `PAYROLL`, `FACILITIES`, all with `complete = false`               | High     |
| TC-HR-004  | AC-022       | `shouldReturn400WhenHrRejectsWithoutRejectionReason`                                   | Integration | Request in `PENDING_HR_VALIDATION`; `HR-007` authenticated                                                                                                | `POST /api/v1/hr/transfer-requests/{requestId}/reject` with empty body `{}`                                                                                                       | HTTP 400; `code = "REJECTION_REASON_REQUIRED"`; request status unchanged in DB                                                                                                                                                     | High     |
| TC-HR-005  | AC-023       | `shouldTransitionToRejectedAndNotifyEmployeeAndBothManagersWhenHrRejects`              | Integration | Request in `PENDING_HR_VALIDATION`; `HR-007` authenticated                                                                                                | `POST /api/v1/hr/transfer-requests/{requestId}/reject` with `{ "rejectionReason": "Does not meet lateral move policy." }` | HTTP 200; `status = "REJECTED"`; `rejectedBy = "HR"`; `rejectionReason` correct; employee receives notification with reason; current line manager receives notification with reason; receiving manager receives notification with reason; all notifications of type `HR_REJECTED` | High     |
| TC-HR-006  | AC-024       | `shouldReturn409WhenEmployeeAttemptsCancellationAfterBothManagersApprove`              | Integration | Request in `PENDING_HR_VALIDATION`; submitting employee `EMP-001` authenticated                                                                           | `PATCH /api/v1/transfer-requests/{requestId}/cancel`                                                                                                                               | HTTP 409; `code = "CANCELLATION_NOT_ALLOWED"`; request status remains `PENDING_HR_VALIDATION` in DB                                                                                                                                | High     |

---

### 4.5 Downstream Tasks

Maps to AC-025 through AC-030.

| TC-ID        | AC Reference | Test Name                                                                                        | Type        | Preconditions                                                                                                                     | Test Steps / Input                                                                                                                      | Expected Result                                                                                                                                                                                                                                    | Priority |
|--------------|--------------|--------------------------------------------------------------------------------------------------|-------------|-----------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| TC-TASK-001  | AC-021, AC-025 | `shouldCreateItTaskWithCompleteFalseAfterHrApproval`                                           | Integration | Request transitioned to `IN_PROGRESS` via HR approval                                                                            | Inspect the `downstreamTasks` array in the HR approval response or `GET /api/v1/transfer-requests/{requestId}` as HR role              | Task with `taskType = "IT"` exists in `downstreamTasks`; `complete = false`; `completedAt = null`                                                                                                                                                  | High     |
| TC-TASK-002  | AC-021, AC-026 | `shouldCreatePayrollTaskWithCompleteFalseAfterHrApproval`                                      | Integration | Request transitioned to `IN_PROGRESS` via HR approval                                                                            | Inspect the `downstreamTasks` array in the HR approval response                                                                         | Task with `taskType = "PAYROLL"` exists; `complete = false`; `completedAt = null`                                                                                                                                                                  | High     |
| TC-TASK-003  | AC-021, AC-027 | `shouldCreateFacilitiesTaskWithCompleteFalseAfterHrApproval`                                   | Integration | Request transitioned to `IN_PROGRESS` via HR approval                                                                            | Inspect the `downstreamTasks` array in the HR approval response                                                                         | Task with `taskType = "FACILITIES"` exists; `complete = false`; `completedAt = null`                                                                                                                                                               | High     |
| TC-TASK-004  | AC-025, AC-028 | `shouldSetItTaskCompleteAndKeepOverallStatusInProgressWhenItMarksTaskComplete`                 | Integration | Request in `IN_PROGRESS`; IT, PAYROLL, FACILITIES tasks all `complete = false`; IT team user authenticated with IT role          | `POST /api/v1/tasks/{requestId}/complete` as IT role                                                                                    | HTTP 200; `taskType = "IT"`; `complete = true`; `completedAt` non-null; `overallStatus = "IN_PROGRESS"` (PAYROLL and FACILITIES still incomplete); DB record shows `itTaskComplete = true`                                                        | High     |
| TC-TASK-005  | AC-026, AC-028 | `shouldKeepOverallStatusInProgressWhenPayrollMarksTaskCompleteButFacilitiesIsStillPending`     | Integration | Request in `IN_PROGRESS`; IT task already complete; Payroll and Facilities still pending; Payroll user authenticated              | `POST /api/v1/tasks/{requestId}/complete` as PAYROLL role                                                                               | HTTP 200; `taskType = "PAYROLL"`; `complete = true`; `overallStatus = "IN_PROGRESS"` (FACILITIES still pending)                                                                                                                                   | High     |
| TC-TASK-006  | AC-025        | `shouldReturn409WhenItTeamAttemptsToMarkAlreadyCompletedTask`                                   | Integration | Request in `IN_PROGRESS`; IT task already marked `complete = true` by a prior call; IT team user authenticated                   | `POST /api/v1/tasks/{requestId}/complete` as IT role (second call)                                                                      | HTTP 409; `code = "TASK_ALREADY_COMPLETE"`; no state change in DB                                                                                                                                                                                  | Medium   |
| TC-TASK-007  | AC-029       | `shouldTransitionOverallStatusToCompletedWhenAllThreeTasksAreMarkedComplete`                    | Integration | Request in `IN_PROGRESS`; IT and PAYROLL tasks already complete; FACILITIES still pending; Facilities user authenticated          | `POST /api/v1/tasks/{requestId}/complete` as FACILITIES role (final task)                                                               | HTTP 200; `taskType = "FACILITIES"`; `complete = true`; `overallStatus = "COMPLETED"`; DB `status = "COMPLETED"`; `completedAt` non-null; audit log entry with `action = "REQUEST_COMPLETED"` recorded                                            | High     |
| TC-TASK-008  | AC-030       | `shouldDispatchCompletionNotificationToEmployeeWhenFinalTaskCompletes`                          | Unit        | `TransferRequestService` with mocked `NotificationService`; all three task completion conditions met                              | Call service method that processes the final task completion event                                                                       | `NotificationService.send(...)` invoked exactly once with `recipientId = submitting employee's ID` and notification `type = "REQUEST_COMPLETED"`; notification message includes `requestId`, `targetRole`, `targetDepartment`, `effectiveDate`    | High     |

---

### 4.6 Visibility and Tracking

Maps to AC-031 through AC-035.

| TC-ID       | AC Reference | Test Name                                                                            | Type        | Preconditions                                                                                                             | Test Steps / Input                                                                               | Expected Result                                                                                                                                                                                                                            | Priority |
|-------------|--------------|--------------------------------------------------------------------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| TC-VIS-001  | AC-031       | `shouldReturnCurrentStatusWhenEmployeeRetrievesRequestById`                          | Integration | Request `REQ-001` in `PENDING_HR_VALIDATION`; submitting employee `EMP-001` authenticated                                 | `GET /api/v1/transfer-requests/{requestId}` as `EMP-001`                                         | HTTP 200; response `status = "PENDING_HR_VALIDATION"`; all other fields present and correct                                                                                                                                                | High     |
| TC-VIS-002  | AC-032       | `shouldReturnIndividualTaskCompletionStatesWhenRequestIsInProgress`                  | Integration | Request in `IN_PROGRESS`; IT task complete, PAYROLL and FACILITIES incomplete; `EMP-001` authenticated                   | `GET /api/v1/transfer-requests/{requestId}` as `EMP-001`                                         | HTTP 200; `downstreamTasks` contains 3 entries; IT entry has `complete = true` and `completedAt` non-null; PAYROLL and FACILITIES entries have `complete = false` and `completedAt = null`                                                  | High     |
| TC-VIS-003  | AC-033, AC-035 | `shouldReturnChronologicalAuditHistoryWithAllStageTransitions`                     | Integration | Request has progressed through `PENDING_CURRENT_MANAGER_APPROVAL` → `PENDING_RECEIVING_MANAGER_APPROVAL` → `PENDING_HR_VALIDATION` → `IN_PROGRESS`; HR user authenticated | `GET /api/v1/transfer-requests/{requestId}` as `HR-007`                                          | HTTP 200; `auditHistory` array has at least 4 entries in ascending timestamp order; each entry contains `action`, `actorId`, `actorRole`, `fromStatus`, `toStatus`, `timestamp`; no transitions are omitted                                | High     |
| TC-VIS-004  | AC-034       | `shouldNotReturnAnotherManagersRequestsInPendingQueue`                               | Integration | `MGR-042` has a pending request from `EMP-001`; `MGR-099` has a different pending request from `EMP-002`; `MGR-042` authenticated | `GET /api/v1/manager/transfer-requests` as `MGR-042`                                      | HTTP 200; `data` array contains only the request assigned to `MGR-042` (managerId matches); the request assigned to `MGR-099` is absent; `totalCount` reflects only `MGR-042`'s queue                                                     | High     |
| TC-VIS-005  | AC-034       | `shouldNotReturnPayrollOrFacilitiesTasksWhenItTeamQueriesTaskList`                   | Integration | Requests in `IN_PROGRESS` with all three tasks created; IT team user authenticated                                        | `GET /api/v1/tasks` as IT role                                                                   | HTTP 200; `data` array contains only tasks with `taskType = "IT"`; no `PAYROLL` or `FACILITIES` tasks are present in the response                                                                                                          | High     |

---

### 4.7 Authorisation and Access Control

These tests verify role-based access control (RBAC) enforcement at the HTTP boundary, independent of business logic.

| TC-ID       | AC Reference | Test Name                                                                            | Type        | Preconditions                                                                       | Test Steps / Input                                                                                                                                 | Expected Result                                                                    | Priority |
|-------------|--------------|--------------------------------------------------------------------------------------|-------------|--------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|----------|
| TC-SEC-001  | AC-034       | `shouldReturn403WhenEmployeeCallsManagerApprovalEndpoint`                            | Integration | `EMP-001` authenticated with EMPLOYEE role only (not MANAGER)                       | `POST /api/v1/manager/transfer-requests/{requestId}/approve` with valid EMPLOYEE JWT                                                               | HTTP 403; `code = "FORBIDDEN"`; request status unchanged in DB                    | High     |
| TC-SEC-002  | AC-034       | `shouldReturn403WhenPayrollRoleCallsHrApprovalEndpoint`                              | Integration | `PAYROLL-001` authenticated with PAYROLL role                                        | `POST /api/v1/hr/transfer-requests/{requestId}/approve` with PAYROLL JWT                                                                           | HTTP 403; `code = "FORBIDDEN"`                                                     | High     |
| TC-SEC-003  | AC-034       | `shouldReturn403WhenEmployeeTriesToRetrieveAnotherEmployeesRequest`                  | Integration | `EMP-001` and `EMP-002` both have submitted requests; `EMP-002` authenticated        | `GET /api/v1/transfer-requests/{requestId}` where `requestId` belongs to `EMP-001`, called by `EMP-002`                                            | HTTP 403; `code = "FORBIDDEN"`                                                     | High     |
| TC-SEC-004  | AC-034       | `shouldReturn403WhenManagerTriesToApproveRequestAssignedToDifferentManager`          | Integration | Request assigned to `MGR-042`; `MGR-099` (a different manager) is authenticated     | `POST /api/v1/manager/transfer-requests/{requestId}/approve` with `MGR-099`'s JWT                                                                  | HTTP 403; `code = "FORBIDDEN"`; request remains in `PENDING_CURRENT_MANAGER_APPROVAL` | High     |
| TC-SEC-005  | AC-034       | `shouldReturn401WhenUnauthenticatedCallerAccessesAnyProtectedEndpoint`               | Integration | No JWT token issued                                                                  | Any protected endpoint called without `Authorization` header (e.g., `GET /api/v1/transfer-requests`)                                               | HTTP 401; `code = "UNAUTHORISED"`                                                  | High     |

---

### 4.8 End-to-End Scenario Tests

These scenarios are written as narrative flow descriptions. In a CI pipeline they map to ordered `@SpringBootTest` test sequences with shared state (request ID threaded between steps). Each step assertion must pass before the next step executes.

---

#### TC-E2E-001 — Happy Path: Full Transfer Completion

**AC Coverage:** AC-001 through AC-042 (primary integration of all ACs)
**Priority:** High
**Type:** E2E

**Scenario Narrative:**

1. **Setup:** Employee `EMP-001` is authenticated. Reference data (departments, locations, roles) is seeded. `MGR-042` is the assigned current line manager. `RCV-MGR-015` is the receiving manager. `HR-007` is the HR Administrator. IT, PAYROLL, and FACILITIES team users are available.

2. **Employee submits request:** `POST /api/v1/transfer-requests` with all required fields and a future `effectiveDate`.
   - Assert: HTTP 201; `requestId` returned (stored as `REQ-001`); `status = "PENDING_CURRENT_MANAGER_APPROVAL"`.
   - Assert: `EMP-001` receives an in-app notification of type `REQUEST_SUBMITTED`.
   - Assert: `MGR-042` receives an in-app notification of type `PENDING_CURRENT_MANAGER_APPROVAL`.

3. **Current manager views queue:** `GET /api/v1/manager/transfer-requests` as `MGR-042`.
   - Assert: `REQ-001` appears in results with `status = "PENDING_CURRENT_MANAGER_APPROVAL"`.

4. **Current manager approves:** `POST /api/v1/manager/transfer-requests/REQ-001/approve` as `MGR-042`.
   - Assert: HTTP 200; `status = "PENDING_RECEIVING_MANAGER_APPROVAL"`; `managerApprovedBy = "MGR-042"`; `managerApprovedAt` non-null.
   - Assert: `RCV-MGR-015` receives an in-app notification of type `PENDING_RECEIVING_MANAGER_APPROVAL`.

4a. **Receiving manager views queue:** `GET /api/v1/receiving-manager/transfer-requests` as `RCV-MGR-015`.
   - Assert: `REQ-001` appears with `status = "PENDING_RECEIVING_MANAGER_APPROVAL"`.

4b. **Receiving manager approves:** `POST /api/v1/receiving-manager/transfer-requests/REQ-001/approve` as `RCV-MGR-015`.
   - Assert: HTTP 200; `status = "PENDING_HR_VALIDATION"`; `receivingManagerApprovedBy = "RCV-MGR-015"`; `receivingManagerApprovedAt` non-null.
   - Assert: HR Administrator receives an in-app notification of type `RECEIVING_MANAGER_APPROVED`.

5. **HR views queue:** `GET /api/v1/hr/transfer-requests` as `HR-007`.
   - Assert: `REQ-001` appears with `status = "PENDING_HR_VALIDATION"`.

6. **HR approves:** `POST /api/v1/hr/transfer-requests/REQ-001/approve` as `HR-007`.
   - Assert: HTTP 200; `status = "IN_PROGRESS"`; `hrApprovedBy = "HR-007"`; `downstreamTasks` has 3 entries, all `complete = false`.
   - Assert: IT, PAYROLL, and FACILITIES team users each receive an in-app notification of type `HR_APPROVED`.

7. **IT marks task complete:** `POST /api/v1/tasks/REQ-001/complete` as IT role.
   - Assert: HTTP 200; `taskType = "IT"`; `complete = true`; `overallStatus = "IN_PROGRESS"`.

8. **Payroll marks task complete:** `POST /api/v1/tasks/REQ-001/complete` as PAYROLL role.
   - Assert: HTTP 200; `taskType = "PAYROLL"`; `complete = true`; `overallStatus = "IN_PROGRESS"`.

9. **Facilities marks task complete (final task):** `POST /api/v1/tasks/REQ-001/complete` as FACILITIES role.
   - Assert: HTTP 200; `taskType = "FACILITIES"`; `complete = true`; `overallStatus = "COMPLETED"`.
   - Assert: `EMP-001` receives an in-app notification of type `REQUEST_COMPLETED` containing `targetRole`, `targetDepartment`, and `effectiveDate`.

10. **Employee verifies final state:** `GET /api/v1/transfer-requests/REQ-001` as `EMP-001`.
    - Assert: `status = "COMPLETED"`; `completedAt` non-null; all three `downstreamTasks` entries have `complete = true`.
    - Assert: `auditHistory` contains entries for: `SUBMITTED`, `CURRENT_MANAGER_APPROVED`, `RECEIVING_MANAGER_APPROVED`, `HR_APPROVED`, `TASK_COMPLETED` (×3), `REQUEST_COMPLETED` — all with correct actor IDs, roles, and timestamps.

---

#### TC-E2E-002 — Manager Rejection Path

**AC Coverage:** AC-001 through AC-007, AC-011 through AC-016, AC-033, AC-035
**Priority:** High
**Type:** E2E

**Scenario Narrative:**

1. **Employee submits request:** `POST /api/v1/transfer-requests` with valid payload.
   - Assert: HTTP 201; `status = "PENDING_CURRENT_MANAGER_APPROVAL"`.

2. **Current manager rejects without reason:** `POST /api/v1/manager/transfer-requests/{requestId}/reject` with empty body.
   - Assert: HTTP 400; `code = "REJECTION_REASON_REQUIRED"`; status unchanged.

3. **Current manager rejects with reason:** Same endpoint, body `{ "rejectionReason": "Team restructure underway — hold all transfers." }`.
   - Assert: HTTP 200; `status = "REJECTED"`; `rejectedBy = "MANAGER"`; `rejectionReason` matches input; `rejectedAt` non-null.
   - Assert: `EMP-001` receives an in-app notification of type `MANAGER_REJECTED` containing the rejection reason text.

4. **No downstream activity:** Verify no receiving manager or HR notifications were dispatched. Verify no tasks were created.

5. **Employee verifies final state:** `GET /api/v1/transfer-requests/{requestId}` as `EMP-001`.
   - Assert: `status = "REJECTED"`; `receivingManagerApprovedBy = null`; `hrApprovedBy = null`; `downstreamTasks` is empty or all entries show `complete = false` with no completedAt.
   - Assert: `auditHistory` contains `SUBMITTED` and `CURRENT_MANAGER_REJECTED` entries only.

---

#### TC-E2E-003 — Employee Cancellation Path

**AC Coverage:** AC-001 through AC-007, AC-017, AC-018, AC-024, AC-033, AC-035
**Priority:** High
**Type:** E2E

**Scenario Narrative:**

1. **Employee submits request:** `POST /api/v1/transfer-requests` with valid payload.
   - Assert: HTTP 201; `status = "PENDING_CURRENT_MANAGER_APPROVAL"`; `MGR-042` notified.

2. **Request appears in manager queue:** `GET /api/v1/manager/transfer-requests` as `MGR-042`.
   - Assert: request present with `status = "PENDING_CURRENT_MANAGER_APPROVAL"`.

3. **Employee cancels:** `PATCH /api/v1/transfer-requests/{requestId}/cancel` as `EMP-001`.
   - Assert: HTTP 200; `status = "CANCELLED"`; `cancelledBy = "EMP-001"`; `cancelledAt` non-null.
   - Assert: `EMP-001` receives an in-app notification of type `REQUEST_CANCELLED`.
   - Assert: `MGR-042` receives an in-app notification of type `REQUEST_CANCELLED` (withdrawal).

4. **Request no longer in manager queue:** `GET /api/v1/manager/transfer-requests` as `MGR-042`.
   - Assert: request `REQ-001` is absent from the pending queue.

5. **Employee attempts second cancellation (idempotency check):** `PATCH /api/v1/transfer-requests/{requestId}/cancel` as `EMP-001` again.
   - Assert: HTTP 409; `code = "CANCELLATION_NOT_ALLOWED"` (already in terminal CANCELLED state).

6. **No downstream activity:** No receiving manager, HR, IT, PAYROLL, or FACILITIES notifications dispatched.

7. **Audit trail verification:** `GET /api/v1/transfer-requests/{requestId}` as `EMP-001`.
   - Assert: `auditHistory` contains `SUBMITTED` and `EMPLOYEE_CANCELLED` entries only; no manager or HR action entries present.

---

## 5. Test Coverage Summary

The following table maps every acceptance criterion (AC-001 to AC-042) to the test case(s) that cover it.

| AC ID  | AC Title (Brief)                                                               | Test Case(s)                                                    | Coverage Status   |
|--------|--------------------------------------------------------------------------------|-----------------------------------------------------------------|-------------------|
| AC-001 | Transfer request form displays all required fields                             | TC-SUB-001                                                      | Covered           |
| AC-002 | All required fields must be completed before submission                        | TC-SUB-002, TC-SUB-003, TC-SUB-004                              | Covered           |
| AC-003 | Effective date must be a future date                                           | TC-SUB-005, TC-SUB-006, TC-SUB-007                              | Covered           |
| AC-004 | Optional reason field is not required for submission                           | TC-SUB-008                                                      | Covered           |
| AC-005 | System assigns a unique request ID on submission                               | TC-SUB-001                                                      | Covered           |
| AC-006 | Request status set to PENDING_CURRENT_MANAGER_APPROVAL on submission           | TC-SUB-001, TC-E2E-001                                          | Covered           |
| AC-007 | Employee receives in-app and email confirmation on submission                  | TC-SUB-001, TC-E2E-001, TC-E2E-002, TC-E2E-003                 | Covered           |
| AC-008 | Employee cannot submit with a past effective date                              | TC-SUB-005, TC-SUB-006                                          | Covered           |
| AC-009 | Employee can have multiple concurrent active requests                          | TC-SUB-009                                                      | Covered           |
| AC-010 | Employee can view all their submitted requests and statuses                    | TC-SUB-010, TC-VIS-001                                          | Covered           |
| AC-011 | Current manager receives notification on pending approval                      | TC-MGR-001, TC-E2E-001                                          | Covered           |
| AC-012 | Current manager can view full request details before deciding                  | TC-MGR-002                                                      | Covered           |
| AC-013 | Current manager approval transitions to PENDING_RECEIVING_MANAGER_APPROVAL    | TC-MGR-003, TC-E2E-001                                          | Covered           |
| AC-014 | Current manager rejection requires a mandatory rejection reason                | TC-MGR-005, TC-E2E-002                                          | Covered           |
| AC-015 | Employee is notified with reason on current manager rejection                  | TC-MGR-006, TC-MGR-007, TC-E2E-002                              | Covered           |
| AC-016 | Request status set to REJECTED on current manager rejection                    | TC-MGR-006, TC-E2E-002                                          | Covered           |
| AC-017 | Employee can cancel request while in PENDING_CURRENT_MANAGER_APPROVAL         | TC-MGR-008, TC-E2E-003                                          | Covered           |
| AC-018 | Current manager notified when employee cancels a pending request               | TC-MGR-008, TC-E2E-003                                          | Covered           |
| AC-019 | HR receives notification when request reaches PENDING_HR_VALIDATION           | TC-HR-001, TC-E2E-001                                           | Covered           |
| AC-020 | HR can view full request details including both managers' approval records     | TC-HR-002                                                       | Covered           |
| AC-021 | HR approval triggers parallel downstream tasks                                 | TC-HR-003, TC-TASK-001, TC-TASK-002, TC-TASK-003                | Covered           |
| AC-022 | HR rejection requires a mandatory rejection reason                             | TC-HR-004                                                       | Covered           |
| AC-023 | Employee and both managers notified on HR rejection with reason                | TC-HR-005                                                       | Covered           |
| AC-024 | Employee cannot cancel once in PENDING_HR_VALIDATION or beyond                | TC-HR-006, TC-E2E-003                                           | Covered           |
| AC-025 | IT team receives notification and can mark task complete                       | TC-TASK-001, TC-TASK-004, TC-TASK-006, TC-E2E-001               | Covered           |
| AC-026 | Payroll team receives notification and can mark task complete                  | TC-TASK-002, TC-TASK-005, TC-E2E-001                            | Covered           |
| AC-027 | Facilities team receives notification and can mark task complete               | TC-TASK-003, TC-TASK-007, TC-E2E-001                            | Covered           |
| AC-028 | Overall status remains IN_PROGRESS while any task is incomplete                | TC-TASK-004, TC-TASK-005, TC-E2E-001                            | Covered           |
| AC-029 | Status transitions to COMPLETED when all three tasks complete                  | TC-TASK-007, TC-E2E-001                                         | Covered           |
| AC-030 | Employee receives final notification when status = COMPLETED                   | TC-TASK-008, TC-E2E-001                                         | Covered           |
| AC-031 | Employee can view real-time status at any point                                | TC-VIS-001, TC-E2E-001                                          | Covered           |
| AC-032 | Employee can see individual downstream task completion states                  | TC-VIS-002, TC-E2E-001                                          | Covered           |
| AC-033 | Each stage transition timestamped and visible in history                       | TC-VIS-003, TC-E2E-001, TC-E2E-002, TC-E2E-003                 | Covered           |
| AC-034 | Actors see only their own pending actions (data scoping)                       | TC-SUB-010, TC-VIS-004, TC-VIS-005, TC-SEC-001 through TC-SEC-005 | Covered         |
| AC-035 | All actions recorded in an audit trail                                         | TC-VIS-003, TC-E2E-001, TC-E2E-002, TC-E2E-003                 | Covered           |
| AC-036 | Receiving manager receives notification upon current manager approval          | TC-RCV-001, TC-MGR-004, TC-E2E-001                              | Covered           |
| AC-037 | Receiving manager can view full request details                                | TC-RCV-002                                                      | Covered           |
| AC-038 | Receiving manager approval transitions to PENDING_HR_VALIDATION               | TC-RCV-003, TC-E2E-001                                          | Covered           |
| AC-039 | Receiving manager rejection requires mandatory rejection reason                | TC-RCV-004                                                      | Covered           |
| AC-040 | Employee and current manager notified on receiving manager rejection           | TC-RCV-005                                                      | Covered           |
| AC-041 | Employee can cancel from PENDING_RECEIVING_MANAGER_APPROVAL                   | TC-RCV-006                                                      | Covered           |
| AC-042 | HR Administrator notified after both managers approve                          | TC-RCV-003, TC-E2E-001                                          | Covered           |

---

## 6. Test Method Naming Convention

All JUnit 5 test methods in this project follow the convention:

```
should[ExpectedBehaviour]When[Condition]()
```

### Rules

1. **`should`** — the method always begins with `should` (lowercase), establishing that this is a declarative assertion about system behaviour.
2. **`[ExpectedBehaviour]`** — a PascalCase phrase describing what the system must do, in positive or negative terms. Use the HTTP status code when the expectation is an HTTP response (e.g., `Return400`, `Return201`).
3. **`When`** — separator word, always capitalised.
4. **`[Condition]`** — a PascalCase phrase describing the input or state that triggers the behaviour.
5. Methods take no parameters unless `@ParameterizedTest` is used, in which case the parameterised value appears in the test name via `@DisplayName` or `@MethodSource`.

### Examples

| Scenario                                        | Method Name                                                          |
|-------------------------------------------------|----------------------------------------------------------------------|
| Effective date in the past → 400                | `shouldReturn400WhenEffectiveDateIsInThePast()`                      |
| Valid submission → 201 with request ID          | `shouldReturn201WithRequestIdWhenSubmissionIsValid()`                |
| Current manager rejects without reason → 400   | `shouldReturn400WhenCurrentManagerRejectsWithoutRejectionReason()`   |
| All three tasks done → COMPLETED transition     | `shouldTransitionToCompletedWhenAllThreeDownstreamTasksAreComplete()`|
| Employee accesses another employee's request    | `shouldReturn403WhenEmployeeAccessesAnotherEmployeesRequest()`       |
| Invalid refresh token → 401                     | `shouldReturn401WhenRefreshTokenIsInvalidOrExpired()`                |

### Supplementary Conventions

- Test classes are named `[ClassName]Test` (unit) or `[ClassName]IntegrationTest` (integration), placed in the same package as the class under test under `src/test/java/`.
- `@DisplayName` annotations may supplement method names with plain-English descriptions for IDE/CI report readability.
- `@Tag("unit")`, `@Tag("integration")`, and `@Tag("e2e")` tags are applied at class level to allow selective test execution in CI pipelines.

---

## 7. Notes on the Test-First (TDD) Approach

### 7.1 Philosophy

This document represents the specification of system behaviour from a testing perspective. Every test case here defines a contract between a caller and the system. The implementation exists to satisfy these contracts — not the other way around.

### 7.2 RED → GREEN Workflow

The development workflow for each test case is strictly:

1. **RED:** The developer writes the test method as described in this document and commits it. Running the test at this point must produce a **failure** — either a compilation error (because the class or method does not yet exist) or an assertion failure (because no implementation has been written). A passing test at this stage is a signal that either the test is wrong or the code already exists and should be reviewed.

2. **GREEN:** The developer writes the minimum production code necessary to make the failing test pass. Nothing more. No speculative logic, no extra parameters, no pre-emptive abstractions.

3. **REFACTOR:** With the test green, the developer improves the implementation code — removes duplication, improves naming, simplifies conditionals — without altering the test. If refactoring breaks the test, the refactoring has introduced a regression.

### 7.3 Commit Strategy

- RED tests should be committed in a dedicated commit with a message clearly indicating the test is not yet passing (e.g., `test(transfer): add RED test for TC-SUB-005 - invalid effective date`).
- GREEN implementation commits reference the test case ID (e.g., `feat(transfer): implement effective date validation — closes TC-SUB-005`).
- This provides a clean, reviewable history where every feature can be traced back to its originating failing test.

### 7.4 What Not to Do

- Do not write implementation code before the test exists.
- Do not modify a test to make it pass — fix the implementation instead.
- Do not use mocks to fake a result that the real system should produce. Mocks are for isolating external dependencies (email service, notification queue), not for bypassing the logic under test.
- Do not skip writing a test for "simple" logic. The simplest bugs hide in the simplest code.

### 7.5 Test Isolation

Each test must:
- Leave the database in a clean state (use `@Transactional` with rollback, or `@Sql` cleanup scripts).
- Not depend on the execution order of other tests (no shared mutable state across test methods).
- Use dedicated test data fixtures (e.g., `TransferRequestTestFixtures.validSubmissionRequest()`) rather than inline ad-hoc construction, to keep tests readable and maintainable.

---

*End of Deliverable 03 — Spec-Derived Test Cases*
