# Deliverable 06 — API Contract

| Field       | Detail                                              |
|-------------|-----------------------------------------------------|
| **Project** | Employee Internal Transfer Digital Journey          |
| **Feature** | Internal Transfer Request — One-Point Employee Portal |
| **Version** | 1.1                                                 |
| **Date**    | 2025-07-14                                          |
| **Author**  | SDD Assessment — Developer Submission               |
| **Status**  | Updated — Post Gate 1 Review (Dual-Manager Approval) |

---

### Revision History

| Version | Date       | Author                                | Summary of Changes    |
|---------|------------|---------------------------------------|-----------------------|
| 1.0     | 2025-07-14 | SDD Assessment — Developer Submission | Initial draft created |
| 1.1     | 2025-07-14 | SDD Assessment — Developer Submission | Gate 1 F-006 resolution: dual-manager approval added; new receiving manager endpoints; state enum updated; RBAC and error catalogue updated |

---

## 1. References

This contract is derived from:

- **Deliverable 01 — Discovery & Requirement Analysis** (v1.0, 2025-07-14) — business rules BR-001 to BR-014, assumptions AS-001 to AS-012
- **Deliverable 02 — Feature Specification and Acceptance Criteria** (v1.1, 2025-07-14) — acceptance criteria AC-001 to AC-042, state machine, data model, and notification triggers

All business rules and acceptance criteria cited in this document are defined in those deliverables.

---

## 2. API Overview

### 2.1 Base URL

```
https://<host>/api/v1
```

All paths in this document are relative to the base URL. The `/api/v1` prefix provides URI-based versioning. A future breaking change would introduce `/api/v2`.

### 2.2 Authentication

Every protected endpoint requires a valid JWT access token supplied in the HTTP `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are issued by `POST /api/v1/auth/login`. Access tokens are short-lived (15–60 minutes; exact value configured per environment, per AS-008). Clients must refresh using `POST /api/v1/auth/refresh` before expiry. Requests with a missing, malformed, or expired token receive `401 Unauthorized`.

### 2.3 Content Type

All request and response bodies are `application/json`. Clients must set:

```
Content-Type: application/json
Accept: application/json
```

### 2.4 Date and Time Format

All date-time fields use **ISO 8601 UTC** format: `"2025-08-01T09:30:00Z"`. Date-only fields (e.g., `effectiveDate`) use: `"2025-08-01"`.

### 2.5 Versioning Strategy

URI-based versioning: `/api/v1/...`. The version segment is incremented only on breaking changes. Non-breaking additions (new optional fields, new endpoints) are deployed without a version bump.

### 2.6 Standard Error Response Envelope

All error responses (4xx and 5xx) return the following JSON body:

```json
{
  "code": "string — application-level error code (see Section 7)",
  "message": "string — human-readable description",
  "details": ["array of strings — field-level or contextual detail; may be empty"],
  "timestamp": "2025-07-14T10:00:00Z"
}
```

**Example — validation failure:**

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed.",
  "details": [
    "effectiveDate: must be a future date",
    "targetRole: must not be blank"
  ],
  "timestamp": "2025-07-14T10:00:00Z"
}
```

### 2.7 Pagination

Endpoints that return lists support pagination via query parameters:

| Parameter  | Type    | Default | Description                        |
|------------|---------|---------|------------------------------------|
| `page`     | integer | `0`     | Zero-based page index              |
| `pageSize` | integer | `20`    | Number of records per page (max 100) |
| `sort`     | string  | varies  | Field name to sort by              |
| `direction`| string  | `DESC`  | `ASC` or `DESC`                    |

---

## 3. Common Schemas

### 3.1 ErrorResponse

```json
{
  "code": "string",
  "message": "string",
  "details": ["string"],
  "timestamp": "datetime (ISO 8601 UTC)"
}
```

### 3.2 PagedResponse

Wrapper returned by all paginated list endpoints. The `data` array contains the resource-specific objects.

```json
{
  "data": [ "...array of resource objects..." ],
  "totalCount": 42,
  "page": 0,
  "pageSize": 20
}
```

| Field        | Type    | Description                                         |
|--------------|---------|-----------------------------------------------------|
| `data`       | array   | Page of result objects                              |
| `totalCount` | integer | Total records matching the query (all pages)        |
| `page`       | integer | Zero-based index of the current page                |
| `pageSize`   | integer | Number of records returned in this page             |

### 3.3 TransferRequestSummary

Lightweight representation used in list views.

```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "employeeId": "EMP-001",
  "employeeName": "Jane Smith",
  "targetDepartment": "Engineering",
  "targetRole": "Senior Software Engineer",
  "effectiveDate": "2025-09-01",
  "status": "PENDING_CURRENT_MANAGER_APPROVAL",
  "submittedAt": "2025-07-14T09:00:00Z"
}
```

| Field              | Type   | Description                             |
|--------------------|--------|-----------------------------------------|
| `requestId`        | string (UUID) | Unique request identifier        |
| `employeeId`       | string | Submitting employee's ID                |
| `employeeName`     | string | Submitting employee's full name         |
| `targetDepartment` | string | Target department display name          |
| `targetRole`       | string | Target role display name                |
| `effectiveDate`    | date   | Requested transfer date (YYYY-MM-DD)    |
| `status`           | enum   | Current workflow state: `PENDING_CURRENT_MANAGER_APPROVAL`, `PENDING_RECEIVING_MANAGER_APPROVAL`, `PENDING_HR_VALIDATION`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`, `CANCELLED` |
| `submittedAt`      | datetime | UTC timestamp of submission           |

### 3.4 TransferRequestDetail

Full representation returned by detail and approval endpoints.

```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "employeeId": "EMP-001",
  "employeeName": "Jane Smith",
  "currentDepartment": "Customer Success",
  "currentBusinessUnit": "APAC Operations",
  "targetDepartment": "Engineering",
  "targetBusinessUnit": "Platform Engineering",
  "targetLocation": "Sydney Office",
  "targetRole": "Senior Software Engineer",
  "effectiveDate": "2025-09-01",
  "reason": "Seeking technical career progression aligned to my skill set.",
  "status": "PENDING_RECEIVING_MANAGER_APPROVAL",
  "submittedAt": "2025-07-14T09:00:00Z",
  "lastUpdatedAt": "2025-07-14T11:30:00Z",
  "managerId": "MGR-042",
  "managerApprovedBy": "MGR-042",
  "managerApprovedAt": "2025-07-14T11:30:00Z",
  "receivingManagerId": "RCV-MGR-015",
  "receivingManagerApprovedBy": null,
  "receivingManagerApprovedAt": null,
  "hrApprovedBy": null,
  "hrApprovedAt": null,
  "rejectedBy": null,
  "rejectionReason": null,
  "rejectedAt": null,
  "cancelledBy": null,
  "cancelledAt": null,
  "completedAt": null,
  "downstreamTasks": [
    { "taskType": "IT",        "complete": false, "completedAt": null },
    { "taskType": "PAYROLL",   "complete": false, "completedAt": null },
    { "taskType": "FACILITIES","complete": false, "completedAt": null }
  ],
  "auditHistory": [
    {
      "action": "SUBMITTED",
      "actorId": "EMP-001",
      "actorRole": "EMPLOYEE",
      "fromStatus": null,
      "toStatus": "PENDING_CURRENT_MANAGER_APPROVAL",
      "timestamp": "2025-07-14T09:00:00Z",
      "metadata": {}
    },
    {
      "action": "MANAGER_APPROVED",
      "actorId": "MGR-042",
      "actorRole": "MANAGER",
      "fromStatus": "PENDING_CURRENT_MANAGER_APPROVAL",
      "toStatus": "PENDING_RECEIVING_MANAGER_APPROVAL",
      "timestamp": "2025-07-14T11:30:00Z",
      "metadata": {}
    }
  ]
}
```

| Field                        | Type         | Nullable | Description                                               |
|------------------------------|--------------|----------|-----------------------------------------------------------|
| `requestId`                  | string (UUID)| No       | Unique request identifier                                 |
| `employeeId`                 | string       | No       | Submitting employee's ID                                  |
| `employeeName`               | string       | No       | Full name (from HR system)                                |
| `currentDepartment`          | string       | No       | Employee's department at submission time                  |
| `currentBusinessUnit`        | string       | No       | Employee's BU at submission time                          |
| `targetDepartment`           | string       | No       | Target department code/name                               |
| `targetBusinessUnit`         | string       | No       | Target BU code/name                                       |
| `targetLocation`             | string       | No       | Target location code/name                                 |
| `targetRole`                 | string       | No       | Target role/position code/name                            |
| `effectiveDate`              | date         | No       | Transfer effective date (YYYY-MM-DD)                      |
| `reason`                     | string       | Yes      | Optional employee-supplied reason (max 1000 chars)        |
| `status`                     | enum         | No       | Current state                                             |
| `submittedAt`                | datetime     | No       | Submission timestamp (UTC)                                |
| `lastUpdatedAt`              | datetime     | No       | Most recent state change timestamp (UTC)                  |
| `managerId`                  | string       | No       | Current line manager's employee ID (resolved to current line manager at submission time) |
| `managerApprovedBy`          | string       | Yes      | Manager's employee ID; null until approval                |
| `managerApprovedAt`          | datetime     | Yes      | Manager approval timestamp; null until approval           |
| `receivingManagerId`         | string       | No       | Manager of target role/department, resolved at submission time |
| `receivingManagerApprovedBy` | string       | Yes      | Receiving manager's employee ID; null until receiving manager approval |
| `receivingManagerApprovedAt` | datetime     | Yes      | Receiving manager approval timestamp; null until receiving manager approval |
| `hrApprovedBy`               | string       | Yes      | HR Administrator's employee ID; null until HR approval    |
| `hrApprovedAt`               | datetime     | Yes      | HR approval timestamp; null until HR approval             |
| `rejectedBy`                 | enum         | Yes      | `MANAGER`, `RECEIVING_MANAGER`, or `HR`; null if not rejected |
| `rejectionReason`            | string       | Yes      | Rejection reason text (max 2000 chars); null if not rejected |
| `rejectedAt`                 | datetime     | Yes      | Rejection timestamp; null if not rejected                 |
| `cancelledBy`                | string       | Yes      | Employee ID of canceller; null if not cancelled           |
| `cancelledAt`                | datetime     | Yes      | Cancellation timestamp; null if not cancelled             |
| `completedAt`                | datetime     | Yes      | Final completion timestamp; null until COMPLETED          |
| `downstreamTasks`            | array        | No       | Three DownstreamTaskStatus objects (see 3.5)              |
| `auditHistory`               | array        | No       | Chronological list of AuditEntry objects (see 3.6)        |

### 3.5 DownstreamTaskStatus

```json
{
  "taskType": "IT",
  "complete": false,
  "completedAt": null
}
```

| Field        | Type     | Values                          | Description                          |
|--------------|----------|---------------------------------|--------------------------------------|
| `taskType`   | enum     | `IT`, `PAYROLL`, `FACILITIES`   | Which downstream team this task is for |
| `complete`   | boolean  | `true` / `false`                | Whether the task has been completed  |
| `completedAt`| datetime | UTC datetime or `null`          | When the task was marked complete    |

### 3.6 AuditEntry

Embedded within `TransferRequestDetail.auditHistory`.

```json
{
  "action": "MANAGER_APPROVED",
  "actorId": "MGR-042",
  "actorRole": "MANAGER",
  "fromStatus": "PENDING_CURRENT_MANAGER_APPROVAL",
  "toStatus": "PENDING_RECEIVING_MANAGER_APPROVAL",
  "timestamp": "2025-07-14T11:30:00Z",
  "metadata": {
    "rejectionReason": "..."
  }
}
```

| Field        | Type    | Description                                                              |
|--------------|---------|--------------------------------------------------------------------------|
| `action`     | string  | Event type: `SUBMITTED`, `MANAGER_APPROVED`, `MANAGER_REJECTED`, `RECEIVING_MANAGER_APPROVED`, `RECEIVING_MANAGER_REJECTED`, `EMPLOYEE_CANCELLED`, `HR_APPROVED`, `HR_REJECTED`, `TASK_COMPLETED`, `REQUEST_COMPLETED` |
| `actorId`    | string  | User ID of the actor who triggered the event                             |
| `actorRole`  | string  | Role of the actor                                                        |
| `fromStatus` | enum    | State before the transition; null for the initial SUBMITTED event        |
| `toStatus`   | enum    | State after the transition                                               |
| `timestamp`  | datetime| UTC timestamp of the event                                               |
| `metadata`   | object  | Additional event-specific fields (e.g., `rejectionReason`, `taskType`)   |

### 3.7 NotificationObject

```json
{
  "notificationId": "n-00000001",
  "recipientId": "EMP-001",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "type": "REQUEST_SUBMITTED",
  "message": "Your transfer request TR-2025-001 has been submitted and is pending manager approval.",
  "read": false,
  "createdAt": "2025-07-14T09:00:00Z"
}
```

---

## 4. Endpoints

---

### 4.1 Authentication

---

#### 4.1.1 `POST /api/v1/auth/login`

**Summary:** Authenticate an employee and return a JWT access token and a refresh token.

**Authentication required:** No

**Request Body:**

```json
{
  "username": "jane.smith@company.com",
  "password": "s3cur3P@ssw0rd"
}
```

| Field      | Type   | Required | Description                |
|------------|--------|----------|----------------------------|
| `username` | string | Yes      | Employee's portal username |
| `password` | string | Yes      | Employee's password        |

**Response — 200 OK:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "employeeId": "EMP-001",
  "roles": ["EMPLOYEE", "MANAGER"]
}
```

| Field          | Type    | Description                                          |
|----------------|---------|------------------------------------------------------|
| `accessToken`  | string  | Short-lived JWT access token                         |
| `refreshToken` | string  | Long-lived opaque refresh token                      |
| `tokenType`    | string  | Always `"Bearer"`                                    |
| `expiresIn`    | integer | Access token TTL in seconds                          |
| `employeeId`   | string  | Authenticated employee's ID                          |
| `roles`        | array   | Roles assigned to this user (used for RBAC)          |

**Error Responses:**

| HTTP Status | Code                     | Condition                                      |
|-------------|--------------------------|------------------------------------------------|
| 400         | `VALIDATION_ERROR`       | Missing username or password                   |
| 401         | `INVALID_CREDENTIALS`    | Incorrect username or password                 |
| 500         | `INTERNAL_SERVER_ERROR`  | Unexpected server error                        |

**AC References:** Supports all ACs indirectly via authentication gate (AS-008).

---

#### 4.1.2 `POST /api/v1/auth/refresh`

**Summary:** Exchange a valid refresh token for a new access token.

**Authentication required:** No (refresh token provided in body)

**Request Body:**

```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

| Field          | Type   | Required | Description       |
|----------------|--------|----------|-------------------|
| `refreshToken` | string | Yes      | Valid refresh token |

**Response — 200 OK:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

**Error Responses:**

| HTTP Status | Code                        | Condition                                          |
|-------------|-----------------------------|----------------------------------------------------|
| 400         | `VALIDATION_ERROR`          | Missing refresh token field                        |
| 401         | `REFRESH_TOKEN_INVALID`     | Token not found, expired, or already invalidated   |
| 500         | `INTERNAL_SERVER_ERROR`     | Unexpected server error                            |

---

#### 4.1.3 `POST /api/v1/auth/logout`

**Summary:** Invalidate the provided refresh token, ending the session.

**Authentication required:** Yes (any authenticated role)

**Request Body:**

```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

| Field          | Type   | Required | Description              |
|----------------|--------|----------|--------------------------|
| `refreshToken` | string | Yes      | Refresh token to revoke  |

**Response — 204 No Content** (empty body on success)

**Error Responses:**

| HTTP Status | Code                     | Condition                                 |
|-------------|--------------------------|-------------------------------------------|
| 400         | `VALIDATION_ERROR`       | Missing refresh token field               |
| 401         | `UNAUTHORISED`           | Access token missing or invalid           |
| 500         | `INTERNAL_SERVER_ERROR`  | Unexpected server error                   |

---

### 4.2 Transfer Requests — Employee

---

#### 4.2.1 `POST /api/v1/transfer-requests`

**Summary:** Submit a new internal transfer request on behalf of the authenticated employee.

**Authentication required:** Yes — role `EMPLOYEE`

**Request Body:**

```json
{
  "targetDepartment": "Engineering",
  "targetBusinessUnit": "Platform Engineering",
  "targetLocation": "Sydney Office",
  "targetRole": "Senior Software Engineer",
  "effectiveDate": "2025-09-01",
  "reason": "Seeking technical career progression aligned to my skill set."
}
```

| Field                | Type   | Required | Validation                                                                    |
|----------------------|--------|----------|-------------------------------------------------------------------------------|
| `targetDepartment`   | string | Yes      | Must not be blank; must match a valid department code from reference data      |
| `targetBusinessUnit` | string | Yes      | Must not be blank; must be a valid BU within `targetDepartment`               |
| `targetLocation`     | string | Yes      | Must not be blank; must match a valid location code from reference data        |
| `targetRole`         | string | Yes      | Must not be blank; must match a valid role code from reference data            |
| `effectiveDate`      | date   | Yes      | ISO 8601 date (`YYYY-MM-DD`); must be strictly after the current server date (BR-010) |
| `reason`             | string | No       | Optional free text; max 1000 characters                                        |

**Response — 201 Created:**

```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "PENDING_CURRENT_MANAGER_APPROVAL",
  "submittedAt": "2025-07-14T09:00:00Z"
}
```

| Field         | Type     | Description                                                          |
|---------------|----------|----------------------------------------------------------------------|
| `requestId`   | string   | System-generated UUID for the new request (BR-012)                   |
| `status`      | enum     | Always `PENDING_CURRENT_MANAGER_APPROVAL` on successful creation     |
| `submittedAt` | datetime | UTC timestamp of submission                                          |

**Error Responses:**

| HTTP Status | Code                         | Condition                                                               |
|-------------|------------------------------|-------------------------------------------------------------------------|
| 400         | `VALIDATION_ERROR`           | One or more required fields missing or malformed                        |
| 400         | `INVALID_EFFECTIVE_DATE`     | `effectiveDate` is today or in the past (BR-010, AC-003, AC-008)        |
| 400         | `INVALID_REFERENCE_VALUE`    | Department, BU, location, or role code not found in reference data      |
| 401         | `UNAUTHORISED`               | Missing or invalid JWT token                                            |
| 403         | `FORBIDDEN`                  | Authenticated user does not have EMPLOYEE role                          |
| 500         | `INTERNAL_SERVER_ERROR`      | Unexpected server error                                                 |

**AC References:** AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009

**Business Rules Enforced:** BR-010 (future date), BR-011 (required fields), BR-012 (unique ID), BR-001 (concurrent requests), BR-009 (notifications sent on creation)

> **Implementation note:** On successful creation the system must:
> 1. Resolve the employee's current line manager from the HR system and store as `managerId`.
> 2. Resolve the receiving manager (manager of the target role/department) from the HR system and store as `receivingManagerId`.
> 3. Dispatch an in-app notification to the employee confirming submission (AC-007).
> 4. Dispatch an email notification to the employee (AC-007).
> 5. Dispatch an in-app + email notification to the current line manager (AC-011).

---

#### 4.2.2 `GET /api/v1/transfer-requests`

**Summary:** List all transfer requests submitted by the authenticated employee, with optional status filtering and pagination.

**Authentication required:** Yes — role `EMPLOYEE`

**Query Parameters:**

| Parameter    | Type    | Required | Default | Description                                               |
|--------------|---------|----------|---------|-----------------------------------------------------------|
| `status`     | enum    | No       | —       | Filter by status; repeatable (e.g., `?status=PENDING_CURRENT_MANAGER_APPROVAL&status=IN_PROGRESS`) |
| `page`       | integer | No       | `0`     | Zero-based page index                                     |
| `pageSize`   | integer | No       | `20`    | Records per page; max 100                                 |
| `sort`       | string  | No       | `submittedAt` | Field name to sort by                              |
| `direction`  | string  | No       | `DESC`  | `ASC` or `DESC`                                           |

**Response — 200 OK** (`PagedResponse<TransferRequestSummary>`):

```json
{
  "data": [
    {
      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "employeeId": "EMP-001",
      "employeeName": "Jane Smith",
      "targetDepartment": "Engineering",
      "targetRole": "Senior Software Engineer",
      "effectiveDate": "2025-09-01",
      "status": "PENDING_CURRENT_MANAGER_APPROVAL",
      "submittedAt": "2025-07-14T09:00:00Z"
    }
  ],
  "totalCount": 1,
  "page": 0,
  "pageSize": 20
}
```

**Error Responses:**

| HTTP Status | Code                    | Condition                        |
|-------------|-------------------------|----------------------------------|
| 400         | `VALIDATION_ERROR`      | Invalid pagination or sort params |
| 401         | `UNAUTHORISED`          | Missing or invalid JWT token     |
| 403         | `FORBIDDEN`             | Not an EMPLOYEE role             |
| 500         | `INTERNAL_SERVER_ERROR` | Unexpected server error          |

**AC References:** AC-010, AC-031

**Business Rules Enforced:** BR-013 (employee can view their own requests); results scoped strictly to the authenticated employee's `employeeId`.

---

#### 4.2.3 `GET /api/v1/transfer-requests/{requestId}`

**Summary:** Retrieve the full detail of a specific transfer request, including audit history and downstream task status.

**Authentication required:** Yes — role `EMPLOYEE`, `MANAGER`, or `HR`

> Employees may only retrieve their own requests. Managers may retrieve requests for which they are the `managerId` or the `receivingManagerId`. HR Administrators may retrieve any request.

**Path Parameters:**

| Parameter   | Type   | Description                         |
|-------------|--------|-------------------------------------|
| `requestId` | string | UUID of the transfer request        |

**Response — 200 OK** (`TransferRequestDetail`):

See schema in Section 3.4 for the full JSON example.

**Error Responses:**

| HTTP Status | Code                            | Condition                                                      |
|-------------|---------------------------------|----------------------------------------------------------------|
| 401         | `UNAUTHORISED`                  | Missing or invalid JWT token                                   |
| 403         | `FORBIDDEN`                     | Authenticated user has no access rights to this request        |
| 404         | `TRANSFER_REQUEST_NOT_FOUND`    | No request exists for the given `requestId`                    |
| 500         | `INTERNAL_SERVER_ERROR`         | Unexpected server error                                        |

**AC References:** AC-010, AC-012, AC-020, AC-031, AC-032, AC-033, AC-037

**Business Rules Enforced:** BR-013, BR-014 (data scoped to actor's access rights)

---

#### 4.2.4 `PATCH /api/v1/transfer-requests/{requestId}/cancel`

**Summary:** Cancel a transfer request. Permitted when the request is in `PENDING_CURRENT_MANAGER_APPROVAL` or `PENDING_RECEIVING_MANAGER_APPROVAL` status.

**Authentication required:** Yes — role `EMPLOYEE`

> The authenticated employee must be the original submitter of the request.

**Path Parameters:**

| Parameter   | Type   | Description                         |
|-------------|--------|-------------------------------------|
| `requestId` | string | UUID of the transfer request        |

**Request Body:** Empty (no body required)

**Response — 200 OK:**

```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "CANCELLED",
  "cancelledAt": "2025-07-14T12:00:00Z"
}
```

| Field         | Type     | Description                        |
|---------------|----------|------------------------------------|
| `requestId`   | string   | UUID of the cancelled request      |
| `status`      | enum     | Always `CANCELLED` on success      |
| `cancelledAt` | datetime | UTC timestamp of cancellation      |

**Error Responses:**

| HTTP Status | Code                            | Condition                                                                 |
|-------------|---------------------------------|---------------------------------------------------------------------------|
| 401         | `UNAUTHORISED`                  | Missing or invalid JWT token                                              |
| 403         | `FORBIDDEN`                     | Authenticated employee is not the submitter of this request               |
| 404         | `TRANSFER_REQUEST_NOT_FOUND`    | No request exists for the given `requestId`                               |
| 409         | `CANCELLATION_NOT_ALLOWED`      | Request is not in `PENDING_CURRENT_MANAGER_APPROVAL` or `PENDING_RECEIVING_MANAGER_APPROVAL` status (BR-003, BR-004, AC-024) |
| 500         | `INTERNAL_SERVER_ERROR`         | Unexpected server error                                                   |

**AC References:** AC-017, AC-018, AC-024, AC-041

**Business Rules Enforced:** BR-003 (cancel permitted while awaiting either manager's approval), BR-004 (no cancel from HR stage onwards), BR-009 (notifications sent to employee and relevant manager(s) on cancellation)

> **Implementation note:** On successful cancellation:
> 1. Set `status = CANCELLED`, populate `cancelledBy` and `cancelledAt`.
> 2. Dispatch in-app + email notification to the employee confirming cancellation (AC-017).
> 3. If the request was in `PENDING_CURRENT_MANAGER_APPROVAL`: dispatch in-app notification to the current line manager that the request has been withdrawn (AC-018).
> 4. If the request was in `PENDING_RECEIVING_MANAGER_APPROVAL`: dispatch in-app notification to both the current manager and the receiving manager that the request has been withdrawn (AC-041).
> 5. Remove the request from the relevant manager(s)' pending approval queue.

---

### 4.3 Transfer Requests — Current Manager

---

#### 4.3.1 `GET /api/v1/manager/transfer-requests`

**Summary:** List transfer requests awaiting approval by the authenticated current line manager (releasing manager).

**Authentication required:** Yes — role `MANAGER`

**Query Parameters:**

| Parameter   | Type    | Required | Default                           | Description                                         |
|-------------|---------|----------|-----------------------------------|-----------------------------------------------------|
| `status`    | enum    | No       | `PENDING_CURRENT_MANAGER_APPROVAL` | Filter by status                                   |
| `page`      | integer | No       | `0`                               | Zero-based page index                               |
| `pageSize`  | integer | No       | `20`                              | Records per page; max 100                           |
| `sort`      | string  | No       | `submittedAt`                     | Field to sort by                                    |
| `direction` | string  | No       | `ASC`                             | `ASC` or `DESC`                                     |

**Response — 200 OK** (`PagedResponse<TransferRequestSummary>`):

```json
{
  "data": [
    {
      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "employeeId": "EMP-001",
      "employeeName": "Jane Smith",
      "targetDepartment": "Engineering",
      "targetRole": "Senior Software Engineer",
      "effectiveDate": "2025-09-01",
      "status": "PENDING_CURRENT_MANAGER_APPROVAL",
      "submittedAt": "2025-07-14T09:00:00Z"
    }
  ],
  "totalCount": 1,
  "page": 0,
  "pageSize": 20
}
```

**Error Responses:**

| HTTP Status | Code                    | Condition                                |
|-------------|-------------------------|------------------------------------------|
| 401         | `UNAUTHORISED`          | Missing or invalid JWT token             |
| 403         | `FORBIDDEN`             | Authenticated user does not have MANAGER role |
| 500         | `INTERNAL_SERVER_ERROR` | Unexpected server error                  |

**AC References:** AC-011, AC-012, AC-034

**Business Rules Enforced:** BR-014 (manager sees only requests assigned to them via `managerId`); results scoped to the authenticated manager's employee ID.

---

#### 4.3.2 `POST /api/v1/manager/transfer-requests/{requestId}/approve`

**Summary:** Approve a transfer request as the current manager, advancing it from `PENDING_CURRENT_MANAGER_APPROVAL` to `PENDING_RECEIVING_MANAGER_APPROVAL`.

**Authentication required:** Yes — role `MANAGER`

> The authenticated manager must be the `managerId` on the specified request.

**Path Parameters:**

| Parameter   | Type   | Description                    |
|-------------|--------|--------------------------------|
| `requestId` | string | UUID of the transfer request   |

**Request Body:** Empty (no body required)

**Response — 200 OK:**

```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "PENDING_RECEIVING_MANAGER_APPROVAL",
  "managerApprovedBy": "MGR-042",
  "managerApprovedAt": "2025-07-14T11:30:00Z"
}
```

| Field               | Type     | Description                                            |
|---------------------|----------|--------------------------------------------------------|
| `requestId`         | string   | UUID of the approved request                           |
| `status`            | enum     | Always `PENDING_RECEIVING_MANAGER_APPROVAL` on success |
| `managerApprovedBy` | string   | Current manager's employee ID                          |
| `managerApprovedAt` | datetime | UTC timestamp of approval                              |

**Error Responses:**

| HTTP Status | Code                            | Condition                                                                    |
|-------------|---------------------------------|------------------------------------------------------------------------------|
| 401         | `UNAUTHORISED`                  | Missing or invalid JWT token                                                 |
| 403         | `FORBIDDEN`                     | Authenticated manager is not the assigned manager for this request           |
| 404         | `TRANSFER_REQUEST_NOT_FOUND`    | No request exists for the given `requestId`                                  |
| 409         | `INVALID_STATE_TRANSITION`      | Request is not in `PENDING_CURRENT_MANAGER_APPROVAL` status                  |
| 500         | `INTERNAL_SERVER_ERROR`         | Unexpected server error                                                      |

**AC References:** AC-013, AC-036

**Business Rules Enforced:** BR-002 (current manager approval precedes receiving manager approval), BR-009 (notification to receiving manager on transition to PENDING_RECEIVING_MANAGER_APPROVAL), BR-015

> **Implementation note:** On successful approval:
> 1. Set `status = PENDING_RECEIVING_MANAGER_APPROVAL`, populate `managerApprovedBy` and `managerApprovedAt`.
> 2. Dispatch in-app + email notification to the receiving manager (AC-036).

---

#### 4.3.3 `POST /api/v1/manager/transfer-requests/{requestId}/reject`

**Summary:** Reject a transfer request as the current manager, terminating the workflow. A rejection reason is mandatory.

**Authentication required:** Yes — role `MANAGER`

> The authenticated manager must be the `managerId` on the specified request.

**Path Parameters:**

| Parameter   | Type   | Description                    |
|-------------|--------|--------------------------------|
| `requestId` | string | UUID of the transfer request   |

**Request Body:**

```json
{
  "rejectionReason": "The team does not have headcount capacity to release this employee at this time."
}
```

| Field             | Type   | Required | Validation                                      |
|-------------------|--------|----------|-------------------------------------------------|
| `rejectionReason` | string | Yes      | Must not be blank; max 2000 characters (BR-007) |

**Response — 200 OK:**

```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "REJECTED",
  "rejectedBy": "MANAGER",
  "rejectionReason": "The team does not have headcount capacity to release this employee at this time.",
  "rejectedAt": "2025-07-14T14:00:00Z"
}
```

**Error Responses:**

| HTTP Status | Code                            | Condition                                                                 |
|-------------|---------------------------------|---------------------------------------------------------------------------|
| 400         | `REJECTION_REASON_REQUIRED`     | `rejectionReason` is missing or blank (AC-014)                            |
| 400         | `VALIDATION_ERROR`              | `rejectionReason` exceeds 2000 characters                                 |
| 401         | `UNAUTHORISED`                  | Missing or invalid JWT token                                              |
| 403         | `FORBIDDEN`                     | Authenticated manager is not the assigned manager for this request        |
| 404         | `TRANSFER_REQUEST_NOT_FOUND`    | No request exists for the given `requestId`                               |
| 409         | `INVALID_STATE_TRANSITION`      | Request is not in `PENDING_CURRENT_MANAGER_APPROVAL` status               |
| 500         | `INTERNAL_SERVER_ERROR`         | Unexpected server error                                                   |

**AC References:** AC-014, AC-015, AC-016

**Business Rules Enforced:** BR-007 (rejection terminates workflow; no downstream stages triggered), BR-009 (notification to employee on rejection)

> **Implementation note:** On successful rejection:
> 1. Set `status = REJECTED`, populate `rejectedBy = MANAGER`, `rejectionReason`, and `rejectedAt`.
> 2. Dispatch in-app + email notification to the employee with the rejection reason (AC-015).

---

### 4.3A Transfer Requests — Receiving Manager

---

#### 4.3A.1 `GET /api/v1/receiving-manager/transfer-requests`

**Summary:** List transfer requests awaiting approval by the authenticated receiving manager.

**Authentication required:** Yes — role `MANAGER` (receiving manager context, determined by `receivingManagerId` on the request matching the authenticated user's `employeeId`)

**Query Parameters:**

| Parameter   | Type    | Required | Default                              | Description                                         |
|-------------|---------|----------|--------------------------------------|-----------------------------------------------------|
| `status`    | enum    | No       | `PENDING_RECEIVING_MANAGER_APPROVAL` | Filter by status                                    |
| `page`      | integer | No       | `0`                                  | Zero-based page index                               |
| `pageSize`  | integer | No       | `20`                                 | Records per page; max 100                           |
| `sort`      | string  | No       | `submittedAt`                        | Field to sort by                                    |
| `direction` | string  | No       | `ASC`                                | `ASC` or `DESC`                                     |

**Response — 200 OK** (`PagedResponse<TransferRequestSummary>`):

```json
{
  "data": [
    {
      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "employeeId": "EMP-001",
      "employeeName": "Jane Smith",
      "targetDepartment": "Engineering",
      "targetRole": "Senior Software Engineer",
      "effectiveDate": "2025-09-01",
      "status": "PENDING_RECEIVING_MANAGER_APPROVAL",
      "submittedAt": "2025-07-14T09:00:00Z"
    }
  ],
  "totalCount": 1,
  "page": 0,
  "pageSize": 20
}
```

**Error Responses:**

| HTTP Status | Code                    | Condition                                |
|-------------|-------------------------|------------------------------------------|
| 401         | `UNAUTHORISED`          | Missing or invalid JWT token             |
| 403         | `FORBIDDEN`             | Authenticated user does not have MANAGER role |
| 500         | `INTERNAL_SERVER_ERROR` | Unexpected server error                  |

**AC References:** AC-034, AC-036, AC-037

**Business Rules Enforced:** BR-014, BR-015; results scoped to requests where `receivingManagerId` matches the authenticated manager's `employeeId`.

---

#### 4.3A.2 `POST /api/v1/receiving-manager/transfer-requests/{requestId}/approve`

**Summary:** Receiving manager approves a transfer request, advancing it from `PENDING_RECEIVING_MANAGER_APPROVAL` to `PENDING_HR_VALIDATION`.

**Authentication required:** Yes — role `MANAGER`

> The authenticated manager must be the `receivingManagerId` on the specified request.

**Path Parameters:**

| Parameter   | Type   | Description                    |
|-------------|--------|--------------------------------|
| `requestId` | string | UUID of the transfer request   |

**Request Body:** Empty (no body required)

**Response — 200 OK:**

```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "PENDING_HR_VALIDATION",
  "receivingManagerApprovedBy": "RCV-MGR-015",
  "receivingManagerApprovedAt": "2025-07-15T14:00:00Z"
}
```

| Field                        | Type     | Description                                   |
|------------------------------|----------|-----------------------------------------------|
| `requestId`                  | string   | UUID of the approved request                  |
| `status`                     | enum     | Always `PENDING_HR_VALIDATION` on success     |
| `receivingManagerApprovedBy` | string   | Receiving manager's employee ID               |
| `receivingManagerApprovedAt` | datetime | UTC timestamp of approval                     |

**Error Responses:**

| HTTP Status | Code                            | Condition                                                                    |
|-------------|---------------------------------|------------------------------------------------------------------------------|
| 401         | `UNAUTHORISED`                  | Missing or invalid JWT token                                                 |
| 403         | `FORBIDDEN`                     | Authenticated manager is not the `receivingManagerId` on this request        |
| 404         | `TRANSFER_REQUEST_NOT_FOUND`    | No request exists for the given `requestId`                                  |
| 409         | `INVALID_STATE_TRANSITION`      | Request is not in `PENDING_RECEIVING_MANAGER_APPROVAL` status                |
| 500         | `INTERNAL_SERVER_ERROR`         | Unexpected server error                                                      |

**AC References:** AC-038, AC-042

**Business Rules Enforced:** BR-002 (receiving manager must approve before HR), BR-009 (HR notification dispatched), BR-015

> **Implementation note:** On successful approval:
> 1. Set `status = PENDING_HR_VALIDATION`, populate `receivingManagerApprovedBy` and `receivingManagerApprovedAt`.
> 2. Dispatch in-app + email notification to the HR Administrator (AC-042).

---

#### 4.3A.3 `POST /api/v1/receiving-manager/transfer-requests/{requestId}/reject`

**Summary:** Receiving manager rejects a transfer request. Rejection reason is mandatory. The workflow terminates.

**Authentication required:** Yes — role `MANAGER`

> The authenticated manager must be the `receivingManagerId` on the specified request.

**Path Parameters:**

| Parameter   | Type   | Description                    |
|-------------|--------|--------------------------------|
| `requestId` | string | UUID of the transfer request   |

**Request Body:**

```json
{
  "rejectionReason": "The target team does not have headcount available for this role at this time."
}
```

| Field             | Type   | Required | Validation                                      |
|-------------------|--------|----------|-------------------------------------------------|
| `rejectionReason` | string | Yes      | Must not be blank; max 2000 characters (BR-007) |

**Response — 200 OK:**

```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "REJECTED",
  "rejectedBy": "RECEIVING_MANAGER",
  "rejectionReason": "The target team does not have headcount available for this role at this time.",
  "rejectedAt": "2025-07-15T15:00:00Z"
}
```

**Error Responses:**

| HTTP Status | Code                            | Condition                                                                 |
|-------------|---------------------------------|---------------------------------------------------------------------------|
| 400         | `REJECTION_REASON_REQUIRED`     | `rejectionReason` is missing or blank (AC-039)                            |
| 400         | `VALIDATION_ERROR`              | `rejectionReason` exceeds 2000 characters                                 |
| 401         | `UNAUTHORISED`                  | Missing or invalid JWT token                                              |
| 403         | `FORBIDDEN`                     | Authenticated manager is not the `receivingManagerId` on this request     |
| 404         | `TRANSFER_REQUEST_NOT_FOUND`    | No request exists for the given `requestId`                               |
| 409         | `INVALID_STATE_TRANSITION`      | Request is not in `PENDING_RECEIVING_MANAGER_APPROVAL` status             |
| 500         | `INTERNAL_SERVER_ERROR`         | Unexpected server error                                                   |

**AC References:** AC-039, AC-040

**Business Rules Enforced:** BR-007 (rejection terminates workflow; no downstream stages triggered), BR-009 (notifications sent to employee and current manager on rejection)

> **Implementation note:** On successful rejection:
> 1. Set `status = REJECTED`, populate `rejectedBy = RECEIVING_MANAGER`, `rejectionReason`, and `rejectedAt`.
> 2. Dispatch in-app + email notification to the employee with the rejection reason (AC-040).
> 3. Dispatch in-app + email notification to the current manager with the rejection reason (AC-040).

---

### 4.4 Transfer Requests — HR

---

#### 4.4.1 `GET /api/v1/hr/transfer-requests`

**Summary:** List transfer requests visible to the HR Administrator, with optional status filtering and pagination.

**Authentication required:** Yes — role `HR`

**Query Parameters:**

| Parameter    | Type    | Required | Default                    | Description                                        |
|--------------|---------|----------|----------------------------|----------------------------------------------------|
| `status`     | enum    | No       | `PENDING_HR_VALIDATION`    | Filter by one or more statuses (repeatable)        |
| `employeeId` | string  | No       | —                          | Filter by submitting employee ID                   |
| `page`       | integer | No       | `0`                        | Zero-based page index                              |
| `pageSize`   | integer | No       | `20`                       | Records per page; max 100                          |
| `sort`       | string  | No       | `submittedAt`              | Field to sort by                                   |
| `direction`  | string  | No       | `ASC`                      | `ASC` or `DESC`                                    |

**Response — 200 OK** (`PagedResponse<TransferRequestSummary>`):

```json
{
  "data": [
    {
      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "employeeId": "EMP-001",
      "employeeName": "Jane Smith",
      "targetDepartment": "Engineering",
      "targetRole": "Senior Software Engineer",
      "effectiveDate": "2025-09-01",
      "status": "PENDING_HR_VALIDATION",
      "submittedAt": "2025-07-14T09:00:00Z"
    }
  ],
  "totalCount": 1,
  "page": 0,
  "pageSize": 20
}
```

**Error Responses:**

| HTTP Status | Code                    | Condition                                  |
|-------------|-------------------------|--------------------------------------------|
| 401         | `UNAUTHORISED`          | Missing or invalid JWT token               |
| 403         | `FORBIDDEN`             | Authenticated user does not have HR role   |
| 500         | `INTERNAL_SERVER_ERROR` | Unexpected server error                    |

**AC References:** AC-019, AC-020, AC-034

**Business Rules Enforced:** BR-014 (HR sees all requests across the organisation in applicable statuses)

---

#### 4.4.2 `POST /api/v1/hr/transfer-requests/{requestId}/approve`

**Summary:** HR approves a transfer request, advancing it to `IN_PROGRESS` and triggering the three parallel downstream tasks.

**Authentication required:** Yes — role `HR`

**Path Parameters:**

| Parameter   | Type   | Description                    |
|-------------|--------|--------------------------------|
| `requestId` | string | UUID of the transfer request   |

**Request Body:** Empty (no body required)

**Response — 200 OK:**

```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "IN_PROGRESS",
  "hrApprovedBy": "HR-007",
  "hrApprovedAt": "2025-07-15T10:00:00Z",
  "downstreamTasks": [
    { "taskType": "IT",        "complete": false, "completedAt": null },
    { "taskType": "PAYROLL",   "complete": false, "completedAt": null },
    { "taskType": "FACILITIES","complete": false, "completedAt": null }
  ]
}
```

**Error Responses:**

| HTTP Status | Code                            | Condition                                                              |
|-------------|---------------------------------|------------------------------------------------------------------------|
| 401         | `UNAUTHORISED`                  | Missing or invalid JWT token                                           |
| 403         | `FORBIDDEN`                     | Authenticated user does not have HR role                               |
| 404         | `TRANSFER_REQUEST_NOT_FOUND`    | No request exists for the given `requestId`                            |
| 409         | `INVALID_STATE_TRANSITION`      | Request is not in `PENDING_HR_VALIDATION` status                       |
| 500         | `INTERNAL_SERVER_ERROR`         | Unexpected server error                                                |

**AC References:** AC-021, AC-025, AC-026, AC-027

**Business Rules Enforced:** BR-005 (IT, Payroll, Facilities triggered simultaneously and in parallel), BR-009 (notifications sent to IT, Payroll, and Facilities teams)

> **Implementation note:** On successful approval:
> 1. Set `status = IN_PROGRESS`, populate `hrApprovedBy` and `hrApprovedAt`.
> 2. Create three downstream task records (IT, PAYROLL, FACILITIES), each with `complete = false`.
> 3. Dispatch in-app + email notification to the IT team (AC-025).
> 4. Dispatch in-app + email notification to the Payroll team (AC-026).
> 5. Dispatch in-app + email notification to the Facilities team (AC-027).

---

#### 4.4.3 `POST /api/v1/hr/transfer-requests/{requestId}/reject`

**Summary:** HR rejects a transfer request, terminating the workflow. A rejection reason is mandatory.

**Authentication required:** Yes — role `HR`

**Path Parameters:**

| Parameter   | Type   | Description                    |
|-------------|--------|--------------------------------|
| `requestId` | string | UUID of the transfer request   |

**Request Body:**

```json
{
  "rejectionReason": "The requested role transfer does not meet current HR policy on lateral moves within 12 months of prior transfer."
}
```

| Field             | Type   | Required | Validation                                      |
|-------------------|--------|----------|-------------------------------------------------|
| `rejectionReason` | string | Yes      | Must not be blank; max 2000 characters (BR-008) |

**Response — 200 OK:**

```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "REJECTED",
  "rejectedBy": "HR",
  "rejectionReason": "The requested role transfer does not meet current HR policy on lateral moves within 12 months of prior transfer.",
  "rejectedAt": "2025-07-15T11:00:00Z"
}
```

**Error Responses:**

| HTTP Status | Code                            | Condition                                                              |
|-------------|---------------------------------|------------------------------------------------------------------------|
| 400         | `REJECTION_REASON_REQUIRED`     | `rejectionReason` is missing or blank (AC-022)                         |
| 400         | `VALIDATION_ERROR`              | `rejectionReason` exceeds 2000 characters                              |
| 401         | `UNAUTHORISED`                  | Missing or invalid JWT token                                           |
| 403         | `FORBIDDEN`                     | Authenticated user does not have HR role                               |
| 404         | `TRANSFER_REQUEST_NOT_FOUND`    | No request exists for the given `requestId`                            |
| 409         | `INVALID_STATE_TRANSITION`      | Request is not in `PENDING_HR_VALIDATION` status                       |
| 500         | `INTERNAL_SERVER_ERROR`         | Unexpected server error                                                |

**AC References:** AC-022, AC-023

**Business Rules Enforced:** BR-008 (HR rejection terminates the workflow), BR-009 (notifications sent to employee, current manager, and receiving manager)

> **Implementation note:** On successful rejection:
> 1. Set `status = REJECTED`, populate `rejectedBy = HR`, `rejectionReason`, and `rejectedAt`.
> 2. Dispatch in-app + email notification to the employee with the rejection reason (AC-023).
> 3. Dispatch in-app + email notification to the current manager with the rejection reason (AC-023).
> 4. Dispatch in-app + email notification to the receiving manager with the rejection reason (AC-023).

---

### 4.5 Downstream Tasks — IT, Payroll, Facilities

---

#### 4.5.1 `GET /api/v1/tasks`

**Summary:** List pending tasks assigned to the authenticated team member. Task type is inferred from the user's role (IT, PAYROLL, or FACILITIES).

**Authentication required:** Yes — role `IT`, `PAYROLL`, or `FACILITIES`

**Query Parameters:**

| Parameter   | Type    | Required | Default       | Description                                        |
|-------------|---------|----------|---------------|----------------------------------------------------|
| `complete`  | boolean | No       | `false`       | When `false`, returns only incomplete tasks; `true` returns all |
| `page`      | integer | No       | `0`           | Zero-based page index                              |
| `pageSize`  | integer | No       | `20`          | Records per page; max 100                          |
| `sort`      | string  | No       | `submittedAt` | Field to sort by                                   |
| `direction` | string  | No       | `ASC`         | `ASC` or `DESC`                                    |

**Response — 200 OK:**

```json
{
  "data": [
    {
      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "taskType": "IT",
      "employeeId": "EMP-001",
      "employeeName": "Jane Smith",
      "targetDepartment": "Engineering",
      "targetRole": "Senior Software Engineer",
      "targetLocation": "Sydney Office",
      "effectiveDate": "2025-09-01",
      "complete": false,
      "completedAt": null,
      "requestSubmittedAt": "2025-07-14T09:00:00Z",
      "hrApprovedAt": "2025-07-15T10:00:00Z"
    }
  ],
  "totalCount": 1,
  "page": 0,
  "pageSize": 20
}
```

**Error Responses:**

| HTTP Status | Code                    | Condition                                                    |
|-------------|-------------------------|--------------------------------------------------------------|
| 401         | `UNAUTHORISED`          | Missing or invalid JWT token                                 |
| 403         | `FORBIDDEN`             | Role is not IT, PAYROLL, or FACILITIES                       |
| 500         | `INTERNAL_SERVER_ERROR` | Unexpected server error                                      |

**AC References:** AC-025, AC-026, AC-027, AC-034

**Business Rules Enforced:** BR-014 (each team member sees only their own task type); task list is scoped to the `taskType` matching the authenticated user's role.

---

#### 4.5.2 `POST /api/v1/tasks/{requestId}/complete`

**Summary:** Mark the authenticated team's task as complete for the given transfer request. When all three tasks are marked complete, the system automatically transitions the overall request to `COMPLETED`.

**Authentication required:** Yes — role `IT`, `PAYROLL`, or `FACILITIES`

> The task type resolved is the one that matches the authenticated user's role. An IT team member calling this endpoint marks the IT task complete; a Payroll member marks the Payroll task complete; and so on.

**Path Parameters:**

| Parameter   | Type   | Description                    |
|-------------|--------|--------------------------------|
| `requestId` | string | UUID of the transfer request   |

**Request Body:** Empty (no body required)

**Response — 200 OK:**

```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "taskType": "IT",
  "complete": true,
  "completedAt": "2025-07-16T08:45:00Z",
  "overallStatus": "IN_PROGRESS"
}
```

When this is the last task to complete, `overallStatus` will be `COMPLETED`:

```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "taskType": "FACILITIES",
  "complete": true,
  "completedAt": "2025-07-17T14:00:00Z",
  "overallStatus": "COMPLETED"
}
```

| Field           | Type     | Description                                                          |
|-----------------|----------|----------------------------------------------------------------------|
| `requestId`     | string   | UUID of the request                                                  |
| `taskType`      | enum     | The task type that was just completed                                |
| `complete`      | boolean  | Always `true` on success                                             |
| `completedAt`   | datetime | UTC timestamp of completion                                          |
| `overallStatus` | enum     | The current overall request status after this task completion event  |

**Error Responses:**

| HTTP Status | Code                            | Condition                                                                  |
|-------------|---------------------------------|----------------------------------------------------------------------------|
| 401         | `UNAUTHORISED`                  | Missing or invalid JWT token                                               |
| 403         | `FORBIDDEN`                     | Role is not IT, PAYROLL, or FACILITIES                                     |
| 404         | `TRANSFER_REQUEST_NOT_FOUND`    | No request exists for the given `requestId`                                |
| 409         | `INVALID_STATE_TRANSITION`      | Request is not in `IN_PROGRESS` status                                     |
| 409         | `TASK_ALREADY_COMPLETE`         | The team's task for this request has already been marked complete          |
| 500         | `INTERNAL_SERVER_ERROR`         | Unexpected server error                                                    |

**AC References:** AC-025, AC-026, AC-027, AC-028, AC-029, AC-030

**Business Rules Enforced:** BR-006 (COMPLETED only when all three tasks done), BR-009 (final notification to employee when COMPLETED)

> **Implementation note:** On marking a task complete:
> 1. Set the corresponding flag (`itTaskComplete`, `payrollTaskComplete`, or `facilitiesTaskComplete`) to `true` and record `*CompletedAt`.
> 2. Record an audit log entry with `action = TASK_COMPLETED`.
> 3. Check if all three tasks are now complete (BR-006).
>    - If **not all done**: `overallStatus` remains `IN_PROGRESS`. No external notification (AC-028).
>    - If **all done**: set `status = COMPLETED`, record `completedAt`, dispatch in-app + email notification to the employee (AC-030).

---

### 4.6 Notifications

---

#### 4.6.1 `GET /api/v1/notifications`

**Summary:** List in-app notifications for the authenticated user, ordered by most recent first.

**Authentication required:** Yes — any authenticated role

**Query Parameters:**

| Parameter   | Type    | Required | Default | Description                                                    |
|-------------|---------|----------|---------|----------------------------------------------------------------|
| `read`      | boolean | No       | —       | When `false`, returns only unread notifications; omit for all  |
| `page`      | integer | No       | `0`     | Zero-based page index                                          |
| `pageSize`  | integer | No       | `20`    | Records per page; max 100                                      |

**Response — 200 OK** (`PagedResponse<NotificationObject>`):

```json
{
  "data": [
    {
      "notificationId": "n-00000001",
      "recipientId": "EMP-001",
      "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "type": "REQUEST_SUBMITTED",
      "message": "Your transfer request a1b2c3d4... has been submitted and is pending manager approval.",
      "read": false,
      "createdAt": "2025-07-14T09:00:00Z"
    }
  ],
  "totalCount": 1,
  "page": 0,
  "pageSize": 20
}
```

Notification `type` values:

| Value                              | Description                                                          |
|------------------------------------|----------------------------------------------------------------------|
| `REQUEST_SUBMITTED`                | Sent to employee on successful submission                            |
| `PENDING_CURRENT_MANAGER_APPROVAL` | Sent to current manager when request awaits their decision           |
| `CURRENT_MANAGER_APPROVED`         | Sent to receiving manager when current manager approves              |
| `PENDING_RECEIVING_MANAGER_APPROVAL` | Sent to receiving manager when request awaits their decision       |
| `RECEIVING_MANAGER_APPROVED`       | Sent to HR when receiving manager approves                           |
| `MANAGER_REJECTED`                 | Sent to employee (and current manager if receiving manager rejects) on manager rejection |
| `REQUEST_CANCELLED`                | Sent to employee and relevant manager(s) on cancellation             |
| `HR_APPROVED`                      | Sent to IT, Payroll, Facilities on HR approval                       |
| `HR_REJECTED`                      | Sent to employee, current manager, and receiving manager on HR rejection |
| `REQUEST_COMPLETED`                | Sent to employee when all tasks are complete                         |

**Error Responses:**

| HTTP Status | Code                    | Condition                             |
|-------------|-------------------------|---------------------------------------|
| 401         | `UNAUTHORISED`          | Missing or invalid JWT token          |
| 500         | `INTERNAL_SERVER_ERROR` | Unexpected server error               |

**AC References:** AC-004 (indirect), AC-007, AC-011, AC-015, AC-017, AC-018, AC-019, AC-023, AC-025, AC-026, AC-027, AC-030, AC-036, AC-040, AC-041, AC-042

---

#### 4.6.2 `PATCH /api/v1/notifications/{notificationId}/read`

**Summary:** Mark a specific in-app notification as read.

**Authentication required:** Yes — any authenticated role

> The authenticated user must be the recipient of the notification.

**Path Parameters:**

| Parameter        | Type   | Description                       |
|------------------|--------|-----------------------------------|
| `notificationId` | string | ID of the notification to mark    |

**Request Body:** Empty (no body required)

**Response — 200 OK:**

```json
{
  "notificationId": "n-00000001",
  "read": true
}
```

**Error Responses:**

| HTTP Status | Code                          | Condition                                                  |
|-------------|-------------------------------|------------------------------------------------------------|
| 401         | `UNAUTHORISED`                | Missing or invalid JWT token                               |
| 403         | `FORBIDDEN`                   | Authenticated user is not the recipient of this notification |
| 404         | `NOTIFICATION_NOT_FOUND`      | No notification exists for the given `notificationId`      |
| 500         | `INTERNAL_SERVER_ERROR`       | Unexpected server error                                    |

**AC References:** AC-004 (indirect — supporting in-app notification management)

---

### 4.7 Reference Data

Reference data endpoints are read-only and are used to populate form dropdowns. They do not require data to be submitted. The data returned serves as the canonical list of valid values for `targetDepartment`, `targetBusinessUnit`, `targetLocation`, and `targetRole` fields on the transfer request.

---

#### 4.7.1 `GET /api/v1/reference/departments`

**Summary:** List all valid departments and their associated business units.

**Authentication required:** Yes — role `EMPLOYEE` (minimum)

**Query Parameters:** None

**Response — 200 OK:**

```json
[
  {
    "departmentCode": "ENG",
    "departmentName": "Engineering",
    "businessUnits": [
      { "code": "ENG-PLATFORM", "name": "Platform Engineering" },
      { "code": "ENG-PRODUCT",  "name": "Product Engineering"  }
    ]
  },
  {
    "departmentCode": "FIN",
    "departmentName": "Finance",
    "businessUnits": [
      { "code": "FIN-CTRL", "name": "Financial Controlling" }
    ]
  }
]
```

**Error Responses:**

| HTTP Status | Code                    | Condition                    |
|-------------|-------------------------|------------------------------|
| 401         | `UNAUTHORISED`          | Missing or invalid JWT token |
| 500         | `INTERNAL_SERVER_ERROR` | Unexpected server error      |

**AC References:** AC-001, AC-002

---

#### 4.7.2 `GET /api/v1/reference/locations`

**Summary:** List all valid transfer target locations.

**Authentication required:** Yes — role `EMPLOYEE` (minimum)

**Query Parameters:** None

**Response — 200 OK:**

```json
[
  { "code": "SYD", "name": "Sydney Office"    },
  { "code": "MEL", "name": "Melbourne Office" },
  { "code": "SIN", "name": "Singapore Office" }
]
```

**Error Responses:**

| HTTP Status | Code                    | Condition                    |
|-------------|-------------------------|------------------------------|
| 401         | `UNAUTHORISED`          | Missing or invalid JWT token |
| 500         | `INTERNAL_SERVER_ERROR` | Unexpected server error      |

**AC References:** AC-001, AC-002

---

#### 4.7.3 `GET /api/v1/reference/roles`

**Summary:** List all valid role/position codes available for selection as a transfer target.

**Authentication required:** Yes — role `EMPLOYEE` (minimum)

**Query Parameters:**

| Parameter            | Type   | Required | Description                                              |
|----------------------|--------|----------|----------------------------------------------------------|
| `departmentCode`     | string | No       | Filter roles by department code                          |
| `businessUnitCode`   | string | No       | Filter roles by business unit code                       |

**Response — 200 OK:**

```json
[
  { "code": "ROLE-SE-SR",  "name": "Senior Software Engineer",  "departmentCode": "ENG", "businessUnitCode": "ENG-PLATFORM" },
  { "code": "ROLE-PM-SR",  "name": "Senior Product Manager",    "departmentCode": "ENG", "businessUnitCode": "ENG-PRODUCT"  }
]
```

**Error Responses:**

| HTTP Status | Code                    | Condition                    |
|-------------|-------------------------|------------------------------|
| 401         | `UNAUTHORISED`          | Missing or invalid JWT token |
| 500         | `INTERNAL_SERVER_ERROR` | Unexpected server error      |

**AC References:** AC-001, AC-002

---

## 5. HTTP Status Code Reference

| Status Code | Standard Meaning     | Usage in This API                                                                                         |
|-------------|----------------------|------------------------------------------------------------------------------------------------------------|
| 200         | OK                   | Successful GET, PATCH (cancel, read), POST (approve, reject, complete task) responses                      |
| 201         | Created              | Successful `POST /transfer-requests` — new resource created                                                |
| 204         | No Content           | Successful `POST /auth/logout` — no response body required                                                 |
| 400         | Bad Request          | Validation failure; malformed request body; business-rule violation at input level (e.g., past date)       |
| 401         | Unauthorized         | Missing, malformed, or expired JWT access token; invalid credentials on login                              |
| 403         | Forbidden            | Valid token present but the user's role or ownership does not permit the action                            |
| 404         | Not Found            | The requested resource (transfer request, notification) does not exist                                     |
| 409         | Conflict             | State machine conflict — action not permitted in the current workflow state; resource already in target state |
| 422         | Unprocessable Entity | Reserved for semantic validation errors where the request is syntactically valid but logically cannot be processed (not used in current endpoints; available for future use) |
| 500         | Internal Server Error| Unhandled server-side exception; always returns a standard ErrorResponse body                              |

---

## 6. Role-Based Access Control Summary

The portal assigns each authenticated user one or more roles, encoded in the JWT token. The following table maps each endpoint to the roles permitted to call it.

| Endpoint                                                                  | EMPLOYEE | MANAGER | HR  | IT  | PAYROLL | FACILITIES |
|---------------------------------------------------------------------------|:--------:|:-------:|:---:|:---:|:-------:|:----------:|
| `POST /auth/login`                                                        | ✓        | ✓       | ✓   | ✓   | ✓       | ✓          |
| `POST /auth/refresh`                                                      | ✓        | ✓       | ✓   | ✓   | ✓       | ✓          |
| `POST /auth/logout`                                                       | ✓        | ✓       | ✓   | ✓   | ✓       | ✓          |
| `POST /transfer-requests`                                                 | ✓        |         |     |     |         |            |
| `GET /transfer-requests`                                                  | ✓        |         |     |     |         |            |
| `GET /transfer-requests/{requestId}`                                      | ✓ ¹      | ✓ ²     | ✓   |     |         |            |
| `PATCH /transfer-requests/{requestId}/cancel`                             | ✓ ¹      |         |     |     |         |            |
| `GET /manager/transfer-requests`                                          |          | ✓       |     |     |         |            |
| `POST /manager/transfer-requests/{requestId}/approve`                     |          | ✓ ²     |     |     |         |            |
| `POST /manager/transfer-requests/{requestId}/reject`                      |          | ✓ ²     |     |     |         |            |
| `GET /receiving-manager/transfer-requests`                                |          | ✓ ⁴     |     |     |         |            |
| `POST /receiving-manager/transfer-requests/{requestId}/approve`           |          | ✓ ⁴     |     |     |         |            |
| `POST /receiving-manager/transfer-requests/{requestId}/reject`            |          | ✓ ⁴     |     |     |         |            |
| `GET /hr/transfer-requests`                                               |          |         | ✓   |     |         |            |
| `POST /hr/transfer-requests/{requestId}/approve`                          |          |         | ✓   |     |         |            |
| `POST /hr/transfer-requests/{requestId}/reject`                           |          |         | ✓   |     |         |            |
| `GET /tasks`                                                              |          |         |     | ✓   | ✓       | ✓          |
| `POST /tasks/{requestId}/complete`                                        |          |         |     | ✓ ³ | ✓ ³     | ✓ ³        |
| `GET /notifications`                                                      | ✓        | ✓       | ✓   | ✓   | ✓       | ✓          |
| `PATCH /notifications/{notificationId}/read`                              | ✓        | ✓       | ✓   | ✓   | ✓       | ✓          |
| `GET /reference/departments`                                              | ✓        | ✓       | ✓   |     |         |            |
| `GET /reference/locations`                                                | ✓        | ✓       | ✓   |     |         |            |
| `GET /reference/roles`                                                    | ✓        | ✓       | ✓   |     |         |            |

**Footnotes:**

1. Employee may only access their own requests (scoped by `employeeId` from JWT).
2. Current manager may only act on requests where they are the assigned `managerId`.
3. Each downstream role marks only their own task type (IT → `itTaskComplete`, PAYROLL → `payrollTaskComplete`, FACILITIES → `facilitiesTaskComplete`).
4. Receiving manager endpoints are accessible to users with MANAGER role but are scoped to requests where `receivingManagerId` matches the authenticated user's `employeeId`.

> **Note on MANAGER role:** A user with the MANAGER role also retains EMPLOYEE privileges unless their account is configured otherwise. Dual-role users (employee who is also a manager) can both submit requests and approve their direct reports' requests.

---

## 7. Error Code Catalogue

| Error Code                       | HTTP Status | Description                                                                                              |
|----------------------------------|-------------|----------------------------------------------------------------------------------------------------------|
| `VALIDATION_ERROR`               | 400         | One or more request fields failed schema or format validation. The `details` array lists each failing field. |
| `INVALID_EFFECTIVE_DATE`         | 400         | The `effectiveDate` provided is today or in the past. Effective date must be a future date (BR-010).     |
| `INVALID_REFERENCE_VALUE`        | 400         | A provided department, business unit, location, or role code does not exist in the reference data.       |
| `REJECTION_REASON_REQUIRED`      | 400         | A rejection action was submitted without a `rejectionReason` value, which is mandatory (AC-014, AC-022, AC-039). |
| `INVALID_CREDENTIALS`            | 401         | Login failed due to incorrect username or password.                                                      |
| `UNAUTHORISED`                   | 401         | JWT access token is missing, malformed, or expired.                                                      |
| `REFRESH_TOKEN_INVALID`          | 401         | The provided refresh token is not found, has expired, or has already been invalidated.                   |
| `FORBIDDEN`                      | 403         | The authenticated user does not have the required role or ownership rights to perform the requested action. |
| `TRANSFER_REQUEST_NOT_FOUND`     | 404         | No transfer request record exists for the given `requestId`.                                             |
| `NOTIFICATION_NOT_FOUND`         | 404         | No notification record exists for the given `notificationId`.                                            |
| `CANCELLATION_NOT_ALLOWED`       | 409         | The employee attempted to cancel a request that is not in `PENDING_CURRENT_MANAGER_APPROVAL` or `PENDING_RECEIVING_MANAGER_APPROVAL` status (BR-003, BR-004, AC-024). |
| `INVALID_STATE_TRANSITION`       | 409         | The requested action cannot be performed because the request is not in the expected state for that transition. |
| `TASK_ALREADY_COMPLETE`          | 409         | The downstream task for this request and role has already been marked complete.                          |
| `INTERNAL_SERVER_ERROR`          | 500         | An unexpected error occurred on the server. No client-actionable information is included beyond the code. |

---

## 8. AC Traceability Table

The following table maps every acceptance criterion from Deliverable 02 (AC-001 to AC-042) to the endpoint(s) that implement or enforce it.

| AC ID  | Acceptance Criteria Summary                                              | Implementing Endpoint(s)                                                                 |
|--------|--------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| AC-001 | Form displays all required fields                                        | `GET /reference/departments`, `GET /reference/locations`, `GET /reference/roles`         |
| AC-002 | All required fields must be completed before submission                  | `POST /transfer-requests` (400 VALIDATION_ERROR on missing fields)                       |
| AC-003 | Effective date must be a future date                                     | `POST /transfer-requests` (400 INVALID_EFFECTIVE_DATE)                                   |
| AC-004 | Optional reason field is not required for submission                     | `POST /transfer-requests` (reason is optional; omitting it does not block creation)      |
| AC-005 | System assigns a unique request ID on submission                         | `POST /transfer-requests` (201 response includes `requestId`)                            |
| AC-006 | Request status set to PENDING_CURRENT_MANAGER_APPROVAL on submission     | `POST /transfer-requests` (201 response: `status = PENDING_CURRENT_MANAGER_APPROVAL`)    |
| AC-007 | Employee receives in-app and email confirmation on submission            | `POST /transfer-requests` (triggers notifications); `GET /notifications`                 |
| AC-008 | Employee cannot submit with a past effective date                        | `POST /transfer-requests` (400 INVALID_EFFECTIVE_DATE)                                   |
| AC-009 | Employee can have multiple concurrent active requests                    | `POST /transfer-requests` (no duplicate-check block; multiple allowed per BR-001)        |
| AC-010 | Employee can view all their submitted requests and statuses              | `GET /transfer-requests`, `GET /transfer-requests/{requestId}`                           |
| AC-011 | Current manager receives notification on pending approval                | `POST /transfer-requests` (triggers current manager notification); `GET /notifications`  |
| AC-012 | Current manager can view full request details before deciding            | `GET /transfer-requests/{requestId}`, `GET /manager/transfer-requests`                   |
| AC-013 | Current manager approval transitions to PENDING_RECEIVING_MANAGER_APPROVAL | `POST /manager/transfer-requests/{requestId}/approve`                                 |
| AC-014 | Current manager rejection requires mandatory rejection reason            | `POST /manager/transfer-requests/{requestId}/reject` (400 REJECTION_REASON_REQUIRED)     |
| AC-015 | Employee is notified with reason on current manager rejection            | `POST /manager/transfer-requests/{requestId}/reject` (triggers notification); `GET /notifications` |
| AC-016 | Request status set to REJECTED on current manager rejection              | `POST /manager/transfer-requests/{requestId}/reject` (200: `status = REJECTED`, `rejectedBy = MANAGER`) |
| AC-017 | Employee can cancel request while in PENDING_CURRENT_MANAGER_APPROVAL   | `PATCH /transfer-requests/{requestId}/cancel`                                            |
| AC-018 | Current manager notified when employee cancels a pending request         | `PATCH /transfer-requests/{requestId}/cancel` (triggers current manager notification); `GET /notifications` |
| AC-019 | HR receives notification when request reaches PENDING_HR_VALIDATION     | `POST /receiving-manager/transfer-requests/{requestId}/approve` (triggers HR notification); `GET /notifications` |
| AC-020 | HR can view full request details including both managers' approval records | `GET /transfer-requests/{requestId}` (HR role), `GET /hr/transfer-requests`             |
| AC-021 | HR approval triggers parallel downstream tasks                           | `POST /hr/transfer-requests/{requestId}/approve` (creates 3 tasks, transitions to IN_PROGRESS) |
| AC-022 | HR rejection requires mandatory rejection reason                         | `POST /hr/transfer-requests/{requestId}/reject` (400 REJECTION_REASON_REQUIRED)          |
| AC-023 | Employee and both managers notified on HR rejection with reason          | `POST /hr/transfer-requests/{requestId}/reject` (triggers 3 notifications); `GET /notifications` |
| AC-024 | Employee cannot cancel once request is in PENDING_HR_VALIDATION or beyond | `PATCH /transfer-requests/{requestId}/cancel` (409 CANCELLATION_NOT_ALLOWED)            |
| AC-025 | IT team receives notification and can mark task complete                 | `POST /hr/transfer-requests/{requestId}/approve` (IT notification); `GET /tasks`; `POST /tasks/{requestId}/complete` (IT role) |
| AC-026 | Payroll team receives notification and can mark task complete            | `POST /hr/transfer-requests/{requestId}/approve` (Payroll notification); `GET /tasks`; `POST /tasks/{requestId}/complete` (PAYROLL role) |
| AC-027 | Facilities team receives notification and can mark task complete         | `POST /hr/transfer-requests/{requestId}/approve` (Facilities notification); `GET /tasks`; `POST /tasks/{requestId}/complete` (FACILITIES role) |
| AC-028 | Overall status remains IN_PROGRESS while any downstream task is incomplete | `POST /tasks/{requestId}/complete` (200: `overallStatus = IN_PROGRESS` when tasks remain outstanding) |
| AC-029 | Status transitions to COMPLETED when all three tasks are marked complete | `POST /tasks/{requestId}/complete` (200: `overallStatus = COMPLETED` when last task done) |
| AC-030 | Employee receives final notification when status transitions to COMPLETED | `POST /tasks/{requestId}/complete` (triggers employee notification on COMPLETED); `GET /notifications` |
| AC-031 | Employee can view real-time status of their request at any point         | `GET /transfer-requests/{requestId}`, `GET /transfer-requests`                           |
| AC-032 | Employee can see which downstream tasks are pending and which are complete | `GET /transfer-requests/{requestId}` (`downstreamTasks` array in TransferRequestDetail) |
| AC-033 | Each stage transition is timestamped and visible in request history      | `GET /transfer-requests/{requestId}` (`auditHistory` array in TransferRequestDetail)     |
| AC-034 | Actors can see only their own pending actions                            | `GET /transfer-requests` (scoped to employee), `GET /manager/transfer-requests` (scoped to current manager), `GET /receiving-manager/transfer-requests` (scoped to receiving manager), `GET /hr/transfer-requests`, `GET /tasks` (scoped to role) |
| AC-035 | All actions recorded in an audit trail                                   | `GET /transfer-requests/{requestId}` (`auditHistory`); all state-mutating endpoints record immutable audit entries |
| AC-036 | Receiving manager receives notification upon current manager approval    | `POST /manager/transfer-requests/{requestId}/approve` (triggers receiving manager notification); `GET /receiving-manager/transfer-requests`; `GET /notifications` |
| AC-037 | Receiving manager can view full request details including current manager approval record | `GET /transfer-requests/{requestId}` (receiving manager role); `GET /receiving-manager/transfer-requests` |
| AC-038 | Receiving manager approval transitions request to PENDING_HR_VALIDATION | `POST /receiving-manager/transfer-requests/{requestId}/approve`                          |
| AC-039 | Receiving manager rejection requires mandatory rejection reason          | `POST /receiving-manager/transfer-requests/{requestId}/reject` (400 REJECTION_REASON_REQUIRED) |
| AC-040 | Employee and current manager notified with reason on receiving manager rejection | `POST /receiving-manager/transfer-requests/{requestId}/reject` (triggers 2 notifications); `GET /notifications` |
| AC-041 | Employee can cancel while request is in PENDING_RECEIVING_MANAGER_APPROVAL | `PATCH /transfer-requests/{requestId}/cancel` (notifies both managers when cancelling from PENDING_RECEIVING_MANAGER_APPROVAL) |
| AC-042 | HR Administrator receives notification after both managers approve       | `POST /receiving-manager/transfer-requests/{requestId}/approve` (triggers HR notification); `GET /notifications` |

---

*End of Deliverable 06 — API Contract*
